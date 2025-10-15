import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// store connected users and drivers
const users = {};   // user_id -> socket.id
const drivers = {}; // driver_id -> socket.id

io.on("connection", (socket) => {
  console.log("Socket Connected:", socket.id);

  // When user connects
  socket.on("registerUser", (user_id) => {
    socket.user_id = user_id;
    users[user_id] = socket.id;

    // send confirmation back to this specific socket
    io.to(socket.id).emit("registrationConfirmed", {
      success: true,
      message: "Socket Connected",
    });
  });

  // When driver connects
  socket.on("registerDriver", (driver_id) => {
    socket.driver_id = driver_id;
    drivers[driver_id] = socket.id;

    // send confirmation back to this specific socket
    io.to(socket.id).emit("registrationConfirmed", {
      success: true,
      message: "Socket Connected",
    });
  });

  // User sends booking confirmation
  socket.on("newBooking", (bookingData) => {
    if (Object.keys(drivers).length === 0) {
      return;
    };

    for (const driverSocketId of Object.values(drivers)) {
      io.to(driverSocketId).emit("incomingBooking", bookingData);
    };
  });

  // Driver accepts booking
  socket.on("driverAccepted", (data) => {
    const { user_id, booking_id, driverDetails, carDetails } = data;
    const userSocket = users[user_id];

    if (userSocket) {
      io.to(userSocket).emit("bookingAccepted", {
        user_id,
        booking_id,
        driverDetails,
        carDetails,
      });
    };
  });

  // Driver rejects booking
  socket.on("driverRejected", (data) => {
    const { user_id, booking_id, driverDetails, carDetails } = data;
    const userSocket = users[user_id];

    if (userSocket) {
      io.to(userSocket).emit("bookingRejected", {
        user_id,
        booking_id,
        driverDetails,
        carDetails,
      });
    };
  });

  // When socket disconnected
  socket.on("disconnect", () => {
    if (socket.user_id) {
      delete users[socket.user_id];
    };

    if (socket.driver_id) {
      delete drivers[socket.driver_id];
    };
  });
});

server.listen(4001, () => {
  console.log("Socket Server running on port 4001");
});
