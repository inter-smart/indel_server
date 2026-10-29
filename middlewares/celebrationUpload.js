const multer = require("multer");
const path = require("path");
const fs = require("fs");
const celebrationFileFilter = require("./celebrationFileFilter");
const { deleteRequestFiles } = require("../utils/celebrationHelpers");

// multer wrapper for the celebrations uploads. Besides the MIME filter it records every file it
// starts writing (req.celebrationUploads), because when multer rejects one part of a multipart
// request a sibling part may already be on disk and would otherwise be left behind.
const celebrationUpload = (subfolder) => {
  const uploadPath = path.join("uploads", subfolder);
  if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename: (req, file, cb) => {
      const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      (req.celebrationUploads = req.celebrationUploads || []).push(path.join(uploadPath, name));
      cb(null, name);
    },
  });
  const upload = multer({ storage, fileFilter: celebrationFileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

  const guard = (handler) => (req, res, next) =>
    handler(req, res, async (error) => {
      if (error) {
        await deleteRequestFiles(req);
        // A part that was already being opened when multer aborted can finish creating its file
        // just after the pass above, so sweep once more shortly afterwards.
        setTimeout(() => deleteRequestFiles(req), 1000).unref();
      }
      next(error);
    });

  return {
    single: (field) => guard(upload.single(field)),
    fields: (fields) => guard(upload.fields(fields)),
  };
};

module.exports = celebrationUpload;
