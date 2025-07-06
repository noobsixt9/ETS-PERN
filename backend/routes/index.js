import express from "express";
import authRoute from "./authRoute.js";
import userRoute from "./userRoute.js";
import accountRoute from "./accountRoute.js";
import transactionRoute from "./transactionRoute.js";

const router = express.Router();

router.use("/auth", authRoute);
router.use("/user", userRoute);
router.use("/account", accountRoute);
router.use("/transaction", transactionRoute);

export default router;
