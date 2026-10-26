const multer = require("multer");
const path = require("path");
const fs = require("fs");
const CustomError = require("../utils/customError");
const logger = require("../services/logger");

const getStorage = (subfolder) => {
  const uploadPath = path.join("uploads", subfolder);

  // Create subfolder if it doesn't exist
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });
};

const createUploadMiddleware = (subfolder, options = {}) => {
  const { fileSize = 50 * 1024 * 1024, fileFilter } = options;

  return multer({
    storage: getStorage(subfolder),
    limits: {
      fileSize, // 50MB by default
    },
    ...(fileFilter && { fileFilter }),
  });
};

module.exports = createUploadMiddleware;
