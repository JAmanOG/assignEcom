import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import {reserveStockForOrder,restockProduct} from "../controller/inventory_transactions.controller.js";

const router = Router();

router.post("/stock/reserve", authMiddleware, roleMiddleware(["ADMIN"]), reserveStockForOrder);
router.post("/stock/restock", authMiddleware, roleMiddleware(["ADMIN"]), restockProduct);

export default router;