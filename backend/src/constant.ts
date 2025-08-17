import { Env } from "./config.js";

export const PORT = Env.PORT || 3000;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_REFRESH_SECRET = Env.JWT_REFRESH_SECRET || "default_refresh_secret";
export const deliveryToOrderStatusMap: Record<string, string> = {
    UNASSIGNED: "PENDING",
    ASSIGNED: "PROCESSING",
    OUT_FOR_DELIVERY: "SHIPPED",
    DELIVERED: "DELIVERED",
    FAILED: "CANCELLED", // or keep as PROCESSING if retry allowed
};

export const allowedTransitions: Record<string, string[]> = {
    UNASSIGNED: ["ASSIGNED"],
    ASSIGNED: ["OUT_FOR_DELIVERY", "FAILED"],
    OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"],
    DELIVERED: [],
    FAILED: [],
  };
  