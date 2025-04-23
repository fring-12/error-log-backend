import express from "express";
import {
  createLogs,
  getLogs,
  updateLogStatus,
} from "../controllers/errorLogController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Logs
 *   description: Error logging API endpoints
 */

/**
 * @swagger
 * /api/logs:
 *   post:
 *     summary: Create new error log(s)
 *     tags: [Logs]
 *     description: Create a single error log or multiple error logs in batch
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/ErrorLog'
 *               - type: array
 *                 items:
 *                   $ref: '#/components/schemas/ErrorLog'
 *           examples:
 *             single:
 *               summary: Single error log
 *               value:
 *                 message: "TypeError: Cannot read property 'id' of undefined"
 *                 level: "error"
 *                 source: "frontend-user-profile"
 *                 stackTrace: "at UserProfile.render (/components/UserProfile.js:25:10)"
 *                 context:
 *                   userId: "123"
 *                   action: "profile-update"
 *                 browserInfo:
 *                   userAgent: "Mozilla/5.0"
 *                   platform: "MacOS"
 *             multiple:
 *               summary: Multiple error logs
 *               value:
 *                 - message: "API Connection Failed"
 *                   level: "error"
 *                   source: "frontend-api"
 *                 - message: "Performance Warning"
 *                   level: "warning"
 *                   source: "frontend-dashboard"
 *     responses:
 *       201:
 *         description: Log(s) created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/ErrorLog'
 *                     - type: array
 *                       items:
 *                         $ref: '#/components/schemas/ErrorLog'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", createLogs);

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Retrieve error logs
 *     tags: [Logs]
 *     description: Get error logs with filtering, pagination, and sorting capabilities
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warning, info]
 *         description: Filter by error level
 *         example: error
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         description: Filter by error source
 *         example: frontend-user-profile
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, acknowledged, resolved, ignored]
 *         description: Filter by status
 *         example: new
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date (ISO format)
 *         example: "2024-01-01T00:00:00Z"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date (ISO format)
 *         example: "2024-12-31T23:59:59Z"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in message and stackTrace
 *         example: TypeError
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: serverTimestamp
 *         description: Field to sort by
 *         example: serverTimestamp
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *         example: 20
 *     responses:
 *       200:
 *         description: List of error logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ErrorLog'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalLogs:
 *                       type: integer
 *                       example: 100
 *                     limit:
 *                       type: integer
 *                       example: 20
 */
router.get("/", getLogs);

/**
 * @swagger
 * /api/logs/{id}:
 *   patch:
 *     summary: Update log status
 *     tags: [Logs]
 *     description: Update the status of a specific error log
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Log ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [new, acknowledged, resolved, ignored]
 *           example:
 *             status: "resolved"
 *     responses:
 *       200:
 *         description: Log status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ErrorLog'
 *       400:
 *         description: Invalid status value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: error
 *               message: Invalid status value
 *       404:
 *         description: Log not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: error
 *               message: Log not found
 */
router.patch("/:id", updateLogStatus);

export default router;
