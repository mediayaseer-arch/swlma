// Cloudflare exposes these virtual modules when Wrangler bundles the Worker.
// @ts-expect-error Resolved by the Cloudflare Workers runtime.
import { httpServerHandler } from "cloudflare:node";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import { createServer } from "node:http";
import { createContext } from "./_core/context";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { appRouter } from "./routers";
import { registerRoutes as registerDiriyahRoutes } from "./routes";

const WORKER_PORT = 3000;
const app = express();
const server = createServer(app);

app.set("trust proxy", true);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerStorageProxy(app);
registerOAuthRoutes(app);
registerDiriyahRoutes(server, app);

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

server.listen(WORKER_PORT);

export default httpServerHandler({ port: WORKER_PORT });