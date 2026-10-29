const { DataTypes } = require("sequelize");

// Plain storage only (see celebrationCategories.js). category_id is a plain integer, not a foreign key.
module.exports = (sequelize) => {
  const CelebrationSubcategories = sequelize.define(
    "CelebrationSubcategories",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      category_id: {
        type: DataTypes.INTEGER,
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
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "celebration_subcategories",
      timestamps: true,
      indexes: [{ fields: ["category_id"] }, { fields: ["category_id", "slug"] }],
    }
  );

  CelebrationSubcategories.associate = (models) => {
    CelebrationSubcategories.belongsTo(models.CelebrationCategories, {
      foreignKey: "category_id",
      as: "category",
      constraints: false,
    });
    CelebrationSubcategories.hasMany(models.CelebrationMedia, {
      foreignKey: "subcategory_id",
      as: "mediaItems",
      constraints: false,
    });
  };

  return CelebrationSubcategories;
};
