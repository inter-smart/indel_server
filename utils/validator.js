const { check } = require("express-validator");
const { models } = require("../models");
const EventTypes = models.EventTypes;

const generateStringValidators = (fields, isOptional = false) => {
  return fields.map((field) =>
    isOptional
      ? check(field)
          .optional()
          .notEmpty()
          .withMessage(`${capitalize(field)} cannot be empty`)
      : check(field)
          .notEmpty()
          .withMessage(`${capitalize(field)} cannot be empty`),
  );
};

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const validateAboutLifeAtIndel = [
  check("order")
    .isInt({
      gt: 0,
    })
    .withMessage("Order must be a positive integer"),
];

const validateAboutLifeAtIndelUpdate = [];

const validateManagementTeam = [
  check("name").notEmpty().withMessage("Name is required"),
  check("title").notEmpty().withMessage("Title is required"),
  check("order")
    .optional()
    .isInt({
      gt: 0,
    })
    .withMessage("Order must be an integer"),
];

const validateManagementTeamUpdate = [
  check("name").optional().notEmpty().withMessage("Name cannot be empty"),
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("order")
    .optional()
    .isInt({
      gt: 0,
    })
    .withMessage("Order must be an integer"),
];

const validateDeptPartners = [
  check("name").notEmpty().withMessage("Name is required"),
  check("description").notEmpty().withMessage("description is required"),
  check("order")
    .optional()
    .isInt({
      gt: 0,
    })
    .withMessage("Order must be an integer"),
];

const validateDeptPartnersUpdate = [
  check("name").optional().notEmpty().withMessage("Name cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("order")
    .optional()
    .isInt({
      gt: 0,
    })
    .withMessage("Order must be an integer"),
];

const validateAboutStatsItem = [
  check("value").isInt({ min: 0 }).withMessage("Value must be a positive integer"),
  check("suffix").notEmpty().withMessage("Suffix is required"),
  check("description").notEmpty().withMessage("Description is required"),
];

const validateAboutStatsItemUpdate = [
  check("value").optional().isInt({ min: 0 }).withMessage("Value must be a positive integer"),
  check("suffix").optional().notEmpty().withMessage("Suffix is required"),
  check("description").optional().notEmpty().withMessage("Description is required"),
];

const validateAboutMessageFromTeam = [
  check("title").notEmpty().withMessage("Title is required"),
  check("short_title").notEmpty().withMessage("Short title is required"),
  check("description").notEmpty().withMessage("Description is required"),
  check("full_name").notEmpty().withMessage("Full name is required"),
  check("designation").notEmpty().withMessage("Designation is required"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
];

const validateAboutMessageFromTeamUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("short_title").optional().notEmpty().withMessage("Short title cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("full_name").optional().notEmpty().withMessage("Full name cannot be empty"),
  check("designation").optional().notEmpty().withMessage("Designation cannot be empty"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
];

const validateAboutPageContentUpdate = [
  check("super_title").optional().notEmpty().withMessage("Super title cannot be empty"),
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("sub_title").optional().notEmpty().withMessage("Sub title cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),

  check("investors_title").optional().notEmpty().withMessage("Investors title cannot be empty"),
  check("investors_sub_title").optional().notEmpty().withMessage("Investors sub title cannot be empty"),

  check("journey_title").optional().notEmpty().withMessage("Journey title cannot be empty"),
  check("journey_sub_title").optional().notEmpty().withMessage("Journey sub title cannot be empty"),
  check("journey_description").optional().notEmpty().withMessage("Journey description cannot be empty"),

  check("journey_year_title").optional().notEmpty().withMessage("Journey year title cannot be empty"),
  check("journey_year_sub_title").optional().notEmpty().withMessage("Journey year sub title cannot be empty"),
  check("journey_year_description").optional().notEmpty().withMessage("Journey year description cannot be empty"),

  check("life_at_indel_title").optional().notEmpty().withMessage("Life at indel title cannot be empty"),
  check("life_at_indel_sub_title").optional().notEmpty().withMessage("Life at indel sub title cannot be empty"),
  check("life_at_indel_description").optional().notEmpty().withMessage("Life at indel description cannot be empty"),
];

const validateAboutQuickLinks = [
  check("title").notEmpty().withMessage("Title is required"),
  check("description").notEmpty().withMessage("Description is required"),
  check("button_name").notEmpty().withMessage("Button name is required"),
  check("button_link").notEmpty().withMessage("Button link is required"),
  check("order").isInt().withMessage("Order must be an integer"),
];

const validateAboutQuickLinksUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("button_name").optional().notEmpty().withMessage("Button name cannot be empty"),
  check("button_link").optional().notEmpty().withMessage("Button link cannot be empty"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validateAboutBanner = [
  check("title").notEmpty().withMessage("Title is required"),
  check("super_title").notEmpty().withMessage("Super title is required"),
  check("order").isInt().withMessage("Order must be an integer"),
];

const validateAboutBannerUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("super_title").optional().notEmpty().withMessage("Super title cannot be empty"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validateHomeSmartDeals = [
  check("title").notEmpty().withMessage("Title is required"),
  check("order").isInt().withMessage("Order must be an integer"),
];

const validateHomeSmartDealsUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];
const validateRegister = [
  check("username").notEmpty().withMessage("Username is required").isLength({ min: 3 }).withMessage("Username must be at least 3 characters"),
  check("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format"),
  check("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  check("firstName").optional().isLength({ min: 1 }).withMessage("First name must not be empty if provided"),
  check("lastName").optional().isLength({ min: 1 }).withMessage("Last name must not be empty if provided"),
  check("phone").optional().isMobilePhone().withMessage("Invalid phone number format"),
];

const validateLogin = [
  check("identifier")
    .notEmpty()
    .withMessage("Username or email is required")
    .isLength({ min: 3 })
    .withMessage("Username or email must be at least 3 characters"),
  check("password").notEmpty().withMessage("Password is required").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  // Custom validation to check if identifier is valid email or username
  check().custom((value, { req }) => {
    const { identifier } = req.body;
    if (identifier && identifier.includes("@")) {
      // If it contains @, validate as email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        throw new Error("Invalid email format");
      }
    }
    return true;
  }),
];

const validatePasswordResetRequest = [check("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format")];

const validatePasswordReset = [
  check("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format"),
  check("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits")
    .isNumeric()
    .withMessage("OTP must contain only numbers"),
  check("newPassword").notEmpty().withMessage("New password is required").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const validateResendOtp = [check("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format")];

const validateCurrentUserProfile = [
  check("username").optional().isLength({ min: 3 }).withMessage("Username must be at least 3 characters if provided"),
  check("email").optional().isEmail().withMessage("Invalid email format if provided"),
  check("firstName").optional().isLength({ min: 1 }).withMessage("First name must not be empty if provided"),
  check("lastName").optional().isLength({ min: 1 }).withMessage("Last name must not be empty if provided"),
  check("phone").optional().isMobilePhone().withMessage("Invalid phone number format if provided"),
];

const validateCurrentUserPassword = [
  check("currentPassword").notEmpty().withMessage("Current password is required"),
  check("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
  check("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("New passwords do not match");
      }
      return true;
    }),
];

const validateHeroBanner = [
  check("title").optional({ checkFalsy: true }),
  check("button_text").optional({ checkFalsy: true }),
  check("button_link").optional({ checkFalsy: true }),
  // check("location").notEmpty().withMessage("Location is required"),
  check("image_alt_text").optional({ checkFalsy: true }),
  check("is_active").isBoolean().withMessage("Is active must be a boolean"),
  check("order").isInt().withMessage("Order must be an integer"),
];

const validateHeroBannerUpdate = [
  check("title").optional({ checkFalsy: true }),
  check("button_text").optional({ checkFalsy: true }),
  check("button_link").optional({ checkFalsy: true }),
  // check("location").optional().notEmpty().withMessage("Location cannot be empty"),
  check("image_alt_text").optional({ checkFalsy: true }),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validateHomeStatistics = [
  check("title").notEmpty().withMessage("Title is required"),
  check("value").notEmpty().withMessage("Value is required"),
  check("sort_order").isInt().withMessage("Sort order must be an integer"),
  check("status").isBoolean().withMessage("Status must be a boolean"),
  check("suffix").optional().isString().withMessage("Suffix must be a string"),
];

const validateHomeStatisticsUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("value").optional().notEmpty().withMessage("Value cannot be empty"),
  check("sort_order").optional().isInt().withMessage("Sort order must be an integer"),
  check("status").optional().isBoolean().withMessage("Status must be a boolean"),
  check("suffix").optional().isString().withMessage("Suffix must be a string"),
];

const validateHomePageContentUpdate = [
  check("gold_rate_label").optional().notEmpty().withMessage("Gold rate label cannot be empty"),
  check("announcement_text").optional().notEmpty().withMessage("Announcement text cannot be empty"),
  check("about_super_title").optional().notEmpty().withMessage("About super title cannot be empty"),
  check("about_title").optional().notEmpty().withMessage("About title cannot be empty"),
  check("about_sub_title").optional().notEmpty().withMessage("About sub title cannot be empty"),
  check("about_description").optional().notEmpty().withMessage("About description cannot be empty"),
  check("about_button_name").optional().notEmpty().withMessage("About button name cannot be empty"),
  // check("about_button_url").optional().notEmpty().withMessage("About button URL cannot be empty"),
  check("step_title").optional().notEmpty().withMessage("Step title cannot be empty"),
  check("life_section_title").optional().notEmpty().withMessage("Life section title cannot be empty"),
  check("life_section_description").optional().notEmpty().withMessage("Life section description cannot be empty"),
  check("life_section_button_name_1").optional().notEmpty().withMessage("Life section button name 1 cannot be empty"),
  check("life_section_button_link_1").optional().notEmpty().withMessage("Life section button link 1 cannot be empty"),
  check("life_section_button_name_2").optional().notEmpty().withMessage("Life section button name 2 cannot be empty"),
  check("life_section_button_link_2").optional().notEmpty().withMessage("Life section button link 2 cannot be empty"),
  check("updates_section_title").optional().notEmpty().withMessage("Updates section title cannot be empty"),
  check("investment_title").optional().notEmpty().withMessage("Investment title cannot be empty"),
  check("investment_description").optional().notEmpty().withMessage("Investment description cannot be empty"),
  check("investment_button_name").optional().notEmpty().withMessage("Investment button name cannot be empty"),
  check("investment_button_link").optional().notEmpty().withMessage("Investment button link cannot be empty"),
  check("features_title").optional().notEmpty().withMessage("Features title cannot be empty"),
  check("features_sub_title").optional().notEmpty().withMessage("Features sub title cannot be empty"),
  check("features_description").optional().notEmpty().withMessage("Features description cannot be empty"),
  check("ios_download_link").optional().notEmpty().withMessage("iOS download link cannot be empty"),
  check("android_download_link").optional().notEmpty().withMessage("Android download link cannot be empty"),
  check("faq_section_title").optional().notEmpty().withMessage("FAQ section title cannot be empty"),
  check("faq_section_super_title").optional().notEmpty().withMessage("FAQ section super title cannot be empty"),
];

const validateHomeLoanStep = [
  check("title").notEmpty().withMessage("Title is required"),
  check("description").notEmpty().withMessage("Description is required"),
  check("order").isInt().withMessage("Order must be an integer"),
];

const validateHomeLoanStepUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validateFaq = [
  check("question").notEmpty().withMessage("Question is required"),
  check("answer").notEmpty().withMessage("Answer is required"),
  check("order").isInt().withMessage("Order must be an integer"),
];

const validateFaqUpdate = [
  check("question").optional().notEmpty().withMessage("Question cannot be empty"),
  check("answer").optional().notEmpty().withMessage("Answer cannot be empty"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];
const validateMngmtTeamContentItemUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
];

const validateDeptPartnersContent = [
  check("title").notEmpty().withMessage("Title is required"),
  check("super_title").notEmpty().withMessage("Super title is required"),
];

const validateDeptPartnersContentUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("super_title").optional().notEmpty().withMessage("Super title cannot be empty"),
];

const validateContactContent = [
  check("title").notEmpty().withMessage("Title is required"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("help_title").optional().notEmpty().withMessage("Help title cannot be empty"),
  check("toll_free_number").optional().notEmpty().withMessage("Toll free number cannot be empty"),
  check("form_title").optional().notEmpty().withMessage("Form title cannot be empty"),
  check("form_sub_title").optional().notEmpty().withMessage("Form sub-title cannot be empty"),
  check("branch_locator_title").optional().notEmpty().withMessage("Branch locator title cannot be empty"),
  check("branch_locator_description").optional().notEmpty().withMessage("Branch locator description cannot be empty"),
  check("faq_super_title").optional().notEmpty().withMessage("FAQ super title cannot be empty"),
  check("faq_title").optional().notEmpty().withMessage("FAQ title cannot be empty"),
];

const validateContactContentUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("help_title").optional().notEmpty().withMessage("Help title cannot be empty"),
  check("toll_free_number").optional().notEmpty().withMessage("Toll free number cannot be empty"),
  check("form_title").optional().notEmpty().withMessage("Form title cannot be empty"),
  check("form_sub_title").optional().notEmpty().withMessage("Form sub-title cannot be empty"),
  check("faq_super_title").optional().notEmpty().withMessage("FAQ super title cannot be empty"),
  check("faq_title").optional().notEmpty().withMessage("FAQ title cannot be empty"),
];

const validateContactOffices = [
  check("office_name").notEmpty().withMessage("Office name is required"),
  check("address").notEmpty().withMessage("Address is required"),
  check("phone").notEmpty().withMessage("Phone is required"),
  check("email").notEmpty().withMessage("Email is required"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validateContactOfficesUpdate = [
  check("office_name").optional().notEmpty().withMessage("Office name cannot be empty"),
  check("address").optional().notEmpty().withMessage("Address cannot be empty"),
  check("phone").optional().notEmpty().withMessage("Phone cannot be empty"),
  check("email").optional().notEmpty().withMessage("Email cannot be empty"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validateAboutAccolades = [
  check("title").notEmpty().withMessage("Title is required"),
  check("bold_text").notEmpty().withMessage("Bold text is required"),
  check("description").notEmpty().withMessage("Description is required"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validateAboutAccoladesUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("bold_text").optional().notEmpty().withMessage("Bold text cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validateHistoryPageContent = [
  check("page_title").notEmpty().withMessage("Page title is required"),
  check("history_title").optional().notEmpty().withMessage("History title cannot be empty"),
  check("history_description").optional().notEmpty().withMessage("History description cannot be empty"),
  check("inception_title").optional().notEmpty().withMessage("Inception title cannot be empty"),
];

const validateHistoryPageContentUpdate = [
  check("page_title").optional().notEmpty().withMessage("Page title cannot be empty"),
  check("history_title").optional().notEmpty().withMessage("History title cannot be empty"),
  check("history_description").optional().notEmpty().withMessage("History description cannot be empty"),
  check("inception_title").optional().notEmpty().withMessage("Inception title cannot be empty"),
];

const validateHistoryImages = [
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
  check("order").isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
];

const validateHistoryImagesUpdate = [
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
  check("order").optional().isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
];

const validateHistoryInceptionsYears = [
  check("year").notEmpty().withMessage("Year cannot be empty"),
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("description").notEmpty().withMessage("Description cannot be empty"),
  check("is_active").isBoolean().withMessage("Is active must be a boolean"),
];

const validateHistoryInceptionsYearsUpdate = [
  check("year").optional().notEmpty().withMessage("Year cannot be empty"),
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
];

const validateIndelValue = [
  check("title").notEmpty().withMessage("Title is required"),
  check("description").notEmpty().withMessage("Description is required"),
  check("order").isInt().withMessage("Order must be an integer"),
  check("is_active").isBoolean().withMessage("Is active must be a boolean"),
];

const validateIndelValueUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
];

const validateServices = [
  check("title").notEmpty().withMessage("Title is required"),
  check("description").notEmpty().withMessage("Description is required"),
  check("order").isInt().withMessage("Order must be an integer"),
  check("is_active").isBoolean().withMessage("Is active must be a boolean"),
  check("slug").notEmpty().withMessage("Slug is required"),
];

const validateServiceUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
  check("slug").optional().notEmpty().withMessage("Slug cannot be empty"),
];
const validateDifferentShadesValue = [
  check("title").notEmpty().withMessage("Title is required"),
  check("paragraph_1").notEmpty().withMessage("Paragraph 1 is required"),
  check("paragraph_2").notEmpty().withMessage("Paragraph 2 is required"),
  check("sort_order").isInt().withMessage("Sort order must be an integer"),
];

const validateDifferentShadesValueUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("paragraph_1").optional().notEmpty().withMessage("Paragraph 1 cannot be empty"),
  check("paragraph_2").optional().notEmpty().withMessage("Paragraph 2 cannot be empty"),
  check("sort_order").optional().isInt().withMessage("Sort order must be an integer"),
];

const validateServicesPageContentUpdate = [
  check("page_super_title").optional().notEmpty().withMessage("Page Super Title cannot be empty"),
  check("page_title").optional().notEmpty().withMessage("Page Title cannot be empty"),
  check("deals_title").optional().notEmpty().withMessage("Deals Title cannot be empty"),
  check("deals_description").optional().notEmpty().withMessage("Deals Description cannot be empty"),
  check("remit_section_title").optional().notEmpty().withMessage("Remit Section Title cannot be empty"),
  check("remit_section_description").optional().notEmpty().withMessage("Remit Section Description cannot be empty"),
  check("remit_section_button_title").optional().notEmpty().withMessage("Remit Section Button Title cannot be empty"),
  // check("remit_section_button_link").optional().isURL().withMessage("Remit Section Button Link must be a valid URL"),
];

const validateServiceBenefits = [
  check("title").notEmpty().withMessage("Title is required"),
  check("service_id").notEmpty().withMessage("Service is required"),
  check("order").isInt().withMessage("Order must be an integer"),
];

const validateServiceBenefitsUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("service_id").optional().notEmpty().withMessage("Service cannot be empty"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validateGoldLoanContentUpdate = [
  check("meta_title").optional().notEmpty().withMessage("Meta Title cannot be empty"),
  check("meta_description").optional().notEmpty().withMessage("Meta Description cannot be empty"),
  check("meta_keywords").optional().notEmpty().withMessage("Meta Keywords cannot be empty"),
  check("page_title").optional().notEmpty().withMessage("Page Title cannot be empty"),
  check("gold_rate_text").optional().notEmpty().withMessage("Gold Rate Text cannot be empty"),
  check("announcement_text").optional().notEmpty().withMessage("Announcement Text cannot be empty"),
  check("gold_loan_step_title").optional().notEmpty().withMessage("Gold Loan Step Title cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("identity_proof_title").optional().notEmpty().withMessage("Identity Proof Title cannot be empty"),
  check("identity_proof_description").optional().notEmpty().withMessage("Identity Proof Description cannot be empty"),
  check("address_proof").optional().notEmpty().withMessage("Address Proof cannot be empty"),
  check("address_proof_description").optional().notEmpty().withMessage("Address Proof Description cannot be empty"),
  check("gold_loan_title").optional().notEmpty().withMessage("Gold Loan Title cannot be empty"),
  check("gold_loan_description").optional().notEmpty().withMessage("Gold Loan Description cannot be empty"),
  check("scheme_title").optional().notEmpty().withMessage("Scheme Title cannot be empty"),
  check("faq_title").optional().notEmpty().withMessage("FAQ Title cannot be empty"),
];

const validateGoldLoanScheme = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validateGoldLoanSchemeUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validateSchemeDetails = [
  check("title").notEmpty().withMessage("Title is required"),
  check("value").notEmpty().withMessage("Value is required"),
  check("scheme_id").notEmpty().withMessage("Service is required"),
  check("order").isInt().withMessage("Order must be an integer"),
];

const validateSchemeDetailsUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("value").optional().notEmpty().withMessage("Value cannot be empty"),
  check("scheme_id").optional().notEmpty().withMessage("Service cannot be empty"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validateGoldLoanFeature = [
  check("title").notEmpty().withMessage("Title is required"),
  check("description").notEmpty().withMessage("Description is required"),
  check("order").isInt().withMessage("Order must be an integer"),
];

const validateGoldLoanFeatureUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validateMsmeLoanContent = [
  check("meta_title").notEmpty().withMessage("Meta title is required"),

  check("meta_description").notEmpty().withMessage("Meta description is required"),

  check("meta_keywords").notEmpty().withMessage("Meta keywords are required"),

  check("title").notEmpty().withMessage("Title is required"),

  check("sub_title").notEmpty().withMessage("Sub-title is required"),

  check("description").notEmpty().withMessage("Description is required"),

  check("button_text").notEmpty().withMessage("Button text is required"),

  check("button_url").notEmpty().withMessage("Button URL is required"),

  check("our_offering_title").notEmpty().withMessage("Our offering title is required"),

  check("our_offering_description").notEmpty().withMessage("Our offering description is required"),

  check("why_msme_loan_title").notEmpty().withMessage("Why MSME loan title is required"),

  check("why_msme_loan_description").notEmpty().withMessage("Why MSME loan description is required"),

  check("who_do_serve_title").notEmpty().withMessage("Who do serve title is required"),

  check("about_msme_title").notEmpty().withMessage("About MSME title is required"),

  check("about_msme_description").notEmpty().withMessage("About MSME description is required"),

  check("msme_loan_overview_title").notEmpty().withMessage("MSME loan overview title is required"),

  check("msme_loan_overview_description").notEmpty().withMessage("MSME loan overview description is required"),
];

const validateMsmeLoanContentUpdate = [
  check("meta_title").optional().notEmpty().withMessage("Meta title cannot be empty"),

  check("meta_description").optional().notEmpty().withMessage("Meta description cannot be empty"),

  check("meta_keywords").optional().notEmpty().withMessage("Meta keywords cannot be empty"),

  check("title").optional().notEmpty().withMessage("Title cannot be empty"),

  check("sub_title").optional().notEmpty().withMessage("Sub-title cannot be empty"),

  check("description").optional().notEmpty().withMessage("Description cannot be empty"),

  check("button_text").optional().notEmpty().withMessage("Button text cannot be empty"),

  check("button_url").optional().notEmpty().withMessage("Button URL cannot be empty"),

  check("our_offering_title").optional().notEmpty().withMessage("Our offering title cannot be empty"),

  check("our_offering_description").optional().notEmpty().withMessage("Our offering description cannot be empty"),

  check("why_msme_loan_title").optional().notEmpty().withMessage("Why MSME loan title cannot be empty"),

  check("why_msme_loan_description").optional().notEmpty().withMessage("Why MSME loan description cannot be empty"),

  check("who_do_serve_title").optional().notEmpty().withMessage("Who do serve title cannot be empty"),

  check("about_msme_title").optional().notEmpty().withMessage("About MSME title cannot be empty"),

  check("about_msme_description").optional().notEmpty().withMessage("About MSME description cannot be empty"),

  check("msme_loan_overview_title").optional().notEmpty().withMessage("MSME loan overview title cannot be empty"),

  check("msme_loan_overview_description").optional().notEmpty().withMessage("MSME loan overview description cannot be empty"),
];

const validateMsmeOfferings = [
  check("title").notEmpty().withMessage("Title is required"),
  check("order").isInt().withMessage("Order must be an integer"),
  check("is_active").isBoolean().withMessage("Is active must be a boolean"),
];

const validateMsmeOfferingsUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
];

const validateMsmeTargetedAudienceUpdate = [
  check("title").optional().notEmpty().withMessage("Title is required"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
];

const validateMsmeTargetedAudience = [
  check("title").notEmpty().withMessage("Title is required"),
  check("description").notEmpty().withMessage("Description cannot be empty"),
  check("order").isInt().withMessage("Order must be an integer"),
  check("is_active").isBoolean().withMessage("Is active must be a boolean"),
];

const validateMsmeLoanSupportedIndustriesUpdate = [
  check("title").optional().notEmpty().withMessage("Title is required"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
];

const validateMsmeLoanSupportedIndustries = [
  check("title").notEmpty().withMessage("Title is required"),
  check("description").notEmpty().withMessage("Description cannot be empty"),
  check("order").isInt().withMessage("Order must be an integer"),
  check("is_active").isBoolean().withMessage("Is active must be a boolean"),
];

const validateLoanAgainstPropertyContent = [
  check("meta_title").notEmpty().withMessage("Meta title is required"),
  check("meta_description").notEmpty().withMessage("Meta description is required"),
  check("meta_keywords").notEmpty().withMessage("Meta keywords are required"),
  check("title").notEmpty().withMessage("Title is required"),
  check("sub_title").notEmpty().withMessage("Sub-title is required"),
  check("description").notEmpty().withMessage("Description is required"),
  check("button_text").notEmpty().withMessage("Button text is required"),
  check("button_url").notEmpty().withMessage("Button URL is required"),
  check("our_offering_title").notEmpty().withMessage("Our offering title is required"),
  check("our_offering_description").notEmpty().withMessage("Our offering description is required"),
  check("why_loan_against_property_title").notEmpty().withMessage("Why Loan Against Property title is required"),
  check("why_loan_against_property_description").notEmpty().withMessage("Why Loan Against Property description is required"),
  check("who_do_serve_title").notEmpty().withMessage("Who do serve title is required"),
  check("about_loan_against_property_title").notEmpty().withMessage("About Loan Against Property title is required"),
  check("about_loan_against_property_description").notEmpty().withMessage("About Loan Against Property description is required"),
  check("loan_against_property_overview_title").notEmpty().withMessage("Loan Against Property overview title is required"),
  check("loan_against_property_overview_description").notEmpty().withMessage("Loan Against Property overview description is required"),
];

const validateLoanAgainstPropertyContentUpdate = [
  check("meta_title").optional().notEmpty().withMessage("Meta title cannot be empty"),
  check("meta_description").optional().notEmpty().withMessage("Meta description cannot be empty"),
  check("meta_keywords").optional().notEmpty().withMessage("Meta keywords cannot be empty"),
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("sub_title").optional().notEmpty().withMessage("Sub-title cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("button_text").optional().notEmpty().withMessage("Button text cannot be empty"),
  check("button_url").optional().notEmpty().withMessage("Button URL cannot be empty"),
  check("our_offering_title").optional().notEmpty().withMessage("Our offering title cannot be empty"),
  check("our_offering_description").optional().notEmpty().withMessage("Our offering description cannot be empty"),
  check("why_loan_against_property_title").optional().notEmpty().withMessage("Why Loan Against Property title cannot be empty"),
  check("why_loan_against_property_description").optional().notEmpty().withMessage("Why Loan Against Property description cannot be empty"),
  check("who_do_serve_title").optional().notEmpty().withMessage("Who do serve title cannot be empty"),
  check("about_loan_against_property_title").optional().notEmpty().withMessage("About Loan Against Property title cannot be empty"),
  check("about_loan_against_property_description").optional().notEmpty().withMessage("About Loan Against Property description cannot be empty"),
  check("loan_against_property_overview_title").optional().notEmpty().withMessage("Loan Against Property overview title cannot be empty"),
  check("loan_against_property_overview_description").optional().notEmpty().withMessage("Loan Against Property overview description cannot be empty"),
];

const validateCdLoanContentUpdate = [
  check("meta_title").optional().notEmpty().withMessage("Meta Title cannot be empty"),
  check("meta_description").optional().notEmpty().withMessage("Meta Description cannot be empty"),
  check("meta_keywords").optional().notEmpty().withMessage("Meta Keywords cannot be empty"),
  check("page_title").optional().notEmpty().withMessage("Page Title cannot be empty"),
  check("loan_offer_title").optional().notEmpty().withMessage("Loan Offer Title cannot be empty"),
  check("loan_offer_description").optional().notEmpty().withMessage("Loan Offer Description cannot be empty"),
  check("loan_offer_button_text").optional().notEmpty().withMessage("Loan Offer Button Text cannot be empty"),
  // check("loan_offer_button_link").optional().isURL().withMessage("Loan Offer Button Link must be a valid URL"),
  check("covered_products_section_title").optional().notEmpty().withMessage("Covered Products Section Title cannot be empty"),
  check("eligibility_criteria_title").optional().notEmpty().withMessage("Eligibility Criteria Title cannot be empty"),
  check("eligibility_criteria_description").optional().notEmpty().withMessage("Eligibility Criteria Description cannot be empty"),
  check("eligibility_criteria_note").optional().notEmpty().withMessage("Eligibility Criteria Note cannot be empty"),
  check("feature_title").optional().notEmpty().withMessage("Feature Title cannot be empty"),
];

const validateCdLoanProductsUpdate = [
  check("title").optional().notEmpty().withMessage("Title is required"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
];

const validateCdLoanProducts = [
  check("title").notEmpty().withMessage("Title is required"),
  check("order").isInt().withMessage("Order must be an integer"),
  check("is_active").isBoolean().withMessage("Is active must be a boolean"),
];

const validateCareerContentsUpdate = [
  check("meta_title").optional().notEmpty().withMessage("Meta Title cannot be empty"),
  check("meta_description").optional().notEmpty().withMessage("Meta Description cannot be empty"),
  check("meta_keywords").optional().notEmpty().withMessage("Meta Keywords cannot be empty"),
  check("page_title").optional().notEmpty().withMessage("Page Title cannot be empty"),
  check("find_job_title").optional().notEmpty().withMessage("Find Job Title cannot be empty"),
  check("find_job_button_name").optional().notEmpty().withMessage("Find Job Button Name cannot be empty"),
  // check("find_job_button_link").optional().isURL().withMessage("Find Job Button Link must be a valid URL"),
  check("make_your_move_title").optional().notEmpty().withMessage("Make Your Move Title cannot be empty"),
  check("make_your_move_description").optional().notEmpty().withMessage("Make Your Move Description cannot be empty"),
  check("make_your_move_").optional().notEmpty().withMessage("Make Your Move cannot be empty"),
  check("gallery_title").optional().notEmpty().withMessage("Gallery Title cannot be empty"),
  check("gallery_sub_title").optional().notEmpty().withMessage("Gallery Sub Title cannot be empty"),
  check("gallery_description").optional().notEmpty().withMessage("Gallery Description cannot be empty"),
  check("gallery_button_text").optional().notEmpty().withMessage("Gallery Button Text cannot be empty"),
  // check("gallery_button_link").optional().isURL().withMessage("Gallery Button Link must be a valid URL"),
  check("benefits_title").optional().notEmpty().withMessage("Benefits Title cannot be empty"),
  check("awards_title").optional().notEmpty().withMessage("Awards Title cannot be empty"),
  check("testimonial_title").optional().notEmpty().withMessage("Testimonial Title cannot be empty"),
  check("testimonial_description").optional().notEmpty().withMessage("Testimonial Description cannot be empty"),
  check("testimonial_button_name").optional().notEmpty().withMessage("Testimonial Button Name cannot be empty"),
  // check("testimonial_button_link").optional().isURL().withMessage("Testimonial Button Link must be a valid URL"),
];

const validateCareerBannersUpdate = [
  check("title").optional().notEmpty().withMessage("Title is required"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validateCareerBanners = [
  check("title").notEmpty().withMessage("Title is required"),
  check("order").isInt().withMessage("Order must be an integer"),
];

const validateCareerStatesUpdate = [
  check("state_name").optional().notEmpty().withMessage("State Name is required"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
];

const validateCareerStates = [
  check("state_name").notEmpty().withMessage("State Name is required"),
  check("order").isInt().withMessage("Order must be an integer"),
  check("is_active").isBoolean().withMessage("Is active must be a boolean"),
];

const validateCareerLocationsUpdate = [
  check("location_name").optional().notEmpty().withMessage("Location Name is required"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
];

const validateCareerLocations = [
  check("location_name").notEmpty().withMessage("Location Name is required"),
  // check("state_id").isInt().withMessage("State ID must be an integer"),
  check("district_id").isInt().withMessage("District ID must be an integer"),
  check("order").isInt().withMessage("Order must be an integer"),
  check("is_active").isBoolean().withMessage("Is active must be a boolean"),
];

const validateCareerRolesUpdate = [
  check("role_name").optional().notEmpty().withMessage("Role Name is required"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
];

const validateCareerRoles = [
  check("role_name").notEmpty().withMessage("Role Name is required"),
  check("order").isInt().withMessage("Order must be an integer"),
  check("is_active").isBoolean().withMessage("Is active must be a boolean"),
];

// const validateJobsUpdate = [
//   // check("location_id").optional().isInt({ min: 1 }).withMessage("Location ID must be a positive integer"),
//   // check("state_id").optional().isInt({ min: 1 }).withMessage("State ID must be a positive integer"),
//   check("location_ids")
//     .optional()
//     .isArray({ min: 1 })
//     .withMessage("Location IDs must be an array with at least one element")
//     .custom((value) => value.every((id) => Number.isInteger(id)))
//     .withMessage("Each location ID must be an integer"),
//   check("state_ids")
//     .optional()
//     .isArray({ min: 1 })
//     .withMessage("State IDs must be an array with at least one element")
//     .custom((value) => value.every((id) => Number.isInteger(id)))
//     .withMessage("Each state ID must be an integer"),
//   check("job_title").optional().trim().isLength({ max: 255 }).withMessage("Job title must not exceed 255 characters"),
//   check("job_description").optional().trim().notEmpty().withMessage("Job description cannot be empty if provided"),
//   check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
//   check("end_date").optional().isISO8601().withMessage("End date must be a valid ISO 8601 date (e.g., YYYY-MM-DD)"),
//   check("order").optional().isInt({ min: 0 }).withMessage("Order must be a non-negative integer"),
// ];

// const validateJobs = [
//   // check("location_id").exists().isInt({ min: 1 }).withMessage("Location ID is required and must be a positive integer"),
//   check("location_ids")
//     .isArray({ min: 1 })
//     .withMessage("At least one location ID is required")
//     .custom((value) => value.every((id) => Number.isInteger(id)))
//     .withMessage("Each location ID must be an integer"),
//   check("state_ids")
//     .isArray({ min: 1 })
//     .withMessage("At least one state ID is required")
//     .custom((value) => value.every((id) => Number.isInteger(id)))
//     .withMessage("Each state ID must be an integer"),
//   // check("state_id").exists().isInt({ min: 1 }).withMessage("State ID is required and must be a positive integer"),
//   check("job_title").optional().trim().isLength({ max: 255 }).withMessage("Job title must not exceed 255 characters"),
//   check("job_description").exists().trim().notEmpty().withMessage("Job description is required and cannot be empty"),
//   check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
//   check("end_date").optional().isISO8601().withMessage("End date must be a valid ISO 8601 date (e.g., YYYY-MM-DD)"),
//   check("order").optional().isInt({ min: 0 }).withMessage("Order must be a non-negative integer"),
// ];

const validateJobsUpdate = [
  // Pan India field validation
  check("is_pan_india").optional().isBoolean().withMessage("is_pan_india must be a boolean"),

  // Location IDs validation with Pan India logic
  check("location_ids")
    .optional()
    .custom((value, { req }) => {
      const isPanIndia = req.body.is_pan_india;

      if (isPanIndia === true) {
        // For Pan India jobs, location_ids should not be provided or should be empty
        if (value && value.length > 0) {
          throw new Error("Location IDs should not be provided for Pan India jobs");
        }
      } else if (isPanIndia === false) {
        // For location-specific jobs, location_ids are required if provided
        if (value !== undefined) {
          if (!Array.isArray(value) || value.length === 0) {
            throw new Error("At least one location ID is required for location-specific jobs");
          }
          // Check if all IDs are valid integers
          if (!value.every((id) => Number.isInteger(id) && id > 0)) {
            throw new Error("Each location ID must be a positive integer");
          }
        }
      }

      return true;
    })
    .withMessage("Invalid location IDs configuration"),

  // State IDs validation with Pan India logic
  check("state_ids")
    .optional()
    .custom((value, { req }) => {
      const isPanIndia = req.body.is_pan_india;

      if (isPanIndia === true) {
        // For Pan India jobs, state_ids should not be provided or should be empty
        if (value && value.length > 0) {
          throw new Error("State IDs should not be provided for Pan India jobs");
        }
      } else if (isPanIndia === false) {
        // For location-specific jobs, state_ids are required if provided
        if (value !== undefined) {
          if (!Array.isArray(value) || value.length === 0) {
            throw new Error("At least one state ID is required for location-specific jobs");
          }
          // Check if all IDs are valid integers
          if (!value.every((id) => Number.isInteger(id) && id > 0)) {
            throw new Error("Each state ID must be a positive integer");
          }
        }
      }

      return true;
    })
    .withMessage("Invalid state IDs configuration"),

  check("role_id").optional().isInt({ min: 1 }).withMessage("Role ID must be a positive integer"),

  check("job_title").optional().trim().isLength({ min: 1, max: 255 }).withMessage("Job title must be between 1 and 255 characters"),

  check("job_description").optional().trim().notEmpty().withMessage("Job description cannot be empty if provided"),

  check("experience").optional().trim().isLength({ min: 1, max: 100 }).withMessage("Experience must be between 1 and 100 characters"),

  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),

  check("is_approved").optional().isBoolean().withMessage("is_approved must be a boolean"),

  check("is_display_full_locations").optional().isBoolean().withMessage("is_display_full_locations must be a boolean"),

  check("end_date").optional().isISO8601().withMessage("End date must be a valid ISO 8601 date (e.g., YYYY-MM-DD)"),

  check("order").optional().isInt({ min: 0 }).withMessage("Order must be a non-negative integer"),

  check("reapply_period_months").optional().isInt({ min: 1 }).withMessage("Reapply period must be at least 1 month"),
];

const validateJobs = [
  // Pan India field validation (optional for create, defaults to false)
  check("is_pan_india").optional().isBoolean().withMessage("is_pan_india must be a boolean"),

  // Role ID is required
  check("role_id").exists().withMessage("Role ID is required").isInt({ min: 1 }).withMessage("Role ID must be a positive integer"),

  // Job title is required
  check("job_title")
    .exists()
    .withMessage("Job title is required")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Job title must be between 1 and 255 characters"),

  // Job description is required
  check("job_description").exists().withMessage("Job description is required").trim().notEmpty().withMessage("Job description cannot be empty"),

  // Experience is required
  check("experience")
    .exists()
    .withMessage("Experience is required")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Experience must be between 1 and 100 characters"),

  // Location IDs validation with Pan India logic
  check("location_ids")
    .custom((value, { req }) => {
      const isPanIndia = req.body.is_pan_india;

      if (isPanIndia === true) {
        // For Pan India jobs, location_ids should not be provided or should be empty
        if (value && value.length > 0) {
          throw new Error("Location IDs should not be provided for Pan India jobs");
        }
      } else {
        // For location-specific jobs (default behavior), location_ids are required
        if (!value || !Array.isArray(value) || value.length === 0) {
          throw new Error("At least one location ID is required for location-specific jobs");
        }
        // Check if all IDs are valid integers
        if (!value.every((id) => Number.isInteger(id) && id > 0)) {
          throw new Error("Each location ID must be a positive integer");
        }
      }

      return true;
    })
    .withMessage("Invalid location IDs configuration"),

  // State IDs validation with Pan India logic
  check("state_ids")
    .custom((value, { req }) => {
      const isPanIndia = req.body.is_pan_india;

      if (isPanIndia === true) {
        // For Pan India jobs, state_ids should not be provided or should be empty
        if (value && value.length > 0) {
          throw new Error("State IDs should not be provided for Pan India jobs");
        }
      } else {
        // For location-specific jobs (default behavior), state_ids are required
        if (!value || !Array.isArray(value) || value.length === 0) {
          throw new Error("At least one state ID is required for location-specific jobs");
        }
        // Check if all IDs are valid integers
        if (!value.every((id) => Number.isInteger(id) && id > 0)) {
          throw new Error("Each state ID must be a positive integer");
        }
      }

      return true;
    })
    .withMessage("Invalid state IDs configuration"),

  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),

  check("is_approved").optional().isBoolean().withMessage("is_approved must be a boolean"),

  check("is_display_full_locations").optional().isBoolean().withMessage("is_display_full_locations must be a boolean"),

  check("end_date").optional().isISO8601().withMessage("End date must be a valid ISO 8601 date (e.g., YYYY-MM-DD)"),

  check("order").optional().isInt({ min: 0 }).withMessage("Order must be a non-negative integer"),

  check("reapply_period_months").optional().isInt({ min: 1 }).withMessage("Reapply period must be at least 1 month"),
];

const validateBlogPageContentUpdate = [
  check("meta_title").optional().notEmpty().withMessage("Meta Title cannot be empty"),
  check("meta_description").optional().notEmpty().withMessage("Meta Description cannot be empty"),
  check("meta_keywords").optional().notEmpty().withMessage("Meta Keywords cannot be empty"),
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("slider_title").optional().notEmpty().withMessage("Slider Title cannot be empty"),
  check("slider_button_text").optional().notEmpty().withMessage("Slider Button Text cannot be empty"),
  // check("slider_button_link").optional().isURL().withMessage("Slider Button Link must be a valid URL"),
  check("all_blogs_title").optional().notEmpty().withMessage("All Blogs Title cannot be empty"),
];

const validateBlogsUpdate = [
  check("meta_title").optional(),
  check("meta_description").optional(),
  check("meta_keywords").optional(),
  check("other_meta_tags").optional(),
  check("title").optional().notEmpty().withMessage("Title is required"),
  check("image_description").optional().notEmpty().withMessage("Image Description cannot be empty"),
  check("image_alt").optional().notEmpty().withMessage("Image Alt cannot be empty"),
  check("second_image_description").optional(),
  // check("second_image_alt").optional().notEmpty().withMessage("Second Image Alt cannot be empty"),
  check("is_active").optional().notEmpty().withMessage("Is active is required"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
  check("posted_on").optional().notEmpty().withMessage("Posted On cannot be empty"),
];

const validateBlogs = [
  check("meta_title").optional(),
  check("meta_description").optional(),
  check("meta_keywords").optional(),
  check("other_meta_tags").optional(),
  check("title").notEmpty().withMessage("Title is required"),
  check("slug").optional(),
  check("image_description").notEmpty().withMessage("Image Description cannot be empty"),
  check("image_alt").optional().notEmpty().withMessage("Image Alt cannot be empty"),
  check("second_image_description").optional(),
  // check("second_image_alt").optional().notEmpty().withMessage("Second Image Alt cannot be empty"),
  check("is_active").notEmpty().withMessage("Is active is required"),
  check("order").isInt().withMessage("Order must be an integer"),
  check("posted_on").optional().notEmpty().withMessage("Posted On cannot be empty"),
];

const validateCSRPageContentUpdate = [
  check("meta_title").optional().notEmpty().withMessage("Meta Title cannot be empty"),
  check("meta_description").optional().notEmpty().withMessage("Meta Description cannot be empty"),
  check("meta_keywords").optional().notEmpty().withMessage("Meta Keywords cannot be empty"),
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("slider_title").optional().notEmpty().withMessage("Slider Title cannot be empty"),
  check("slider_button_text").optional().notEmpty().withMessage("Slider Button Text cannot be empty"),
  // check("slider_button_link").optional().isURL().withMessage("Slider Button Link must be a valid URL"),
  check("all_csr_title").optional().notEmpty().withMessage("All CSR Title cannot be empty"),
];

const validateGalleryPageContentItemUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("meta_title").optional().notEmpty().withMessage("Meta title cannot be empty"),
  check("meta_description").optional().notEmpty().withMessage("Meta description cannot be empty"),
  check("meta_keywords").optional().notEmpty().withMessage("Meta keywords cannot be empty"),
];

const validateEventType = [
  check("title").notEmpty().withMessage("Title is required"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("order").notEmpty().isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_slider").optional().isBoolean().withMessage("is_slider must be a boolean"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateEventTypeUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("order").optional().isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_slider").optional().isBoolean().withMessage("is_slider must be a boolean"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateEventGallery = [
  check("order").notEmpty().isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_video").optional().isBoolean().withMessage("is_video must be a boolean"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
  check("event_type_id")
    .notEmpty()
    .isInt({ gt: 0 })
    .withMessage("Event Type ID must be a positive integer")
    .custom(async (value) => {
      const eventType = await EventTypes.findByPk(value);
      if (!eventType) {
        throw new Error("Event Type ID does not exist");
      }
      return true;
    }),
];

const validateEventGalleryUpdate = [
  check("order").optional().isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_video").optional().isBoolean().withMessage("is_video must be a boolean"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
  check("event_type_id")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("Event Type ID must be a positive integer")
    .custom(async (value) => {
      if (value) {
        const eventType = await EventTypes.findByPk(value);
        if (!eventType) {
          throw new Error("Event Type ID does not exist");
        }
      }
      return true;
    }),
];

const validateAwardPageContentItemUpdate = [
  check("meta_title").optional().notEmpty().withMessage("Meta title cannot be empty"),
  check("meta_description").optional().notEmpty().withMessage("Meta description cannot be empty"),
  check("meta_keywords").optional().notEmpty().withMessage("Meta keywords cannot be empty"),
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("all_awards_title").optional().notEmpty().withMessage("All awards title cannot be empty"),
];

const validateAward = [
  check("title").notEmpty().withMessage("Title is required"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("year")
    .notEmpty()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage(`Year must be between 1900 and ${new Date().getFullYear()}`),
  check("is_slide").optional().isBoolean().withMessage("is_slide must be a boolean"),
];

const validateAwardUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("year")
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage(`Year must be between 1900 and ${new Date().getFullYear()}`),
  check("is_slide").optional().isBoolean().withMessage("is_slide must be a boolean"),
];

const validateNewsPageContentItemUpdate = [
  check("meta_title").optional().notEmpty().withMessage("Meta title cannot be empty"),
  check("meta_description").optional().notEmpty().withMessage("Meta description cannot be empty"),
  check("meta_keywords").optional().notEmpty().withMessage("Meta keywords cannot be empty"),
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("slider_title").optional().notEmpty().withMessage("Slider title cannot be empty"),
  check("slider_button_text").optional().notEmpty().withMessage("Slider button text cannot be empty"),
  check("slider_button_link").optional().notEmpty().withMessage("Slider button link cannot be empty"),
  check("all_news_title").optional().notEmpty().withMessage("All news title cannot be empty"),
];

const validateNews = [
  check("title").notEmpty().withMessage("Title is required"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("order").notEmpty().isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateNewsUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("order").optional().isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateEventPageContentItemUpdate = [
  check("meta_title").optional().notEmpty().withMessage("Meta title cannot be empty"),
  check("meta_description").optional().notEmpty().withMessage("Meta description cannot be empty"),
  check("meta_keywords").optional().notEmpty().withMessage("Meta keywords cannot be empty"),
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("slider_title").optional().notEmpty().withMessage("Slider title cannot be empty"),
  check("slider_button_text").optional().notEmpty().withMessage("Slider button text cannot be empty"),
  check("slider_button_link").optional().notEmpty().withMessage("Slider button link cannot be empty"),
  check("all_events_title").optional().notEmpty().withMessage("All events title cannot be empty"),
];

const validateEvent = [
  check("title").notEmpty().withMessage("Title is required"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("image_alt").optional().notEmpty().withMessage("Image alt text cannot be empty"),
  check("order").notEmpty().isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateEventUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("image_alt").optional().notEmpty().withMessage("Image alt text cannot be empty"),
  check("order").optional().isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateInvestorsPageContentItemUpdate = [
  check("meta_title").optional().notEmpty().withMessage("Meta title cannot be empty"),
  check("meta_description").optional().notEmpty().withMessage("Meta description cannot be empty"),
  check("meta_keywords").optional().notEmpty().withMessage("Meta keywords cannot be empty"),
  check("page_title").optional().notEmpty().withMessage("Page title cannot be empty"),
  check("annual_report_title").optional().notEmpty().withMessage("Annual report title cannot be empty"),
  check("annual_report_button_title").optional().notEmpty().withMessage("Annual report button title cannot be empty"),
  check("annual_returns_title").optional().notEmpty().withMessage("Annual returns title cannot be empty"),
  check("investors_contact_title").optional().notEmpty().withMessage("Investors contact title cannot be empty"),
  check("policies_title").optional().notEmpty().withMessage("Policies title cannot be empty"),
  check("stock_exchange_title").optional().notEmpty().withMessage("Stock exchange title cannot be empty"),
  check("corporate_governance_title").optional().notEmpty().withMessage("Corporate governance title cannot be empty"),
  check("disclosure_title").optional().notEmpty().withMessage("Disclosure title cannot be empty"),
  check("disclosure_file").optional().notEmpty().withMessage("Disclosure file path cannot be empty"),
];

const validateFiscalYear = [
  check("fiscal_year")
    .notEmpty()
    .withMessage("Fiscal year is required")
    .matches(/^\d{4}-\d{2}$/)
    .withMessage("Fiscal year must be in YYYY-YY format (e.g., 2024-25)"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateFiscalYearUpdate = [
  check("fiscal_year")
    .optional()
    .notEmpty()
    .withMessage("Fiscal year cannot be empty")
    .matches(/^\d{4}-\d{2}$/)
    .withMessage("Fiscal year must be in YYYY-YY format (e.g., 2024-25)"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateAnnualReport = [
  check("year")
    .notEmpty()
    .withMessage("Year is required")
    .isInt({ min: 1 })
    .withMessage("Year must be a valid Fiscal Year ID")
    .custom(async (value) => {
      const fiscalYear = await models.FiscalYears.findByPk(value);
      if (!fiscalYear) {
        throw new Error("Year must be a valid Fiscal Year ID");
      }
      return true;
    }),
  check("order").notEmpty().withMessage("Order is required").isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateAnnualReportUpdate = [
  check("year")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Year must be a valid Fiscal Year ID")
    .custom(async (value) => {
      const fiscalYear = await models.FiscalYears.findByPk(value);
      if (!fiscalYear) {
        throw new Error("Year must be a valid Fiscal Year ID");
      }
      return true;
    }),
  check("order").optional().isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateAnnualReturns = [
  check("year")
    .notEmpty()
    .withMessage("Year is required")
    .isInt({ min: 1 })
    .withMessage("Year must be a valid Fiscal Year ID")
    .custom(async (value) => {
      const fiscalYear = await models.FiscalYears.findByPk(value);
      if (!fiscalYear) {
        throw new Error("Year must be a valid Fiscal Year ID");
      }
      return true;
    }),
  check("order").notEmpty().withMessage("Order is required").isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateAnnualReturnsUpdate = [
  check("year")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Year must be a valid Fiscal Year ID")
    .custom(async (value) => {
      const fiscalYear = await models.FiscalYears.findByPk(value);
      if (!fiscalYear) {
        throw new Error("Year must be a valid Fiscal Year ID");
      }
      return true;
    }),
  check("order").optional().isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateInvestorsContact = [
  check("type").optional().isIn(["text", "pdf"]).withMessage("type must be 'text' or 'pdf'"),
  check("title").notEmpty().withMessage("Title is required").isString().withMessage("Title must be a string"),
  check("name").custom((value, { req }) => {
    const contentType = req.body.type || "text";
    if (contentType === "text" && (!value || value.trim() === "")) {
      throw new Error("Name is required for text type");
    }
    return true;
  }),
  check("address").optional().isString().withMessage("Address must be a string"),
  check("phone")
    .optional({ checkFalsy: true })
    .matches(/^\+?[\d\s-]{7,}$/)
    .withMessage("Phone must be a valid phone number (e.g., +1-123-456-7890)"),
  check("email").optional({ checkFalsy: true }).isEmail().withMessage("Email must be a valid email address"),
  check("order").notEmpty().withMessage("Order is required").isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateInvestorsContactUpdate = [
  check("type").optional().isIn(["text", "pdf"]).withMessage("type must be 'text' or 'pdf'"),
  check("title").optional().notEmpty().withMessage("Title cannot be empty").isString().withMessage("Title must be a string"),
  check("name")
    .optional()
    .custom((value, { req }) => {
      const contentType = req.body.type;
      if (contentType === "text" && value !== undefined && value.trim() === "") {
        throw new Error("Name cannot be empty for text type");
      }
      return true;
    }),
  check("address").optional().isString().withMessage("Address must be a string"),
  check("phone")
    .optional({ checkFalsy: true })
    .matches(/^\+?[\d\s-]{7,}$/)
    .withMessage("Phone must be a valid phone number (e.g., +1-123-456-7890)"),
  check("email").optional({ checkFalsy: true }).isEmail().withMessage("Email must be a valid email address"),
  check("order").optional().isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validatePolicies = [
  check("title").notEmpty().withMessage("Title is required").isString().withMessage("Title must be a string"),
  check("order").notEmpty().withMessage("Order is required").isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validatePoliciesUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty").isString().withMessage("Title must be a string"),
  check("order").optional().isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validatePolicyCategory = [
  check("title").notEmpty().withMessage("Title is required").isString().withMessage("Title must be a string").isLength({ max: 15 }).withMessage("Title must be at most 15 characters"),
  check("order").optional().isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validatePolicyCategoryUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty").isString().withMessage("Title must be a string").isLength({ max: 15 }).withMessage("Title must be at most 15 characters"),
  check("order").optional().isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateBoardMeetings = [
  check("fiscal_year")
    .notEmpty()
    .withMessage("Fiscal Year is required")
    .isInt({ min: 1 })
    .withMessage("Fiscal Year must be a valid Fiscal Year ID")
    .custom(async (value) => {
      const fiscalYear = await models.FiscalYears.findByPk(value);
      if (!fiscalYear) {
        throw new Error("Fiscal Year must be a valid Fiscal Year ID");
      }
      return true;
    }),
  check("meeting_date")
    .notEmpty()
    .withMessage("Meeting Date is required")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Meeting Date must be a valid date (YYYY-MM-DD)"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateBoardMeetingsUpdate = [
  check("fiscal_year")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Fiscal Year must be a valid Fiscal Year ID")
    .custom(async (value) => {
      const fiscalYear = await models.FiscalYears.findByPk(value);
      if (!fiscalYear) {
        throw new Error("Fiscal Year must be a valid Fiscal Year ID");
      }
      return true;
    }),
  check("meeting_date").optional().isDate({ format: "YYYY-MM-DD" }).withMessage("Meeting Date must be a valid date (YYYY-MM-DD)"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateOtherIntimations = [
  check("fiscal_year")
    .notEmpty()
    .withMessage("Fiscal Year is required")
    .isInt({ min: 1 })
    .withMessage("Fiscal Year must be a valid Fiscal Year ID")
    .custom(async (value) => {
      const fiscalYear = await models.FiscalYears.findByPk(value);
      if (!fiscalYear) {
        throw new Error("Fiscal Year must be a valid Fiscal Year ID");
      }
      return true;
    }),
  check("month_date")
    .notEmpty()
    .withMessage("Month Date is required")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Month Date must be a valid date (YYYY-MM-DD)"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateOtherIntimationsUpdate = [
  check("fiscal_year")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Fiscal Year must be a valid Fiscal Year ID")
    .custom(async (value) => {
      const fiscalYear = await models.FiscalYears.findByPk(value);
      if (!fiscalYear) {
        throw new Error("Fiscal Year must be a valid Fiscal Year ID");
      }
      return true;
    }),
  check("month_date").optional().isDate({ format: "YYYY-MM-DD" }).withMessage("Month Date must be a valid date (YYYY-MM-DD)"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateCsrCommittee = [
  check("name").notEmpty().withMessage("Name is required").isString().withMessage("Name must be a string"),
  check("nature").notEmpty().withMessage("Nature is required").isString().withMessage("Nature must be a string"),
  check("designation").notEmpty().withMessage("Designation is required").isString().withMessage("Designation must be a string"),
  check("order").notEmpty().withMessage("Order is required").isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateCsrCommitteeUpdate = [
  check("name").optional().notEmpty().withMessage("Name cannot be empty").isString().withMessage("Name must be a string"),
  check("nature").optional().notEmpty().withMessage("Nature cannot be empty").isString().withMessage("Nature must be a string"),
  check("designation").optional().notEmpty().withMessage("Designation cannot be empty").isString().withMessage("Designation must be a string"),
  check("order").optional().isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateCsrReport = [
  check("fiscal_year").isInt({ min: 1 }).withMessage("Fiscal Year must be a valid Fiscal Year ID"),
  check("order").notEmpty().withMessage("Order is required").isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateCsrReportUpdate = [
  check("fiscal_year").optional().isInt({ min: 1 }).withMessage("Fiscal Year must be a valid Fiscal Year ID"),
  check("order").optional().isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateCsrActionPlan = [
  check("fiscal_year").isInt({ min: 1 }).withMessage("Fiscal Year must be a valid Fiscal Year ID"),
  check("order").notEmpty().withMessage("Order is required").isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateCsrActionPlanUpdate = [
  check("fiscal_year").optional().isInt({ min: 1 }).withMessage("Fiscal Year must be a valid Fiscal Year ID"),
  check("order").optional().isInt({ gt: 0 }).withMessage("Order must be a positive integer"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateTestimonialPageContents = [
  check("meta_title").notEmpty().withMessage("Meta Title is required").isString().withMessage("Meta Title must be a string"),
  check("meta_description").notEmpty().withMessage("Meta Description is required").isString().withMessage("Meta Description must be a string"),
  check("meta_keywords").notEmpty().withMessage("Meta Keywords is required").isString().withMessage("Meta Keywords must be a string"),
  check("title").notEmpty().withMessage("Title is required").isString().withMessage("Title must be a string"),
];

const validateTestimonial = [
  check("name").notEmpty().withMessage("Name is required").isString().withMessage("Name must be a string"),
  check("designation").notEmpty().withMessage("Designation is required").isString().withMessage("Designation must be a string"),
  check("order").notEmpty().withMessage("Order is required").isString().matches(/^\d+$/).withMessage("Order must be a numeric string"),
  check("type").notEmpty().withMessage("Type is required").isIn(["video", "text"]).withMessage("Type must be 'video' or 'text'"),
  check("testimonial")
    .if(check("type").equals("text"))
    .notEmpty()
    .withMessage("Testimonial text is required for type 'text'")
    .isString()
    .withMessage("Testimonial must be a string"),
  check("video")
    .if(check("type").equals("video"))
    .custom((value, { req }) => {
      if (!req.files || !req.files.video) {
        throw new Error("Video file is required for type 'video'");
      }
      return true;
    }),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
  check("is_about").optional().isBoolean().withMessage("is_about must be a boolean"),
];

const validateTestimonialUpdate = [
  check("name").optional().notEmpty().withMessage("Name cannot be empty").isString().withMessage("Name must be a string"),
  check("designation").optional().notEmpty().withMessage("Designation cannot be empty").isString().withMessage("Designation must be a string"),
  check("order").optional().notEmpty().withMessage("Order cannot be empty").isString().matches(/^\d+$/).withMessage("Order must be a numeric string"),
  check("type").optional().notEmpty().withMessage("Type cannot be empty").isIn(["video", "text"]).withMessage("Type must be 'video' or 'text'"),
  check("testimonial")
    .optional()
    .if(check("type").equals("text"))
    .notEmpty()
    .withMessage("Testimonial text is required for type 'text'")
    .isString()
    .withMessage("Testimonial must be a string"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
  check("is_about").optional().isBoolean().withMessage("is_about must be a boolean"),
];

const validateBranchLocatorPageContents = [
  check("meta_title").notEmpty().withMessage("Meta Title is required").isString().withMessage("Meta Title must be a string"),
  check("meta_description").notEmpty().withMessage("Meta Description is required").isString().withMessage("Meta Description must be a string"),
  check("meta_keywords").notEmpty().withMessage("Meta Keywords is required").isString().withMessage("Meta Keywords must be a string"),
  check("title").notEmpty().withMessage("Title is required").isString().withMessage("Title must be a string"),
  check("description").notEmpty().withMessage("Description is required").isString().withMessage("Description must be a string"),
];

const validateBranch = [
  check("name").notEmpty().withMessage("Name is required").isString().withMessage("Name must be a string"),
  check("state").notEmpty().withMessage("State is required").isString().withMessage("State must be a string"),
  check("district").notEmpty().withMessage("District is required").isString().withMessage("District must be a string"),
  check("location").notEmpty().withMessage("Location is required").isString().withMessage("Location must be a string"),
  check("address").notEmpty().withMessage("Address is required").isString().withMessage("Address must be a string"),
  check("latitude").optional().isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90"),
  check("longitude").optional().isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180"),
  check("phone_no")
    .optional()
    .matches(/^\d{2,4}-\d{6,8}$/)
    .withMessage("Phone number must be in format 'XXX-XXXXXX' or similar"),
  check("mobile_no")
    .optional()
    .matches(/^\+?\d{10,12}$/)
    .withMessage("Mobile number must be 10-12 digits, optionally starting with '+'"),
  check("email").optional().isEmail().withMessage("Email must be valid"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateBranchUpdate = [
  check("name").optional().notEmpty().withMessage("Name cannot be empty").isString().withMessage("Name must be a string"),
  check("state").optional().notEmpty().withMessage("State cannot be empty").isString().withMessage("State must be a string"),
  check("district").optional().notEmpty().withMessage("District cannot be empty").isString().withMessage("District must be a string"),
  check("location").optional().notEmpty().withMessage("Location cannot be empty").isString().withMessage("Location must be a string"),
  check("address").optional().notEmpty().withMessage("Address cannot be empty").isString().withMessage("Address must be a string"),
  check("latitude").optional().isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90"),
  check("longitude").optional().isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180"),
  check("phone_no")
    .optional()
    .matches(/^\d{2,4}-\d{6,8}$/)
    .withMessage("Phone number must be in format 'XXX-XXXXXX' or similar"),
  check("mobile_no")
    .optional()
    .matches(/^\+?\d{10,12}$/)
    .withMessage("Mobile number must be 10-12 digits, optionally starting with '+'"),
  check("email").optional().isEmail().withMessage("Email must be valid"),
  check("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

const validateCorporateGovernance = [
  check("title").notEmpty().withMessage("Title is required"),
  check("is_active").isBoolean().withMessage("Is active must be a boolean"),
  check("order").isInt().withMessage("Order must be an integer"),
];

const validateCorporateGovernanceUpdate = [
  check("title").optional().notEmpty().withMessage("Title is required"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validateQuarterlyReportsUpdate = [
  check("year").optional().isInt().withMessage("Year ID must be an integer"),
  check("title").optional().notEmpty().withMessage("Title is required"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validateQuarterlyReports = [
  check("year").isInt().withMessage("Year ID must be an integer"),
  check("title").notEmpty().withMessage("Title is required"),
  check("is_active").isBoolean().withMessage("Is active must be a boolean"),
  check("order").isInt().withMessage("Order must be an integer"),
];

const validateCreditRatingsUpdate = [
  check("title").optional().notEmpty().withMessage("Title is required"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validateCreditRatings = [
  check("title").notEmpty().withMessage("Title is required"),
  check("is_active").isBoolean().withMessage("Is active must be a boolean"),
  check("order").isInt().withMessage("Order must be an integer"),
];

const validateIndelCaresUpdate = [
  check("title").optional().notEmpty().withMessage("Title is required"),
  // check("event_date").optional().isISO8601().withMessage("Event date must be a valid date (YYYY-MM-DD)"),
  check("is_slider").optional().isBoolean().withMessage("Is slider must be a boolean"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validateIndelCares = [
  check("title").notEmpty().withMessage("Title is required"),
  // check("event_date").isISO8601().withMessage("Event date must be a valid date (YYYY-MM-DD)"),
  check("is_slider").isBoolean().withMessage("Is slider must be a boolean"),
  check("is_active").isBoolean().withMessage("Is active must be a boolean"),
  check("description").notEmpty().withMessage("Description cannot be empty"),
  check("order").isInt().withMessage("Order must be an integer"),
];

const validateIndelCaresContentUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("care_title").optional().notEmpty().withMessage("Care Title cannot be empty"),
];

const validateFooterContentUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  check("sub_title").optional().notEmpty().withMessage("Sub Title cannot be empty"),
  check("address").optional().notEmpty().withMessage("Address cannot be empty"),
  check("toll_free_num")
    .optional()
    .matches(/^(\+?\d{4}\s?\d{4}\s?\d{3}|\+?\d{10,15})$/)
    .withMessage("Toll Free Number must be in format: 1800 4253 990 or 10-15 digits"),
  check("email").optional().isEmail().withMessage("Email must be valid"),
  check("button_1_text").optional().notEmpty().withMessage("Button 1 Text cannot be empty"),
  // check("button_1_link").optional().isURL().withMessage("Button 1 Link must be a valid URL"),
  check("button_2_text").optional().notEmpty().withMessage("Button 2 Text cannot be empty"),
  // check("button_2_link").optional().isURL().withMessage("Button 2 Link must be a valid URL"),
  // check("icon_section_link").optional().isURL().withMessage("Icon Section Link must be a valid URL"),
  check("icon_section_text").optional().notEmpty().withMessage("Icon Section Text cannot be empty"),
  check("social_media_text").optional().notEmpty().withMessage("Social Media Text cannot be empty"),
];

const validateSocialMediaIconsUpdate = [
  check("title").optional().notEmpty().withMessage("Title is required"),
  // check("link").optional().notEmpty().isURL().withMessage("Link must be a valid URL"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validateSocialMediaIcons = [
  check("title").notEmpty().withMessage("Title is required"),
  // check("link").notEmpty().isURL().withMessage("Link must be a valid URL"),
  check("is_active").isBoolean().withMessage("Is active must be a boolean"),
  check("order").isInt().withMessage("Order must be an integer"),
];

const validateServiceEnquiry = [
  check("name").notEmpty().withMessage("Name is required"),
  check("phone").notEmpty().withMessage("Phone is required"),
  check("service_types").notEmpty().withMessage("Service types is required"),
  check("enquiry_type").isIn(["gold_loan_calculator", "emi_calculator", "general", "contact"]).withMessage("Invalid enquiry type"),
  check("email").optional().isEmail().withMessage("Email must be valid"),
  check("enquiry_type_details").optional().isObject().withMessage("Enquiry type details must be an object"),
];

const validateServiceEnquiryUpdate = [
  check("name").optional().notEmpty().withMessage("Name cannot be empty"),
  check("phone").optional().notEmpty().withMessage("Phone cannot be empty"),
  check("service_types").optional().notEmpty().withMessage("Service types cannot be empty"),
  check("enquiry_type").optional().isIn(["gold_loan_calculator", "emi_calculator", "general", "contact"]).withMessage("Invalid enquiry type"),
  check("email").optional().isEmail().withMessage("Email must be valid"),
  check("enquiry_type_details").optional().isObject().withMessage("Enquiry type details must be an object"),
];

const validateServiceType = [
  check("type_name").notEmpty().withMessage("Type name is required"),
  check("description").optional().isString().withMessage("Description must be a string"),
];

const validateServiceTypeUpdate = [
  check("type_name").optional().notEmpty().withMessage("Type name cannot be empty"),
  check("description").optional().isString().withMessage("Description must be a string"),
];

const validateGoldCaratType = [
  check("name").notEmpty().withMessage("Name is required"),
  check("description").optional().isString().withMessage("Description must be a string"),
];

const validateGoldCaratTypeUpdate = [
  check("name").optional().notEmpty().withMessage("Name cannot be empty"),
  check("description").optional().isString().withMessage("Description must be a string"),
];

const validateGoldType = [
  check("gold_type_name").notEmpty().withMessage("Gold type name is required"),
  check("description").optional().isString().withMessage("Description must be a string"),
];

const validateGoldTypeUpdate = [
  check("gold_type_name").optional().notEmpty().withMessage("Gold type name cannot be empty"),
  check("description").optional().isString().withMessage("Description must be a string"),
];

const validateNewsLetterSubs = [check("email").notEmpty().isEmail().withMessage("Valid email is required")];

const validateHeaderContentsUpdate = [
  check("quick_pay_title").optional().notEmpty().withMessage("Quick Pay Title cannot be empty"),
  check("button_1_text").optional().notEmpty().withMessage("Button 1 Text cannot be empty"),
  check("button_1_inner_title").optional().notEmpty().withMessage("Button 1 Inner Title cannot be empty"),
  // check("button_2_link").optional().isURL().withMessage("Button 2 Link must be a valid URL"),
  check("button_2_text").optional().notEmpty().withMessage("Button 2 Text cannot be empty"),
  // check("apple_dowload_icon").optional().isURL().withMessage("Apple Download Icon must be a valid URL"),
  // check("andrioid_download_icon").optional().isURL().withMessage("Android Download Icon must be a valid URL"),
  // check("apple_dowload_link").optional().isURL().withMessage("Apple Download Link must be a valid URL"),
  // check("andrioid_download_link").optional().isURL().withMessage("Android Download Link must be a valid URL"),
];

const validatePaymentModesUpdate = [
  check("title").optional().notEmpty().withMessage("Title is required"),
  // check("link").optional().notEmpty().isURL().withMessage("Link must be a valid URL"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validatePaymentModes = [
  check("title").notEmpty().withMessage("Title is required"),
  // check("link").notEmpty().isURL().withMessage("Link must be a valid URL"),
  check("is_active").isBoolean().withMessage("Is active must be a boolean"),
  check("order").isInt().withMessage("Order must be an integer"),
];

const validatePopupSettingsUpdate = [
  check("title").optional().notEmpty().withMessage("Title cannot be empty"),
  // check("logo").optional().isURL().withMessage("Logo must be a valid URL"),
  check("banner_popup_status").optional().isBoolean().withMessage("Banner Popup Status must be a boolean"),
  check("service_popup_status").optional().isBoolean().withMessage("Service Popup Status must be a boolean"),
  // check("banner_popup_image").optional().isURL().withMessage("Banner Popup Image must be a valid URL"),
  check("banner_popup_appearence_time").optional().isInt({ min: 0 }).withMessage("Banner Popup Appearance Time must be a non-negative integer"),
  check("banner_popup_disappear_time").optional().isInt({ min: 0 }).withMessage("Banner Popup Disappear Time must be a non-negative integer"),
  check("service_popup_appearence_time").optional().isInt({ min: 0 }).withMessage("Service Popup Appearance Time must be a non-negative integer"),
  check("service_popup_disappear_time").optional().isInt({ min: 0 }).withMessage("Service Popup Disappear Time must be a non-negative integer"),
];

const validatePopupServicesUpdate = [
  check("image_alt").optional().notEmpty().withMessage("Image Alt cannot be empty"),
  check("title").optional().notEmpty().withMessage("Title is required"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  // check("button_link").optional().isURL().withMessage("Button Link must be a valid URL"),
  check("button_text").optional().notEmpty().withMessage("Button Text cannot be empty"),
  // check("image").optional().isURL().withMessage("Image must be a valid URL"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];
const validatePopupServices = [
  check("image_alt").notEmpty().withMessage("Image Alt cannot be empty"),
  check("title").notEmpty().withMessage("Title is required"),
  check("description").notEmpty().withMessage("Description cannot be empty"),
  // check("button_link").isURL().withMessage("Button Link must be a valid URL"),
  check("button_text").notEmpty().withMessage("Button Text cannot be empty"),
  // check("image").isURL().withMessage("Image must be a valid URL"),
  check("is_active").isBoolean().withMessage("Is active must be a boolean"),
  check("order").isInt().withMessage("Order must be an integer"),
];

const validateLoanTypesUpdate = [
  check("title").optional().notEmpty().withMessage("Title is required"),
  check("image_alt").optional().notEmpty().withMessage("Image Alt is required"),
  check("sub_title").optional().notEmpty().withMessage("Sub Title cannot be empty"),
  check("description").optional().notEmpty().withMessage("Description cannot be empty"),
  // check("link").optional().isURL().withMessage("Link must be a valid URL"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];
const validateLoanTypes = [
  check("title").notEmpty().withMessage("Title is required"),
  check("image_alt").notEmpty().withMessage("Image Alt is required"),
  check("sub_title").notEmpty().withMessage("Sub Title cannot be empty"),
  check("description").notEmpty().withMessage("Description cannot be empty"),
  // check("link").isURL().withMessage("Link must be a valid URL"),
  check("is_active").isBoolean().withMessage("Is active must be a boolean"),
  check("order").isInt().withMessage("Order must be an integer"),
];

const validateCareerDistricts = [
  check("district_name").notEmpty().withMessage("District Name is required"),
  check("state_id").isInt().withMessage("State ID must be an integer"),
  check("image_alt").optional().notEmpty().withMessage("Image Alt cannot be empty"),
  check("is_active").isBoolean().withMessage("Is active must be a boolean"),
  check("order").isInt().withMessage("Order must be an integer"),
];

const validateCareerDistrictsUpdate = [
  check("district_name").optional().notEmpty().withMessage("District Name cannot be empty"),
  check("state_id").optional().isInt().withMessage("State ID must be an integer"),
  check("image_alt").optional().notEmpty().withMessage("Image Alt cannot be empty"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
  check("order").optional().isInt().withMessage("Order must be an integer"),
];

const validateApplicants = [
  check("name").exists().trim().isLength({ max: 100 }).withMessage("Name is required and must not exceed 100 characters"),
  check("email")
    .exists()
    .isEmail()
    .withMessage("A valid email is required")
    .isLength({ max: 255 })
    .withMessage("Email must not exceed 255 characters"),
  check("phone").optional().trim().isLength({ max: 20 }).withMessage("Phone number must not exceed 20 characters"),
  check("referred_employee_name").optional().trim().isLength({ max: 200 }).withMessage("Referred employee name must not exceed 200 characters"),
  check("employee_referral_code").optional().trim().isLength({ max: 50 }).withMessage("Employee referral code must not exceed 50 characters"),
  check("age").exists().isInt({ min: 18 }).withMessage("Age is required and must be an integer of 18 or above"),
  check("current_salary").optional().isFloat({ min: 0 }).withMessage("Current salary must be a positive number"),
  check("expected_salary").optional().isFloat({ min: 0 }).withMessage("Expected salary must be a positive number"),
  check("file").exists().trim().isLength({ max: 255 }).withMessage("File path is required and must not exceed 255 characters"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
];

const validateApplicantsUpdate = [
  check("name").optional().trim().isLength({ max: 100 }).withMessage("Name must not exceed 100 characters"),
  check("email")
    .optional()
    .isEmail()
    .withMessage("A valid email is required")
    .isLength({ max: 255 })
    .withMessage("Email must not exceed 255 characters"),
  check("phone").optional().trim().isLength({ max: 20 }).withMessage("Phone number must not exceed 20 characters"),
  check("referred_employee_name").optional().trim().isLength({ max: 200 }).withMessage("Referred employee name must not exceed 200 characters"),
  check("employee_referral_code").optional().trim().isLength({ max: 50 }).withMessage("Employee referral code must not exceed 50 characters"),
  check("age").optional().isInt({ min: 18 }).withMessage("Age must be an integer of 18 or above"),
  check("file").optional().trim().isLength({ max: 255 }).withMessage("File path must not exceed 255 characters"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
];

const validateApplicationStatuses = [
  check("status_name").exists().trim().isLength({ max: 50 }).withMessage("Status name is required and must not exceed 50 characters"),
  check("description").optional().trim().isLength({ max: 255 }).withMessage("Description must not exceed 255 characters"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
  check("order").optional().isInt({ min: 0 }).withMessage("Order must be a non-negative integer"),
];

const validateApplicationStatusesUpdate = [
  check("status_name").optional().trim().isLength({ max: 50 }).withMessage("Status name must not exceed 50 characters"),
  check("description").optional().trim().isLength({ max: 255 }).withMessage("Description must not exceed 255 characters"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
  check("order").optional().isInt({ min: 0 }).withMessage("Order must be a non-negative integer"),
];

const validateGeneralApplications = [
  check("applicant_id").exists().isInt({ min: 1 }).withMessage("Applicant ID is required and must be a positive integer"),
  check("status_id").exists().isInt({ min: 1 }).withMessage("Status ID is required and must be a positive integer"),
  check("application_date").optional().isISO8601().withMessage("Application date must be a valid ISO 8601 date (e.g., YYYY-MM-DD)"),
  check("role_id").optional().isInt({ min: 1 }).withMessage("Role ID must be a positive integer"),
  check("preferred_role").optional().trim().isLength({ max: 200 }).withMessage("Preferred role must not exceed 200 characters"),
  check("current_salary").optional().isDecimal({ decimal_digits: "0,2" }).withMessage("Current salary must be a valid decimal with up to 2 places"),
  check("expected_salary").optional().isDecimal({ decimal_digits: "0,2" }).withMessage("Expected salary must be a valid decimal with up to 2 places"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
  check("order").optional().isInt({ min: 0 }).withMessage("Order must be a non-negative integer"),
];

const validateGeneralApplicationsUpdate = [
  check("applicant_id").optional().isInt({ min: 1 }).withMessage("Applicant ID must be a positive integer"),
  check("status_id").optional().isInt({ min: 1 }).withMessage("Status ID must be a positive integer"),
  check("application_date").optional().isISO8601().withMessage("Application date must be a valid ISO 8601 date (e.g., YYYY-MM-DD)"),
  check("role_id").optional().isInt({ min: 1 }).withMessage("Role ID must be a positive integer"),
  check("current_salary").optional().isDecimal({ decimal_digits: "0,2" }).withMessage("Current salary must be a valid decimal with up to 2 places"),
  check("expected_salary").optional().isDecimal({ decimal_digits: "0,2" }).withMessage("Expected salary must be a valid decimal with up to 2 places"),
  check("is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
  check("order").optional().isInt({ min: 0 }).withMessage("Order must be a non-negative integer"),
];

const validateGeneralApplicationSubmission = [
  // Applicant Fields
  check("applicant.name").exists().trim().isLength({ max: 100 }).withMessage("Name is required and must not exceed 100 characters"),
  check("applicant.email")
    .exists()
    .isEmail()
    .withMessage("A valid email is required")
    .isLength({ max: 255 })
    .withMessage("Email must not exceed 255 characters"),
  check("applicant.phone").optional().trim().isLength({ max: 20 }).withMessage("Phone number must not exceed 20 characters"),
  check("applicant.preferred_locations")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Preferred locations must be an array with at least one location"),
  check("applicant.preferred_locations.*").optional().isInt({ min: 1 }).withMessage("Each preferred location ID must be a positive integer"),
  check("applicant.preferred_states").optional().isArray({ min: 1 }).withMessage("Preferred states must be an array with at least one state"),
  check("applicant.preferred_states.*").optional().isInt({ min: 1 }).withMessage("Each preferred state ID must be a positive integer"),
  // Custom validation to ensure at least one location is provided
  check().custom((value, { req }) => {
    const { applicant } = req.body;
    if (!applicant) {
      throw new Error("Applicant data is required");
    }

    const hasPreferredLocations =
      applicant.preferred_locations && Array.isArray(applicant.preferred_locations) && applicant.preferred_locations.length > 0;

    if (!hasPreferredLocations) {
      throw new Error("At least one preferred location is required");
    }

    return true;
  }),
  check("applicant.referred_employee_name")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Referred employee name must not exceed 200 characters"),
  check("applicant.employee_referral_code")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Employee referral code must not exceed 50 characters"),
  check("applicant.age").exists().isInt({ min: 18 }).withMessage("Age is required and must be an integer of 18 or above"),
  check("applicant.current_salary").optional().isFloat({ min: 0 }).withMessage("Current salary must be a non-negative number"),
  check("applicant.expected_salary").exists().isFloat({ min: 0 }).withMessage("Expected salary is required and must be a non-negative number"),
  check("applicant.is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
  // General Application Fields
  check("general_application.role_id").exists().isInt({ min: 1 }).withMessage("Role ID is required and must be a positive integer"),
  check("general_application.preferred_role_name")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Preferred role name must not exceed 100 characters"),
];

const validateJobApplicationSubmission = [
  // Applicant Fields
  check("applicant.name").exists().trim().isLength({ max: 100 }).withMessage("Name is required and must not exceed 100 characters"),
  check("applicant.email")
    .exists()
    .isEmail()
    .withMessage("A valid email is required")
    .isLength({ max: 255 })
    .withMessage("Email must not exceed 255 characters"),
  check("applicant.phone").optional().trim().isLength({ max: 20 }).withMessage("Phone number must not exceed 20 characters"),
  check("applicant.preferred_locations")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Preferred locations must be an array with at least one location"),
  check("applicant.preferred_locations.*").optional().isInt({ min: 1 }).withMessage("Each preferred location ID must be a positive integer"),
  check("applicant.preferred_states").optional().isArray({ min: 1 }).withMessage("Preferred states must be an array with at least one state"),
  check("applicant.preferred_states.*").optional().isInt({ min: 1 }).withMessage("Each preferred state ID must be a positive integer"),
  // Custom validation to ensure at least one location is provided
  check().custom((value, { req }) => {
    const { applicant } = req.body;
    if (!applicant) {
      throw new Error("Applicant data is required");
    }

    const hasPreferredLocations =
      applicant.preferred_locations && Array.isArray(applicant.preferred_locations) && applicant.preferred_locations.length > 0;

    if (!hasPreferredLocations) {
      throw new Error("At least one preferred location is required");
    }

    return true;
  }),
  check("applicant.referred_employee_name")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Referred employee name must not exceed 200 characters"),
  check("applicant.employee_referral_code")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Employee referral code must not exceed 50 characters"),
  check("applicant.age").exists().isInt({ min: 18 }).withMessage("Age is required and must be an integer of 18 or above"),
  check("applicant.current_salary").optional().isFloat({ min: 0 }).withMessage("Current salary must be a non-negative number"),
  check("applicant.expected_salary").exists().isFloat({ min: 0 }).withMessage("Expected salary is required and must be a non-negative number"),
  // check("applicant.file")
  //   .exists()
  //   .optional()
  //   .trim()
  //   .isLength({ max: 255 })
  //   .withMessage("File path is required and must not exceed 255 characters"),
  check("applicant.is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
  // Job Application Fields
  check("job_application.job_id").exists().isInt({ min: 1 }).withMessage("Job ID is required and must be a positive integer"),
  check("job_application.status_id").exists().isInt({ min: 1 }).withMessage("Status ID is required and must be a positive integer"),
  check("job_application.application_date").optional().isISO8601().withMessage("Application date must be a valid ISO 8601 date (e.g., YYYY-MM-DD)"),
  check("job_application.is_active").optional().isBoolean().withMessage("Is active must be a boolean"),
  check("job_application.order").optional().isInt({ min: 0 }).withMessage("Order must be a non-negative integer"),
];

const validateNCDPageContentUpdate = [
  check("meta_title").optional().notEmpty().withMessage("Meta Title cannot be empty"),

  check("meta_description").optional().notEmpty().withMessage("Meta Description cannot be empty"),

  check("meta_keywords").optional().notEmpty().withMessage("Meta Keywords cannot be empty"),

  check("banner_image_alt").optional().notEmpty().withMessage("Banner Image Alt cannot be empty"),

  check("content").optional().notEmpty().withMessage("Content cannot be empty"),

  check("second_banner_image_alt").optional().notEmpty().withMessage("Second Banner Image Alt cannot be empty"),
];

module.exports = {
  validateLoanTypes,
  validateLoanTypesUpdate,
  validatePopupServicesUpdate,
  validatePopupServices,
  validatePopupSettingsUpdate,
  validatePaymentModes,
  validatePaymentModesUpdate,
  validateHeaderContentsUpdate,
  validateNewsLetterSubs,
  validateSocialMediaIcons,
  validateSocialMediaIconsUpdate,
  validateFooterContentUpdate,
  validateIndelCaresUpdate,
  validateIndelCaresContentUpdate,
  validateIndelCares,
  validateCreditRatings,
  validateCreditRatingsUpdate,
  validateQuarterlyReports,
  validateQuarterlyReportsUpdate,
  validateHeroBanner,
  validateHeroBannerUpdate,
  validateHomeStatistics,
  validateHomeStatisticsUpdate,
  validateHomePageContentUpdate,
  validateHomeLoanStep,
  validateHomeLoanStepUpdate,
  validateFaq,
  validateFaqUpdate,
  validateHomeSmartDeals,
  validateHomeSmartDealsUpdate,
  validateAboutBanner,
  validateAboutBannerUpdate,
  validateAboutLifeAtIndel,
  validateAboutLifeAtIndelUpdate,
  validateAboutQuickLinks,
  validateAboutQuickLinksUpdate,
  validateAboutPageContentUpdate,
  validateAboutMessageFromTeam,
  validateAboutMessageFromTeamUpdate,
  validateAboutStatsItem,
  validateAboutStatsItemUpdate,
  validateManagementTeam,
  validateManagementTeamUpdate,
  validateMngmtTeamContentItemUpdate,
  validateDeptPartners,
  validateDeptPartnersUpdate,
  validateDeptPartnersContent,
  validateDeptPartnersContentUpdate,
  validateContactContent,
  validateContactContentUpdate,
  validateContactOffices,
  validateContactOfficesUpdate,
  validateAboutAccolades,
  validateAboutAccoladesUpdate,
  validateHistoryPageContent,
  validateHistoryPageContentUpdate,
  validateHistoryImages,
  validateHistoryImagesUpdate,
  validateHistoryInceptionsYears,
  validateHistoryInceptionsYearsUpdate,
  validateIndelValue,
  validateIndelValueUpdate,
  validateDifferentShadesValue,
  validateDifferentShadesValueUpdate,
  validateServicesPageContentUpdate,
  validateServiceBenefits,
  validateServiceBenefitsUpdate,
  validateGoldLoanContentUpdate,
  validateGoldLoanScheme,
  validateGoldLoanSchemeUpdate,
  validateSchemeDetails,
  validateSchemeDetailsUpdate,
  validateGoldLoanFeature,
  validateGoldLoanFeatureUpdate,
  validateMsmeLoanContent,
  validateMsmeLoanContentUpdate,
  validateMsmeOfferings,
  validateMsmeOfferingsUpdate,
  validateMsmeTargetedAudience,
  validateMsmeTargetedAudienceUpdate,
  validateMsmeLoanSupportedIndustries,
  validateMsmeLoanSupportedIndustriesUpdate,
  validateCdLoanContentUpdate,
  validateCdLoanProducts,
  validateCdLoanProductsUpdate,
  validateCareerContentsUpdate,
  validateCareerBanners,
  validateCareerBannersUpdate,
  validateCareerStates,
  validateCareerStatesUpdate,
  validateCareerLocations,
  validateCareerLocationsUpdate,
  validateCareerRoles,
  validateCareerRolesUpdate,
  validateJobs,
  validateJobsUpdate,
  validateBlogPageContentUpdate,
  validateBlogs,
  validateBlogsUpdate,
  generateStringValidators,
  validateCSRPageContentUpdate,
  validateGalleryPageContentItemUpdate,
  validateEventType,
  validateEventTypeUpdate,
  validateEventGallery,
  validateEventGalleryUpdate,
  validateAwardPageContentItemUpdate,
  validateAward,
  validateAwardUpdate,
  validateNewsPageContentItemUpdate,
  validateNews,
  validateNewsUpdate,
  validateEventPageContentItemUpdate,
  validateEvent,
  validateEventUpdate,
  validateNews,
  validateNewsUpdate,
  validateInvestorsPageContentItemUpdate,
  validateFiscalYear,
  validateFiscalYearUpdate,
  validateAnnualReport,
  validateAnnualReportUpdate,
  validateAnnualReturns,
  validateAnnualReturnsUpdate,
  validateInvestorsContact,
  validateInvestorsContactUpdate,
  validatePolicies,
  validatePoliciesUpdate,
  validateBoardMeetings,
  validateBoardMeetingsUpdate,
  validateOtherIntimations,
  validateOtherIntimationsUpdate,
  validateCsrCommittee,
  validateCsrCommitteeUpdate,
  validateCsrReport,
  validateCsrReportUpdate,
  validateCsrActionPlan,
  validateCsrActionPlanUpdate,
  validateTestimonialPageContents,
  validateTestimonial,
  validateTestimonialUpdate,
  validateBranchLocatorPageContents,
  validateBranch,
  validateBranchUpdate,
  validateCorporateGovernance,
  validateCorporateGovernanceUpdate,
  validateServiceEnquiry,
  validateServiceEnquiryUpdate,
  validateServiceType,
  validateServiceTypeUpdate,
  validateGoldCaratType,
  validateGoldCaratTypeUpdate,
  validateGoldType,
  validateGoldTypeUpdate,
  validateCareerDistricts,
  validateCareerDistrictsUpdate,
  validateApplicants,
  validateApplicantsUpdate,
  validateApplicationStatuses,
  validateApplicationStatusesUpdate,
  validateGeneralApplications,
  validateGeneralApplicationsUpdate,
  validateGeneralApplicationSubmission,
  validateJobApplicationSubmission,
  validateRegister,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateResendOtp,
  validateCurrentUserProfile,
  validateCurrentUserPassword,
  validateServices,
  validateServiceUpdate,
  validateLoanAgainstPropertyContent,
  validateLoanAgainstPropertyContentUpdate,
  validateNCDPageContentUpdate,
  validatePolicyCategory,
  validatePolicyCategoryUpdate,
};
