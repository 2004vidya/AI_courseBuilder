const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const lessonSchema = new Schema({
  course:    { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  title:     { type: String, required: true },
  content:   { type: String, required: true },
  order:     { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Lesson', lessonSchema);
