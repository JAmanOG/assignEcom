import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Package,
  ShoppingCart,
  DollarSign,
  Truck,
  TrendingUp,
  Eye
} from 'lucide-react';
import axios from "@/lib/axios";
import { useQueries } from "@tanstack/react-query";


const fetchTotalRevenue = async () =>
  (await axios.get("/api/admin/revenue/total")).data;
const fetchTotalOrders = async () =>
  (await axios.get("/api/admin/orders/total")).data;
// const fetchTotalCustomers = async () =>
//   (await axios.get("/api/admin/users/total")).data;
const fetchTotalProducts = async () =>
  (await axios.get("/api/admin/products/total")).data;
const getTotalPendingDeliveries = async () =>
  (await axios.get("/api/admin/deliveries/total/status?status=UNASSIGNED")).data;
const getRecentOrders = async () =>
  (await axios.get("/api/admin/orders/recent")).data;
const getTopCategories = async () =>
  (await axios.get("/api/admin/performance/category")).data;



export function AdminDashboard() {
    const results = useQueries({
      queries: [
        {
          queryKey: ["totalRevenue"],
          queryFn: fetchTotalRevenue,
          staleTime: 1000 * 60 * 5,
          refetchOnWindowFocus: false,
        },
        {
          queryKey: ["totalOrders"],
          queryFn: fetchTotalOrders,
          staleTime: 1000 * 60 * 5,
          refetchOnWindowFocus: false,
        },
        {
          queryKey: ["totalProducts"],
          queryFn: fetchTotalProducts,
          staleTime: 1000 * 60 * 5,
          refetchOnWindowFocus: false,
        },
        {
          queryKey: ["totalPendingDeliveries"],
          queryFn: getTotalPendingDeliveries,
          staleTime: 1000 * 60 * 5,
          refetchOnWindowFocus: false,
        },
        {
          queryKey: ["recentOrders"],
          queryFn: getRecentOrders,
          staleTime: 1000 * 60 * 5,
          refetchOnWindowFocus: false,
        },
        {
          queryKey: ["topCategories"],
          queryFn: getTopCategories,
          staleTime: 1000 * 60 * 5,
          refetchOnWindowFocus: false,
        },
      ]})
      
      const [totalRevenue, totalOrders,  totalProducts, totalPendingDeliveries, RecentOrders, topCategories] = results;

  // Mock data - in real app, this would come from your API
  const stats = [
    {
      title: 'Total Products',
      value: `${totalProducts?.data?.totalProducts || 0}`,
      change: '+12',
      icon: Package,
      color: 'text-primary'
    },
    {
      title: 'Total Orders',
      value: `${totalOrders?.data?.totalOrders || 0}`,
      change: '+89',
      icon: ShoppingCart,
      color: 'text-accent'
    },
    {
      title: 'Revenue',
      value: `${totalRevenue?.data?.totalRevenue || 0}`,
      change: '+23%',
      icon: DollarSign,
      color: 'text-success'
    },
    {
      title: 'Pending Deliveries (Unassigned)',
      value: `${totalPendingDeliveries?.data?.totalPendingDeliveries || 0}`,
      change: '-5',
      icon: Truck,
      color: 'text-warning'
    }
  ];

  // normalize recent orders data
  const recentOrders = RecentOrders.data?.map((order: any) => ({
    id: order.id,
    customer: order.user.full_name,
    amount: order.items.reduce((sum: number, item: any) => sum + item.line_total, 0).toFixed(2),
    status: order.delivery.status,
    date: order.placed_at
  })) || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'status-pending',
      processing: 'status-processing', 
      shipped: 'status-shipped',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled'
    };
    
    return (
      <Badge className={`${variants[status]} border`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard Overview</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your store today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, _) => (
          <Card key={stat.title} className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{order.amount}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order Completion Rate</span>
                <span className="font-medium">
                  {totalOrders?.data?.totalOrders ? `${((totalOrders.data.totalOrders - totalPendingDeliveries.data.totalPendingDeliveries) / totalOrders.data.totalOrders * 100).toFixed(2)}%` : '0%'}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-success h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground mb-2">Top Categories</div>
              <div className="space-y-1">
                {topCategories.data?.map((category: any) => (
                  <div key={category.category} className="flex justify-between text-sm">
                    <span>{category.category}</span>
                    <span className="text-muted-foreground">${category.totalrevenue.toFixed(2)}</span>
                    
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}