const express = require("express");
const { searchVideos, searchPlaylists } = require("../controllers/youtubeController");

const router = express.Router();

router.post("/youtube/search-videos", searchVideos);
router.post("/youtube/search-playlists", searchPlaylists);

module.exports = router;
