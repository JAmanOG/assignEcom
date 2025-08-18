import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import {getTotalNoOfOrders,getTotalNoOfOrdersByStatus,getTotalPendingDeliveriesByStatus,getTotalRevenue,
    getCategoryPerformance,getMonthlyOrderTrend,getMonthlyRevenueTrend,getRecentOrders,getSalesByCategory,getTopSellingProducts,getTotalActiveCustomers,getTotalProducts,getUserGrowth
} from "../controller/adminData.controller.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Admin
 *     description: Administrative analytics and metrics
 * /api/admin/orders/total:
 *   get:
 *     tags: [Admin]
 *     summary: Get total number of orders
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Total orders returned }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 * /api/admin/orders/total/status:
 *   get:
 *     tags: [Admin]
 *     summary: Get total number of orders grouped by status
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Order counts by status }
 * /api/admin/deliveries/total/status:
 *   get:
 *     tags: [Admin]
 *     summary: Get total pending deliveries grouped by status
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Delivery counts by status }
 * /api/admin/revenue/total:
 *   get:
 *     tags: [Admin]
 *     summary: Get total revenue
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Total revenue returned }
 * /api/admin/revenue/trend:
 *   get:
 *     tags: [Admin]
 *     summary: Get monthly revenue trend (DELIVERED orders)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Monthly revenue data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/MonthlyRevenueTrendItem' }
 * /api/admin/orders/trend:
 *   get:
 *     tags: [Admin]
 *     summary: Get monthly delivered order count trend
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Monthly order data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/MonthlyOrderTrendItem' }
 * /api/admin/sales/category:
 *   get:
 *     tags: [Admin]
 *     summary: Get sales distribution by category (pie chart data)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Category sales share
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/CategorySalesItem' }
 * /api/admin/users/total:
 *   get:
 *     tags: [Admin]
 *     summary: Get total active customers
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Total active customers returned }
 * /api/admin/products/top-selling:
 *   get:
 *     tags: [Admin]
 *     summary: Get top selling products
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, default: 5 }
 *     responses:
 *       200:
 *         description: Top products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/TopSellingProduct' }
 * /api/admin/performance/category:
 *   get:
 *     tags: [Admin]
 *     summary: Get category performance (revenue & quantity)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Category performance data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/CategoryPerformanceItem' }
 * /api/admin/orders/recent:
 *   get:
 *     tags: [Admin]
 *     summary: Get recent orders summary (latest 5)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Recent orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/RecentOrderSummary' }
 * /api/admin/products/total:
 *   get:
 *     tags: [Admin]
 *     summary: Get total number of active products
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Total products count returned }
 * /api/admin/users/growth:
 *   get:
 *     tags: [Admin]
 *     summary: Get user growth by month for current year (customers & delivery partners)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Monthly growth data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/UserGrowthItem' }
 */

// GET /api/admin/orders/total - Get total number of orders (Admin only)
// GET /api/admin/orders/total/status - Get total number of orders by status (Admin only)
// GET /api/admin/deliveries/total/status - Get total pending deliveries by status
// GET /api/admin/revenue/total - Get total revenue (Admin only)

router.get("/orders/total", authMiddleware, roleMiddleware(["ADMIN"]), getTotalNoOfOrders);
router.get("/orders/total/status", authMiddleware, roleMiddleware(["ADMIN"]), getTotalNoOfOrdersByStatus);
router.get("/deliveries/total/status", authMiddleware, roleMiddleware(["ADMIN"]), getTotalPendingDeliveriesByStatus);
router.get("/revenue/total", authMiddleware, roleMiddleware(["ADMIN"]), getTotalRevenue);


router.get("/revenue/trend", authMiddleware, roleMiddleware(["ADMIN"]), getMonthlyRevenueTrend);
router.get("/orders/trend", authMiddleware, roleMiddleware(["ADMIN"]), getMonthlyOrderTrend);
router.get("/sales/category", authMiddleware, roleMiddleware(["ADMIN"]), getSalesByCategory);
router.get("/users/total", authMiddleware, roleMiddleware(["ADMIN"]), getTotalActiveCustomers);

router.get("/products/top-selling", authMiddleware, roleMiddleware(["ADMIN"]), getTopSellingProducts);
router.get("/performance/category", authMiddleware, roleMiddleware(["ADMIN"]), getCategoryPerformance);
router.get("/performance/orders", authMiddleware, roleMiddleware(["ADMIN"]), getTotalNoOfOrdersByStatus);
router.get("/orders/recent", authMiddleware, roleMiddleware(["ADMIN"]), getRecentOrders);
router.get("/products/total", authMiddleware, roleMiddleware(["ADMIN"]), getTotalProducts);
router.get("/users/growth", authMiddleware, roleMiddleware(["ADMIN"]), getUserGrowth);


export default router;