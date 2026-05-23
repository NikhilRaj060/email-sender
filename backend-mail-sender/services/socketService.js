const { Server } = require("socket.io");

let io = null;

const init = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Allow all origins for simplicity (or specifically the frontend)
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket.IO client connected: ${socket.id}`);

    socket.on("join-job", (jobId) => {
      socket.join(jobId);
      console.log(`Client ${socket.id} joined room: ${jobId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket.IO client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => io;

const emitProgress = (jobId, progressData) => {
  if (io) {
    io.to(jobId).emit("job-progress", progressData);
    // Also broadcast a general event for dashboard updates
    io.emit("job-updated", progressData);
  }
};

module.exports = { init, getIO, emitProgress };
