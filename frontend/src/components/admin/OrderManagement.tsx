"use client";

import React, { useEffect, useState } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Eye, Package, User, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

// Local UI-order shape used by this component (keeps component decoupled from backend shape)
interface OrderUIItem {
  name: string;
  quantity: number;
  price: number;
}

type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

interface OrderUI {
  id: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  items: OrderUIItem[];
  status: OrderStatus;
  total: number;
  createdAt: string; // ISO
  deliveryPersonnel?: { id: string; name: string } | null;
}

const mockOrders: OrderUI[] = [];

const statusColors: Record<OrderStatus, string> = {
  pending: "secondary",
  confirmed: "default",
  processing: "secondary",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
};

export function OrderManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // UI state
  const [orders, setOrders] = useState<OrderUI[]>(mockOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderUI | null>(null);

  // Fetch orders (assumes API returns { orders: OrderUI[] } or array directly)
  const ordersQuery = useQuery<OrderUI[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await axios.get("/api/orders/admin/orders");
      // normalize response (defensive)
      if (Array.isArray(res.data)) return res.data as OrderUI[];
      if (Array.isArray(res.data.orders)) return res.data.orders as OrderUI[];
      return [];
    },
    initialData: mockOrders,
    staleTime: 1000 * 60, // 1 minute
  });

  // Fetch delivery users (assumes API returns { users: [...] } or array)
  const deliveryUsersQuery = useQuery<{ id: string; name: string }[]>({
    queryKey: ["deliveryUsers"],
    queryFn: async () => {
      const res = await axios.get("/api/auth/users?role=DELIVERY");
      console.log("Fetched delivery users:", res.data);
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data.users)) return res.data.users;
      console.error("Unexpected delivery users response format:", res.data);
      return [];
    },
    initialData: [],
  });

  console.log("Delivery users:", deliveryUsersQuery.data);

  // Keep local copy for optimistic updates / filtering
  useEffect(() => {
    if (ordersQuery.data) setOrders(ordersQuery.data);
  }, [ordersQuery.data]);

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: OrderStatus;
    }) => {
      // backend endpoint may vary; adapt as needed
      return axios.patch(`/api/orders/${orderId}/status`, { status });
    },
    onMutate: ({ orderId, status }) => {
      // optimistic update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Success", description: "Order status updated" });
    },
    onError: (err: AxiosError) => {
      toast({ title: "Error", description: "Failed to update order status" });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const assignDeliveryMutation = useMutation({
    mutationFn: async ({
      orderId,
      deliveryId,
    }: {
      orderId: string;
      deliveryId: string;
    }) => {
      return axios.post(`/api/orders/${orderId}/assign-delivery`, {
        deliveryId,
      });
    },
    onMutate: ({ orderId, deliveryId }) => {
      {console.log("Delivery person:", deliveryUsersQuery)}

      const delivery =
        deliveryUsersQuery.data?.find((d) => d.id === deliveryId) ?? null;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, deliveryPersonnel: delivery, status: "confirmed" }
            : o
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Success", description: "Delivery person assigned" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to assign delivery" });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  // Filtering locally
  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      order.id.toLowerCase().includes(term) ||
      order.customer.name.toLowerCase().includes(term) ||
      order.customer.email.toLowerCase().includes(term);

    const matchesStatus =
      selectedStatus === "all" ||
      order.status === (selectedStatus as OrderStatus);
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  const getOrderStats = () => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const revenue = orders
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + (o.total ?? 0), 0);
    return { total, pending, delivered, revenue };
  };

  const stats = getOrderStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Order Management</h2>
        <p className="text-muted-foreground">
          Track and manage customer orders
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Orders
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.revenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            Manage all customer orders and their delivery status
          </CardDescription>

          <div className="flex gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders by ID, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium">{order.customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.customer.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      {order.items.length} item
                      {order.items.length > 1 ? "s" : ""}
                    </div>
                  </TableCell>

                  <TableCell>${order.total.toFixed(2)}</TableCell>

                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value: string) =>
                        updateStatusMutation.mutate({
                          orderId: order.id,
                          status: value as OrderStatus,
                        })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={statusColors[order.status]}
                            className="border-0"
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell>
                    {order.deliveryPersonnel ? (
                      <div className="text-sm">
                        {order.deliveryPersonnel.name}
                      </div>
                    ) : (
                      <Select
                        onValueChange={(value) =>
                          assignDeliveryMutation.mutate({
                            orderId: order.id,
                            deliveryId: value,
                          })
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Assign" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryUsersQuery.data?.map((person) => (
                            <SelectItem key={person.id} value={person.id}>
                              {console.log("Delivery person:", deliveryUsersQuery)}
                              {person.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </TableCell>

                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>

                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            Order Details - {selectedOrder?.id}
                          </DialogTitle>
                          <DialogDescription>
                            Complete order information and customer details
                          </DialogDescription>
                        </DialogHeader>

                        {selectedOrder ? (
                          <div className="space-y-6">
                            <div>
                              <h4 className="font-medium mb-2">
                                Customer Information
                              </h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">
                                    Name:
                                  </span>
                                  <div>{selectedOrder.customer.name}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Email:
                                  </span>
                                  <div>{selectedOrder.customer.email}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Phone:
                                  </span>
                                  <div>
                                    {selectedOrder.customer.phone ?? "-"}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Status:
                                  </span>
                                  <Badge
                                    variant={statusColors[selectedOrder.status]}
                                    className="ml-2"
                                  >
                                    {selectedOrder.status}
                                  </Badge>
                                </div>
                              </div>

                              <div className="mt-2">
                                <span className="text-muted-foreground">
                                  Address:
                                </span>
                                <div>
                                  {selectedOrder.customer.address ?? "-"}
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Order Items</h4>
                              <div className="border rounded-lg">
                                {selectedOrder.items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className={`flex justify-between items-center p-3 ${
                                      idx > 0 ? "border-t" : ""
                                    }`}
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {item.name}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        Quantity: {item.quantity}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div>${item.price.toFixed(2)} each</div>
                                      <div className="text-sm font-medium">
                                        $
                                        {(item.price * item.quantity).toFixed(
                                          2
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                <div className="border-t p-3 bg-muted/50">
                                  <div className="flex justify-between items-center font-medium">
                                    <span>Total</span>
                                    <span>
                                      ${selectedOrder.total.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {selectedOrder.deliveryPersonnel && (
                              <div>
                                <h4 className="font-medium mb-2">
                                  Delivery Information
                                </h4>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">
                                    Assigned to:
                                  </span>
                                  <div>
                                    {selectedOrder.deliveryPersonnel.name}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>Loading...</div>
                        )}
                      </DialogContent>
                    </Dialog>
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
