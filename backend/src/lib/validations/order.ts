import { z } from "zod";

const shippingAddressSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  street: z.string().trim().min(1, "Street is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  zip: z.string().trim().min(1, "Zip is required"),
  country: z.string().trim().min(1, "Country is required"),
});

export const createPaymentIntentSchema = z.object({
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.string().trim().min(1, "Payment method is required").default("card"),
});

export const getMyOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const getAllOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(["pending", "processing", "shipped", "delivered", "cancelled"])
    .optional(),
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
