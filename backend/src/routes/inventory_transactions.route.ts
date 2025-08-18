import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import {reserveStockForOrder,restockProduct} from "../controller/inventory_transactions.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { reserveStockSchema, restockProductSchema } from "../validation/schemas.js";

/**
 * @openapi
 * tags:
 *   - name: Inventory
 *     description: Inventory stock reservation and restock operations
 * /api/inventory/stock/reserve:
 *   post:
 *     tags: [Inventory]
 *     summary: Reserve stock for one or more products (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ReserveStockRequest' }
 *     responses:
 *       200:
 *         description: Stock reserved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productId: { type: string }
 *                       newStock: { type: integer }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 * /api/inventory/stock/restock:
 *   post:
 *     tags: [Inventory]
 *     summary: Restock a product (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RestockRequest' }
 *     responses:
 *       200:
 *         description: Product restocked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     productId: { type: string }
 *                     newStock: { type: integer }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 */

const router = Router();

router.post("/stock/reserve", authMiddleware, roleMiddleware(["ADMIN"]), validate({ body: reserveStockSchema }), reserveStockForOrder);
router.post("/stock/restock", authMiddleware, roleMiddleware(["ADMIN"]), validate({ body: restockProductSchema }), restockProduct);

export default router;