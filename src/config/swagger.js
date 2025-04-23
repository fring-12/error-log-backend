import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Error Logger API",
      version: "1.0.0",
      description: "A REST API for collecting and managing error logs",
      contact: {
        name: "API Support",
        url: "https://github.com/fring-12/error-log-backend",
      },
    },
    servers: [
      {
        url: process.env.SERVER_URL,
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        ErrorLog: {
          type: "object",
          required: ["message"],
          properties: {
            message: {
              type: "string",
              description: "The error message",
            },
            level: {
              type: "string",
              enum: ["error", "warning", "info"],
              default: "error",
              description: "The severity level of the error",
            },
            source: {
              type: "string",
              description: "Where the error originated from",
            },
            stackTrace: {
              type: "string",
              description: "The error stack trace",
            },
            context: {
              type: "object",
              description: "Additional context about the error",
            },
            browserInfo: {
              type: "object",
              description: "Information about the browser/client",
            },
            status: {
              type: "string",
              enum: ["new", "acknowledged", "resolved", "ignored"],
              default: "new",
              description: "The current status of the error log",
            },
            serverTimestamp: {
              type: "string",
              format: "date-time",
              description: "When the log was received by the server",
            },
            clientTimestamp: {
              type: "string",
              format: "date-time",
              description: "When the error occurred on the client",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "error",
            },
            message: {
              type: "string",
              example: "Error message",
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"], // Path to the API routes
};

export const specs = swaggerJsdoc(options);
