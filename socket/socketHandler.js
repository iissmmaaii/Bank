const activeSockets = {}; // transactionId => socket

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('🔌 New socket connected:', socket.id);

    socket.on('join-transaction', (transactionId) => {
      console.log(`📦 Joining transaction room: ${transactionId}`);
      socket.join(transactionId);
      activeSockets[transactionId] = socket;
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      // يمكنك تنظيف الـ activeSockets إذا حبيت
    });
  });
}

module.exports = { setupSocket, activeSockets };
