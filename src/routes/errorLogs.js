import express from "express";
import {
  createLogs,
  getLogs,
  updateLogStatus,
} from "../controllers/errorLogController.js";

const router = express.Router();

router.post("/", createLogs);
router.get("/", getLogs);
router.patch("/:id", updateLogStatus);

export default router;
