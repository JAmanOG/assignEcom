// filepath: src/validation/schemas.ts
import { z } from "zod";

// Generic helpers
export const idParamSchema = z.object({ id: z.string().min(1, "id is required") });
export const uuidLike = () => z.string().min(1, "uuid is required");
export const addressIdParamSchema = z.object({ id: z.string().min(1, "addressId is required") });
export const cartItemIdParamSchema = z.object({ itemId: z.string().min(1, "itemId is required") });
export const deliveryIdParamSchema = z.object({ deliveryId: z.string().min(1, "deliveryId is required") });
export const cartIdParamSchema = z.object({ cartId: z.string().min(1, "cartId is required") });

// User / Auth
export const registerUserSchema = z.object({
  full_name: z.string().min(1, "full_name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "phone must be at least 10 digits"),
  password: z.string().min(6, "password must be at least 6 characters")
});
export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "password must be at least 6 characters")
});
export const updateUserSchema = z.object({
  full_name: z.string().min(1, "full_name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().min(5, "phone must be at least 5 digits").optional()
}).refine(data => Object.keys(data).length > 0, { message: "At least one field must be provided" });
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "oldPassword is required"),
  newPassword: z.string().min(6, "newPassword must be at least 6 characters")
});

// Category
export const createCategorySchema = z.object({
  name: z.string().min(3, "name must be at least 3 characters"),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format").optional(),
});
export const updateCategorySchema = z.object({
  name: z.string().min(1, "name is required"),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format").optional(),
});

// Product
export const createProductSchema = z.object({
  name: z.string().min(1, "name is required"),
  description: z.string().min(1, "description is required"),
  price: z.coerce.number().nonnegative("price must be a non-negative number"),
  stock: z.coerce.number().int("stock must be an integer").nonnegative("stock must be non-negative"),
  categoryId: z.string().min(1, "categoryId is required"),
  is_active: z.boolean().default(true),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format").optional()
});
export const updateProductSchema = z.object({
  name: z.string().min(1, "name is required").optional(),
  description: z.string().min(1, "description is required").optional(),
  price: z.coerce.number().nonnegative("price must be a non-negative number").optional(),
  stock: z.coerce.number().int("stock must be an integer").nonnegative("stock must be non-negative").optional(),
  categoryId: z.string().min(1, "categoryId is required").optional(),
  is_active: z.boolean().optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format").optional()
});

// Address
export const createAddressSchema = z.object({
  label: z.string().optional(),
  recipient_name: z.string().min(1, "recipient_name is required"),
  phone: z.string().min(5, "phone must be at least 5 digits"),
  address: z.string().min(1, "address is required"),
  city: z.string().min(1, "city is required").max(100, "city must be at most 100 characters"),
  state: z.string().min(1, "state is required").max(100, "state must be at most 100 characters"),
  postal_code: z.string().min(1, "postal_code is required").max(20, "postal_code must be at most 20 characters"),
  country: z.string().min(1, "country is required").max(200, "country must be at most 200 characters"),
  is_default: z.boolean().optional()
});
export const updateAddressSchema = createAddressSchema.partial();

// Cart
export const addItemToCartSchema = z.object({
  productId: z.string().min(1, "productId is required"),
  quantity: z.coerce.number().int("quantity must be an integer").positive("quantity must be greater than 0").default(1)
});
export const updateCartItemQuantitySchema = z.object({
  quantity: z.coerce.number().int("quantity must be an integer").positive("quantity must be greater than 0")
});

// Orders
const orderItemSchema = z.object({
  product_id: z.string().min(1, "product_id is required"),
  quantity: z.coerce.number().int("quantity must be an integer").positive("quantity must be greater than 0")
});
export const placeOrderSchema = z.object({
  address_id: z.string().min(1, "address_id is required").optional(),
  new_shipping_address: z.object({
    recipient_name: z.string().min(1, "recipient_name is required"),
    phone: z.string().min(5, "phone must be at least 5 digits"),
    address: z.string().min(1, "address is required"),
    city: z.string().min(1, "city is required"),
    state: z.string().min(1, "state is required"),
    postal_code: z.string().min(1, "postal_code is required"),
    country: z.string().min(1, "country is required")
  }).optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required")
}).refine(d => d.address_id || d.new_shipping_address, { message: "Either address_id or new_shipping_address required" });

export const placeOrderFromCartSchema = z.object({
  address_id: z.string().min(1, "address_id is required").optional(),
  new_shipping_address: z.object({
    recipient_name: z.string().min(1, "recipient_name is required"),
    phone: z.string().min(5, "phone must be at least 5 digits"),
    address: z.string().min(1, "address is required"),
    city: z.string().min(1, "city is required"),
    state: z.string().min(1, "state is required"),
    postal_code: z.string().min(1, "postal_code is required"),
    country: z.string().min(1, "country is required")
  }).optional()
}).refine(d => d.address_id || d.new_shipping_address, { message: "Either address_id or new_shipping_address required" });

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED"], { required_error: "status is required" })
});
export const assignOrderSchema = z.object({
  deliveryPartnerId: z.string().min(1, "deliveryPartnerId is required")
});

// Orders query (customer)
export const listUserOrdersQuerySchema = z.object({
  page: z.coerce.number().int("page must be an integer").positive("page must be greater than 0").default(1).optional(),
  limit: z.coerce.number().int("limit must be an integer").positive("limit must be greater than 0").max(100, "limit must not exceed 100").default(10).optional(),
  status: z.enum(["PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED"]).optional()
});
// Orders query (admin)
export const listAllOrdersQuerySchema = listUserOrdersQuerySchema;

// Delivery
export const updateDeliveryStatusSchema = z.object({
  status: z.enum(["UNASSIGNED","ASSIGNED","OUT_FOR_DELIVERY","DELIVERED","FAILED"], { required_error: "status is required" }),
  notes: z.string().max(500, "notes must be at most 500 characters").optional().nullable()
});

// Inventory
export const reserveStockSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1, "productId is required"),
    quantity: z.coerce.number().int("quantity must be an integer").positive("quantity must be greater than 0")
  })).min(1, "At least one item is required")
});
export const restockProductSchema = z.object({
  productId: z.string().min(1, "productId is required"),
  quantity: z.coerce.number().int("quantity must be an integer").positive("quantity must be greater than 0"),
  reason: z.string().max(200, "reason must be at most 200 characters").optional()
});

// User list query
export const listUsersQuerySchema = z.object({
  role: z.enum(["ADMIN","CUSTOMER","DELIVERY"]).optional()
});

// Product query schemas
export const listProductsQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  page: z.coerce.number().int("page must be an integer").positive("page must be greater than 0").optional(),
  limit: z.coerce.number().int("limit must be an integer").positive("limit must be greater than 0").max(100, "limit must not exceed 100").optional(),
  sortBy: z.enum(["created_at","price","name","stock","id"]).optional(),
  sortOrder: z.enum(["asc","desc"]).optional()
});

export const filterProductsQuerySchema = z.object({
  categoryId: z.string().optional(),
  minPrice: z.coerce.number().nonnegative("minPrice must be a non-negative number").optional(),
  maxPrice: z.coerce.number().nonnegative("maxPrice must be a non-negative number").optional(),
  search: z.string().optional(),
  inStock: z.coerce.boolean().optional(),
  page: z.coerce.number().int("page must be an integer").positive("page must be greater than 0").optional(),
  limit: z.coerce.number().int("limit must be an integer").positive("limit must be greater than 0").max(100, "limit must not exceed 100").optional()
}).refine(d => (d.minPrice === undefined || d.maxPrice === undefined) || d.minPrice <= d.maxPrice, { message: "minPrice must be <= maxPrice" });

// Admin Analytics
export const orderStatusQuerySchema = z.object({
  status: z.enum(["PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED"], { required_error: "status is required" })
});
export const deliveryStatusQuerySchema = z.object({
  status: z.enum(["PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED"], { required_error: "status is required" })
});
export const topSellingProductsQuerySchema = z.object({
  limit: z.coerce.number().int("limit must be an integer").positive("limit must be greater than 0").max(100, "limit must not exceed 100").optional()
});

// Utility to format Zod errors
export function formatZodError(error: z.ZodError) {
  return error.flatten();
}
