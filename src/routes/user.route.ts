import express from "express";
import {
  createUser,
  followUser,
  getRandomUsers,
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/", (req, res) => {
  res.json("user rote");
});

router.post("/update", createUser);

router.post("/get-random-users", getRandomUsers);

// @ts-expect-error The code is working absolutely fine
router.post("/follow-user", followUser);

export default router;
