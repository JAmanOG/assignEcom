import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import {addItemToCart,getUserCart,removeItemFromCart,updateCartItemQuantity} from "../controller/carts.controller.js";

const router = Router();

// GET /api/cart - Get user's cart (Customer only) 
// POST /api/cart/add - Add item to cart (Customer only) 
// PUT /api/cart/:itemId - Update cart item quantity 
// DELETE /api/cart/:itemId - Remove item from cart

router.get("/", authMiddleware, getUserCart);
router.post("/add", authMiddleware, addItemToCart);
router.put("/:itemId", authMiddleware, updateCartItemQuantity);
router.delete("/:itemId", authMiddleware, removeItemFromCart);

export default router;