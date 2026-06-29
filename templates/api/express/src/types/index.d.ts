import { SeamlessAuthUser } from "@seamless-auth/express";

export type appUser = {
  id: string;
  email: string | null;
  phone: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: SeamlessAuthUser;
      appUser?: appUser;
    }
  }
}
