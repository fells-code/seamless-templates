import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === "production";

const configPath = isProd
  ? path.join(__dirname, "../dist/config/config.js")
  : path.join(__dirname, "../config/config.js");

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
