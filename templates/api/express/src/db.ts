import getLogger from "./lib/logger";

const logger = getLogger("db");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const connectToDb = async (models: { [key: string]: any }) => {
  try {
    await models.sequelize.authenticate();
    logger.info("✅ Database connection established successfully.");
  } catch (error) {
    logger.error("Failed to connect to the database:", error);
    throw error;
  }
};
