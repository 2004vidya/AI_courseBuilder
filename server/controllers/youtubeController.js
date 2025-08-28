const axios = require("axios");
require("dotenv").config();

const YT_API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = "https://www.googleapis.com/youtube/v3";

// Fetch videos
exports.searchVideos = async (req, res) => {
  const { query, maxResults = 6 } = req.body;
  if (!query) return res.status(400).json({ error: "Query is required" });

  // ✅ Check if YouTube API key is configured
  if (!YT_API_KEY) {
    return res.status(500).json({
      error: "YouTube API key not configured",
      details: "YOUTUBE_API_KEY environment variable is missing"
    });
  }

  try {
    const { data } = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: "snippet",
        q: query,
        maxResults,
        type: "video",
        key: YT_API_KEY
      }
    });

    // Map to frontend structure
    const videos = data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high.url
    }));

    res.json({ videos });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch videos", details: err.message });
  }
};

// Fetch playlists
exports.searchPlaylists = async (req, res) => {
  const { query, maxResults = 4 } = req.body;
  if (!query) return res.status(400).json({ error: "Query is required" });

  // ✅ Check if YouTube API key is configured
  if (!YT_API_KEY) {
    return res.status(500).json({
      error: "YouTube API key not configured",
      details: "YOUTUBE_API_KEY environment variable is missing"
    });
  }

  try {
    const { data } = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: "snippet",
        q: query,
        maxResults,
        type: "playlist",
        key: YT_API_KEY
      }
    });

    const playlists = data.items.map(item => ({
      id: item.id.playlistId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high.url,
      itemCount: "N/A" // YouTube search API doesn't return count; need a second API call if required
    }));

    res.json({ playlists });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch playlists", details: err.message });
  }
};
