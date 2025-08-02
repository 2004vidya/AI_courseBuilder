const express = require("express");
const router = express.Router();
const Course = require("../models/courses");
const { generateCourseStructure, generateLessonContent } = require("../controllers/generateController");

// ✅ Generate + Save a Course
router.post("/generate", generateCourseStructure);


// ✅ Get Course by ID
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json(course);
  } catch (err) {
    console.error("❌ Error fetching course:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get All Courses
router.get("/", async (req, res) => {
  const courses = await Course.find();
  res.json(courses);
});

// ✅ Generate Lesson Content
router.post("/generate-lesson-content", generateLessonContent);

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const Course = require('../models/course.model');

// // Create Course
// router.post('/', async (req, res) => {
//   try {
//     const course = new Course(req.body);
//     await course.save();
//     res.status(201).json(course);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// // Get All Courses
// router.get('/', async (req, res) => {
//   const courses = await Course.find().populate('createdBy');
//   res.json(courses);
// });

// // Get One Course
// router.get('/:id', async (req, res) => {
//   const course = await Course.findById(req.params.id).populate('lessons');
//   res.json(course);
// });

// // Update Course
// router.put('/:id', async (req, res) => {
//   const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
//   res.json(course);
// });

// // Delete Course
// router.delete('/:id', async (req, res) => {
//   await Course.findByIdAndDelete(req.params.id);
//   res.json({ message: 'Course deleted' });
// });

// module.exports = router;
