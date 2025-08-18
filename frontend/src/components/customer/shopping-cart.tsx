"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  CheckCircle,
  Badge,
  Truck,
  Package,
  Copy,
  Download,
} from "lucide-react";
import axios from "@/lib/axios";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { PhotoView } from "react-photo-view";
import type { CartItem } from "@/types/type";
import { useToast } from "@/hooks/use-toast";
import AddressSelectionDialog from "./component/addressSelection";
import type { Address } from "@/types/type";

type UpdateCartPayload = {
  id: string;
  quantity: number;
};

export function ShoppingCart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const {
    data: cartData,
    isLoading: isCartLoading,
    error: cartError,
  } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const response = await axios.get("/api/cart");
      setCartItems(response.data.cart.items);
      return response.data.cart;
    },
    initialData: [],
  });

  const updateCartMutation = useMutation({
    mutationFn: async (updatedCart: UpdateCartPayload) => {
      const response = await axios.put(`/api/cart/${updatedCart.id}`, {
        quantity: updatedCart.quantity,
      });
      return response.data.cart;
    },
    onMutate: async (updatedCart) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData(["cart"]);
      queryClient.setQueryData(["cart"], (old: any) => {
        return {
          ...old,
          items: old.items.map((item: CartItem) =>
            item.id === updatedCart.id
              ? { ...item, quantity: updatedCart.quantity }
              : item
          ),
        };
      });
      return { previousCart };
    },
    onError: (err, _newCart, context) => {
      queryClient.setQueryData(["cart"], context?.previousCart);
      toast({
        title: "Error updating cart",
        description: `Failed to update cart: ${err.message}`,
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
      toast({
        title: "Cart updated",
        description: "Your cart has been successfully updated.",
        variant: "success",
      });
    },
  });

  const getAddress = (data: Address) => {
    setSelectedAddress(data);
  };

  const onOrderedMutation = useMutation({
    mutationFn: async (payload: { id: string; address_id: string | null }) => {
      const response = await axios.post(
        `/api/orders/cart/${payload.id}/order`,
        { address_id: payload.address_id }
      );
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Order placed successfully!",
        description:
          "Your order has been placed and will be processed shortly.",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error placing order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const updateQuantity = debounce((id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(id);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );

    updateCartMutation.mutate({ id, quantity: newQuantity });
  }, 400);

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/cart/${id}`);
      return response.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData(["cart"]);
      queryClient.setQueryData(["cart"], (old: any) => {
        return {
          ...old,
          items: old.items.filter((item: CartItem) => item.id !== id),
        };
      });
      return { previousCart };
    },
    onError: (err, _id, context) => {
      queryClient.setQueryData(["cart"], context?.previousCart);
      toast({
        title: "Error deleting item",
        description: `Failed to delete item: ${err.message}`,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({
        title: "Item deleted",
        description: "The item has been successfully removed from your cart.",
        variant: "success",
      });
    },
  });

  const removeItem = debounce((id: string) => {
    deleteItemMutation.mutate(id);
    setCartItems(cartData.items.filter((item: CartItem) => item.id !== id));
  }, 300);

  const continueShopping = () => {
    window.location.href = "/shop";
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.total_price, 0);
  const shipping = subtotal > 100 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before proceeding.",
        variant: "warning",
      });
      return;
    }

    const payload = {
      id: cartData.id,
      address_id: selectedAddress?.id || null,
    };
    onOrderedMutation.mutate(payload);
  };

  const OrderCompletedDialog = () => {
    const [isOpen, setIsOpen] = useState(false);

    const orderData = {
      orderNumber: "#ORD-8901",
      total: 249.99,
      itemCount: 5,
      estimatedDelivery: "Aug 22, 2024",
      trackingNumber: "TRK123456789",
    };

    return (
      <div className="p-8 bg-gray-50">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" onClick={proceedToCheckout}>
              Proceed to Checkout
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md">
            <div className="text-center pb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Order Completed!
                </DialogTitle>
                <p className="text-gray-600 text-sm">
                  Thank you for your purchase
                </p>
              </DialogHeader>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-900">
                    {orderData.orderNumber}
                  </span>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    Confirmed
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {orderData.itemCount} items
                  </span>
                  <span className="text-xl font-bold text-gray-900">
                    ${orderData.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Truck size={16} className="mr-2 text-blue-600" />
                    <span className="text-sm font-medium">Delivery</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {orderData.estimatedDelivery}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Package size={16} className="mr-2 text-blue-600" />
                    <span className="text-sm font-medium">Tracking</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mr-2">
                      {orderData.trackingNumber}
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Copy size={12} />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Truck size={16} className="mr-2" />
                  Track Order
                </Button>

                <Button variant="outline" className="w-full">
                  <Download size={16} className="mr-2" />
                  Download Receipt
                </Button>
              </div>

              <div className="text-center pt-2 border-t">
                <p className="text-xs text-gray-500">
                  Confirmation email sent • Need help? Contact support
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  if (cartItems.length === 0) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600">Your cart is currently empty</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-600 mb-4">Add some products to get started!</p>
            <Button onClick={continueShopping}>Continue Shopping</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCartLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading your cart...</p>
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-red-600">Error loading cart: {cartError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <p className="text-gray-600">{cartItems.length} items in your cart</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Cart Items</CardTitle>
              <CardDescription>Review your selected products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 py-4 border-b last:border-b-0 min-w-0"
                  >
                    <div className="flex items-start sm:items-center sm:space-x-4 min-w-0">
                      <PhotoView
                        src={
                          item.product?.imagesURL?.[0].image_url || "/placeholder.svg"
                        }
                      >
                        <img
                          src={
                            item.product?.imagesURL?.[0].image_url || "/placeholder.svg"
                          }
                          alt={item.product_name}
                          className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded flex-shrink-0"
                        />
                      </PhotoView>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{item.product_name}</h3>
                        <p className="text-sm text-gray-600">${item.unit_price}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mt-0 sm:mt-0">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          aria-label={`Quantity for ${item.product_name}`}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.id,
                              Number.parseInt(e.target.value) || 0
                            )
                          }
                          className="w-14 sm:w-16 text-center"
                          min="0"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <p className="font-medium">${item.total_price}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" onClick={continueShopping}>
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader />
            <CardContent className="space-y-4 lg:sticky lg:top-20">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              {subtotal < 100 && (
                <p className="text-sm text-gray-600">
                  Add ${(100 - subtotal).toFixed(2)} more for free shipping!
                </p>
              )}

              {!selectedAddress && <AddressSelectionDialog onAddressSelect={getAddress} />}
              {selectedAddress && <OrderCompletedDialog />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
