import Task from "../models/Task.js";
import User from "../models/user.js";
// Hàm controller: lấy danh sách tất cả task theo filter (today, week, month, all)
export const getAllTasks = async (req, res) => {
  // Lấy query param "filter" từ URL, mặc định là "today"
  // Ví dụ: /tasks?filter=week
  const { filter = "today" } = req.query;

  const now = new Date(); // Lấy thời điểm hiện tại
  let startDate; // Biến để tính ngày bắt đầu filter

  // Xử lý filter
  switch (filter) {
    case "today": {
      // Lấy ngày hôm nay (00:00:00 của ngày hiện tại)
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      break;
    }

    case "week": {
      // Tính ngày thứ 2 đầu tuần (theo ISO: tuần bắt đầu từ Monday)
      const mondayDate =
        now.getDate() -
        (now.getDay() - 1) -
        (now.getDay() === 0 ? 7 : 0); // Nếu là Chủ nhật (0), lùi về tuần trước

      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        mondayDate
      );
      break;
    }

    case "month": {
      // Lấy ngày đầu tiên của tháng
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    }

    case "all":
    default: {
      // Nếu filter = all hoặc không có filter → không giới hạn ngày
      startDate = null;
    }
  }

  // Tạo query filter cho MongoDB
  // Nếu có startDate → lấy task có createdAt >= startDate
  // Nếu không có startDate → lấy tất cả
  const query = startDate ? { createdAt: { $gte: startDate } } : {};

  try {
    // Sử dụng aggregate pipeline để query + tính toán nhiều kết quả một lúc
    const result = await Task.aggregate([
      { $match: query }, // Bước 1: lọc theo query

      {
        $facet: {
          // Nhánh 1: Lấy danh sách task, sort theo createdAt giảm dần
          tasks: [{ $sort: { createdAt: -1 } }],

          // Nhánh 2: Đếm số task có status = "active"
          activeCount: [
            { $match: { status: "active" } },
            { $count: "count" },
          ],

          // Nhánh 3: Đếm số task có status = "complete"
          completeCount: [
            { $match: { status: "complete" } },
            { $count: "count" },
          ],
        },
      },
    ]);

    // Lấy kết quả từ aggregate
    const tasks = result[0].tasks; // danh sách task
    const activeCount = result[0].activeCount[0]?.count || 0; // số lượng task active
    const completeCount = result[0].completeCount[0]?.count || 0; // số lượng task complete

    // Trả kết quả về client
    res.status(200).json({ tasks, activeCount, completeCount });
  } catch (error) {
    // Xử lý khi lỗi DB hoặc code
    console.error("lỗi khi gọi getAllTasks", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const createTask = async (req, res) => {
  try {
    const user = await User.findOne({
      Email: "qkhang154567890dragon@gmail.com",
    });
    // CÁCH 1: const newTask = await Task.create({ title: "Học Mongoose" }); Viết gọn

    const { title } = req.body;
    const task = new Task({ title, user: user._id });
    const newTask = await task.save();

    res.status(201).json(newTask);
  } catch (error) {
    console.error("lỗi khi gọi createTask", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Hàm controller để cập nhật 1 task theo id
export const updateTask = async (req, res) => {
  try {
    // Lấy dữ liệu từ body request (client gửi lên)
    const { title, status, completedAt } = req.body;

    // Tìm task theo id (req.params.id) và cập nhật dữ liệu mới
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id, // id lấy từ URL (ví dụ: /tasks/66ec1f3a7a...)
      {
        title, // cập nhật title
        status, // cập nhật status
        completedAt, // cập nhật completedAt
      },
      { new: true } // new: true => trả về document sau khi cập nhật (mặc định là document cũ)
    );

    // Nếu không tìm thấy task nào với id đó
    if (!updatedTask) {
      return res
        .status(404) // Trả về HTTP 404 Not Found
        .json({ message: "Không tìm thấy nhiệm vụ" });
    } else {
      // Nếu tìm thấy và cập nhật thành công, trả về task mới
      res.status(200).json(updatedTask);
    }
  } catch (error) {
    // Nếu có lỗi (id sai, DB lỗi, ...)
    console.error("lỗi khi gọi updateTask", error);
    res.status(500).json({ message: "Lỗi hệ thống" }); // Trả về HTTP 500 Internal Server Error
  }
};

export const deleteTask = async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy nhiệm vụ" });
    }
    res.status(200).json(deletedTask);
  } catch (error) {
    console.error("lỗi khi gọi deleteTask", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// const updatedTask = await Task.findByIdAndUpdate(
//   req.params.id,           // id của task cần update (lấy từ URL)
//   { title, status, completedAt }, // dữ liệu mới (cập nhật những field này)
//   { new: true }            // option: trả về document mới sau khi update
// );
