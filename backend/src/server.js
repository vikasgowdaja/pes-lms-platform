import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { app } from "./app.js";

const startServer = async () => {
  try {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`API running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();
