"use strict";

/**
 * Add a deletion timestamp to jobs so deleting a posting preserves its
 * application history while excluding it from normal job queries.
 *
 * Run: node migrations/20261017_add_jobs_deleted_at.js
 * Roll back: node migrations/20261017_add_jobs_deleted_at.js down
 */

const sequelize = require("../config/database");
require("dotenv").config();

async function up() {
  await sequelize.query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;`);
  console.log("Added jobs.deleted_at for soft deletion.");
}

async function down() {
  await sequelize.query(`ALTER TABLE jobs DROP COLUMN IF EXISTS deleted_at;`);
  console.log("Dropped jobs.deleted_at.");
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
