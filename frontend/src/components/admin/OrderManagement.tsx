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

// Backend returns uppercase statuses (e.g. PENDING, CONFIRMED)
type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED" | "PARTIAL";

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
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: string; // ISO
  deliveryPersonnel?: { id: string; name: string } | null;
  raw?: any; // keep original for debugging if needed
}

const mockOrders: OrderUI[] = [];

const statusColors: Record<OrderStatus, string> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  PROCESSING: "secondary",
  SHIPPED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
};

const paymentStatusColors: Record<PaymentStatus, string> = {
  UNPAID: "secondary",
  PAID: "default",
  REFUNDED: "secondary",
  PARTIAL: "secondary",
};

export function OrderManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // UI state
  const [orders, setOrders] = useState<OrderUI[]>(mockOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderUI | null>(null);
  const [isfilitering, setIsFiltering] = useState(false);
  // Fetch orders (assumes API returns { orders: OrderUI[] } or array directly)
  const ordersQuery = useQuery<OrderUI[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await axios.get("/api/orders/admin/orders");
      const rawArray = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.orders)
        ? res.data.orders
        : [];
      // Transform backend order to UI shape
      const transformed: OrderUI[] = rawArray.map((o: any) => {
        const items: OrderUIItem[] = (o.items || []).map((it: any) => ({
          name: it.product_name,
          quantity: it.quantity,
          price: it.unit_price,
        }));
        const total = (o.items || []).reduce(
          (sum: number, it: any) => sum + (Number(it.line_total) || 0),
          0
        );

        const partner = o.delivery?.delivery_partner;
        const deliveryPersonnel = o.delivery
          ? {
              id:
                partner?.id ||
                o.delivery.delivery_partner_id || 
                o.delivery.id,
              name:
                partner?.full_name ||
                partner?.email ||
                partner?.phone ||
                "Assigned Partner",
            }
          : null;

        return {
          id: o.id,
          customer: {
            name: o.user?.full_name || o.user?.name || "Unknown",
            email: o.user?.email || "",
            phone: o.user?.phone,
            address: o.shipping_address
              ? `${o.shipping_address.ship_address}, ${o.shipping_address.ship_city}, ${o.shipping_address.ship_state} ${o.shipping_address.ship_zip}`
              : undefined,
          },
          // Ensure status fits union (fallback to PENDING)
          status: (o.status as OrderStatus) || "PENDING",
          paymentStatus: (o.payment_status as PaymentStatus) || "UNPAID",
          items,
            total,
          createdAt:
            o.placed_at ||
            o.created_at ||
            o.createdAt ||
            new Date().toISOString(),
          deliveryPersonnel,
          raw: o,
        };
      });
      return transformed;
    },
    initialData: mockOrders,
    // staleTime: 1000 * 60,
  });

  console.log("Fetched orders:", ordersQuery.data);

  // Fetch delivery users (assumes API returns { users: [...] } or array)
  const deliveryUsersQuery = useQuery<{ id: string; name: string }[]>({
    queryKey: ["deliveryUsers"],
    queryFn: async () => {
      const res = await axios.get("/api/auth/users?role=DELIVERY");
      console.log("Fetched delivery users:", res.data);
      const arr = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.users)
        ? res.data.users
        : [];
      return arr.map((u: any) => ({
        id: u.id,
        name: u.full_name || u.name || u.email,
      }));
    },
    initialData: [],
    // staleTime: 1000 * 60,
  });

  // console.log("Delivery users:", deliveryUsersQuery.data);

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
      return axios.put(`/api/orders/admin/orders/${orderId}/status`, { status });
    },
    onMutate: ({ orderId, status }) => {
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
      return axios.put(`/api/orders/admin/orders/${orderId}/assign`, {
        deliveryPartnerId: deliveryId,
      });
    },
    onMutate: ({ orderId, deliveryId }) => {
      const delivery =
        deliveryUsersQuery.data?.find((d) => d.id === deliveryId) ?? null;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, deliveryPersonnel: delivery, status: "CONFIRMED" }
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
    // setIsFiltering(true);
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      order.id.toLowerCase().includes(term) ||
      order.customer.name.toLowerCase().includes(term) ||
      order.customer.email.toLowerCase().includes(term);

    const matchesStatus =
      selectedStatus === "all" ||
      order.status === (selectedStatus as OrderStatus);
    // setIsFiltering(false);
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
    const pending = orders.filter((o) => o.status === "PENDING").length;
    const delivered = orders.filter((o) => o.status === "DELIVERED").length;
    const revenue = orders
      .filter((o) => o.status === "DELIVERED")
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
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
                <TableHead>Payment</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredOrders ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {order.customer.name}
                          </div>
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
                        <SelectTrigger className="w-36">
                          <Badge
                            variant={statusColors[order.status]}
                            className="border-0 w-full justify-center"
                          >
                            {order.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                          <SelectItem value="PROCESSING">Processing</SelectItem>
                          <SelectItem value="SHIPPED">Shipped</SelectItem>
                          <SelectItem value="DELIVERED">Delivered</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={paymentStatusColors[order.paymentStatus]}>
                        {order.paymentStatus}
                      </Badge>
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
                                      variant={
                                        statusColors[selectedOrder.status]
                                      }
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
                                <div className="mt-2">
                                  <span className="text-muted-foreground">
                                    Payment:
                                  </span>
                                  <div>
                                    <Badge
                                      variant={
                                        paymentStatusColors[
                                          selectedOrder.paymentStatus
                                        ]
                                      }
                                    >
                                      {selectedOrder.paymentStatus}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">
                                  Order Items
                                </h4>
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
                                      {console.log(selectedOrder)}
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
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground"
                  >
                    No orders found
                  </TableCell>
                </TableRow>
              )}
              {isfilitering && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground"
                  >
                    Filtering orders...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
