import mongoose from "mongoose";

let cachedConnection = global.mongooseConnection;

export const connectDB = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    cachedConnection = await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
    global.mongooseConnection = cachedConnection;
    console.log("Connected to the database");
    return cachedConnection;
  } catch (error) {
    console.error("Database connection error", error);
    throw error;
  }
};
