import type { FastifyReply, FastifyRequest } from "fastify";
import {
  getSeamlessUser,
  type SeamlessAuthServerOptions,
} from "@seamless-auth/fastify";

import getLogger from "../lib/logger.js";
import { User } from "../../models/user.js";

const logger = getLogger("requireUser");

export const requireUser =
  (opts: SeamlessAuthServerOptions) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const seamlessUser = await getSeamlessUser(req, opts);

      if (!seamlessUser) {
        logger.warn("Failed to resolve Seamless Auth user");
        return reply.status(401).send({ message: "Not allowed." });
      }

      try {
        const email =
          typeof seamlessUser.email === "string"
            ? seamlessUser.email.toLowerCase()
            : null;
        const phone =
          typeof seamlessUser.phone === "string" &&
          seamlessUser.phone.length > 0
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error.name === "SequelizeUniqueConstraintError") {
          const existingUser = await User.findOne({
            where: { id: seamlessUser.id },
          });

          if (existingUser) {
            req.appUser = existingUser;
            return;
          }
        }

        logger.error({ err: error }, "Error creating local user");
        return reply.status(400).send({ message: "Failed to create user" });
      }
    } catch (error) {
      logger.error({ err: error }, "requireUser failed");
      return reply.status(401).send({ message: "Not allowed" });
    }
  };
