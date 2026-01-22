import express from "express";
import companiesRouter from "./routes/companies.js";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/companies", companiesRouter);

  return app;
}