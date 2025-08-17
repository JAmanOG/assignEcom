"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ShoppingCart, Star } from "lucide-react";
import axios from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { CartItemSchema } from "@/lib/validation/cartSchemas";
import { useToast } from "@/hooks/use-toast";
import type { CartItem,Cart } from "@/types/type";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  cartData?: CartItem | null;
  rating?: number;
  reviews?: number;
  image?: string;
  inStock: boolean;
  description?: string;
}

interface AddCart {
  productId: string;
  quantity: number;
}

export function ProductCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [products] = useState<Product[]>([]);

  const { data: cartData, isLoading: isCartLoading } = useQuery<Cart[], AxiosError>({
    queryKey: ["cart"],
    queryFn: async () => {
      const response = await axios.get("/api/cart");
      console.log("Fetched cart data:", response.data.cart);
      return response.data.cart;
    },
    initialData: [],
    // staleTime: 1000 * 60, // 1 minute
    // refetchOnWindowFocus: false,
  });


  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery<Product[], AxiosError>({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await axios.get("/api/products");

      // waiting until the isCartloading is true
      if (isCartLoading) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const ValidProduct = response.data.products
        .map((p: any) => ({
          ...p,
          inStock: p.stock > 0,
          cartData: cartData?.items.find((c: CartItem) => c.productId === p.id) || null,
          image: p.imagesURL[0]?.image_url || "/placeholder.svg",
          description: p.description,
          rating: p.rating || 4.0,
          reviews: p.reviews || 0,
        }))
        .filter((p: any) => p.is_active !== false);
      console.log("Fetched products:", ValidProduct);
      return ValidProduct;
    },
    initialData: products,
    // staleTime: 1000 * 60, // 1 minute
    // cacheTime: 1000 * 60 * 2, // 2 minutes
    // refetchOnWindowFocus: false,
  });



  const addProductMutation = useMutation({
    mutationFn: async (data: AddCart) => {
      CartItemSchema.parse(data);
      const response = await axios.post("/api/cart/add", data);
      return response.data;
    },
    onSuccess: (data) => {
      // console.log("Product added to cart:", data);
      toast({
        title: "Product added to cart",
        description: `${data.item.product_name} has been added to your cart.`,
      });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: AxiosError) => {
      console.error("Error adding product to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      });
    },
  });

  const categories = [
    { id: "all", name: "All Categories" },
    ...Array.from(
      new Map(
        productsData?.map((p) => {
          // console.log("p", p);
          return [p.category.id, p.category];
        })
      ).values()
    ),
  ];

  // console.log("Available categories:", categories);

  const filteredProducts = productsData
    .filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || product.category.name === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const addToCart = (product: Product) => {
    try {
      const cartItem: AddCart = {
        productId: product.id,
        quantity: 1,
      };

      addProductMutation.mutate(cartItem);
      console.log("Adding to cart:", cartItem);
    } catch (error: unknown) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <p>Loading products...</p>;
  if (error) {
    console.log(error);
    return <p className="text-red-500">Failed to fetch products.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Product Catalog</h1>
        <p className="text-gray-600">Discover our amazing products</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="aspect-square relative">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.originalPrice && (
                <Badge className="absolute top-2 left-2 bg-red-500">Sale</Badge>
              )}
              {!product.inStock && (
                <Badge variant="secondary" className="absolute top-2 right-2">
                  Out of Stock
                </Badge>
              )}
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <Badge variant="outline">{product.category.name}</Badge>
              </div>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium ml-1">
                    {product.rating}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  ({product.reviews} reviews)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">${product.price}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-500 line-through">
                      ${product.originalPrice}
                    </span>
                  )}
                </div>
                {
                  product.cartData ? (
                    <span className="text-sm text-green-500">
                    In Cart: {product.cartData.quantity}
                  </span>
                  ): (
                    <Button
                    onClick={() => addToCart(product)}
                    disabled={!product.inStock}
                    size="sm"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {product.inStock ? "Add to Cart" : "Out of Stock"}
                  </Button>
  
                  )
                }
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No products found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
}
