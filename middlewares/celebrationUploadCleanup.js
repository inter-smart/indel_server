const { validationResult } = require("express-validator");
const CustomError = require("../utils/customError");
const { deleteRequestFiles } = require("../utils/celebrationHelpers");

// Same as validateMiddleware, but multer has already written the uploads by the time the
// validators run, so a rejected request must also remove those files.
const celebrationUploadCleanup = async (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  await deleteRequestFiles(req);
  return next(
    new CustomError(
      "Validation failed: " +
        errors
          .array()
          .map((err) => err.msg)
          .join(", "),
      400
    )
  );
};

module.exports = celebrationUploadCleanup;
