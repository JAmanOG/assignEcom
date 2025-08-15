import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import {assignOrderToDelivery,getAllOrders,getOrderDetails,getUserOrders,placeOrder,updateOrderStatus,deleteOrder} from "../controller/orders.controller.js";

const router = Router();

// GET /api/orders - Get user's orders (Customer only) 
// GET /api/orders/:id - Get order details
// GET /api/admin/orders - Get all orders (Admin only) 
// POST /api/orders - Place order (Customer only) 
// PUT /api/admin/orders/:id/status - Update order status (Admin only) 
// PUT /api/admin/orders/:id/assign - Assign order to delivery (Admin only) 

router.get("/admin/orders", authMiddleware, roleMiddleware(["ADMIN"]), getAllOrders);
router.put("/admin/orders/:id/status", authMiddleware, roleMiddleware(["ADMIN"]), updateOrderStatus);
router.put("/admin/orders/:id/assign", authMiddleware, roleMiddleware(["ADMIN"]), assignOrderToDelivery);
router.delete("/admin/orders/:id", authMiddleware, roleMiddleware(["ADMIN"]), deleteOrder);

router.get("/", authMiddleware, getUserOrders);
router.post("/", authMiddleware, placeOrder);
router.get("/:id", authMiddleware, getOrderDetails);

export default router;