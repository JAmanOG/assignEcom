import { Request } from "express";
import "multer";

declare global {
  namespace Express {
    interface Request {
      user?: any; // type properly if you know your user object
    }
  }
}

export interface MulterRequest extends Request {
  file?: Express.Multer.File;
}
