import cors from "cors";
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for error logs
const errorLogs = [];

// POST /logs endpoint
app.post("/logs", (req, res) => {
  const logEntry = {
    ...req.body,
    timestamp: req.body.timestamp || new Date().toISOString(),
  };

  errorLogs.push(logEntry);

  res.status(201).json({
    status: "success",
    message: "Log received",
  });
});

// GET /logs endpoint
app.get("/logs", (req, res) => {
  res.status(200).json(errorLogs);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
