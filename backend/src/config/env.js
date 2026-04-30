import dotenv from "dotenv";

dotenv.config();

const requiredVars = ["MONGO_URI", "JWT_SECRET"];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  judge0BaseUrl: process.env.JUDGE0_BASE_URL || "",
  judge0ApiKey: process.env.JUDGE0_API_KEY || "",
  judge0Host: process.env.JUDGE0_HOST || "",
  cheatingViolationThreshold: Number(process.env.CHEATING_VIOLATION_THRESHOLD || 5)
};
