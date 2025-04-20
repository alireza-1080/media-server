import express from "express";
import { createPost, getAllPosts, toggleLike } from "../controllers/post.controller.js";

const router = express.Router();

router.post("/create", createPost);

router.post("/get-all", getAllPosts);

router.post("/toggle-like", toggleLike)

export default router;
