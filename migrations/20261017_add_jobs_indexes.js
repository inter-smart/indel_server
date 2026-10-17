"use strict";

/**
 * Migration: add_jobs_indexes
 *
 * Adds indexes to the "jobs" table to speed up the career/admin job listing
 * queries (JobsController.getAll / getAllFiltered), which filter on
 * is_active/is_approved/end_date and role_id with no supporting index.
 *
 * Run:  node migrations/20261017_add_jobs_indexes.js
 */

const sequelize = require("../config/database");
require("dotenv").config();

async function up() {
  await sequelize.query(
    `CREATE INDEX IF NOT EXISTS jobs_is_active_is_approved_end_date_idx
     ON jobs (is_active, is_approved, end_date);`
  );
  await sequelize.query(
    `CREATE INDEX IF NOT EXISTS jobs_role_id_idx ON jobs (role_id);`
  );
  console.log("Added indexes on jobs(is_active, is_approved, end_date) and jobs(role_id).");
}

async function down() {
  await sequelize.query(`DROP INDEX IF EXISTS jobs_is_active_is_approved_end_date_idx;`);
  await sequelize.query(`DROP INDEX IF EXISTS jobs_role_id_idx;`);
  console.log("Dropped jobs indexes.");
}

const command = process.argv[2]; // "up" | "down"

(async () => {
  try {
    await sequelize.authenticate();
    if (command === "down") {
      await down();
    } else {
      await up();
    }
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
})();
