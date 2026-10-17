// utils/deactivateExpiredJobs.js
//
// Deactivates career job postings whose end_date has passed. This used to run
// inline inside JobsController.getAll on every GET request (a write + table
// scan on every page load of the admin jobs list), which was a major source
// of latency. Moved to a periodic cron job instead, following the pattern in
// utils/fileExpiration.js.
const cron = require("node-cron");
const { Op } = require("sequelize");
const { models } = require("../models/index");

const Jobs = models.CareerJobs;

async function deactivateExpiredJobs() {
  await Jobs.update(
    { is_active: false },
    {
      where: {
        end_date: {
          [Op.ne]: null,
          [Op.lt]: new Date(),
        },
        is_active: true,
      },
    },
  );
}

// Runs hourly so expired jobs don't stay active/visible for long.
cron.schedule(
  "0 * * * *",
  async () => {
    try {
      await deactivateExpiredJobs();
    } catch (error) {
      console.error("Error deactivating expired jobs:", error);
    }
  },
  {
    timezone: "Asia/Kolkata",
  },
);

module.exports = { deactivateExpiredJobs };
