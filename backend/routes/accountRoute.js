import express from "express";
import { userAuth } from "../middleware/authMiddleware.js";
import {
  addMoneyToAccount,
  createAccount,
  getAccounts,
} from "../controllers/accountController.js";

const router = express.Router();

router.get("/:id?", userAuth, getAccounts);
router.post("/create", userAuth, createAccount);
router.put("/add-money/:id", userAuth, addMoneyToAccount);

export default router;
