import { z } from "zod";

export const addressSchema = z
  .object({
    id: z.string().optional(),
    userId: z.string().min(1, "User ID is required"),
    label: z.string().min(1, "Label is required"),
    recipient_name: z
      .string()
      .min(1, "Recipient name is required")
      .max(100, "Recipient name must be at most 100 characters"),
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 characters")
      .max(15, "Phone number must be at most 15 characters"),
    address: z
      .string()
      .min(1, "Address is required")
      .max(255, "Address must be at most 255 characters"),
    city: z
      .string()
      .min(1, "City is required")
      .max(100, "City must be at most 100 characters"),
    state: z
      .string()
      .min(1, "State is required")
      .max(100, "State must be at most 100 characters"),
    postal_code: z
      .string()
      .min(1, "Postal code is required")
      .max(20, "Postal code must be at most 20 characters"),
    country: z
      .string()
      .min(1, "Country is required")
      .max(20, "Country must be at most 20 characters"),
    is_default: z.boolean().optional(),
  })
  .strict();
