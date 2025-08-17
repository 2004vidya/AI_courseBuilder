const express = require("express");
const router = express.Router();
const Course = require("../models/courses");
const { generateCourseStructure, generateLessonContent } = require("../controllers/generateController");

// ✅ Generate + Save a Course
router.post("/generate", generateCourseStructure);

// ✅ Get Course by ID
router.get("/:id", async (req, res) => {
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



/* ================================
   📌 Progress Tracking Routes
================================ */

// ✅ Update single lesson progress
// PUT /api/courses/:courseId/lesson/progress
router.put("/:courseId/lesson/progress", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { sectionId, lessonId, completed, bookmarked } = req.body;

    if (!sectionId || !lessonId) {
      return res.status(400).json({ error: "sectionId and lessonId are required" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const section = course.sections.find(
      (s) =>
        (s.id && s.id === sectionId) ||
        (s._id && s._id.toString() === sectionId) ||
        `section-${course.sections.indexOf(s)}` === sectionId
    );
    if (!section) return res.status(404).json({ error: "Section not found" });

    const lesson = section.lessons.find(
      (l) =>
        (l.id && l.id === lessonId) ||
        (l._id && l._id.toString() === lessonId) ||
        section.lessons.indexOf(l).toString() === lessonId
    );
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    // Update lesson status
    if (typeof completed !== "undefined") {
      lesson.completed = completed;
      lesson.completedAt = completed ? new Date() : null;
    }
    if (typeof bookmarked !== "undefined") {
      lesson.bookmarked = bookmarked;
      lesson.bookmarkedAt = bookmarked ? new Date() : null;
    }

    // Save and recalc progress
    await course.save();
    const allLessons = course.sections.flatMap((s) => s.lessons || []);
    const completedCount = allLessons.filter((l) => l.completed).length;
    const totalCount = allLessons.length;
    const progressPercentage =
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    course.progress = progressPercentage;
    course.lastAccessed = new Date();
    course.completed = progressPercentage === 100;
    course.completedAt = course.completed ? new Date() : null;

    await course.save();

    res.json(course);
  } catch (error) {
    console.error("Error updating lesson progress:", error);
    res.status(500).json({
      error: "Failed to update lesson progress",
      details: error.message,
    });
  }
});

// ✅ Get progress summary
// GET /api/courses/:courseId/progress
router.get("/:courseId/progress", async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const allLessons = course.sections.flatMap((s) => s.lessons || []);
    const completedLessons = allLessons.filter((l) => l.completed);
    const bookmarkedLessons = allLessons.filter((l) => l.bookmarked);

    const progressData = {
      courseId: course._id,
      title: course.title,
      totalLessons: allLessons.length,
      completedLessons: completedLessons.length,
      bookmarkedLessons: bookmarkedLessons.length,
      progressPercentage:
        allLessons.length > 0
          ? Math.round((completedLessons.length / allLessons.length) * 100)
          : 0,
      isCompleted: course.completed || false,
      lastAccessed: course.lastAccessed,
      completedAt: course.completedAt,
      sections: course.sections.map((section, sIndex) => ({
        id: section.id || `section-${sIndex}`,
        title: section.title,
        totalLessons: section.lessons?.length || 0,
        completedLessons:
          section.lessons?.filter((l) => l.completed).length || 0,
        progressPercentage:
          section.lessons?.length > 0
            ? Math.round(
                (section.lessons.filter((l) => l.completed).length /
                  section.lessons.length) *
                  100
              )
            : 0,
        lessons:
          section.lessons?.map((lesson, lIndex) => ({
            id: lesson.id || lIndex,
            title: lesson.title,
            completed: lesson.completed || false,
            bookmarked: lesson.bookmarked || false,
            completedAt: lesson.completedAt,
            bookmarkedAt: lesson.bookmarkedAt,
          })) || [],
      })),
    };

    res.json(progressData);
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({
      error: "Failed to fetch progress data",
      details: error.message,
    });
  }
});

// ✅ Batch update lessons
// PUT /api/courses/:courseId/lessons/batch-update
router.put("/:courseId/lessons/batch-update", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: "Updates must be an array" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    for (const update of updates) {
      const { sectionId, lessonId, completed, bookmarked } = update;
      const section = course.sections.find(
        (s) => (s.id && s.id === sectionId) || `section-${course.sections.indexOf(s)}` === sectionId
      );
      if (section) {
        const lesson = section.lessons.find(
          (l) => (l.id && l.id === lessonId) || section.lessons.indexOf(l).toString() === lessonId
        );
        if (lesson) {
          if (typeof completed !== "undefined") {
            lesson.completed = completed;
            lesson.completedAt = completed ? new Date() : null;
          }
          if (typeof bookmarked !== "undefined") {
            lesson.bookmarked = bookmarked;
            lesson.bookmarkedAt = bookmarked ? new Date() : null;
          }
        }
      }
    }

    const allLessons = course.sections.flatMap((s) => s.lessons || []);
    const completedCount = allLessons.filter((l) => l.completed).length;
    const totalCount = allLessons.length;
    const progressPercentage =
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    course.progress = progressPercentage;
    course.lastAccessed = new Date();
    course.completed = progressPercentage === 100;
    course.completedAt = course.completed ? new Date() : null;

    await course.save();
    res.json(course);
  } catch (error) {
    console.error("Error batch updating lessons:", error);
    res.status(500).json({
      error: "Failed to batch update lessons",
      details: error.message,
    });
  }
});

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
