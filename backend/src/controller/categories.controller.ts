import { prisma } from "../index.js";
import {allFieldRequired} from "../helper/helper.js";
import type { Request, Response } from "express";

// Create a New Category
const createCategory = async (req: Request, res: Response) => {
    const { name, slug } = req.body;

    // Validate required fields
    const isAllfieldExist = allFieldRequired({ name, slug });
    if (!isAllfieldExist) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        // Create a new category
        const category = await prisma.categories.create({
            data: {
                name,
                slug,
            },
        });

        return res.status(201).json({ message: "Category created successfully", category });
    } catch (error) {
        console.error("Error creating category:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

//  update the Category
const updateCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, slug } = req.body;

    // Validate required fields
    if (!id || !name || !slug) {
        return res.status(400).json({ message: "Category ID, name, and slug are required" });
    }

    try {
        // Check if category exists
        const categoryExists = await prisma.categories.findUnique({
            where: { id },
        });

        if (!categoryExists) {
            return res.status(404).json({ message: "Category not found" });
        }

        // Update the category
        const updatedCategory = await prisma.categories.update({
            where: { id },
            data: { name, slug },
        });

        return res.status(200).json({ message: "Category updated successfully", category: updatedCategory });
    } catch (error) {
        console.error("Error updating category:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Delete a Category
const deleteCategory = async (req: Request, res: Response) => {
    const { id } = req.params;

    // Validate required fields
    if (!id) {
        return res.status(400).json({ message: "Category ID is required" });
    }

    try {
        // Check if category exists
        const categoryExists = await prisma.categories.findUnique({
            where: { id },
        });

        if (!categoryExists) {
            return res.status(404).json({ message: "Category not found" });
        }

        // Delete the category
        await prisma.categories.delete({
            where: { id },
        });

        return res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Get all Categories
const getAllCategories = async (req: Request, res: Response) => {
    try {
        // Fetch all categories
        const categories = await prisma.categories.findMany();

        if (categories.length === 0) {
            return res.status(404).json({ message: "No categories found" });
        }

        return res.status(200).json({ message: "Categories fetched successfully", categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export {
    createCategory,
    updateCategory,
    deleteCategory,
    getAllCategories
};