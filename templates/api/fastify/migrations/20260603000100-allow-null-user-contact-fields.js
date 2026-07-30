"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn("users", "email", {
    type: Sequelize.STRING,
    allowNull: true,
  });

  await queryInterface.changeColumn("users", "phone", {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn("users", "email", {
    type: Sequelize.STRING,
    allowNull: false,
  });

  await queryInterface.changeColumn("users", "phone", {
    type: Sequelize.STRING,
    allowNull: false,
  });
}
