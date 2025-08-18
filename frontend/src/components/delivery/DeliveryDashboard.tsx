"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MapPin, Phone, CheckCircle, Navigation, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Delivery as DeliveryType } from "@/types/type";
import axios from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type UIStatus =
  | "assigned"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "unassigned";

interface LocalDelivery {
  id: string;
  orderId: string;
  backendStatus: string;
  status: UIStatus;
  assigned_at?: string | null;
  last_update_at?: string | null;
  notes?: string | null;

  // derived from order
  customerName: string;
  customerPhone?: string | null;
  address?: string | null;
  itemsCount: number;
  amount: number;

  // keep raw order if needed
  raw?: any;
}

export function DeliveryDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // UI state
  const [orders, setOrders] = useState<LocalDelivery[]>([]);
  const [deliveryNotesDialog, setDeliveryNotesDialog] = useState<string | null>(
    null
  );
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [orderDetailsDialog, setOrderDetailsDialog] = useState<string | null>(
    null
  );
  const [selectedOrderDetail, setSelectedOrderDetail] =
    useState<LocalDelivery | null>(null);

  // Fetch deliveries assigned to this delivery partner
  const {
    data: deliveriesData = [],
    // isLoading,
    // isError,
  } = useQuery({
    queryKey: ["deliveries"],
    queryFn: async () => {
      const res = await axios.get("/api/delivery/orders/get-assigned-delivery");
      // console.log("Fetched deliveries:", res.data);
      const payload = res.data?.deliveries ?? res.data ?? [];
      return payload as DeliveryType[];
    },
    initialData: [],
  });

  // Helpers: status mapping
  const backendToUIStatus = (s?: string): UIStatus => {
    if (!s) return "unassigned";
    const up = String(s).toUpperCase();
    if (up === "ASSIGNED") return "assigned";
    if (up === "OUT_FOR_DELIVERY") return "out_for_delivery";
    if (up === "DELIVERED") return "delivered";
    if (up === "FAILED") return "failed";
    return "unassigned";
  };

  const uiToBackendStatus = (s: UIStatus) => {
    if (s === "assigned") return "ASSIGNED";
    if (s === "out_for_delivery") return "OUT_FOR_DELIVERY";
    if (s === "delivered") return "DELIVERED";
    if (s === "failed") return "FAILED";
    return "UNASSIGNED";
  };

  // Normalize server deliveries to the LocalDelivery UI shape
  useEffect(() => {
    if (!Array.isArray(deliveriesData)) return;

    const normalized: LocalDelivery[] = deliveriesData.map((d: any) => {
      const order = d.order ?? {};
      const ship = (order.shipping_address as any) ?? {};
      const items = Array.isArray(order.items) ? order.items : [];
      const amount = items.reduce(
        (sum: number, it: any) => sum + (it.line_total ?? 0),
        0
      );

      const addressParts = [
        ship.ship_address,
        ship.ship_city,
        ship.ship_state,
        ship.ship_zip,
      ].filter(Boolean);
      const address = addressParts.join(", ");

      return {
        id: d.id,
        orderId: order.id,
        backendStatus: d.status,
        status: backendToUIStatus(d.status),
        assigned_at: d.assigned_at ?? null,
        last_update_at: d.last_update_at ?? null,
        notes: d.notes ?? null,

        customerName: ship.ship_name ?? order.user?.full_name ?? "Customer",
        customerPhone: ship.ship_phone ?? order.user?.phone ?? null,
        address,
        itemsCount: items.length,
        amount,
        raw: d,
      };
    });

    setOrders(normalized);
  }, [deliveriesData]);

  // Mutation to update delivery status on server
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: string;
      notes?: string | null;
    }) => {
      return axios.put(`/api/delivery/orders/${id}/status`, { status, notes });
    },
    onMutate: async ({ id, status, notes }) => {
      await queryClient.cancelQueries({ queryKey: ["deliveries"] });
      const previous = queryClient.getQueryData(["deliveries"]);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                backendStatus: status,
                status: backendToUIStatus(status),
                notes: notes ?? o.notes,
              }
            : o
        )
      );

      return { previous };
    },
    onError: (err, _variables, context: any) => {
      toast({ title: "Error", description: `Failed to update status ${err.message}` });
      if (context?.previous)
        queryClient.setQueryData(["deliveries"], context.previous);
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Delivery status updated" });
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    },
  });

  // UI actions
  const updateOrderStatus = (
    deliveryId: string,
    newStatusUI: UIStatus,
    notes?: string | null
  ) => {
    const backendStatus = uiToBackendStatus(newStatusUI);
    updateStatusMutation.mutate({
      id: deliveryId,
      status: backendStatus,
      notes: notes ?? null,
    });
  };

  const handleMarkOutForDelivery = (deliveryId: string) => {
    updateOrderStatus(deliveryId, "out_for_delivery");
  };

  const handleMarkDelivered = (deliveryId: string) => {
    setDeliveryNotesDialog(deliveryId);
    setDeliveryNotes("");
  };

  const confirmDelivery = () => {
    if (!deliveryNotesDialog) return;
    updateOrderStatus(deliveryNotesDialog, "delivered", deliveryNotes || null);
    setDeliveryNotesDialog(null);
    setDeliveryNotes("");
  };

  const getStatusBadge = (status: UIStatus) => {
    const configs: Record<UIStatus, { className: string; label: string }> = {
      assigned: { className: "status-pending", label: "Assigned" },
      out_for_delivery: {
        className: "status-shipped",
        label: "Out for Delivery",
      },
      delivered: { className: "status-delivered", label: "Delivered" },
      failed: { className: "status-destructive", label: "Failed" },
      unassigned: { className: "status-muted", label: "Unassigned" },
    };
    const cfg = configs[status] ?? configs.unassigned;
    return <Badge className={`${cfg.className} border`}>{cfg.label}</Badge>;
  };

  const getActionButton = (d: LocalDelivery) => {
    switch (d.status) {
      case "assigned":
        return (
          <Button
            size="sm"
            onClick={() => handleMarkOutForDelivery(d.id)}
            className="w-full"
          >
            <Navigation className="w-4 h-4 mr-2" /> Mark Out for Delivery
          </Button>
        );
      case "out_for_delivery":
        return (
          <Button
            size="sm"
            onClick={() => handleMarkDelivered(d.id)}
            className="w-full"
          >
            <CheckCircle className="w-4 h-4 mr-2" /> Mark as Delivered
          </Button>
        );
      case "delivered":
        return (
          <div className="w-full">
            <Badge className="w-full justify-center status-delivered border">
              <CheckCircle className="w-4 h-4 mr-2" /> Completed
            </Badge>
          </div>
        );
      case "failed":
        return (
          <Badge className="w-full justify-center status-destructive border">
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  const openOrderDetails = (deliveryId: string) => {
    const found = orders.find((o) => o.id === deliveryId) ?? null;
    setSelectedOrderDetail(found);
    setOrderDetailsDialog(found ? deliveryId : null);
  };

  const closeOrderDetails = () => {
    setOrderDetailsDialog(null);
    setSelectedOrderDetail(null);
  };

  const activeOrders = orders.filter((o) => o.status !== "delivered");

  const formatDate = (iso?: string | null) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString();
    } catch (e) {
      return iso;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Delivery Dashboard</h1>
        <p className="text-muted-foreground">
          View assigned deliveries and update delivery status
        </p>
      </div>

      {/* Assigned Deliveries */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Assigned Deliveries</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {activeOrders.map((order) => (
            <Card key={order.id} className="hover-lift">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{order.orderId}</CardTitle>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openOrderDetails(order.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Customer Details */}
                <div>
                  <h3 className="font-semibold mb-1">{order.customerName}</h3>
                  {order.customerPhone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Phone className="w-4 h-4" />
                      {order.customerPhone}
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <span>{order.address ?? "—"}</span>
                  </div>
                </div>

                {/* Order Details */}
                <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
                  <div>
                    <div className="text-muted-foreground">Items</div>
                    <div className="font-medium">{order.itemsCount}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground">Amount</div>
                    <div className="font-semibold">
                      {order.amount.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Delivery Notes (if present) */}
                {order.notes && (
                  <div className="p-3 bg-success/10 rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium text-success mb-1">
                        Delivery Notes:
                      </div>
                      <div>{order.notes}</div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-2">{getActionButton(order)}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {activeOrders.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success" />
              <h3 className="font-semibold mb-2">All deliveries completed!</h3>
              <p className="text-muted-foreground">
                Check back later for new delivery assignments.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog
        open={!!orderDetailsDialog}
        onOpenChange={(open) => {
          if (!open) closeOrderDetails();
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {selectedOrderDetail ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Order ID</div>
                  <div className="font-medium">
                    {selectedOrderDetail.orderId}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">Placed at</div>
                <div className="font-medium">
                  {formatDate(selectedOrderDetail.raw?.order?.placed_at)}
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium mb-2">Items</h4>
                <div className="border rounded-lg overflow-hidden">
                  {(selectedOrderDetail.raw?.order?.items ?? []).map(
                    (it: any, idx: number) => (
                      <div
                        key={it.id ?? idx}
                        className={`flex justify-between items-center p-3 ${
                          idx > 0 ? "border-t" : ""
                        }`}
                      >
                        <div>
                          <div className="font-medium">{it.product_name}</div>
                          <div className="text-sm text-muted-foreground">
                            Qty: {it.quantity}
                          </div>
                        </div>
                        <div className="text-right">
                          <div>${(it.unit_price ?? 0).toFixed(2)} each</div>
                          <div className="text-sm font-medium">
                            ${(it.line_total ?? 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  <div className="border-t p-3 bg-muted/50">
                    <div className="flex justify-between items-center font-medium">
                      <span>Total</span>
                      <span>${selectedOrderDetail.amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h4 className="font-medium mb-2">Shipping Address</h4>
                <div className="text-sm">
                  <div className="font-medium">
                    {selectedOrderDetail.customerName}
                  </div>
                  <div className="text-muted-foreground">
                    {selectedOrderDetail.customerPhone}
                  </div>
                  <div className="mt-2">{selectedOrderDetail.address}</div>
                </div>
              </div>

              {/* Actions in Details */}
              <div className="flex gap-2">
                {selectedOrderDetail.status === "assigned" && (
                  <Button
                    onClick={() =>
                      updateOrderStatus(
                        selectedOrderDetail.id,
                        "out_for_delivery"
                      )
                    }
                  >
                    <Navigation className="w-4 h-4 mr-2" /> Mark Out for
                    Delivery
                  </Button>
                )}

                {selectedOrderDetail.status === "out_for_delivery" && (
                  <Button
                    onClick={() => handleMarkDelivered(selectedOrderDetail.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Mark as Delivered
                  </Button>
                )}

                <Button
                  variant="ghost"
                  onClick={closeOrderDetails}
                  className="ml-auto"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div>Loading...</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delivery Notes Dialog */}
      <Dialog
        open={!!deliveryNotesDialog}
        onOpenChange={(open) => {
          if (!open) setDeliveryNotesDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Delivered</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add optional notes about the delivery completion:
            </p>
            <Textarea
              placeholder="Delivery notes (optional)..."
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeliveryNotesDialog(null)}
            >
              Cancel
            </Button>
            <Button onClick={confirmDelivery}>
              <CheckCircle className="w-4 h-4 mr-2" /> Confirm Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
