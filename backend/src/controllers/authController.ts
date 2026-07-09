import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User, IUser } from "../models/User";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt";
import { env, isSmtpConfigured } from "../config/env";
import { hashRefreshToken } from "../lib/refreshToken";
import {
  buildPasswordResetUrl,
  generatePasswordResetToken,
  getPasswordResetExpiry,
  hashPasswordResetToken,
} from "../lib/passwordReset";
import { sendPasswordResetEmail } from "../lib/email";
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "../lib/validations/auth";

const REFRESH_TOKEN_COOKIE = "refreshToken";
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
  });
}

function formatUser(user: IUser) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as RegisterInput;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    res.status(409).json({
      success: false,
      message: "Email already exists",
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  user.refreshToken = hashRefreshToken(refreshToken);
  await user.save();

  setRefreshTokenCookie(res, refreshToken);

  res.status(201).json({
    success: true,
    accessToken,
    user: formatUser(user),
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const user = await User.findOne({ email }).select("+password +refreshToken");

  if (!user || !user.isActive) {
    res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
    return;
  }

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  user.refreshToken = hashRefreshToken(refreshToken);
  await user.save();

  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    accessToken,
    user: formatUser(user),
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user.id, { $unset: { refreshToken: 1 } });
  }

  clearRefreshTokenCookie(res);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Refresh token not provided",
    });
    return;
  }

  const decoded = verifyRefreshToken(token);

  const user = await User.findById(decoded.userId).select("+refreshToken role");

  if (!user || !user.isActive || !user.refreshToken) {
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
    return;
  }

  if (user.refreshToken !== hashRefreshToken(token)) {
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
    return;
  }

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const newRefreshToken = generateRefreshToken(user._id.toString());

  user.refreshToken = hashRefreshToken(newRefreshToken);
  await user.save();

  setRefreshTokenCookie(res, newRefreshToken);

  res.status(200).json({
    success: true,
    accessToken,
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);

  if (!user || !user.isActive) {
    res.status(404).json({
      success: false,
      message: "User not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    user: formatUser(user),
  });
});

const PASSWORD_RESET_MESSAGE =
  "If an account exists for that email, password reset instructions have been sent.";

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as ForgotPasswordInput;

  const user = await User.findOne({ email }).select(
    "+passwordResetToken +passwordResetExpires",
  );

  if (user && user.isActive) {
    const resetToken = generatePasswordResetToken();

    user.passwordResetToken = hashPasswordResetToken(resetToken);
    user.passwordResetExpires = getPasswordResetExpiry();
    await user.save();

    const resetUrl = buildPasswordResetUrl(resetToken);
    await sendPasswordResetEmail(user.email, resetUrl);

    res.status(200).json({
      success: true,
      message: PASSWORD_RESET_MESSAGE,
      ...(env.NODE_ENV === "development" && !isSmtpConfigured()
        ? { resetUrl }
        : {}),
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: PASSWORD_RESET_MESSAGE,
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body as ResetPasswordInput;

  const hashedToken = hashPasswordResetToken(token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select("+password +passwordResetToken +passwordResetExpires +refreshToken");

  if (!user || !user.isActive) {
    res.status(400).json({
      success: false,
      message: "Invalid or expired reset link. Please request a new one.",
    });
    return;
  }

  user.password = await bcrypt.hash(password, 12);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully. You can sign in with your new password.",
  });
});
