"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye, Package, Truck, CheckCircle } from "lucide-react"
import type { Order } from '@/types/type'
import axios from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export function OrderHistory() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  const { data: orders = [], isLoading, isError } = useQuery({
    queryKey: ["ordered"],
    queryFn: async () => {
      const response = await axios.get("/api/orders");
      // console.log("Fetched orders:", response.data.orders);
      return response.data.orders as Order[];
    },
    initialData: [],
    staleTime: 1000 * 60 * 1
  });

  if (isLoading) return <div>Loading...</div>

  if (isError) return <div>Error loading orders</div>
  const filteredOrders = orders?.filter((order) => statusFilter === "all" || order.status.toLowerCase() === statusFilter) || []

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailsDialogOpen(true)
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "PENDING":
        return "secondary"
      case "PROCESSING":
        return "default"
      case "SHIPPED":
        return "outline"
      case "DELIVERED":
        return "default"
      case "CANCELLED":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "PENDING":
      case "PROCESSING":
        return <Package className="h-4 w-4" />
      case "SHIPPED":
        return <Truck className="h-4 w-4" />
      case "DELIVERED":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
          <p className="text-gray-600">Track your past and current orders</p>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const total = order.items.reduce((sum, item) => sum + item.line_total, 0)
          return (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{order.id}</span>
                      <Badge variant={getStatusColor(order.status)} className="flex items-center space-x-1">
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status.toLowerCase()}</span>
                      </Badge>
                    </CardTitle>
                    <CardDescription>Ordered on {new Date(order.placed_at).toLocaleDateString()}</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${total.toFixed(2)}</p>
                    <Button variant="outline" size="sm" onClick={() => viewOrderDetails(order)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium">Items ({order.items.length}):</h4>
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.product_name} × {item.quantity}
                      </span>
                      <span>${item.line_total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">No orders match the selected filter.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Complete information for {selectedOrder?.id}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Order Information</h4>
                  <p><strong>Order ID:</strong> {selectedOrder.id}</p>
                  <p><strong>Date:</strong> {new Date(selectedOrder.placed_at).toLocaleString()}</p>
                  <p>
                    <strong>Status:</strong>
                    <Badge variant={getStatusColor(selectedOrder.status)} className="ml-2">
                      {selectedOrder.status.toLowerCase()}
                    </Badge>
                  </p>
                  <p>
                    <strong>Total:</strong> $
                    {selectedOrder.items.reduce((sum, item) => sum + item.line_total, 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Delivery Information</h4>
                  <p><strong>Recipient:</strong> {selectedOrder.shipping_address.ship_name}</p>
                  <p><strong>Phone:</strong> {selectedOrder.shipping_address.ship_phone}</p>
                  <p><strong>Address:</strong> {selectedOrder.shipping_address.ship_address}, {selectedOrder.shipping_address.ship_city}, {selectedOrder.shipping_address.ship_state} - {selectedOrder.shipping_address.ship_zip}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Order Items</h4>
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-2 px-3 font-medium">Item</th>
                        <th className="text-left py-2 px-3 font-medium">Quantity</th>
                        <th className="text-left py-2 px-3 font-medium">Price</th>
                        <th className="text-left py-2 px-3 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id} className="border-b last:border-b-0">
                          <td className="py-2 px-3">{item.product_name}</td>
                          <td className="py-2 px-3">{item.quantity}</td>
                          <td className="py-2 px-3">${item.unit_price.toFixed(2)}</td>
                          <td className="py-2 px-3">${item.line_total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
