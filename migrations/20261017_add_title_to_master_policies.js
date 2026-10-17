"use strict";

/**
 * Migration: add_title_to_master_policies
 *
 * Adds an optional "title" column to master_policies, letting each policy
 * override the page's default slug-derived heading, matching the new
 * field in models/policies/policies.js.
 *
 * Run:  node migrations/20261017_add_title_to_master_policies.js
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
require("dotenv").config();

const queryInterface = sequelize.getQueryInterface();

const TABLE = "master_policies";
const COLUMN = "title";

async function up() {
  const table = await queryInterface.describeTable(TABLE);
  if (table[COLUMN]) {
    console.log(`Column "${COLUMN}" already exists on "${TABLE}" — skipping.`);
    return;
  }

  await queryInterface.addColumn(TABLE, COLUMN, {
    type: DataTypes.STRING,
    allowNull: true,
  });

  console.log(`Added column "${COLUMN}" to "${TABLE}".`);
}

async function down() {
  await queryInterface.removeColumn(TABLE, COLUMN);
  console.log(`Removed column "${COLUMN}" from "${TABLE}".`);
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
