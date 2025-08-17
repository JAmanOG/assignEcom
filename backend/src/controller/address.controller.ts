import { prisma } from "../prismaClient.js";
import { allFieldRequired } from "../helper/helper.js";
import type { Request, Response } from "express";

const createAddress = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const {
    label,
    recipient_name,
    phone,
    address,
    city,
    state,
    postal_code,
    country,
    is_default,
  } = req.body;

  console.log("Creating address for user:", userId);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (
    !recipient_name ||
    !phone ||
    !address ||
    !city ||
    !state ||
    !postal_code ||
    !country
  ) {
    return res
      .status(400)
      .json({ message: "All required fields must be provided" });
  }

  try {
    const newAddress = await prisma.address.create({
      data: {
        userId,
        label,
        recipient_name,
        phone,
        address,
        city,
        state,
        postal_code,
        country,
        is_default: is_default || false,
      },
    });
    return res.status(201).json(newAddress);
  } catch (error) {
    console.error("Error creating address:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAddresses = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  console.log("userId",userId)
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: userId as string },
      orderBy: { is_default: "desc" },
    });

    console.log("Fetched addresses for user:", userId, addresses);
    return res.status(200).json(addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateAddress = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  try {
    const existing = await prisma.address.findUnique({ where: { id: id as string } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ message: "Address not found" });
    }

    const updated = await prisma.address.update({
      where: { id: id as string },
      data: req.body,
    });
    return res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating address:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteAddress = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  try {
    const existing = await prisma.address.findUnique({
      where: { id: id as string },
    });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ message: "Address not found" });
    }

    await prisma.address.delete({ where: { id: id as string } });
    return res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { createAddress, getAddresses, updateAddress, deleteAddress };