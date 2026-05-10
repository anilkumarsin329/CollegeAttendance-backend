const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    rollNo: { type: String, required: true, unique: true, trim: true },
    class: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    semester: { type: Number, default: 1 },
    phone: { type: String, default: "" },
  },
  { timestamps: true }
);

studentSchema.index({ class: 1, department: 1, semester: 1 });

module.exports = mongoose.model("Student", studentSchema);
