const Logger = require("../services/logger");

const errorMiddleware = (error, req, res, next) => {
  Logger.error(`${error.message} - ${req.method} ${req.url}`);

  if (res.headersSent) {
    return next(error);
  }

  const status = error.status || 500;
  const message = error.message || "Internal Server Error";
  console.error(error.stack || error.message);

  res.status(status).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    },
  });
};

module.exports = errorMiddleware;
