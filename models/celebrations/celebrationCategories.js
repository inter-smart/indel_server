const { DataTypes } = require("sequelize");

// Plain storage only: no foreign keys, unique indexes, NOT NULL or validate rules.
// Every rule (required title, unique slug, ...) is enforced in the validators and controllers.
module.exports = (sequelize) => {
  const CelebrationCategories = sequelize.define(
    "CelebrationCategories",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
      },
      slug: {
        type: DataTypes.STRING,
      },
      description: {
        type: DataTypes.TEXT,
      },
      cover_image: {
        type: DataTypes.STRING,
      },
      image_alt: {
        type: DataTypes.STRING,
      },
      order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      is_slider: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "celebration_categories",
      timestamps: true,
      indexes: [{ fields: ["slug"] }],
    }
  );

  CelebrationCategories.associate = (models) => {
    CelebrationCategories.hasMany(models.CelebrationSubcategories, {
      foreignKey: "category_id",
      as: "subcategories",
      constraints: false,
    });
  };

  return CelebrationCategories;
};
