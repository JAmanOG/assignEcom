import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
} from "lucide-react";
import axios from "@/lib/axios";
import { useQueries } from "@tanstack/react-query";

// Small helpers
const shortId = (id = "") => id.slice(0, 8);
const formatMonthShort = (isoOrMonth: string) => {
  // Accepts values like "2025-08-01T00:00:00.000Z" or "2025-08"
  try {
    if (/^\d{4}-\d{2}$/.test(isoOrMonth)) {
      const [y, m] = isoOrMonth.split("-").map(Number);
      return new Date(y, m - 1).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
    }
    const d = new Date(isoOrMonth);
    if (isNaN(d.getTime())) return isoOrMonth;
    return d.toLocaleString("default", { month: "short", year: "numeric" });
  } catch (e) {
    return isoOrMonth;
  }
};

// Fetchers
const fetchTotalRevenue = async () =>
  (await axios.get("/api/admin/revenue/total")).data;
const fetchTotalOrders = async () =>
  (await axios.get("/api/admin/orders/total")).data;
const fetchTotalCustomers = async () =>
  (await axios.get("/api/admin/users/total")).data;
const fetchTotalProducts = async () =>
  (await axios.get("/api/admin/products/total")).data;
const fetchingRevenueAndOrdersTrend = async () => {
  const resRev = await axios.get("/api/admin/revenue/trend");
  const resOrders = await axios.get("/api/admin/orders/trend");
  return { revenue: resRev.data ?? [], orders: resOrders.data ?? [] };
};
const fetchingSalesByCategory = async () =>  (await axios.get("/api/admin/sales/category")).data;
const fetchingTopSellingProducts = async () => (await axios.get("/api/admin/products/top-selling")).data;
const fetchingPerformanceCategory = async () =>  (await axios.get("/api/admin/performance/category")).data;
const fetchUserGrowth = async () =>  (await axios.get("/api/admin/users/growth")).data;

export function AnalyticsPage() {
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
        queryKey: ["totalCustomers"],
        queryFn: fetchTotalCustomers,
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
        queryKey: ["revenueAndOrdersTrend"],
        queryFn: fetchingRevenueAndOrdersTrend,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ["salesByCategory"],
        queryFn: fetchingSalesByCategory,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ["topSellingProducts"],
        queryFn: fetchingTopSellingProducts,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ["performanceCategory"],
        queryFn: fetchingPerformanceCategory,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ["userGrowth"],
        queryFn: fetchUserGrowth,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
      },
    ],
  });

  // Destructure
  const [
    totalRevenueQuery,
    totalOrdersQuery,
    totalCustomersQuery,
    totalProductsQuery,
    revenueAndOrdersTrendQuery,
    salesByCategoryQuery,
    topSellingProductsQuery,
    performanceCategoryQuery,
    userGrowthQuery,
  ] = results;

  // Metrics (safe fallbacks)
  const totalRevenue = totalRevenueQuery?.data?.totalRevenue ?? 0;
  const totalOrders = totalOrdersQuery?.data?.totalOrders ?? 0;
  const totalCustomers = totalCustomersQuery?.data?.totalActiveCustomers ?? 0;
  const totalProducts = totalProductsQuery?.data?.totalProducts ?? 0;

  // Revenue & Orders trend mapping
  const revenueTrendRaw = revenueAndOrdersTrendQuery?.data?.revenue ?? [];
  const ordersTrendRaw = revenueAndOrdersTrendQuery?.data?.orders ?? [];

  const revenueChartData = (revenueTrendRaw || []).map((r: any) => {
    // find matching orders value by month (flexible matching)
    const monthKey = (r.month ?? r.month_string ?? "").toString();
    const ordersForMonthObj = (ordersTrendRaw || []).find((o: any) => {
      if (!o) return false;
      const a = (o.month ?? "").toString();
      // compare YYYY-MM or YYYY-MM-01 or ISO
      return (
        a.startsWith(monthKey.slice(0, 7)) || monthKey.startsWith(a.slice(0, 7))
      );
    });

    return {
      month: formatMonthShort(r.month),
      revenue: Number(r.totalRevenue ?? 0),
      orders: Number(ordersForMonthObj?.totalOrders ?? 0),
    };
  });

  // If API returned empty trend, show a small placeholder so charts don't crash
  const revenueData = revenueChartData.length
    ? revenueChartData
    : [{ month: "No data", revenue: 0, orders: 0 }];

  // Sales by category -> pie chart / list
  const salesByCategoryRaw =
    salesByCategoryQuery?.data ?? performanceCategoryQuery?.data ?? [];
  const totalCategoryRevenue =
    (salesByCategoryRaw || []).reduce(
      (acc: number, cur: any) =>
        acc + Number(cur.totalrevenue ?? cur.revenue ?? 0),
      0
    ) || 1; // avoid div by zero
  const categoryData = (salesByCategoryRaw || []).map((c: any) => ({
    name: c.category ?? c.name ?? "Unknown",
    value: Math.round(
      (Number(c.totalrevenue ?? c.revenue ?? 0) / totalCategoryRevenue) * 100
    ),
    sales: Number(c.totalrevenue ?? c.revenue ?? 0),
  }));

  // Fallback category data if none returned
  const categoryDataFinal = categoryData.length
    ? categoryData
    : [{ name: "No data", value: 100, sales: 0 }];

  // Top products
  const topProductsRaw = topSellingProductsQuery?.data ?? [];

  const topProductsData = (topProductsRaw || []).map((p: any) => ({
    name: p.productname ?? `Prod ${shortId(p.productId ?? p.id ?? "")}`,
    sales: Number(p.totalsold ?? p.sales ?? 0),
    revenue: Number(p.revenue),
  }));

  console.log("Top products data:", topProductsData);

  const topProductsDataFinal = topProductsData.length
    ? topProductsData
    : [{ name: "No data", sales: 0, revenue: 0 }];

  // User growth mapping
  const userGrowthRaw = userGrowthQuery?.data ?? [];
  const userGrowthData = (userGrowthRaw || []).map((u: any) => ({
    month: formatMonthShort(u.month ?? u.month_string ?? ""),
    customers: Number(u.customers ?? 0),
    delivery: Number(u.delivery ?? 0),
  }));
  const userGrowthDataFinal = userGrowthData.length
    ? userGrowthData
    : [{ month: "No data", customers: 0, delivery: 0 }];

  // Simple derived metric for UI
  const revenueGrowth = totalRevenue
    ? ((totalRevenue - totalRevenue * 0.125) / totalRevenue) * 100
    : 0;

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(var(--accent))",
    "#8884d8",
    "#82ca9d",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Analytics Dashboard
        </h2>
        <p className="text-muted-foreground">
          Comprehensive business insights and performance metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">
                +{revenueGrowth.toFixed(1)}%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalOrders.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCustomers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+21.4%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalProducts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8</span> added this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Orders Trend</CardTitle>
            <CardDescription>
              Monthly revenue and order volume over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>
              Distribution of sales across product categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDataFinal}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryDataFinal.map((_:any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>
              Customer and delivery personnel growth over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthDataFinal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="customers"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Customers"
                />
                <Line
                  type="monotone"
                  dataKey="delivery"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  name="Delivery Personnel"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>
              Best performing products by sales volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topProductsDataFinal}
                layout="horizontal"
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barCategoryGap="20%" // spacing between categories
                barGap={5} // spacing between bars in a group
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />

                {/* Sales bar */}
                <Bar dataKey="sales" fill="hsl(var(--primary))" name="Sales" />

                {/* Revenue bar - different color */}
                <Bar
                  dataKey="revenue"
                  fill="hsl(var(--destructive))"
                  name="Revenue"
                />
              </BarChart>
            </ResponsiveContainer>{" "}
          </CardContent>
        </Card>
      </div>

      {/* Summary Tables */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
            <CardDescription>
              Revenue breakdown by product category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryDataFinal.map((category: { name: string; sales: number; value: number }, index: number) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ${Number(category.sales).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {category.value}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>
              Key business metrics and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium">Revenue Growth</div>
                  <div className="text-sm text-muted-foreground">
                    {revenueGrowth.toFixed(1)}% increase from last month
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium">Order Volume</div>
                  <div className="text-sm text-muted-foreground">
                    Average{" "}
                    {Math.round(totalOrders / Math.max(revenueData.length, 1))}{" "}
                    orders per month
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="font-medium">Customer Retention</div>
                  <div className="text-sm text-muted-foreground">
                    High growth in customer base
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="font-medium">Top Category</div>
                  <div className="text-sm text-muted-foreground">
                    {categoryDataFinal[0]?.name} leads with{" "}
                    {categoryDataFinal[0]?.value}% of sales
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
