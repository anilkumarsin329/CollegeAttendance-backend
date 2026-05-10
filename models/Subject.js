const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    class: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    semester: { type: Number, default: 1 },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", default: null },
  },
  { timestamps: true }
);

subjectSchema.index({ class: 1, department: 1, semester: 1 });

module.exports = mongoose.model("Subject", subjectSchema);
