import { prisma } from "../index.js";
import type { Request, Response } from "express";
import type { OrderStatus, Role } from "../types/type.js";
import { allowedTransitions, deliveryToOrderStatusMap } from "../constant.js";
// Get assigned deliveries
const getAssignedDeliveries = async (req: Request, res: Response) => {
    const deliveryPartnerId = req.user?.id;

    if (!deliveryPartnerId) {
        return res.status(400).json({ message: "Delivery Partner ID is required" });
    }

    try {

        // Fetch deliveries assigned to the delivery partner even existing in the database
        const delivery_partnerExists = await prisma.user.findUnique({
            where: { id: deliveryPartnerId, role: "DELIVERY" as Role },
        });

        if (!delivery_partnerExists) {
            return res.status(404).json({ message: "Delivery Partner not found" });
        }
        
        const deliveries = await prisma.delivery.findMany({
            where: { delivery_partner_id: deliveryPartnerId, status: { in: ["ASSIGNED", "OUT_FOR_DELIVERY"] } },
            include: {
                order: {
                    include: {
                        items: true,
                        shipping_address: true,
                    },
                },
            },
        });

        if (deliveries.length === 0) {
            return res.status(404).json({ message: "No assigned deliveries found" });
        }

        return res.status(200).json({ message: "Assigned deliveries fetched successfully", deliveries });
    } catch (error) {
        console.error("Error fetching assigned deliveries:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Update delivery status
const updateDeliveryStatus = async (req: Request, res: Response) => {
    const { deliveryId } = req.params;
    const { status,notes } = req.body;

    if (!deliveryId || !status) {
        return res.status(400).json({ message: "Delivery ID and status are required" });
    }

    try {
        // Validate delivery status
        const deliveryStatusValues = ["UNASSIGNED", "ASSIGNED", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED"];
        if (!deliveryStatusValues.includes(status)) {
            return res.status(400).json({ message: "Invalid delivery status" });
        }
        // Check if delivery exists
        const deliveryExists = await prisma.delivery.findUnique({
            where: { id: deliveryId },
        });

        if (!deliveryExists) {
            return res.status(404).json({ message: "Delivery not found" });
        }

        if (deliveryExists.delivery_partner_id !== req.user?.id) {
            return res.status(403).json({ message: "You are not authorized to update this delivery" });
          }          

        const currentStatus = deliveryExists.status;

        const transitions = allowedTransitions[currentStatus as keyof typeof allowedTransitions] || [];
        if (!transitions.includes(status)) {
            return res.status(400).json({ message: `Invalid status transition from ${currentStatus} to ${status}` });
        }
          

        // Update delivery status
        const updatedDelivery = await prisma.delivery.update({
            where: { id: deliveryId },
            data: { status, notes, last_update_at: new Date() },
        });

        if (!updatedDelivery) {
            return res.status(404).json({ message: "Delivery not found" });
        }
        if (updatedDelivery.order_id) {
            const newOrderStatus = deliveryToOrderStatusMap[status];
            if (newOrderStatus) {
                await prisma.orders.update({
                    where: { id: updatedDelivery.order_id },
                    data: { status: newOrderStatus as OrderStatus },
                });
            }
        }        
        return res.status(200).json({ message: "Delivery status updated successfully", delivery: updatedDelivery });
    } catch (error) {
        console.error("Error updating delivery status:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export {
    getAssignedDeliveries,
    updateDeliveryStatus,
};