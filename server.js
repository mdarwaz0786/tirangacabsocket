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
    users[user_id] = socket.id;
    console.log("User Registered:", user_id);

    // send confirmation back to this specific socket
    io.to(socket.id).emit("registrationConfirmed", {
      type: "user",
      userId: user_id,
      success: true,
      message: "User socket registered successfully",
    });
  });

  // When driver connects
  socket.on("registerDriver", (driver_id) => {
    drivers[driver_id] = socket.id;
    console.log("Driver Registered:", driver_id);

    // send confirmation back to this driver socket
    io.to(socket.id).emit("registrationConfirmed", {
      type: "driver",
      driverId: driver_id,
      success: true,
      message: "Driver socket registered successfully",
    });
  });

  // User sends booking confirmation
  socket.on("newBooking", (bookingData) => {
    console.log("New Booking Received:", bookingData);

    // Send booking to all connected drivers
    Object.values(drivers).forEach((driverSocketId) => {
      io.to(driverSocketId).emit("incomingBooking", bookingData);
    });
  });

  // Driver accepts booking
  socket.on("driverAccepted", (data) => {
    console.log("Driver Accepted Booking:", data);
    const { user_id, booking_id, driverDetails } = data;
    const userSocket = users[user_id];
    if (userSocket) {
      io.to(userSocket).emit("bookingAccepted", {
        user_id,
        booking_id,
        driverDetails,
      });
    };
  });

  // Driver rejects booking
  socket.on("driverRejected", (data) => {
    const { user_id, booking_id, driverDetails } = data;
    const userSocket = users[user_id];
    if (userSocket) {
      io.to(userSocket).emit("bookingRejected", {
        user_id,
        booking_id,
        driverDetails,
      });
    };
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

server.listen(4001, () => {
  console.log("Socket Server running on port 4001");
});
