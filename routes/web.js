const express = require("express");
const router = express.Router();
const WebController = require("../controllers/webController");
const JobApplicationsController = require("../controllers/resumeController");
const createUploadMiddleware = require("../middlewares/multerMiddleware");
const { uploadResume } = require("../middlewares/resumeUploadMiddleware");
const InvestorsController = require("../controllers/investorsController");
const { validateJobApplicationSubmission, validateGeneralApplicationSubmission } = require("../utils/validator");
const JobApplicationSubmissionController = require("../controllers/career/jobApplicationController");
const MetaDataController = require("../controllers/meta/metaDataController");
const GoldRateController = require("../controllers/general/goldRateController");
const FaqController = require("../controllers/faqController");

const upload = createUploadMiddleware("job-applications");
const uploadField = upload.single("file");

router.get("/meta", MetaDataController.getMetaData);
router.get("/gold-rate", GoldRateController.fetchGoldRate);
router.get("/faq", FaqController.getFaqData);
router.get("/meta-slug", MetaDataController.getMetaForSlug);
router.get("/home", WebController.getHomeData);
router.get("/float-buttons", WebController.floatButtons);
router.get("/about", WebController.aboutData);
router.get("/management", WebController.mangementData);
router.get("/contacts", WebController.contactData);
router.get("/history", WebController.historyData);
router.get("/blogs", WebController.allBlogs);
router.get("/blogs-latest", WebController.blogDataLatest);
router.get("/blogs/:slug", WebController.blogDetails);
router.get("/csr", WebController.CsrData);
router.get("/csr/:slug", WebController.csrDetails);
router.get("/news", WebController.allNews);
router.get("/news-latest", WebController.newsDataLatest);
router.get("/news/:slug", WebController.newsDetails);
router.get("/indel-values", WebController.IndelValuesData);
router.get("/shades-of-indel", WebController.ShadesOfIndel);
router.get("/our-services", WebController.OurServices);
router.get("/gold-loan", WebController.goldLoan);
router.get("/msme", WebController.MSMELoan);
router.get("/cd-loan", WebController.CDLoan);
router.get("/loan-against-property", WebController.LoanAgainstProperty);
router.get("/career", WebController.CareerPage);
router.get("/career-active-jobs", WebController.ActiveJobs);
router.get("/event-gallery", WebController.eventGallery);
router.get("/event", WebController.event);
router.get("/more-events", WebController.galleryItems);
router.get("/awards", WebController.Awards);
router.get("/investors/report", InvestorsController.AnnualReports);
router.get("/investors/contact", InvestorsController.contact);
router.get("/investors/policies", InvestorsController.policies);
router.get("/investors/stock-exchange", InvestorsController.stockExchangeData);
router.get("/investors/fiscal_years", InvestorsController.fiscalyears);
router.get("/investors/policy_categories", InvestorsController.policyCategories);

router.get("/investors/corporate-governance", InvestorsController.CorporateGovernence);
router.get("/investors/ncd-reports", InvestorsController.ncdReports);
router.get("/investors/quarterly-reports", InvestorsController.quarterlyReports);
router.get("/investors/credit-ratings", InvestorsController.creditRatings);
router.get("/investors/csr-details", InvestorsController.csrDetails);
router.get("/indel-cares", WebController.indelCares);
router.get("/indel-cares/:slug", WebController.indelCaresDetails);
router.get("/ombudsman", WebController.ombudsmanFiles);
router.get("/footer", WebController.footerContent);
router.get("/header", WebController.headerContent);
router.get("/popups", WebController.popUps);
router.get("/testimonials", WebController.testimonials);
router.get("/partners", WebController.partners);
router.get("/partner-data", WebController.partnersData);
router.get("/directors", WebController.directors);
router.get("/policies", WebController.policy);
router.get("/branch-locator", WebController.branchLocator);
router.get("/ncd-forms", WebController.getNcdPageData);

router.post("/career/resume", uploadField, JobApplicationsController.create);
router.get("/career/resume", uploadField, JobApplicationsController.getAll);

router.post("/careers/job_application", validateJobApplicationSubmission, uploadResume, JobApplicationSubmissionController.submitApplication);

router.get("/careers/job_applications", JobApplicationSubmissionController.listApplications);
router.get("/careers/export_job_applications", JobApplicationSubmissionController.exportApplicationsToExcel);
router.get("/careers/export_general_applications", JobApplicationSubmissionController.exportGeneralApplicationsToExcel);

router.post(
  "/careers/general_application",
  validateGeneralApplicationSubmission,
  uploadResume,
  JobApplicationSubmissionController.submitGeneralApplication,
);

router.get("/careers/general_applications", JobApplicationSubmissionController.listGeneralApplications);
router.post("/careers/send-otp", JobApplicationSubmissionController.sendOtp);
router.post("/careers/verify-otp", JobApplicationSubmissionController.verifyOtp);
router.post("/careers/job-applications/:id/status", JobApplicationSubmissionController.changeStatus);
router.post("/careers/general-applications/:id/status", JobApplicationSubmissionController.changeStatusGeneral);

module.exports = router;
