import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import ErrorLog from "./models/ErrorLog.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

connectDB();

// POST /logs endpoint
app.post("/logs", async (req, res) => {
  try {
    const logEntry = new ErrorLog({
      ...req.body,
      serverTimestamp: new Date(),
    });

    const savedLog = await logEntry.save();

    res.status(201).json({
      status: "success",
      data: savedLog,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
});

// GET /logs endpoint with filtering, sorting, and pagination
app.get("/logs", async (req, res) => {
  try {
    const {
      level,
      source,
      status,
      startDate,
      endDate,
      search,
      sortBy = "serverTimestamp",
      order = "desc",
      limit = 20,
      page = 1,
    } = req.query;

    // Build query
    const query = {};

    if (level) query.level = level;
    if (source) query.source = source;
    if (status) query.status = status;

    // Date range filter
    if (startDate || endDate) {
      query.serverTimestamp = {};
      if (startDate) query.serverTimestamp.$gte = new Date(startDate);
      if (endDate) query.serverTimestamp.$lte = new Date(endDate);
    }

    // Text search
    if (search) {
      query.$or = [
        { message: { $regex: search, $options: "i" } },
        { stackTrace: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with sorting and pagination
    const logs = await ErrorLog.find(query)
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalLogs = await ErrorLog.countDocuments(query);
    const totalPages = Math.ceil(totalLogs / parseInt(limit));

    res.status(200).json({
      status: "success",
      data: logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalLogs,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// PATCH /logs/:id endpoint
app.patch("/logs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (
      !status ||
      !["new", "acknowledged", "resolved", "ignored"].includes(status)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid status value",
      });
    }

    const updatedLog = await ErrorLog.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedLog) {
      return res.status(404).json({
        status: "error",
        message: "Log not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: updatedLog,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
