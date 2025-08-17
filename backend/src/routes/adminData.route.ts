import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import {getTotalNoOfOrders,getTotalNoOfOrdersByStatus,getTotalPendingDeliveriesByStatus,getTotalRevenue} from "../controller/adminData.controller.js";

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
 */

// GET /api/admin/orders/total - Get total number of orders (Admin only)
// GET /api/admin/orders/total/status - Get total number of orders by status (Admin only)
// GET /api/admin/deliveries/total/status - Get total pending deliveries by status
// GET /api/admin/revenue/total - Get total revenue (Admin only)

router.get("/orders/total", authMiddleware, roleMiddleware(["ADMIN"]), getTotalNoOfOrders);
router.get("/orders/total/status", authMiddleware, roleMiddleware(["ADMIN"]), getTotalNoOfOrdersByStatus);
router.get("/deliveries/total/status", authMiddleware, roleMiddleware(["ADMIN"]), getTotalPendingDeliveriesByStatus);
router.get("/revenue/total", authMiddleware, roleMiddleware(["ADMIN"]), getTotalRevenue);

export default router;