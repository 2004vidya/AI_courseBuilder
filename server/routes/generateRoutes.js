const express = require("express");
const router = express.Router();
const { generateCourseStructure, generateLessonContent } = require("../controllers/generateController.js");

// Endpoint to generate only course structure
router.post("/generate-course-structure", generateCourseStructure);

// Endpoint to generate full content for a specific lesson
router.post("/generate-lesson-content", generateLessonContent);

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const { generateCourse } = require("../controllers/generateController");

// router.post("/generate-course", generateCourse);

// module.exports = router;
