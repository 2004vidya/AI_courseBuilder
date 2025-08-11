const express = require("express");
const { searchVideos, searchPlaylists } = require("../controllers/youtubeController");

const router = express.Router();

router.post("/search-videos", searchVideos);
router.post("/search-playlists", searchPlaylists);
module.exports = router;
