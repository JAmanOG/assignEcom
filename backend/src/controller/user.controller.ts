import { prisma } from "../index.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import {
  comparePasswords,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  isPasswordValid,
  allFieldRequired
} from "../helper/helper.js";
import type { Request, Response } from "express";
import type { Role } from "../types/type.js";

// registering a new user
const registerUser = async (req: Request, res: Response) => {
  const { full_name, email, phone, password } = req.body;

  const isValid = allFieldRequired({ full_name, email, phone, password });
  if (!isValid) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const isUserExists = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (isUserExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await prisma.user.create({
      data: {
        id: uuidv4(),
        full_name,
        email,
        phone,
        password_hashed: hashedPassword,
      },
    });


    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // Store refresh token in the database
    await prisma.user.update({
      where: { id: newUser.id },
      data: { storedRefreshToken: refreshToken }
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // setting the access token
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000 // 15 minutes
    });


    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Rotate Refresh Token
const rotateRefreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as { id: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || user.storedRefreshToken !== refreshToken) {
      // Compare against stored token in DB
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Store new refresh token in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { storedRefreshToken: newRefreshToken }
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000
    });

    return res.status(200).json({ message: "Tokens rotated successfully" });

  } catch (error) {
    console.error("Error rotating refresh token:", error);
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};
// Updating user details
const updatingUser = async (req: Request, res: Response) => {
  const userId: string = req.user?.id || "";
  const { full_name, email, phone } = req.body;

  try {
    // If email is provided, check uniqueness
    if (email) {
      const emailExists = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } },
      });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Build update object dynamically
    const data: any = {};
    if (full_name) data.full_name = full_name;
    if (email) data.email = email;
    if (phone) data.phone = phone;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return res.status(200).json({
      message: "User updated successfully",
      user: {
        id: updatedUser.id,
        full_name: updatedUser.full_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// logging in the user
const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const isValid = allFieldRequired({ email, password });
  if (!isValid) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !isPasswordValid(password, user.password_hashed)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // generating the access and refresh tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in the database
    await prisma.user.update({
      where: { id: user.id },
      data: { storedRefreshToken: refreshToken }
    });

    // setting the refresh token in the client's cookies
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // setting the access token in the client's cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// logging out the user
const logoutUser = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET as string) as { id: string };
    await prisma.user.update({
      where: { id: decoded.id },
      data: { storedRefreshToken: null }
    });

    
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // TODO: have to invalidate the access token
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error logging out user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// fetching the current user login
const getCurrentUser = async (req: Request, res: Response) => {
  const userId: string = req.user?.id || "";
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// changing the password 
const changePassword = async (req: Request, res: Response) => {
    const userId: string = req.user?.id || "";
    const { oldPassword, newPassword } = req.body;
    
    const isValid = allFieldRequired({ userId, oldPassword, newPassword });    
    if (!isValid) {
        return res.status(400).json({ message: "All fields are required" });
    }
    
    try {
        const user = await prisma.user.findUnique({
        where: { id: userId },
        });
    
        if (!user || !(await comparePasswords(oldPassword, user.password_hashed))) {
        return res.status(401).json({ message: "Invalid credentials" });
        }
    
        const hashedNewPassword = await hashPassword(newPassword);
        await prisma.user.update({
        where: { id: userId },
        data: { password_hashed: hashedNewPassword },
        });
        
        return res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Error changing password:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// list all the users
const listUsers = async (req: Request, res: Response) => {
  // with filter
  const { role } = req.query;
  if (role && typeof role !== "string") {
    return res.status(400).json({ message: "Invalid role filter" });
  }

  try {
    if (role) {
      const users = await prisma.user.findMany({
        where: { role : role as Role },
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          role: true,
        },
      });

      return res.status(200).json({ message: "Users fetched successfully", users });
    }else {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          role: true,
        },
      });

      return res.status(200).json({ message: "Users fetched successfully", users });
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  changePassword,
  updatingUser,
  listUsers,
  rotateRefreshToken,
  
}