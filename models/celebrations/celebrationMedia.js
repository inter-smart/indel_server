const { DataTypes } = require("sequelize");

// Plain storage only (see celebrationCategories.js). subcategory_id is a plain integer, not a foreign key.
module.exports = (sequelize) => {
  const CelebrationMedia = sequelize.define(
    "CelebrationMedia",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      subcategory_id: {
        type: DataTypes.INTEGER,
      },
      image: {
        type: DataTypes.STRING,
      },
      image_alt: {
        type: DataTypes.STRING,
      },
      // uploaded file path or an http(s) URL (e.g. YouTube)
      video: {
        type: DataTypes.STRING,
      },
      video_thumbnail: {
        type: DataTypes.STRING,
      },
      thumbnail_alt: {
        type: DataTypes.STRING,
      },
      is_video: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
      tableName: "celebration_media",
      timestamps: true,
      indexes: [{ fields: ["subcategory_id", "is_active", "is_video", "order"] }],
    }
  );

  CelebrationMedia.associate = (models) => {
    CelebrationMedia.belongsTo(models.CelebrationSubcategories, {
      foreignKey: "subcategory_id",
      as: "subcategory",
      constraints: false,
    });
  };

  return CelebrationMedia;
};
