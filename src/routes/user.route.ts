import express from "express";
import {
  createUser,
  followUser,
  getRandomUsers,
  getUserByUsername,
  isCurrentUserFollowing,
  unfollowUser,
  updateUserByFormData,
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/update", createUser);

router.post("/update-user-by-form-data", updateUserByFormData);

router.post("/get-random-users", getRandomUsers);

router.post("/follow-user", followUser);

router.post("/unfollow-user", unfollowUser);

router.post("/get-user-by-username", getUserByUsername);

router.post("/is-current-user-following", isCurrentUserFollowing);

export default router;
