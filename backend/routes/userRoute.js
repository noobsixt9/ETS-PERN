import express from "express";
import { userAuth } from "../middleware/authMiddleware.js";
import {
  changePasssword,
  getUser,
  updateUser,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/", userAuth, getUser);
router.put("/change-password", userAuth, changePasssword);
router.put("/", userAuth, updateUser);

export default router;
