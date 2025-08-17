import { z } from "zod";

// example: OrderedMap { "id": "prod_123", "name": "Wireless Mouse", "description": "Ergonomic wireless mouse", "price": 29.99, "stock": 120, "is_active": true, "categoryId": "cat_1", "category": OrderedMap { "id": "cat_1", "name": "Accessories", "slug": "accessories" }, "imagesURL": List [ OrderedMap { "id": "img_1", "image_url": "https://cdn.example.com/mouse.jpg", "sort_order": 1 } ], "created_at": "2025-08-16T12:00:00.000Z", "updated_at": "2025-08-16T12:00:00.000Z" }

export const ProductSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Product name is required"),
    description: z.string().min(1, "Product description is required"),
    price: z.coerce.number().positive("Price must be a positive number"), // ✅ accepts string or number
    stock: z.coerce.number().int().nonnegative("Stock must be a non-negative integer"),
    categoryId: z.string().min(1, "categoryId is required"), // ✅ matches your payload
    status: z.enum(["active", "inactive"]).default("active"),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format")
      .optional(),
  }).strict();
  