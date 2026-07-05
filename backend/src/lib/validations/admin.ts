import { z } from "zod";

export const getAllUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(["customer", "admin"]).optional(),
  search: z.string().trim().optional(),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const updateOrderStatusSchema = z.object({
  orderStatus: z.enum([
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
