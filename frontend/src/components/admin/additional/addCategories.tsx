import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../../ui/button";
import { Plus } from "lucide-react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import axios from "@/lib/axios";
import { categorySchema } from "@/lib/validation/categorySchemas";
import { ZodError } from "zod";
import type { Category } from "../ProductManagement";
import { useToast } from "@/hooks/use-toast";
type ChildProps = {
  onCategoryAdd: (category: Category) => void;
};

const AddCategory = ({ onCategoryAdd }: ChildProps) => {
  const { toast } = useToast();
  const [newCategory, setNewCategory] = useState({
    name: "",
    slug: "",
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleAddCategory = async () => {
    try {

      console.log("Adding category:", newCategory);
      // Validate using Zod schema
      const validatedCategory = categorySchema.parse(newCategory);

      console.log("Validated category:", validatedCategory);
      // Send request
      const res = await axios.post("/api/categories", validatedCategory);
      console.log("Category added successfully", res.data);

      // Call the parent callback to update state
      onCategoryAdd(res.data.category);
      toast({
        title: "Category Added",
        description: `Category "${res.data.category.name}" has been added successfully.`,
      });

      // Reset state
      setNewCategory({ name: "", slug: "" });
      setIsAddDialogOpen(false);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        console.error("Validation error:", error.issues);
        toast({
          title: "Validation Error",
          description: error.issues.map((issue) => issue.message).join(", "),
          variant: "destructive",
        });
      } else {
        console.error("Error adding category:", error);
        toast({
          title: "Error",
          description: "Failed to add category. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Create a new category to organize your products
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={newCategory.name}
              onChange={(e) =>
                setNewCategory({ ...newCategory, name: e.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">Slug (optional)</Label>
            <Input
              id="slug"
              value={newCategory.slug}
              onChange={(e) =>
                setNewCategory({ ...newCategory, slug: e.target.value })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleAddCategory}>Add Category</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategory;
