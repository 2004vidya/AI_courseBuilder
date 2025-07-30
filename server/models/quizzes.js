const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const quizSchema = new Schema({
  lesson:    { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
  questions: [{
    question:   { type: String, required: true },
    options:    [{ type: String }],
    answer:     { type: String, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
