const amqp = require("amqplib");

let connection = null;
let channel = null;
const QUEUE_NAME = "email_queue";
const assertedQueues = new Set();

const connectQueue = async () => {
  try {

    if (!process.env.RABBITMQ_URL) {
      console.log("⚠️ RABBITMQ_URL not configured. Skipping RabbitMQ connection.");
      return;
    }

    connection = await amqp.connect(process.env.RABBITMQ_URL);

    channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
    });

    console.log("✅ RabbitMQ connected successfully");

  } catch (err) {
    console.error("❌ RabbitMQ connection failed:", err);
  }
};

const getChannel = () => channel;
const getConnection = () => connection;

/**
 * Purge all pending messages from a user's queue.
 * Call on startup to clear stale messages from previous killed runs.
 */
const purgeUserQueue = async (userId) => {
  if (!channel) return;
  const queueName = `email_queue_${userId}`;
  try {
    await channel.assertQueue(queueName, { durable: true });
    const result = await channel.purgeQueue(queueName);
    console.log(`🧹 Purged ${result.messageCount} stale messages from user queue: ${queueName}`);
  } catch (err) {
    console.error(`⚠️ Failed to purge queue for user ${userId}:`, err);
  }
};

const publishEmail = async (jobId, data) => {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized");
  }
  const userId = data.userId;
  if (!userId) {
    throw new Error("userId is required to publish email to a user-specific queue");
  }
  const queueName = `email_queue_${userId}`;
  if (!assertedQueues.has(queueName)) {
    await channel.assertQueue(queueName, { durable: true });
    assertedQueues.add(queueName);
  }
  channel.sendToQueue(
    queueName,
    Buffer.from(
      JSON.stringify({
        jobId,
        data,
      })
    ),
    { persistent: true }
  );
};

module.exports = {
  connectQueue,
  getChannel,
  getConnection,
  purgeUserQueue,
  publishEmail,
  QUEUE_NAME,
};
