import express from "express";
import { userAuth } from "../middleware/authMiddleware.js";
import {
  addTransactions,
  getDashboardInformation,
  getTransactions,
  transferMoneyToAccount,
} from "../controllers/transactionController.js";

const router = express.Router();

router.get("/", userAuth, getTransactions);
router.get("/dashboard", userAuth, getDashboardInformation);
router.post("/add-transaction/:account_id", userAuth, addTransactions);
router.put("/transfer-money", userAuth, transferMoneyToAccount);

export default router;
