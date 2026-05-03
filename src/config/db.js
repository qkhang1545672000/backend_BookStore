import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
    console.log("Connected to the database 22");
  } catch (error) {
    console.error("lỗi kết nối csdl", error);
    process.exit(1); // dừng chương trình nếu có lỗi
  }
};
