import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import NodeCache from "node-cache";
import ErrorLog from "./models/ErrorLog.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize cache with 5 minutes TTL
const cache = new NodeCache({ stdTTL: 300 });

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(limiter);

// MongoDB Connection with optimized settings
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 5, // Minimum number of connections in the pool
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

connectDB();

// POST /logs endpoint with batching support
app.post("/logs", async (req, res) => {
  try {
    // Handle both single log and batch of logs
    const logs = Array.isArray(req.body) ? req.body : [req.body];

    const logEntries = logs.map(
      (log) =>
        new ErrorLog({
          ...log,
          serverTimestamp: new Date(),
        })
    );

    const savedLogs = await ErrorLog.insertMany(logEntries);

    // Clear cache when new logs are added
    cache.del("all_logs");

    res.status(201).json({
      status: "success",
      data: savedLogs,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
});

// GET /logs endpoint with caching
app.get("/logs", async (req, res) => {
  try {
    const cacheKey = `logs_${JSON.stringify(req.query)}`;
    const cachedLogs = cache.get(cacheKey);

    if (cachedLogs) {
      return res.status(200).json({
        status: "success",
        data: cachedLogs.data,
        pagination: cachedLogs.pagination,
        cached: true,
      });
    }

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
    const [logs, totalLogs] = await Promise.all([
      ErrorLog.find(query)
        .sort({ [sortBy]: order === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ErrorLog.countDocuments(query),
    ]);

    // Get total count for pagination
    const totalPages = Math.ceil(totalLogs / parseInt(limit));
    const response = {
      status: "success",
      data: logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalLogs,
        limit: parseInt(limit),
      },
    };

    // Cache the response
    cache.set(cacheKey, response);

    res.status(200).json(response);
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

    // Clear cache when log is updated
    cache.del("all_logs");

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
