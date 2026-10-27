const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const HeroBanner = sequelize.define(
    "HeroBanner",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      button_text: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      button_link: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      state_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "states",
          key: "id",
        },
      },
      media_type: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "image",
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      image_mobile: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      video: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      video_mobile: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      thumbnail: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      video_link: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      image_alt_text: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "hero_banners",
      timestamps: true,
    }
  );

  HeroBanner.associate = (models) => {
    HeroBanner.belongsTo(models.CareerStates, {
      foreignKey: "state_id",
      as: "state",
    });
  };

  return HeroBanner;
};
