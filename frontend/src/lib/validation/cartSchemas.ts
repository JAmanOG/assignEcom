import { z } from "zod";

export const CartItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
    quantity: z.coerce.number().int().positive("Quantity must be a positive integer"),
}).strict();