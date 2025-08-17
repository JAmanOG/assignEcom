import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PhotoView } from "react-photo-view";
import AddCategory from "./additional/addCategories";
import { ProductSchema } from "@/lib/validation/productSchemas";
import axios from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

export interface ImageURL {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

type ErrorResponse = {
  message: string;
};

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  imagesURL: ImageURL[];
  category: Category;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
}

const baseCategories = [
  "Fruits",
  "Vegetables",
  "Grains",
  "Dairy",
  "Meat",
  "Electronics",
];

export function ProductManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [newProduct, setNewProduct] = useState({
    name: "",
    categoryId: "",
    price: "",
    stock: "",
    description: "",
    status: "active" as "active" | "inactive",
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<
    Product[]
  >({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await axios.get("/api/products");
      return res.data.products;
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: categoriesFromServer = [], isLoading: categoriesLoading } =
    useQuery<Category[]>({
      queryKey: ["categories"],
      queryFn: async () => {
        const res = await axios.get("/api/categories");
        return res.data.categories;
      },
      staleTime: 1000 * 60 * 5,
    });

  const handleCategoriesAdd = (newCategory: Category) => {
    queryClient.setQueryData<Category[]>(["categories"], (oldCategories) => {
      if (!oldCategories) return [newCategory];
      return [...oldCategories, newCategory];
    });
  };

  const categories = useMemo((): Category[] => {
    const serverCategories = categoriesFromServer || [];
    const baseCategoryObjects = baseCategories.map((name) => ({
      id: name.toLowerCase(),
      name,
    }));
    return [...baseCategoryObjects, ...serverCategories];
  }, [categoriesFromServer]);

  const addProductMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      ProductSchema.parse({
        name: formData.get("name"),
        description: formData.get("description"),
        price: parseFloat(formData.get("price")?.toString() || "0"),
        stock: parseInt(formData.get("stock")?.toString() || "0", 10),
        categoryId: formData.get("categoryId"),
        status: formData.get("status"),
      });

      const response = await axios.post("/api/products", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product added successfully",
      });
      setNewProduct({
        name: "",
        categoryId: "",
        price: "",
        stock: "",
        description: "",
        status: "active",
      });
      setFiles([]);
      setPreviewUrls([]);
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: { id: string; formData: FormData }) => {
      ProductSchema.parse({
        name: data.formData.get("name"),
        description: data.formData.get("description"),
        price: parseFloat(data.formData.get("price")?.toString() || "0"),
        stock: parseInt(data.formData.get("stock")?.toString() || "0", 10),
        categoryId: data.formData.get("categoryId"),
        status: data.formData.get("status"),
      });

      const response = await axios.put(
        `/api/products/${data.id}`,
        data.formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      setEditingProduct(null);
      setNewProduct({
        name: "",
        categoryId: "",
        price: "",
        stock: "",
        description: "",
        status: "active",
      });
      setFiles([]);
      setPreviewUrls([]);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/products/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddProduct = () => {
    try {
      console.log("Adding product:", newProduct);
      const formData = new FormData();
      formData.append("name", newProduct.name);
      formData.append("description", newProduct.description);
      formData.append("price", newProduct.price);
      formData.append("stock", newProduct.stock);
      formData.append("categoryId", newProduct.categoryId);
      formData.append("status", newProduct.status);

      console.log("Adding product:", formData);

      // Append each file
      files.forEach((file) => {
        formData.append("imagesURL", file);
      });

      console.log("FormData prepared:", formData);

      addProductMutation.mutate(formData);
    } catch (err: any) {
      toast({
        title: "Validation error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      categoryId: product.categoryId,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description,
      status: product.is_active ? "active" : "inactive",
    });
    setPreviewUrls(product.imagesURL.map((img) => img.image_url));
  };

  const handleUpdateProduct = () => {
    if (!editingProduct) return;

    try {
      const formData = new FormData();
      formData.append("name", newProduct.name);
      formData.append("description", newProduct.description);
      formData.append("price", newProduct.price);
      formData.append("stock", newProduct.stock);
      formData.append("categoryId", newProduct.categoryId);
      formData.append("status", newProduct.status);

      // Append new files if any
      files.forEach((file) => {
        formData.append("imagesURL", file);
      });

      updateProductMutation.mutate({
        id: editingProduct.id,
        formData,
      });
    } catch (err: any) {
      toast({
        title: "Validation error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = (id: string) => {
    console.log("Deleting product with ID:", id);
    deleteProductMutation.mutate(id);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).slice(0, 5);
    setFiles(selectedFiles);

    // Create preview URLs
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  if (productsLoading || categoriesLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Product Management
          </h2>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Create a new product in your inventory
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newProduct.categoryId}
                    onValueChange={(value) =>
                      setNewProduct({ ...newProduct, categoryId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, price: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, stock: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="images">Product Images</Label>
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {previewUrls.map((url, index) => (
                      <PhotoView key={index} src={url}>
                        <img
                          src={url}
                          alt={`Product preview ${index + 1}`}
                          className="w-24 h-24 object-cover rounded cursor-pointer"
                        />
                      </PhotoView>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAddProduct}
                  disabled={addProductMutation.isPending}
                >
                  {addProductMutation.isPending ? "Adding..." : "Add Product"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <AddCategory onCategoryAdd={handleCategoriesAdd} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            A list of all products in your inventory
          </CardDescription>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        {product.imagesURL.length > 0 ? (
                          <PhotoView src={product.imagesURL[0].image_url}>
                            <img
                              src={product.imagesURL[0].image_url}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-lg cursor-pointer"
                            />
                          </PhotoView>
                        ) : (
                          <Package className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-48">
                          {product.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category.name}</TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <span
                      className={product.stock === 0 ? "text-destructive" : ""}
                    >
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.is_active ? "success" : "destructive"}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog
                        open={editingProduct?.id === product.id}
                        onOpenChange={(open) => {
                          if (!open) setEditingProduct(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          {product.is_active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Product</DialogTitle>
                            <DialogDescription>
                              Update product information
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="edit-name">Product Name</Label>
                              <Input
                                id="edit-name"
                                value={newProduct.name}
                                onChange={(e) =>
                                  setNewProduct({
                                    ...newProduct,
                                    name: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="edit-category">Category</Label>
                              <Select
                                value={newProduct.categoryId}
                                onValueChange={(value) =>
                                  setNewProduct({
                                    ...newProduct,
                                    categoryId: value,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem
                                      key={category.id}
                                      value={category.id}
                                    >
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="edit-price">Price ($)</Label>
                                <Input
                                  id="edit-price"
                                  type="number"
                                  step="0.01"
                                  value={newProduct.price}
                                  onChange={(e) =>
                                    setNewProduct({
                                      ...newProduct,
                                      price: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="edit-stock">Stock</Label>
                                <Input
                                  id="edit-stock"
                                  type="number"
                                  value={newProduct.stock}
                                  onChange={(e) =>
                                    setNewProduct({
                                      ...newProduct,
                                      stock: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="edit-description">
                                Description
                              </Label>
                              <Textarea
                                id="edit-description"
                                value={newProduct.description}
                                onChange={(e) =>
                                  setNewProduct({
                                    ...newProduct,
                                    description: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="edit-images">
                                Product Images
                              </Label>
                              <Input
                                id="edit-images"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                              />
                              <div className="mt-2 flex flex-wrap gap-2">
                                {previewUrls.map((url, index) => (
                                  <PhotoView key={index} src={url}>
                                    <img
                                      src={url}
                                      alt={`Product preview ${index + 1}`}
                                      className="w-24 h-24 object-cover rounded cursor-pointer"
                                    />
                                  </PhotoView>
                                ))}
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleUpdateProduct}
                              disabled={updateProductMutation.isPending}
                            >
                              {updateProductMutation.isPending
                                ? "Updating..."
                                : "Update Product"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {product.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-destructive hover:text-destructive"
                          disabled={deleteProductMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
