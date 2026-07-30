export type appUser = {
  id: string;
  email: string | null;
  phone: string | null;
};

// `user` and `cookiePayload` are declared by @seamless-auth/fastify itself.
declare module "fastify" {
  interface FastifyRequest {
    appUser?: appUser;
  }
}
