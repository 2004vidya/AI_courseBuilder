import React, { useState, useEffect } from 'react';
import { Play, ExternalLink, Clock, Eye, ThumbsUp, User, PlayCircle, List, Search, Loader, X, ChevronRight, Monitor } from 'lucide-react';

const YouTubeComponent = ({ lessonTitle, topic, isVisible }) => {
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('videos');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  // Fetch YouTube content when component becomes visible
  useEffect(() => {
    if (isVisible && lessonTitle && topic) {
      fetchYouTubeContent();
    }
  }, [isVisible, lessonTitle, topic]);

  const fetchYouTubeContent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch both videos and playlists
      const [videosRes, playlistsRes] = await Promise.all([
        fetch('http://localhost:5000/api/youtube/search-videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: `${topic} ${lessonTitle}`,
            maxResults: 6
          })
        }),
        fetch('http://localhost:5000/api/youtube/search-playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: `${topic} tutorial`,
            maxResults: 4
          })
        })
      ]);

      if (!videosRes.ok || !playlistsRes.ok) {
        throw new Error('Failed to fetch YouTube content');
      }

      const videosData = await videosRes.json();
      const playlistsData = await playlistsRes.json();

      setVideos(videosData.videos || []);
      setPlaylists(playlistsData.playlists || []);
    } catch (err) {
      console.error('YouTube fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    
    // Convert ISO 8601 duration (PT4M13S) to readable format
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 'N/A';
    
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatViews = (views) => {
    if (!views) return '0 views';
    const num = parseInt(views);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M views`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K views`;
    }
    return `${num} views`;
  };

  const openVideoModal = (video) => {
    setSelectedVideo(video);
    setVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setVideoModalOpen(false);
    setSelectedVideo(null);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">YouTube Resources</h3>
              <p className="text-red-100 text-sm">Related videos and playlists</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchYouTubeContent}
              disabled={loading}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-800/50 border-b border-slate-700/50">
        <div className="flex">
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex-1 px-6 py-4 font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              activeTab === 'videos' 
                ? 'bg-slate-700/50 text-white border-b-2 border-red-500' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span>Videos ({videos.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('playlists')}
            className={`flex-1 px-6 py-4 font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              activeTab === 'playlists' 
                ? 'bg-slate-700/50 text-white border-b-2 border-red-500' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Playlists ({playlists.length})</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-slate-600 rounded-full"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-red-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-slate-400">Loading YouTube content...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-400 font-medium mb-2">Failed to load YouTube content</p>
            <p className="text-slate-500 text-sm">{error}</p>
            <button
              onClick={fetchYouTubeContent}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div>
            {activeTab === 'videos' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.length > 0 ? videos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all duration-200 cursor-pointer group"
                    onClick={() => openVideoModal(video)}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-slate-700">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-200"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-red-600/90 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-red-500 transition-colors duration-200">
                          <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                      </div>
                      {video.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-md">
                          {formatDuration(video.duration)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h4 className="text-white font-medium line-clamp-2 group-hover:text-red-300 transition-colors duration-200 mb-2">
                        {video.title}
                      </h4>
                      <div className="flex items-center space-x-2 text-slate-400 text-sm mb-2">
                        <User className="w-3 h-3" />
                        <span className="truncate">{video.channelTitle}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-xs">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{formatViews(video.viewCount)}</span>
                        </div>
                        {video.likeCount && (
                          <div className="flex items-center space-x-1">
                            <ThumbsUp className="w-3 h-3" />
                            <span>{formatViews(video.likeCount)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-2 text-center py-12">
                    <PlayCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No videos found for this topic</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'playlists' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {playlists.length > 0 ? playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all duration-200 cursor-pointer group"
                    onClick={() => window.open(`https://www.youtube.com/playlist?list=${playlist.id}`, '_blank')}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-slate-700">
                      <img
                        src={playlist.thumbnail}
                        alt={playlist.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-200"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg flex items-center space-x-2 group-hover:bg-black/40 transition-colors duration-200">
                          <List className="w-5 h-5" />
                          <span className="font-medium">{playlist.itemCount} videos</span>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <ExternalLink className="w-5 h-5 text-white/80" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h4 className="text-white font-medium line-clamp-2 group-hover:text-red-300 transition-colors duration-200 mb-2">
                        {playlist.title}
                      </h4>
                      <div className="flex items-center space-x-2 text-slate-400 text-sm mb-2">
                        <User className="w-3 h-3" />
                        <span className="truncate">{playlist.channelTitle}</span>
                      </div>
                      <p className="text-slate-500 text-xs line-clamp-2">
                        {playlist.description || 'No description available'}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-2 text-center py-12">
                    <List className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No playlists found for this topic</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Modal */}
      {videoModalOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-[60] p-4">
          <div className="w-full max-w-4xl bg-slate-900 rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-500 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Monitor className="w-6 h-6 text-white" />
                <h3 className="text-lg font-bold text-white">Watch Video</h3>
              </div>
              <button
                onClick={closeVideoModal}
                className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Content */}
            <div className="p-6">
              <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4">
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&rel=0`}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-white">{selectedVideo.title}</h4>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-slate-400 text-sm">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{selectedVideo.channelTitle}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{formatViews(selectedVideo.viewCount)}</span>
                    </div>
                    {selectedVideo.duration && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(selectedVideo.duration)}</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedVideo.id}`, '_blank')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open on YouTube</span>
                  </button>
                </div>

                {selectedVideo.description && (
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <p className="text-slate-300 text-sm leading-relaxed line-clamp-4">
                      {selectedVideo.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeComponent;