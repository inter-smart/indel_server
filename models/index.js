const sequelize = require("../config/database");
const defineUser = require("./user");
const defineHeroBanner = require("./homePage/heroBanner");
const defineHomeStatistics = require("./homePage/homeStatistics");
const defineHomePageContent = require("./homePage/homePageContent");
const defineHomeLoanStep = require("./homePage/homeLoanStep");
const defineHomeFaq = require("./homePage/homeFaq");
const defineSmartMoneyDeals = require("./homePage/smartMoneyDeals");
const defineAboutBanner = require("./about/aboutBanner");
const defineAboutLifeAtIndelGallery = require("./about/aboutLifeAtIndelGallery");
const defineAboutQuickLinks = require("./about/aboutQuickLinks");
const defineAboutPageContent = require("./about/aboutPageContent");
const defineAboutServiceGallery = require("./about/aboutServiceGallery");
const defineAboutMessageTeam = require("./about/aboutMessageFromTeam");
const defineAboutStatistics = require("./about/aboutStats");
const defineAboutAccolades = require("./about/aboutAccolades");
const ManagementTeams = require("./management/managementTeams");
const ManagementTeamContent = require("./management/managementTeamContent");
const DeptPartners = require("./debt/deptPartners");
const DebtPartnersContent = require("./debt/debtPartnersContent");
const ContactContent = require("./contact/contactContent");
const ContactFaq = require("./contact/contactFaq");
const ContactOffice = require("./contact/contactOffice");
const defineHistoryPageContent = require("./history/historyContent");
const defineHistoryImages = require("./history/historyImages");
const defineHistoryInceptionsYears = require("./history/historyInceptionsYears");
const defineIndelValuesContent = require("./indelValues/indelValueContent");
const defineIndelValues = require("./indelValues/indelValues");
const defineValuesBannerMobile = require("./indelValues/mobileBanners");
const defineApproachPropositions = require("./indelValues/approachProposition");
const defineShadesOfIndelContent = require("./shadesOfIndel/shadesOfIndelContent");
const defineDifferentShades = require("./shadesOfIndel/differentShades");
const defineServiceContent = require("./services/servicesContent");
const defineServices = require("./services/services");
const defineServiceBenefits = require("./services/serviceBenefits");
const defineGoldloanContent = require("./goldloan/goldloanContent");
const defineGoldloanBannerFeatures = require("./goldloan/bannerFeatures");
const defineGoldLoanScheme = require("./goldloan/goldLoanScheme");
const defineSchemeDetails = require("./goldloan/schemeDetails");
const defineGoldLoanFaq = require("./goldloan/goldLoanFaq");
const defineGoldLoanFeatures = require("./goldloan/goldLoanFeatures");
const defineMsmeLoanContent = require("./msme/loanContent");
const defineMsmeFaq = require("./msme/faq");
const defineMsmeOfferings = require("./msme/msmeOfferings");
const defineMsmeTargetAudience = require("./msme/targetAudience");
const defineMsmeSupportedIndustries = require("./msme/supportedIndustries");
const defineMsmeLoanTypes = require("./msme/loanTypes");
const defineCdLoanContent = require("./CD/cdContent");
const defineCdLoanProducts = require("./CD/loanProducts");
const defineCdLoanBenefits = require("./CD/loanBenefits");
const defineCdLoanFaq = require("./CD/cdFaq");
const defineCareersContent = require("./career/contents");
const defineCareerBanners = require("./career/banners");
const defineCareerStates = require("./career/states");
const defineCareerLocations = require("./career/locations");
const defineCareerRoles = require("./career/roles");
const defineCareerJobs = require("./career/jobs");
const defineCareerGallery = require("./career/gallery");
const defineCareerBenfs = require("./career/employeeBenfs");
const defineApplicants = require("./career/applicants");
const defineBlogContent = require("./blog/content");
const defineBlogs = require("./blog/blogs");
const defineCsrContent = require("./csr/content");
const defineCsr = require("./csr/csr");
const defineGalleryPageContent = require("./gallery/galleryPageContent");
const defineEventTypes = require("./gallery/eventTypes");
const defineEventGallery = require("./gallery/eventGallery");
const defineCelebrationPageContent = require("./celebrations/celebrationPageContent");
const defineCelebrationCategories = require("./celebrations/celebrationCategories");
const defineCelebrationSubcategories = require("./celebrations/celebrationSubcategories");
const defineCelebrationMedia = require("./celebrations/celebrationMedia");
const defineAwardPageContent = require("./awards/awardPageContent");
const defineAwards = require("./awards/awards");
const defineNewsPageContent = require("./news/newsPageContent");
const defineNews = require("./news/news");
const defineEventPageContent = require("./event/eventPageContent");
const defineEvents = require("./event/event");
const defineInvestorsPageContent = require("./investors/investorsPageContent");
const defineFiscalYears = require("./investors/fiscalYears");
const defineAnnualReport = require("./investors/annualReport");
const defineAnnualReturns = require("./investors/annualReturns");
const defineInvestorsContact = require("./investors/investorsContact");
const definePolicies = require("./investors/policies");
const defineBoardMeetings = require("./investors/boardMeetings");
const defineOtherIntimations = require("./investors/otherIntimations");
const defineCsrCommittee = require("./investors/csrCommittee");
const defineCsrReport = require("./investors/csrReport");
const defineCsrActionPlan = require("./investors/csrActionPlan");
const defineTestimonialPageContent = require("./testimonials/testimonialPageContent");
const defineTestimonials = require("./testimonials/testimonials");
const defineBranchLocatorPageContents = require("./branch/branchLocatorPageContentsModel");
const defineBranches = require("./branch/branches");
const defineJobApplications = require("./career/job_applications");
const defineCorporateGovernance = require("./investors/corporateGovernance");
const defineNcdReports = require("./investors/ncdReports");
const defineQuarterlyReports = require("./investors/quarterlyReports");
const defineCreditRatings = require("./investors/creditRatings");
const defineIndelCares = require("./indelCare/indelCares");
const defineIndelCaresContent = require("./indelCare/indelCaresContents");
const defineOmbudsmanFiles = require("./ombudsman/ombudsmanFiles");
const defineFooterContent = require("./footer/content");
const defineFooterIcons = require("./footer/icons");
const defineServiceEnquiries = require("./serviceEnquiries/serviceEnquiries");
const defineServiceTypes = require("./serviceEnquiries/serviceTypes");
const defindGoldCaratTypes = require("./serviceEnquiries/goldCaratTypes");
const defindGoldTypes = require("./serviceEnquiries/goldTypes");
const defineNewsLetterSubs = require("./footer/newsLetterSubs");
const defineHeaderContent = require("./header/content");
const definePaymentModes = require("./header/payment_modes");
const definePopUpSettings = require("./popup/settings");
const definePopUpServices = require("./popup/services");
const defineDistricts = require("./career/districts");
const definePartners = require("./partners/partners");
const definePartnersData = require("./partners/partnersData");
const defineDirectors = require("./directors/directors");
const defineDirectorsContent = require("./directors/content");
const defineMasterPolicies = require("./policies/policies");
const defineApplicationStatus = require("./career/application_status");
const defineGeneralApplications = require("./career/general_application");
const defineOtp = require("./otp");
const defineFloatButtons = require("./floatButtons/buttons");
const defineAnnouncement = require("./homePage/announcement");
const defineLapContent = require("./Lap/content");
const defineLapProducts = require("./Lap/products");
const defineLapFaq = require("./Lap/lapFaq");
const defineCareerMeta = require("./career/careerMeta");
const defineFileShare = require("./fileShare");
const defineJobLocation = require("./career/jobLocation"); // New import
const defineJobState = require("./career/jobState"); // New import
const defineNcdContent = require("./ncd/content");
const defineApplicantLocations = require("./career/applicantLocations"); // New import
const defineApplicantStates = require("./career/applicantStates"); // New import
const defineApplicantDistricts = require("./career/applicantDistricts");
const definePolicyCategories = require("./investors/policyCategory");
const defineRefreshToken = require("./refreshToken");

const models = {
  User: defineUser(sequelize),
  HeroBanner: defineHeroBanner(sequelize),
  HomeStatistics: defineHomeStatistics(sequelize),
  HomePageContent: defineHomePageContent(sequelize),
  HomeLoanStep: defineHomeLoanStep(sequelize),
  HomeFaq: defineHomeFaq(sequelize),
  SmartMoneyDeals: defineSmartMoneyDeals(sequelize),
  AboutBanner: defineAboutBanner(sequelize),
  AboutLifeAtIndelGallery: defineAboutLifeAtIndelGallery(sequelize),
  AboutQuickLinks: defineAboutQuickLinks(sequelize),
  AboutPageContent: defineAboutPageContent(sequelize),
  AboutServiceGallery: defineAboutServiceGallery(sequelize),
  AboutMessageFromTeam: defineAboutMessageTeam(sequelize),
  AboutStatistics: defineAboutStatistics(sequelize),
  ManagementTeams: ManagementTeams(sequelize),
  ManagementTeamContent: ManagementTeamContent(sequelize),
  DeptPartners: DeptPartners(sequelize),
  DebtPartnersContent: DebtPartnersContent(sequelize),
  ContactContent: ContactContent(sequelize),
  ContactFaq: ContactFaq(sequelize),
  ContactOffice: ContactOffice(sequelize),
  AboutAccolades: defineAboutAccolades(sequelize),
  HistoryPageContent: defineHistoryPageContent(sequelize),
  HistoryImages: defineHistoryImages(sequelize),
  HistoryInceptionsYears: defineHistoryInceptionsYears(sequelize),
  IndelValueContent: defineIndelValuesContent(sequelize),
  IndelValues: defineIndelValues(sequelize),
  ValuesBannerMobile: defineValuesBannerMobile(sequelize),

  ApproachPropositions: defineApproachPropositions(sequelize),
  ShadesOfIndelContent: defineShadesOfIndelContent(sequelize),
  DifferentShades: defineDifferentShades(sequelize),
  ServiceContent: defineServiceContent(sequelize),
  Services: defineServices(sequelize),
  ServiceBenefit: defineServiceBenefits(sequelize),
  GoldloanContent: defineGoldloanContent(sequelize),
  GoldloanBannerFeatures: defineGoldloanBannerFeatures(sequelize),
  GoldLoanScheme: defineGoldLoanScheme(sequelize),
  SchemeDetails: defineSchemeDetails(sequelize),
  GoldLoanFaq: defineGoldLoanFaq(sequelize),
  GoldLoanFeatures: defineGoldLoanFeatures(sequelize),
  MsmeLoanContent: defineMsmeLoanContent(sequelize),
  MsmeLoanFaq: defineMsmeFaq(sequelize),
  MsmeOfferings: defineMsmeOfferings(sequelize),
  MsmeTargetedAudience: defineMsmeTargetAudience(sequelize),
  MsmeLoanSupportedIndustries: defineMsmeSupportedIndustries(sequelize),
  MsmeloanTypes: defineMsmeLoanTypes(sequelize),

  CdLoanContent: defineCdLoanContent(sequelize),
  CdLoanProducts: defineCdLoanProducts(sequelize),
  CdLoanBenefits: defineCdLoanBenefits(sequelize),
  CDFaq: defineCdLoanFaq(sequelize),
  CareersContent: defineCareersContent(sequelize),
  CareerBanners: defineCareerBanners(sequelize),
  CareerStates: defineCareerStates(sequelize),
  CareerLocations: defineCareerLocations(sequelize),
  CareerRoles: defineCareerRoles(sequelize),
  CareerJobs: defineCareerJobs(sequelize),
  CareerGallery: defineCareerGallery(sequelize),
  Applicants: defineApplicants(sequelize),
  EmployeeBenefits: defineCareerBenfs(sequelize),
  BlogPageContent: defineBlogContent(sequelize),
  Blogs: defineBlogs(sequelize),
  CsrPageContent: defineCsrContent(sequelize),
  Csr: defineCsr(sequelize),
  GalleryPageContent: defineGalleryPageContent(sequelize),
  EventTypes: defineEventTypes(sequelize),
  EventGallery: defineEventGallery(sequelize),
  CelebrationPageContent: defineCelebrationPageContent(sequelize),
  CelebrationCategories: defineCelebrationCategories(sequelize),
  CelebrationSubcategories: defineCelebrationSubcategories(sequelize),
  CelebrationMedia: defineCelebrationMedia(sequelize),
  AwardPageContent: defineAwardPageContent(sequelize),
  Awards: defineAwards(sequelize),
  NewsPageContent: defineNewsPageContent(sequelize),
  News: defineNews(sequelize),
  EventPageContent: defineEventPageContent(sequelize),
  Events: defineEvents(sequelize),
  InvestorsPageContent: defineInvestorsPageContent(sequelize),
  FiscalYears: defineFiscalYears(sequelize),
  AnnualReport: defineAnnualReport(sequelize),
  AnnualReturns: defineAnnualReturns(sequelize),
  InvestorsContact: defineInvestorsContact(sequelize),
  Policies: definePolicies(sequelize),
  BoardMeetings: defineBoardMeetings(sequelize),
  OtherIntimations: defineOtherIntimations(sequelize),
  CsrCommittee: defineCsrCommittee(sequelize),
  CsrReport: defineCsrReport(sequelize),
  CsrActionPlan: defineCsrActionPlan(sequelize),
  TestimonialPageContent: defineTestimonialPageContent(sequelize),
  Testimonials: defineTestimonials(sequelize),
  BranchLocatorPageContents: defineBranchLocatorPageContents(sequelize),
  Branches: defineBranches(sequelize),
  JobApplications: defineJobApplications(sequelize),
  CorporateGovernance: defineCorporateGovernance(sequelize),
  NcdReports: defineNcdReports(sequelize),
  QuarterlyReports: defineQuarterlyReports(sequelize),
  CreditRatings: defineCreditRatings(sequelize),
  IndelCares: defineIndelCares(sequelize),
  IndelCaresContent: defineIndelCaresContent(sequelize),
  OmbudsmanFiles: defineOmbudsmanFiles(sequelize),
  FooterContent: defineFooterContent(sequelize),
  SocialMediaIcons: defineFooterIcons(sequelize),
  ServiceEnquiries: defineServiceEnquiries(sequelize),
  ServiceTypes: defineServiceTypes(sequelize),
  GoldCaratTypes: defindGoldCaratTypes(sequelize),
  GoldTypes: defindGoldTypes(sequelize),
  NewsLetterSubs: defineNewsLetterSubs(sequelize),
  HeaderContents: defineHeaderContent(sequelize),
  PaymentModes: definePaymentModes(sequelize),
  PopupSettings: definePopUpSettings(sequelize),
  PopupServices: definePopUpServices(sequelize),
  Districts: defineDistricts(sequelize),
  PartnersTypes: definePartners(sequelize),
  Partners: definePartnersData(sequelize),
  Directors: defineDirectors(sequelize),
  DirectorsContent: defineDirectorsContent(sequelize),
  PolicyCategories: definePolicyCategories(sequelize),
  MasterPolicies: defineMasterPolicies(sequelize),
  ApplicationStatus: defineApplicationStatus(sequelize),
  GeneralApplications: defineGeneralApplications(sequelize),
  Otp: defineOtp(sequelize),
  FloatButtons: defineFloatButtons(sequelize),
  Announcement: defineAnnouncement(sequelize),
  LapContent: defineLapContent(sequelize),
  LapProducts: defineLapProducts(sequelize),
  LapFaq: defineLapFaq(sequelize),
  CareerMeta: defineCareerMeta(sequelize),
  FileShare: defineFileShare(sequelize),
  JobLocation: defineJobLocation(sequelize), // New model
  JobState: defineJobState(sequelize),
  NcdPageContent: defineNcdContent(sequelize),

  ApplicantLocations: defineApplicantLocations(sequelize), // New model
  ApplicantStates: defineApplicantStates(sequelize), // New model
  ApplicantDistricts: defineApplicantDistricts(sequelize),
  RefreshToken: defineRefreshToken(sequelize),
};

Object.keys(models).forEach((modelName) => {
  if ("associate" in models[modelName]) {
    console.log("Associating", modelName);
    models[modelName].associate(models);
  }
});

module.exports = { sequelize, models };
