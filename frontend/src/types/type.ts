import type { ReactNode } from 'react';

export type UserRole = 'ADMIN' | 'CUSTOMER' | 'DELIVERY';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  phone?: string;
  addresses?: any;
  createdAt: string;
  lastLogin: string;
  ordersCount?: number;
  deliveriesCount?: number;
}


export interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}
export interface AdminLayoutProps {
  children: ReactNode;
}

export type CustomerSection = "catalog" | "cart" | "orders" | "profile"

type ProductImage = {
  image_url: string;
};

export type Product = {
  description: string;
  price: number;
  stock: number;
  imagesURL?: ProductImage[];
};

export type CartItem = {
  id: string;
  cartId: string;
  productId: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
  product?: Product;
};

export type Cart = {
  id: string;
  userId: string;
  status: 'ACTIVE' | 'INACTIVE';  // Assuming "ACTIVE" or "INACTIVE" are the only possible values
  items: CartItem[];
  created_at: string;
  updated_at: string;
};


export type Address = {
  id: string;
  userId: string;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
};

export type ShippingAddress = {
  id: string;
  userId: string;
  ship_name: string;
  ship_phone: string;
  ship_address: string;
  ship_city: string;
  ship_state: string;
  ship_zip: string;
  notes?: string | null;
};


type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type Order = {
  id: string;
  userId: string;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  payment_status: "UNPAID" | "PAID" | "REFUNDED" | "FAILED";
  shipping_address: ShippingAddress;
  items: OrderItem[];
  placed_at: string;  // ISO date string
  updated_at: string; // ISO date string
};

export type Delivery = {
  id: string;
  order_id: string;
  delivery_partner_id: string;
  status: "UNASSIGNED" | "ASSIGNED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED";
  assigned_at: string;    // ISO string for DateTime
  last_update_at: string; // ISO string for DateTime
  notes?: string | null;

  // Relations
  order: Order;            // assuming you have an Order type
  delivery_partner: User;  // assuming you have a User type
};
