"use strict";

/**
 * Migration: add_thumbnail_to_hero_banners
 *
 * Adds an optional "thumbnail" column to hero_banners, used as the poster
 * image for video banners, matching the new field in
 * models/homePage/heroBanner.js.
 *
 * Run:  node migrations/20261022_add_thumbnail_to_hero_banners.js
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
require("dotenv").config();

const queryInterface = sequelize.getQueryInterface();

const TABLE = "hero_banners";
const COLUMN = "thumbnail";

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
