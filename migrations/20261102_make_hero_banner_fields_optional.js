"use strict";

/**
 * Migration: make_hero_banner_fields_optional
 *
 * Drops the NOT NULL constraint on title, button_text, button_link and
 * image_alt_text in hero_banners, so video-only banners (media_type=video)
 * can be saved without these fields, matching the relaxed validation in
 * utils/validator.js and models/homePage/heroBanner.js.
 *
 * Run:  node migrations/20261102_make_hero_banner_fields_optional.js
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
require("dotenv").config();

const queryInterface = sequelize.getQueryInterface();

const TABLE = "hero_banners";
const COLUMNS = ["title", "button_text", "button_link", "image_alt_text"];

async function up() {
  for (const column of COLUMNS) {
    await queryInterface.changeColumn(TABLE, column, {
      type: DataTypes.STRING,
      allowNull: true,
    });
    console.log(`Made column "${column}" on "${TABLE}" nullable.`);
  }
}

async function down() {
  for (const column of COLUMNS) {
    await queryInterface.changeColumn(TABLE, column, {
      type: DataTypes.STRING,
      allowNull: false,
    });
    console.log(`Restored NOT NULL on column "${column}" on "${TABLE}".`);
  }
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
