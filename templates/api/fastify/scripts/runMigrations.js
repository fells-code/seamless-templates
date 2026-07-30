import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// sequelize-cli reads the config, migrations, and models from the source tree at
// runtime (see .sequelizerc), so the same source config is used in dev and prod.
const configPath = path.join(__dirname, "../config/config.js");

function run(command) {
  execSync(command, {
    stdio: "inherit",
  });
}

try {
  console.log("📦 Running database migrations...");

  try {
    run(`npx sequelize-cli db:migrate --config ${configPath}`);
    console.log("✅ Database migrations complete.");
  } catch (err) {
    console.log("⚠️ Migration failed. Attempting database creation...");

    try {
      run(`npm run db:create`);
      console.log("✅ Database created. Retrying migrations...");

      run(`npx sequelize-cli db:migrate --config ${configPath}`);
      console.log("✅ Database migrations complete.");
    } catch (createErr) {
      console.error("❌ Failed to create database or run migrations.");
      console.error(createErr);
      process.exit(1);
    }
  }
} catch (err) {
  console.error("❌ Unexpected error during migration startup.");
  console.error(err);
  process.exit(1);
}
