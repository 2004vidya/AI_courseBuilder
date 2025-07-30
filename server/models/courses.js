const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const courseSchema = new Schema({
  title:       { type: String, required: true },
  description: { type: String },
  createdBy:   { type: Schema.Types.ObjectId, ref: 'User', default: null }, // ✅ allow null
  sections:    [
    {
      id: String,
      title: String,
      lessons: [
        {
          id: String,
          title: String,
          duration: String,
          completed: { type: Boolean, default: false }
        }
      ]
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);

// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const courseSchema = new Schema({
//   title:       { type: String, required: true },
//   description: { type: String },
//   createdBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
//   lessons:     [{ type: Schema.Types.ObjectId, ref: 'Lesson' }]
// }, { timestamps: true });

// module.exports = mongoose.model('Course', courseSchema);
