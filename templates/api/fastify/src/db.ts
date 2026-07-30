import getLogger from "./lib/logger.js";

const logger = getLogger("db");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const connectToDb = async (models: { [key: string]: any }) => {
  try {
    await models.sequelize.authenticate();
    logger.info("✅ Database connection established successfully.");
  } catch (error) {
    logger.error({ err: error }, "Failed to connect to the database");
    throw error;
  }
};
