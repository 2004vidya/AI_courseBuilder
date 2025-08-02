import fetch from 'node-fetch';

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAQVn2WExm4NpS4Q0WEEYjDvVUJvRJ7SKY";

async function listModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`
    );

    const data = await response.json();

    if (data.models) {
      console.log("Available models:");
      data.models.forEach((model) => {
        console.log(`- ${model.name}`);
      });
    } else {
      console.error("API response error:", data);
    }
  } catch (err) {
    console.error("Error fetching model list:", err);
  }
}

listModels();

