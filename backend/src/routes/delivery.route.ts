import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import { getAssignedDeliveries,updateDeliveryStatus } from "../controller/delivery.controller.js";

const router = Router();

// GET /api/delivery/orders - Get assigned deliveries (Delivery only) 
// PUT /api/delivery/orders/:id/status - Update delivery status (Delivery only)

router.get("/orders/get-assigned-delivery", authMiddleware, roleMiddleware(["DELIVERY"]), getAssignedDeliveries);
router.put("/orders/:deliveryId/status", authMiddleware, roleMiddleware(["DELIVERY"]), updateDeliveryStatus);

export default router;