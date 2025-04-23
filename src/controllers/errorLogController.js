import ErrorLog from "../models/ErrorLog.js";

export const createLogs = async (req, res) => {
  try {
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
    req.cache.del("all_logs");

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
};

export const getLogs = async (req, res) => {
  try {
    const cacheKey = `logs_${JSON.stringify(req.query)}`;
    const cachedLogs = req.cache.get(cacheKey);

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

    const query = {};

    if (level) query.level = level;
    if (source) query.source = source;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.serverTimestamp = {};
      if (startDate) query.serverTimestamp.$gte = new Date(startDate);
      if (endDate) query.serverTimestamp.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { message: { $regex: search, $options: "i" } },
        { stackTrace: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, totalLogs] = await Promise.all([
      ErrorLog.find(query)
        .sort({ [sortBy]: order === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ErrorLog.countDocuments(query),
    ]);

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

    req.cache.set(cacheKey, response);

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const updateLogStatus = async (req, res) => {
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

    req.cache.del("all_logs");

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
};
