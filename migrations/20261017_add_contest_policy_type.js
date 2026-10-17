"use strict";

/**
 * Migration: add_contest_policy_type
 *
 * Adds the "contest" value to the Postgres enum type backing
 * master_policies.type, matching the new entry in
 * models/policies/policies.js.
 *
 * Run:  node migrations/20261017_add_contest_policy_type.js
 */

const sequelize = require("../config/database");
require("dotenv").config();

const TABLE = "master_policies";
const COLUMN = "type";
const NEW_VALUE = "contest";

async function getEnumTypeName() {
  const [rows] = await sequelize.query(
    `SELECT t.typname
     FROM pg_type t
     JOIN pg_attribute a ON a.atttypid = t.oid
     JOIN pg_class c ON c.oid = a.attrelid
     WHERE c.relname = :table AND a.attname = :column`,
    { replacements: { table: TABLE, column: COLUMN } }
  );
  if (!rows.length) {
    throw new Error(`Could not find enum type for ${TABLE}.${COLUMN}`);
  }
  return rows[0].typname;
}

async function up() {
  const enumType = await getEnumTypeName();
  await sequelize.query(`ALTER TYPE "${enumType}" ADD VALUE IF NOT EXISTS '${NEW_VALUE}';`);
  console.log(`Added "${NEW_VALUE}" to enum type "${enumType}".`);
}

async function down() {
  // Postgres does not support removing a value from an enum type directly.
  console.log(
    `No-op: Postgres does not support removing "${NEW_VALUE}" from the enum without recreating the type.`
  );
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
