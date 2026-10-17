const express = require("express");
const dotenv = require("dotenv");
const sequelize = require("./config/database");
const apiRoutes = require("./routes/index");
const translateMiddleware = require("./middlewares/translateMiddleware");
const errorMiddleware = require("./middlewares/errorMiddleware");
const Logger = require("./services/logger");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { createDemoAdmin } = require("./utils/demoUser");
const { initHomePageContent } = require("./utils/initHomePageContent");
const { initMngmntTeamContent } = require("./utils/initMangementTeamContent");
const { initContactContent } = require("./utils/initContactContent");
const { initHistoryPageContent } = require("./utils/initHistoryPageContent");
const { initIndelValueContent } = require("./utils/initIndelValueContent");
const { initShadesOfIndelContent } = require("./utils/initShadesOfIndelContent");
const { initServicesPageContent } = require("./utils/initServicePageContent");
const { initGoldLoanContent } = require("./utils/initGoldLoanContent");
const { initMsmeLoanContent } = require("./utils/initMsmeLoanContent");
const { initLoanAgainstPropertyContent } = require("./utils/initLoanAgainstPropertyContent");

const { initCdLoanContent } = require("./utils/initCdLoanContent");
const { initCareerContents } = require("./utils/initCareerContent");
const { initDebtPartnersContent, initAboutPageContent, initBlogPageContent, initCSRPageContent } = require("./utils/initContents");
const { initGalleryPageContent } = require("./utils/initGalleryContents");
const { initAwardPageContent } = require("./utils/initAwardPageContent");
const { initNewsPageContent } = require("./utils/initNewsPageContent");
const { initEventPageContent } = require("./utils/initEventPageContent");
const { initInvestorsPageContent } = require("./utils/initInvestorsPageContent");
const { initTestimonialPageContents } = require("./utils/initTestimonialPageContents");
const { initBranchLocatorPageContents } = require("./utils/initBranchLocatorPageContents");
const { initIndelCaresContent } = require("./utils/initIndelCareContent");
const { initFooterContent } = require("./utils/initFooterContent");
const { initHeaderContents } = require("./utils/initHeaderContent");
const { initPopupSettings } = require("./utils/initPopupSettings");
const { initDirectorsContent } = require("./utils/initDirectorsContent");
const { initNcdPageContent } = require("./utils/initNcdContent");
require("./utils/fileExpiration");
require("./utils/deactivateExpiredJobs");
const session = require("express-session");

dotenv.config();

// Keep the process alive on stray async errors (e.g. failed external API calls)
process.on("unhandledRejection", (reason) => {
  Logger.error(`Unhandled rejection: ${reason?.stack || reason?.message || reason}`);
});
process.on("uncaughtException", (error) => {
  Logger.error(`Uncaught exception: ${error?.stack || error?.message || error}`);
});

const app = express();

app.set("trust proxy", 1);

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS).split(",").map((o) => o.trim());

function normalizeOrigin(origin) {
  return origin.replace(/^https?:\/\/www\./, "https://");
}

const normalizedAllowedOrigins = ALLOWED_ORIGINS.map(normalizeOrigin);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // same-origin / server-to-server

      if (normalizedAllowedOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }

      Logger.warn(`CORS rejected origin: ${origin}`); // ← see point 4
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  }),
);

// Parse incoming JSON bodies. The limit is raised well above Express's 100kb
// default because POST /api/translate receives every translatable string on a
// page in one body, and a content-heavy page overruns 100kb — which would 413
// and leave the whole page untranslated.
app.use(express.json({ limit: "1mb" }));

// Parse cookies — required for req.cookies.refreshToken in auth/refresh and auth/logout
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // true only for HTTPS!
      sameSite: "lax", // 'none' for HTTPS and cross-origin
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

app.get("/set-location", (req, res) => {
  req.session.stateId = 1;
  req.session.stateName = "Kerala";
  res.send("Location stored in session!");
});

app.get("/get-location", (req, res) => {
  res.json({
    stateId: req.session.stateId,
    stateName: req.session.stateName,
  });
});


app.get('/remove-location', (req, res) => {
  req.session.stateId = null;
  req.session.stateName = null;
  res.send('Location removed from session!');
})
app.use("/api", translateMiddleware, apiRoutes);

const PORT = process.env.PORT || 3000;

app.use(errorMiddleware);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    // await sequelize.sync({ alter: false });
    Logger.info("Database connected and synced");

    await createDemoAdmin();
    // await initHomePageContent();
    // await initAboutPageContent();
    // await initMngmntTeamContent();
    // await initDebtPartnersContent();
    // await initContactContent();
    // await initCSRPageContent();
    // await initHistoryPageContent();
    // await initIndelValueContent();
    // await initShadesOfIndelContent();
    // await initServicesPageContent();
    // await initGoldLoanContent();
    // await initMsmeLoanContent();
    // await initLoanAgainstPropertyContent();
    // await initCdLoanContent();
    // await initCareerContents();
    // await initBlogPageContent();
    // await initGalleryPageContent();
    // await initAwardPageContent();
    // await initNewsPageContent();
    // await initEventPageContent();
    // await initInvestorsPageContent();
    // await initTestimonialPageContents();
    // await initBranchLocatorPageContents();
    // await initIndelCaresContent();
    // await initFooterContent();
    // await initHeaderContents();
    // await initPopupSettings();
    // await initDirectorsContent();
    // await initNcdPageContent();

    app.listen(PORT, () => {
      Logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    Logger.error("Failed to start server: " + error.message);
    process.exit(1);
  }
};

startServer();
