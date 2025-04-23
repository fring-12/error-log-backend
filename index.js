import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./src/config/database.js";
import { cacheMiddleware } from "./src/middleware/cache.js";
import { rateLimiter } from "./src/middleware/rateLimiter.js";
import errorLogRoutes from "./src/routes/errorLogs.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "*", // Replace with your frontend URL in production
  methods: ["GET", "POST", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(rateLimiter);
app.use(cacheMiddleware);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Routes
app.use("/api/logs", errorLogRoutes);

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
