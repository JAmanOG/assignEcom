import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import {assignOrderToDelivery,getAllOrders,getOrderDetails,getUserOrders,placeOrder,updateOrderStatus,deleteOrder,placeOrderFromCart} from "../controller/orders.controller.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Orders
 *     description: Order placement and administration
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get current customer's orders
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED] }
 *     responses:
 *       200:
 *         description: List of customer orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Order' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *   post:
 *     tags: [Orders]
 *     summary: Place a new order (Customer only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PlaceOrderRequest' }
 *     responses:
 *       201:
 *         description: Order placed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 order: { $ref: '#/components/schemas/Order' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order details (Customer only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order: { $ref: '#/components/schemas/Order' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 * /api/orders/admin/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED] }
 *     responses:
 *       200:
 *         description: All orders list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 orders:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Order' }
 *                 totalOrders: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 * /api/orders/admin/orders/{id}/status:
 *   put:
 *     tags: [Orders]
 *     summary: Update order status (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateOrderStatusRequest' }
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 order: { $ref: '#/components/schemas/Order' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 * /api/orders/admin/orders/{id}/assign:
 *   put:
 *     tags: [Orders]
 *     summary: Assign order to delivery partner (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AssignOrderRequest' }
 *     responses:
 *       200:
 *         description: Order assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 order: { $ref: '#/components/schemas/Order' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 * /api/orders/admin/orders/{id}:
 *   delete:
 *     tags: [Orders]
 *     summary: Delete order (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order deleted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GenericMessageResponse' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */

router.get("/admin/orders", authMiddleware, roleMiddleware(["ADMIN"]), getAllOrders);
router.put("/admin/orders/:id/status", authMiddleware, roleMiddleware(["ADMIN"]), updateOrderStatus);
router.put("/admin/orders/:id/assign", authMiddleware, roleMiddleware(["ADMIN"]), assignOrderToDelivery);
router.delete("/admin/orders/:id", authMiddleware, roleMiddleware(["ADMIN"]), deleteOrder);

router.get("/", authMiddleware, roleMiddleware(["CUSTOMER"]), getUserOrders);
router.post("/", authMiddleware, roleMiddleware(["CUSTOMER"]), placeOrder);
router.post('/cart/:cartId/order', authMiddleware, roleMiddleware(["CUSTOMER"]), placeOrderFromCart);
router.get("/:id", authMiddleware, roleMiddleware(["CUSTOMER"]), getOrderDetails);

export default router;