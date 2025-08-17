import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import {addItemToCart,getUserCart,removeItemFromCart,updateCartItemQuantity} from "../controller/carts.controller.js";

/**
 * @openapi
 * tags:
 *   - name: Cart
 *     description: Shopping cart operations for customers
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get current customer's cart
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Cart retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 cart: { $ref: '#/components/schemas/Cart' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 * /api/cart/add:
 *   post:
 *     tags: [Cart]
 *     summary: Add an item to the cart
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AddCartItemRequest' }
 *     responses:
 *       200:
 *         description: Item added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 item: { $ref: '#/components/schemas/CartItem' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 * /api/cart/{itemId}:
 *   put:
 *     tags: [Cart]
 *     summary: Update quantity of a cart item
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateCartItemQuantityRequest' }
 *     responses:
 *       200:
 *         description: Item updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 updatedCartItem: { $ref: '#/components/schemas/CartItem' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 *   delete:
 *     tags: [Cart]
 *     summary: Remove an item from the cart
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Item removed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GenericMessageResponse' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */

const router = Router();

router.get("/", authMiddleware, roleMiddleware(['CUSTOMER']), getUserCart);
router.post("/add", authMiddleware,roleMiddleware(['CUSTOMER']), addItemToCart);
router.put("/:itemId", authMiddleware,roleMiddleware(['CUSTOMER']), updateCartItemQuantity);
router.delete("/:itemId", authMiddleware,roleMiddleware(['CUSTOMER']), removeItemFromCart);

export default router;