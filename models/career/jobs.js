const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Jobs = sequelize.define(
    "Jobs",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "roles",
          key: "id",
        },
      },
      job_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // Removed location_id and state_id columns
      job_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      experience: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_approved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_display_full_locations: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      is_pan_india: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "If true, this job is available across all of India and location/state restrictions don't apply",
      },
      reapply_period_months: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 6,
        comment: "Number of months a candidate must wait before reapplying for this job",
        validate: {
          min: 1,
          max: 24,
        },
      },
    },
    {
      tableName: "jobs",
      timestamps: true,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  Jobs.associate = (models) => {
    Jobs.belongsTo(models.CareerRoles, {
      foreignKey: "role_id",
      as: "role",
    });

    // Define many-to-many association with CareerLocations through JobLocation
    Jobs.belongsToMany(models.CareerLocations, {
      through: models.JobLocation,
      foreignKey: "job_id",
      otherKey: "location_id",
      as: "locations", // Alias for the association
    });

    // Define many-to-many association with CareerStates through JobState
    Jobs.belongsToMany(models.CareerStates, {
      through: models.JobState,
      foreignKey: "job_id",
      otherKey: "state_id",
      as: "states", // Alias for the association
    });
  };

  return Jobs;
};
