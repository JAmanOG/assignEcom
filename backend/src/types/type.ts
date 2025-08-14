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

export type ProductResult = {
  message: string;
  products: any[];
  totalProducts: number;
  page?: number;
  limit?: number;
};
