import { Request } from "express";
import type { User } from "../type.ts";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}
