const CustomError = require("../utils/customError");

// multer fileFilter for the celebrations uploads: the "video" field takes video/*, every other field image/*.
const celebrationFileFilter = (req, file, cb) => {
  const isVideoField = file.fieldname === "video";
  const expected = isVideoField ? "video/" : "image/";

  if (file.mimetype && file.mimetype.startsWith(expected)) {
    return cb(null, true);
  }

  const label = file.fieldname.replace(/_/g, " ");
  return cb(new CustomError(`${label} must be ${isVideoField ? "a video" : "an image"} file`, 400));
};

module.exports = celebrationFileFilter;
