const mongoose = require("mongoose");
const { DB_URL } = require("./config");

mongoose.set("strictQuery", true);

exports.conDB = async () => {
  try {
    await mongoose.connect(DB_URL, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
  }
};
