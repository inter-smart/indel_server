const { Op, fn, col } = require("sequelize");
const { models } = require("../../models/index");
const CacheService = require("../../services/cacheService");
const CustomError = require("../../utils/customError");

const CACHE_TTL_SECONDS = 60;
const MONTHS_IN_CHART = 6;
const RECENT_LIMIT = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

// Roles allowed to see each dashboard section. Each section links to an admin
// page, so these mirror the roles that can OPEN that page (ROUTE_ROLES in
// admin/src/config/roleConfig.ts; admin always has access) — which is a subset
// of the roles the data APIs allow. The dashboard therefore never lists data
// behind a page the caller would be bounced from:
//   openJobs     -> /careers-jobs
//   pendingJobs  -> /pending-jobs
//   applications -> /job-applications, /general-applications, /applicants
//   enquiries    -> /service-enquiries
//   fileShare    -> /file-share
//   ncd          -> /ncd-content
// Keep in sync with ROUTE_ROLES_BY_PATH (admin/src/config/routeAccess.ts); changing this does not change API permissions.
const SECTION_ROLES = {
  openJobs: ["admin", "manager"],
  pendingJobs: ["admin", "manager", "hr"],
  applications: ["admin", "manager"],
  enquiries: ["admin", "manager"],
  fileShare: ["admin", "manager", "hr"],
  ncd: ["admin", "manager", "hr"],
};
const RECENT_FILES_LIMIT = 6;

const sectionsForRole = (role) =>
  Object.fromEntries(Object.entries(SECTION_ROLES).map(([section, roles]) => [section, roles.includes(role)]));

const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

// Last N month buckets (oldest first) so months without rows still show as 0.
const buildMonthBuckets = (count) => {
  const now = new Date();
  const buckets = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    buckets.push({
      key: monthKey(d),
      label: d.toLocaleString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }),
      jobApplications: 0,
      generalApplications: 0,
    });
  }
  return buckets;
};

const countSince = (Model, field, days) =>
  Model.count({ where: { [field]: { [Op.gte]: new Date(Date.now() - days * DAY_MS) } } });

const monthlyCounts = (Model, since) =>
  Model.findAll({
    attributes: [
      [fn("date_trunc", "month", col("application_date")), "month"],
      [fn("COUNT", col("id")), "count"],
    ],
    where: { application_date: { [Op.gte]: since } },
    group: [fn("date_trunc", "month", col("application_date"))],
    raw: true,
  });

const countByStatus = (Model) =>
  Model.findAll({
    attributes: ["status_id", [fn("COUNT", col("id")), "count"]],
    group: ["status_id"],
    raw: true,
  });

class DashboardController {
  static async getSummary(req, res, next) {
    try {
      const sections = sectionsForRole(req.user?.role);
      const allowed = Object.keys(sections).filter((section) => sections[section]);
      if (!allowed.length) {
        throw new CustomError("Insufficient permissions", 403);
      }

      // Roles with identical access share one cache entry.
      const cacheKey = `dashboardSummary_${allowed.join(".")}`;
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: JSON.parse(cached) });
      }

      const data = { sections };

      // ── Jobs ─────────────────────────────────────────────────────────────
      data.kpis = {};
      const [openJobs, pendingJobs] = await Promise.all([
        sections.openJobs ? models.CareerJobs.count({ where: { is_active: true, is_approved: true } }) : undefined,
        sections.pendingJobs ? models.CareerJobs.count({ where: { is_approved: false } }) : undefined,
      ]);
      if (sections.openJobs) data.kpis.openJobs = openJobs;
      if (sections.pendingJobs) data.kpis.pendingJobs = pendingJobs;

      // ── Pending approval (jobs awaiting approval) ────────────────────────
      if (sections.pendingJobs) {
        const [pendingByRoleRows, recentPending] = await Promise.all([
          models.CareerJobs.findAll({
            attributes: ["role_id", [fn("COUNT", col("id")), "count"]],
            where: { is_approved: false },
            group: ["role_id"],
            raw: true,
          }),
          models.CareerJobs.findAll({
            attributes: ["id", "job_title", "experience", "createdAt"],
            where: { is_approved: false },
            include: [{ model: models.CareerRoles, as: "role", attributes: ["role_name"] }],
            order: [["createdAt", "DESC"]],
            limit: RECENT_LIMIT,
          }),
        ]);

        const roleIds = pendingByRoleRows.map((r) => r.role_id).filter((id) => id != null);
        const roles = roleIds.length
          ? await models.CareerRoles.findAll({ where: { id: roleIds }, attributes: ["id", "role_name"], raw: true })
          : [];
        const roleNameById = Object.fromEntries(roles.map((r) => [r.id, r.role_name]));
        data.pendingJobsByRole = pendingByRoleRows
          .map((r) => ({ name: roleNameById[r.role_id] || "Unassigned", count: Number(r.count) }))
          .sort((a, b) => b.count - a.count);
        data.recentPendingJobs = recentPending.map((j) => ({
          id: j.id,
          title: j.job_title ?? "—",
          role: j.role?.role_name ?? "—",
          experience: j.experience ?? "—",
          date: j.get("createdAt"),
        }));
      }

      // ── File share ───────────────────────────────────────────────────────
      if (sections.fileShare) {
        const [sharedFiles, activeSharedFiles, recentFiles] = await Promise.all([
          models.FileShare.count(),
          models.FileShare.count({ where: { is_active: true } }),
          models.FileShare.findAll({
            attributes: ["id", "title", "is_active", "createdAt"],
            order: [["createdAt", "DESC"]],
            limit: RECENT_FILES_LIMIT,
          }),
        ]);
        Object.assign(data.kpis, { sharedFiles, activeSharedFiles });
        data.recentFiles = recentFiles.map((f) => ({
          id: f.id,
          title: f.title,
          isActive: !!f.is_active,
          date: f.get("createdAt"),
        }));
      }

      // ── NCD page content ─────────────────────────────────────────────────
      if (sections.ncd) {
        const ncd = await models.NcdPageContent.findOne({
          attributes: ["meta_title", "banner_image", "content", "updatedAt"],
          order: [["id", "ASC"]],
        });
        data.ncd = {
          updatedAt: ncd ? ncd.get("updatedAt") : null,
          metaTitle: ncd?.meta_title || null,
          hasBanner: !!ncd?.banner_image,
          hasContent: !!ncd?.content?.trim(),
        };
      }

      // ── Career / applicant data ──────────────────────────────────────────
      if (sections.applications) {
        const monthsStart = new Date();
        monthsStart.setUTCMonth(monthsStart.getUTCMonth() - (MONTHS_IN_CHART - 1), 1);
        monthsStart.setUTCHours(0, 0, 0, 0);

        const [
          jobApplications,
          jobApplications30d,
          generalApplications,
          generalApplications30d,
          applicants,
          jobMonthly,
          generalMonthly,
          jobByStatus,
          generalByStatus,
          statuses,
          topJobRows,
          recentJobApps,
          recentGeneralApps,
        ] = await Promise.all([
          models.JobApplications.count(),
          countSince(models.JobApplications, "application_date", 30),
          models.GeneralApplications.count(),
          countSince(models.GeneralApplications, "application_date", 30),
          models.Applicants.count(),
          monthlyCounts(models.JobApplications, monthsStart),
          monthlyCounts(models.GeneralApplications, monthsStart),
          countByStatus(models.JobApplications),
          countByStatus(models.GeneralApplications),
          models.ApplicationStatus.findAll({ attributes: ["id", "status_name", "order"], order: [["order", "ASC"]], raw: true }),
          models.JobApplications.findAll({
            attributes: ["job_id", [fn("COUNT", col("id")), "count"]],
            group: ["job_id"],
            order: [[fn("COUNT", col("id")), "DESC"]],
            limit: 5,
            raw: true,
          }),
          models.JobApplications.findAll({
            attributes: ["id", "application_date"],
            include: [
              { model: models.Applicants, as: "applicant", attributes: ["name"] },
              { model: models.CareerJobs, as: "job", attributes: ["job_title"] },
              { model: models.ApplicationStatus, as: "status", attributes: ["status_name"] },
            ],
            order: [["application_date", "DESC"]],
            limit: RECENT_LIMIT,
          }),
          models.GeneralApplications.findAll({
            attributes: ["id", "application_date", "preferred_role_name"],
            include: [
              { model: models.Applicants, as: "applicant", attributes: ["name"] },
              { model: models.CareerRoles, as: "role", attributes: ["role_name"] },
              { model: models.ApplicationStatus, as: "status", attributes: ["status_name"] },
            ],
            order: [["application_date", "DESC"]],
            limit: RECENT_LIMIT,
          }),
        ]);

        Object.assign(data.kpis, {
          jobApplications,
          jobApplications30d,
          generalApplications,
          generalApplications30d,
          applicants,
        });

        // Applications per month
        const buckets = buildMonthBuckets(MONTHS_IN_CHART);
        const bucketByKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
        jobMonthly.forEach((row) => {
          const bucket = bucketByKey[monthKey(row.month)];
          if (bucket) bucket.jobApplications = Number(row.count);
        });
        generalMonthly.forEach((row) => {
          const bucket = bucketByKey[monthKey(row.month)];
          if (bucket) bucket.generalApplications = Number(row.count);
        });
        data.applicationsByMonth = buckets.map(({ key, ...rest }) => rest);

        // Applications by status (job + general combined)
        const statusTotals = {};
        [...jobByStatus, ...generalByStatus].forEach((row) => {
          statusTotals[row.status_id] = (statusTotals[row.status_id] || 0) + Number(row.count);
        });
        data.applicationsByStatus = statuses
          .map((s) => ({ name: s.status_name, count: statusTotals[s.id] || 0 }))
          .filter((s) => s.count > 0);

        // Top jobs by applications
        const topJobIds = topJobRows.map((r) => r.job_id);
        const topJobs = topJobIds.length
          ? await models.CareerJobs.findAll({ where: { id: topJobIds }, attributes: ["id", "job_title"], raw: true })
          : [];
        const titleById = Object.fromEntries(topJobs.map((j) => [j.id, j.job_title]));
        data.topJobs = topJobRows.map((r) => ({
          name: titleById[r.job_id] || `Job #${r.job_id}`,
          count: Number(r.count),
        }));

        // Recent applications (job + general merged)
        data.recentApplications = [
          ...recentJobApps.map((a) => ({
            id: `job-${a.id}`,
            kind: "Job",
            applicant: a.applicant?.name ?? "Unknown",
            position: a.job?.job_title ?? "—",
            status: a.status?.status_name ?? "—",
            date: a.application_date,
          })),
          ...recentGeneralApps.map((a) => ({
            id: `general-${a.id}`,
            kind: "General",
            applicant: a.applicant?.name ?? "Unknown",
            position: a.role?.role_name ?? a.preferred_role_name ?? "—",
            status: a.status?.status_name ?? "—",
            date: a.application_date,
          })),
        ]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, RECENT_LIMIT);
      }

      // ── Service enquiries ────────────────────────────────────────────────
      if (sections.enquiries) {
        const [serviceEnquiries, serviceEnquiries30d, enquiriesByTypeRows, recentEnquiries] = await Promise.all([
          models.ServiceEnquiries.count(),
          countSince(models.ServiceEnquiries, "createdAt", 30),
          models.ServiceEnquiries.findAll({
            attributes: ["enquiry_type", [fn("COUNT", col("id")), "count"]],
            group: ["enquiry_type"],
            raw: true,
          }),
          models.ServiceEnquiries.findAll({
            attributes: ["id", "name", "city", "enquiry_type", "createdAt"],
            include: [{ model: models.ServiceTypes, as: "service_type", attributes: ["type_name"] }],
            order: [["createdAt", "DESC"]],
            limit: RECENT_LIMIT,
          }),
        ]);

        Object.assign(data.kpis, { serviceEnquiries, serviceEnquiries30d });
        data.enquiriesByType = enquiriesByTypeRows.map((r) => ({
          type: r.enquiry_type,
          count: Number(r.count),
        }));
        data.recentEnquiries = recentEnquiries.map((e) => ({
          id: e.id,
          name: e.name,
          city: e.city ?? "—",
          serviceType: e.service_type?.type_name ?? "—",
          enquiryType: e.enquiry_type,
          date: e.get("createdAt"),
        }));
      }

      await CacheService.set(cacheKey, JSON.stringify(data), CACHE_TTL_SECONDS);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DashboardController;
