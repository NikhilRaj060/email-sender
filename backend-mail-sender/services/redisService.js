const redis = require("redis");

let client = null;

const connectRedis = async () => {
  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
      socket: process.env.REDIS_URL?.startsWith("rediss://")
        ? {
          tls: true,
          rejectUnauthorized: false,
        }
        : {},
    });

    client.on("error", (err) => {
      console.error("Redis Client Error", err);
    });

    await client.connect();

    console.log("✅ Redis connected successfully");
  } catch (err) {
    console.error("❌ Redis connection failed:", err);
  }
};

const getClient = () => client;

/**
 * Initialize job progress in Redis
 */
const initJobProgress = async (jobId, { totalCount, status }) => {
  if (!client) return;
  const key = `job:progress:${jobId}`;
  await client.hSet(key, {
    totalCount: totalCount.toString(),
    sentCount: "0",
    failedCount: "0",
    coolDownCount: "0",
    status: status,
    percentage: "0",
  });
  // Set expiry of 2 days so old jobs don't leak memory
  await client.expire(key, 172800);
};

/**
 * Increment counts and update percentage in Redis
 */
const updateJobProgress = async (jobId, type, increment = 1) => {
  if (!client) return null;
  const key = `job:progress:${jobId}`;

  // Increment the specific field
  let field = "sentCount";
  if (type === "SENT") field = "sentCount";
  else if (type === "FAILED") field = "failedCount";
  else if (type === "COOLDOWN") field = "coolDownCount";

  await client.hIncrBy(key, field, increment);

  // Read current stats to compute percentage
  const stats = await client.hGetAll(key);
  const totalCount = parseInt(stats.totalCount || "0", 10);
  const sentCount = parseInt(stats.sentCount || "0", 10);
  const failedCount = parseInt(stats.failedCount || "0", 10);
  const coolDownCount = parseInt(stats.coolDownCount || "0", 10);

  const processed = sentCount + failedCount + coolDownCount;
  const percentage = totalCount > 0 ? Math.min(100, Math.round((processed / totalCount) * 100)) : 0;

  await client.hSet(key, "percentage", percentage.toString());

  if (processed >= totalCount) {
    await client.hSet(key, "status", "COMPLETED");
  } else {
    await client.hSet(key, "status", "PROCESSING");
  }

  const updatedStats = await client.hGetAll(key);
  return {
    jobId,
    totalCount: parseInt(updatedStats.totalCount, 10),
    sentCount: parseInt(updatedStats.sentCount, 10),
    failedCount: parseInt(updatedStats.failedCount, 10),
    coolDownCount: parseInt(updatedStats.coolDownCount, 10),
    percentage: parseInt(updatedStats.percentage, 10),
    status: updatedStats.status,
  };
};

/**
 * Get job progress from Redis
 */
const getJobProgress = async (jobId) => {
  if (!client) return null;
  const key = `job:progress:${jobId}`;
  const exists = await client.exists(key);
  if (!exists) return null;

  const stats = await client.hGetAll(key);
  return {
    jobId,
    totalCount: parseInt(stats.totalCount || "0", 10),
    sentCount: parseInt(stats.sentCount || "0", 10),
    failedCount: parseInt(stats.failedCount || "0", 10),
    coolDownCount: parseInt(stats.coolDownCount || "0", 10),
    percentage: parseInt(stats.percentage || "0", 10),
    status: stats.status,
  };
};

module.exports = {
  connectRedis,
  getClient,
  initJobProgress,
  updateJobProgress,
  getJobProgress,
};
