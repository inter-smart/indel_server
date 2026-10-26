const fs = require("fs");
const path = require("path");
const multer = require("multer");
const createUploadMiddleware = require("./multerMiddleware");
const CustomError = require("../utils/customError");
const logger = require("../services/logger");

const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5MB
const RESUME_FIELD = "applicant[file]";
const INVALID_TYPE_MESSAGE = "Only PDF, DOC and DOCX files are allowed";

// extension -> accepted mimetypes. Browsers sometimes send application/octet-stream
// (or an empty type) for Word files, so it is tolerated here; the real check is the
// magic-byte signature below.
const ALLOWED_TYPES = {
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword", "application/octet-stream"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"],
};

// extension -> file signature that must appear at the start of the file
const SIGNATURES = {
  ".pdf": Buffer.from("%PDF-"),
  ".doc": Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), // OLE2 compound file
  ".docx": Buffer.from([0x50, 0x4b, 0x03, 0x04]), // ZIP container
};

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const mimes = ALLOWED_TYPES[ext];

  if (!mimes || !mimes.includes(file.mimetype)) {
    return cb(new CustomError(INVALID_TYPE_MESSAGE, 400));
  }
  cb(null, true);
};

const upload = createUploadMiddleware("job-applications", { fileSize: MAX_RESUME_SIZE, fileFilter }).single(RESUME_FIELD);

const removeFile = (filePath) => {
  fs.promises.unlink(filePath).catch((err) => {
    if (err.code !== "ENOENT") logger.error(`Failed to delete resume ${filePath}: ${err.message}`);
  });
};

const hasValidSignature = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const signature = SIGNATURES[ext];
  if (!signature) return false;

  const handle = await fs.promises.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(signature.length);
    const { bytesRead } = await handle.read(buffer, 0, signature.length, 0);
    return bytesRead === signature.length && buffer.equals(signature);
  } finally {
    await handle.close();
  }
};

/**
 * Resume upload for the public career forms: PDF/DOC/DOCX up to 5MB.
 * - multer errors are turned into 400s with readable messages
 * - the file content is checked against its extension's signature
 * - the saved file is removed again if the request ends in an error response
 */
const uploadResume = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        const message =
          err.code === "LIMIT_FILE_SIZE"
            ? `File size should be less than ${MAX_RESUME_SIZE / (1024 * 1024)}MB`
            : err.code === "LIMIT_UNEXPECTED_FILE"
              ? "Unexpected file field"
              : err.message;
        return next(new CustomError(message, 400));
      }
      return next(err);
    }

    if (!req.file) return next();

    try {
      if (req.file.size === 0 || !(await hasValidSignature(req.file.path))) {
        removeFile(req.file.path);
        return next(new CustomError(req.file.size === 0 ? "Uploaded file is empty" : "Uploaded file content does not match its file type", 400));
      }
    } catch (error) {
      removeFile(req.file.path);
      return next(error);
    }

    // Don't leave orphaned uploads behind when the submission is rejected later on
    const { path: filePath } = req.file;
    res.on("finish", () => {
      if (res.statusCode >= 400) removeFile(filePath);
    });

    next();
  });
};

module.exports = { uploadResume, MAX_RESUME_SIZE };
