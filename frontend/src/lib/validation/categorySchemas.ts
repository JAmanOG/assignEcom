import { z } from "zod";

export const categorySchema = z.object({
  // id: z.string().optional(),
  name: z.string().min(1, "Category name is required"),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format").optional(),
});