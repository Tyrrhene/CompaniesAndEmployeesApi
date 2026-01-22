import { Router } from "express";
import { allCompanies, companiesByIds } from "../controllers/companies.js";

const router = Router();

router.get("/", allCompanies);
router.get("/:id", companiesByIds);

export default router;
