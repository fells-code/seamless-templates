import type { Request, NextFunction, Response } from "express";

import getLogger from "../lib/logger";
import {
  getSeamlessUser,
  SeamlessAuthServerOptions,
} from "@seamless-auth/express";
import { User } from "../../models/user";

const logger = getLogger("requireUser");

export const requireUser =
  (opts: SeamlessAuthServerOptions) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const seamlessUser = await getSeamlessUser(req, opts);

      if (!seamlessUser) {
        logger.warn("Failed to resolve Seamless Auth user");
        return res.status(401).json({ message: "Not allowed." });
      }

      try {
        const email =
          typeof seamlessUser.email === "string"
            ? seamlessUser.email.toLowerCase()
            : null;
        const phone =
          typeof seamlessUser.phone === "string" && seamlessUser.phone.length > 0
            ? seamlessUser.phone
            : null;

        const [user] = await User.findOrCreate({
          where: { id: seamlessUser.id },
          defaults: {
            email,
            phone,
          },
        });

        req.appUser = user;
        next();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error.name === "SequelizeUniqueConstraintError") {
          const existingUser = await User.findOne({
            where: { id: seamlessUser.id },
          });

          if (existingUser) {
            req.appUser = existingUser;
            return next();
          }
        }

        logger.error("Error creating local user", error);
        return res.status(400).json({ message: "Failed to create user" });
      }
    } catch (error) {
      logger.error("requireUser failed", error);
      res.status(401).json({ message: "Not allowed" });
    }
  };
