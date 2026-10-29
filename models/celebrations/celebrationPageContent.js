const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CelebrationPageContent = sequelize.define(
    "CelebrationPageContent",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      meta_title: {
        type: DataTypes.STRING,
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
      other_meta_tags: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "celebration_page_content",
      timestamps: true,
    }
  );

  return CelebrationPageContent;
};
