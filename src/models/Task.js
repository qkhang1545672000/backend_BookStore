import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "complete"],
      default: "active",
    },
    completedAt: {
      type: Date,
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // ref phải trùng với tên model User bạn export
      required: true, // bắt buộc phải có
    },
  },

  {
    timestamps: true, // create createdAt and updatedAt fields tự đọng thêm vào
  }
);

const Task = mongoose.model("Task", taskSchema);
export default Task;
