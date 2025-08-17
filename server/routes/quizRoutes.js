const express = require('express');
const router = express.Router();
const Quiz = require('../models/quizzes');
const { generateQuizContent } = require('../controllers/generateController'); // Import your quiz function

// Generate Quiz Content (NEW)
router.post('/generate-quiz', generateQuizContent);

// Create Quiz
router.post('/', async (req, res) => {
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();
    res.status(201).json(quiz);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get Quiz by Lesson
router.get('/lesson/:lessonId', async (req, res) => {
  const quiz = await Quiz.findOne({ lesson: req.params.lessonId });
  res.json(quiz);
});

// Update Quiz
router.put('/:id', async (req, res) => {
  const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(quiz);
});

// Delete Quiz
router.delete('/:id', async (req, res) => {
  await Quiz.findByIdAndDelete(req.params.id);
  res.json({ message: 'Quiz deleted' });
});

module.exports = router;
