import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import uploadFile from "../middlewares/multer.js";
import {
  myProfile,
  getAllUsers,
  userProfile,
  followandUnfollowUser,
  userFollowerandFollowingData,
  updateProfile,
  updatePassword,
} from "../controllers/userControllers.js";

const router = express.Router();

/* ---------- STATIC ROUTES FIRST ---------- */
router.get("/me", isAuth, myProfile);
router.get("/all", isAuth, getAllUsers);
router.get("/followdata/:id", isAuth, userFollowerandFollowingData);

/* ---------- ACTION ROUTES ---------- */
router.post("/follow/:id", isAuth, followandUnfollowUser);

/* ---------- UPDATE ROUTES ---------- */
router.post("/:id", isAuth, updatePassword);
router.put("/:id", isAuth, uploadFile, updateProfile);

/* ---------- DYNAMIC ROUTE LAST ---------- */
router.get("/:id", isAuth, userProfile);

export default router;
