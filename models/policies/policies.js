const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const MasterPolicies = sequelize.define(
    "MasterPolicies",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      meta_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM(
          "privacy-policy",
          "disclaimer",
          "mobile-app-privacy-policy-indel-money-private-limited",
          "fair-practices-code",
          "gold-loan-terms-and-conditions",
          "kyc-policy",
          "methodology-and-valuation-of-gold-collateral",
          "contest",
        ),
        allowNull: true,
      },
      meta_description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      meta_keywords: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "master_policies",
      timestamps: true,
    }
  );
  

  return MasterPolicies;
};
