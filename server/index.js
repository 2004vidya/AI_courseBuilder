const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;
require("dotenv").config();
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const generateRoutes = require("./routes/generateRoutes");
const courseRoutes = require("./routes/courseRoutes");

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use("/api", generateRoutes);
app.use('/api/courses', courseRoutes);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

app.get("/api", (req, res) => {
  res.json({ message: "Hello World!" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// console.log("JWT_SECRET loaded:", process.env.JWT_SECRET);
// console.log("OpenAI Key:", process.env.OPENAI_API_KEY); // test only
console.log("Using Gemini key:", process.env.GEMINI_API_KEY);
