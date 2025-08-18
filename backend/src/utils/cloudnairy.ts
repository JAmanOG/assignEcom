import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import type { CloudinaryConfig } from "../types/type.js";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
} as CloudinaryConfig);

const uploadFilePath = async (LocalFilePath: string) => {
  try {
    if (!LocalFilePath) return "Please provide a file path";

    const response = await cloudinary.uploader.upload(LocalFilePath, {
      resource_type: "auto",
    });
    console.log("File uploaded successfully", response);
    fs.unlinkSync(LocalFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(LocalFilePath);
    console.log("Error uploading file", error);
    return null;
  }
};

const DeleteOldImage = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Image deleted successfully:", result);
    return result;
  } catch (error) {
    console.error("Error deleting image:", error);
    return null;
  }
};

export { uploadFilePath, DeleteOldImage };
