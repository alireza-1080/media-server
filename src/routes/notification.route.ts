import express from "express";
import {
  getAllNotifications,
  markAsRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.post("/get-all", getAllNotifications);

router.post("/mark-as-read", markAsRead);

export default router;
