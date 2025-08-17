import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import { getAssignedDeliveries,updateDeliveryStatus } from "../controller/delivery.controller.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Delivery
 *     description: Delivery partner operations
 *
 * /api/delivery/orders/get-assigned-delivery:
 *   get:
 *     tags:
 *       - Delivery
 *     summary: Get deliveries assigned to current delivery partner
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assigned deliveries list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deliveries:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Delivery'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *
 * /api/delivery/orders/{deliveryId}/status:
 *   put:
 *     tags:
 *       - Delivery
 *     summary: Update delivery status (Delivery partner only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deliveryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDeliveryStatusRequest'
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 delivery:
 *                   $ref: '#/components/schemas/Delivery'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

// GET /api/delivery/orders - Get assigned deliveries (Delivery only) 
// PUT /api/delivery/orders/:id/status - Update delivery status (Delivery only)

router.get("/orders/get-assigned-delivery", authMiddleware, roleMiddleware(["DELIVERY"]), getAssignedDeliveries);
router.put("/orders/:deliveryId/status", authMiddleware, roleMiddleware(["DELIVERY"]), updateDeliveryStatus);

export default router;