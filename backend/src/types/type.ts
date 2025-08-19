export type CloudinaryConfig = {
  cloud_name: string;
  api_key: string;
  api_secret: string;
};

export type User = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  password_hashed: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type GetAllProductsParams = {
  id?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

// export type ProductResult = {
//   message: string;
//   products: any[];
//   totalProducts: number;
//   page?: number;
//   limit?: number;
// };

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type Role = "ADMIN" | "CUSTOMER" | "DELIVERY";

export type DeliveryStatus =
  | "UNASSIGNED"
  | "ASSIGNED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED";
