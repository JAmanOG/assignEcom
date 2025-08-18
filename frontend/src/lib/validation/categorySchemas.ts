import { z } from "zod";

export const categorySchema = z.object({
  // id: z.string().optional(),
  name: z.string().min(3, "Category name is required & must be at least 3 characters"),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format").optional(),
});