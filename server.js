const { Server } = require("socket.io");

/**
 * Senior Backend Implementation: Socket.io Room Garbage Collection
 * 
 * OBJECTIVE: Fix "Stale Room" bug where game states persist in memory 
 * after all players disconnect.
 * 
 * This handler manages room lifecycle, ensuring immediate memory purge
 * (Garbage Collection) when a room becomes empty.
 */

// In-memory persistent storage for active games
// Structure: Map<roomId, { state: GameState, users: Set<socketId> }>
const games = new Map();

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`[Socket] User Connected: ${socket.id}`);

    /**
     * JOIN ROOM HANDLER
     * Logic: If a room id is empty in memory, initialize it from scratch.
     * Otherwise, join the existing active session.
     */
    socket.on("join_room", (roomId) => {
      // Step 1: Ensure room exists in memory, or create a fresh one
      if (!games.has(roomId)) {
        console.log(`[GC] Initializing NEW Game State for Room: ${roomId}`);
        games.set(roomId, {
          state: {
            board: Array(24).fill(null),
            currentPlayer: 'white',
            phase: 'placing',
            whitePiecesPlaced: 0,
            blackPiecesPlaced: 0,
            whitePiecesOnBoard: 0,
            blackPiecesOnBoard: 0,
            selectedPiece: null,
            mustRemove: false,
            winner: null,
            moveHistory: []
          },
          users: new Set()
        });
      }

      // Step 2: Add user to the room's participant list
      const room = games.get(roomId);
      room.users.add(socket.id);
      socket.join(roomId);

      // Store roomId on socket for efficient lookup during disconnect
      socket.currentRoom = roomId;

      console.log(`[Room] User ${socket.id} joined ${roomId}. Total: ${room.users.size}`);

      // Step 3: Sync current state to the joining user
      socket.emit("game_state_sync", room.state);
    });

    /**
     * LEAVE / DISCONNECT HANDLER
     * Logic: Implements immediate Garbage Collection. If a room hits 0 users,
     * it is purged from memory to prevent "Stale Room" inheritance.
     */
    const handleLeaveRoom = () => {
      const roomId = socket.currentRoom;
      if (!roomId || !games.has(roomId)) return;

      const room = games.get(roomId);
      
      // Step A: Remove user from the list
      room.users.delete(socket.id);
      socket.leave(roomId);

      console.log(`[Room] User ${socket.id} left ${roomId}. Remaining: ${room.users.size}`);

      // Step C (CRITICAL): Check occupancy for Garbage Collection
      if (room.users.size === 0) {
        // PURGE: Remove room object from server memory immediately
        console.log(`[GC] DELETING Room: ${roomId} (Zero occupancy). Memory cleared.`);
        games.delete(roomId);
      } else if (room.users.size === 1) {
        // NOTIFY: Inform the remaining player and handle game interruption
        console.log(`[Notify] Opponent left ${roomId}. Notifying survivor.`);
        io.to(roomId).emit("opponent_disconnected", {
          message: "Opponent left. You can wait or return to menu.",
          isStale: true
        });
        
        // Optionally reset specific state flags if the game shouldn't continue
        room.state.isPaused = true;
      }

      socket.currentRoom = null;
    };

    socket.on("leave_room", handleLeaveRoom);
    socket.on("disconnect", handleLeaveRoom);
  });
};
