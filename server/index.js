const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const generateRoutes = require("./routes/generateRoutes");
const courseRoutes = require("./routes/courseRoutes");
const youtubeRoutes = require("./routes/youtubeRoutes");
const quizRoutes = require("./routes/quizRoutes");

const PORT = process.env.PORT || 5000;

// ✅ CORS configuration for development and production
const allowedOrigins = [
  "http://localhost:5173",   // local dev
  "http://localhost:5174",   // local dev
  "http://localhost:3000",   // alternative local dev
  process.env.FRONTEND_URL,  // production frontend URL from env
  "https://ai-coursebuilder.vercel.app" // fallback Vercel URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use("/api", generateRoutes);
app.use('/api/courses', courseRoutes);
app.use("/api/youtube", youtubeRoutes);
app.use('/api/quiz', quizRoutes);

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Test route
app.get("/api", (req, res) => {
  res.json({ message: "Hello from Render backend!" });
});

app.get("/", (req, res) => {
  res.send("Backend is working! 🚀 Use /api routes for data.");
});

// ✅ Use Render's port
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

console.log("Using Gemini key:", process.env.GEMINI_API_KEY);

// const express = require("express");
// const cors = require("cors");
// const app = express();
// const PORT = process.env.PORT || 5000;
// require("dotenv").config();
// const mongoose = require("mongoose");
// const authRoutes = require("./routes/authRoutes");
// const generateRoutes = require("./routes/generateRoutes");
// const courseRoutes = require("./routes/courseRoutes");
// const youtubeRoutes = require("./routes/youtubeRoutes");
// const quizRoutes = require('./routes/quizRoutes');

// app.use(cors({
//   origin: ["http://localhost:5173", "http://localhost:5174"],
//   credentials: true
// }));
// app.use(express.json());
// app.use('/api/auth', authRoutes);
// app.use("/api", generateRoutes);
// app.use('/api/courses', courseRoutes);
// app.use("/api/youtube", youtubeRoutes);
// app.use('/api/quiz', quizRoutes);


// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// }).then(() => console.log('MongoDB connected'))
//   .catch(err => console.error('MongoDB error:', err));

// app.get("/api", (req, res) => {
//   res.json({ message: "Hello World!" });
// });

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// // console.log("JWT_SECRET loaded:", process.env.JWT_SECRET);
// // console.log("OpenAI Key:", process.env.OPENAI_API_KEY); // test only
// console.log("Using Gemini key:", process.env.GEMINI_API_KEY);
