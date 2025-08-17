import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  Play,
  Clock,
  Users,
  Star,
  BookOpen,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  Circle,
  Award,
  FileText,
  Loader,
  X,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Monitor,
  PanelLeftClose,
  Youtube,
  Menu,
  StarIcon,
  HelpCircle,
  Brain,
  Target,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
} from "lucide-react";
import YouTubeComponent from "../components/YoutubeComponent";

const CourseView = () => {
  /** ✅ Get course ID from URL */
  const { courseId } = useParams();
  const navigate = useNavigate();

  /** ✅ State */
  const [courseData, setCourseData] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [error, setError] = useState(null);

  const [activeLesson, setActiveLesson] = useState(null);
  const [lessonContents, setLessonContents] = useState({});
  const [loadingLessons, setLoadingLessons] = useState({});
  const [expandedSections, setExpandedSections] = useState({});

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [currentLessonData, setCurrentLessonData] = useState(null);

  // YouTube integration state
  const [activeModalTab, setActiveModalTab] = useState("content");
  const [playlists, setPlaylists] = useState([]);
  const [youtubeVideos, setYoutubeVideos] = useState([]);

  // Mobile navigation state
  const [showMobileNav, setShowMobileNav] = useState(false);

  // Progress and bookmark state
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [bookmarkedLessons, setBookmarkedLessons] = useState(new Set());
  const [updatingProgress, setUpdatingProgress] = useState(false);

  // ✅ NEW: Quiz state
  const [quizData, setQuizData] = useState({});
  const [loadingQuiz, setLoadingQuiz] = useState({});
  const [currentQuizAnswers, setCurrentQuizAnswers] = useState({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  /** ✅ Fetch Course from MongoDB on Mount */
  useEffect(() => {
    const fetchCourseAndVideos = async () => {
      try {
        // Step 1: Fetch course data
        const res = await fetch(
          `http://localhost:5000/api/courses/${courseId}`
        );
        if (!res.ok) throw new Error("Failed to fetch course data");
        const data = await res.json();
        setCourseData(data);

        // Initialize completed lessons and bookmarks from course data
        const completed = new Set();
        const bookmarks = new Set();
        
        data.sections?.forEach((section, sIndex) => {
          const sectionId = section.id || `section-${sIndex}`;
          section.lessons?.forEach((lesson, lIndex) => {
            const lessonKey = `${sectionId}-${lesson.id || lIndex}`;
            if (lesson.completed) {
              completed.add(lessonKey);
            }
            if (lesson.bookmarked) {
              bookmarks.add(lessonKey);
            }
          });
        });
        
        setCompletedLessons(completed);
        setBookmarkedLessons(bookmarks);

        // Step 2: Extract query (e.g., course title or topic)
        const courseTitle = data.title || "React course";

        // Step 3: Fetch YouTube playlists based on course title
        const ytRes = await fetch(
          "http://localhost:5000/api/youtube/search-playlists",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: courseTitle || "programming",
            }),
          }
        );

        if (!ytRes.ok) throw new Error("Failed to fetch YouTube playlists");

        const ytData = await ytRes.json();
        setYoutubeVideos(ytData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingCourse(false);
      }
    };

    fetchCourseAndVideos();
  }, [courseId]);

  /** ✅ Update lesson progress in backend */
  const updateLessonProgress = async (lessonKey, updates) => {
    try {
      setUpdatingProgress(true);
      
      // Parse lesson key to get section and lesson IDs
      const [sectionId, lessonId] = lessonKey.split('-');
      
      const response = await fetch(
        `http://localhost:5000/api/courses/${courseId}/lesson/progress`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sectionId,
            lessonId,
            ...updates,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update lesson progress");
      }

      const updatedCourse = await response.json();
      setCourseData(updatedCourse);
      
      return true;
    } catch (error) {
      console.error("Error updating lesson progress:", error);
      // Show user-friendly error
      alert("Failed to update progress. Please try again.");
      return false;
    } finally {
      setUpdatingProgress(false);
    }
  };

  /** ✅ Mark lesson as complete/incomplete */
  const toggleLessonComplete = async (lessonKey) => {
    const isCompleted = completedLessons.has(lessonKey);
    const newCompletedState = !isCompleted;
    
    // Optimistically update UI
    const newCompletedLessons = new Set(completedLessons);
    if (newCompletedState) {
      newCompletedLessons.add(lessonKey);
    } else {
      newCompletedLessons.delete(lessonKey);
    }
    setCompletedLessons(newCompletedLessons);

    // Update backend
    const success = await updateLessonProgress(lessonKey, { 
      completed: newCompletedState 
    });
    
    if (!success) {
      // Revert optimistic update on failure
      setCompletedLessons(completedLessons);
    }
  };

  /** ✅ Toggle bookmark */
  const toggleBookmark = async (lessonKey) => {
    const isBookmarked = bookmarkedLessons.has(lessonKey);
    const newBookmarkState = !isBookmarked;
    
    // Optimistically update UI
    const newBookmarkedLessons = new Set(bookmarkedLessons);
    if (newBookmarkState) {
      newBookmarkedLessons.add(lessonKey);
    } else {
      newBookmarkedLessons.delete(lessonKey);
    }
    setBookmarkedLessons(newBookmarkedLessons);

    // Update backend
    const success = await updateLessonProgress(lessonKey, { 
      bookmarked: newBookmarkState 
    });
    
    if (!success) {
      // Revert optimistic update on failure
      setBookmarkedLessons(bookmarkedLessons);
    }
  };

  /** ✅ Auto-complete lesson when navigating to next */
  const autoCompleteCurrentLesson = async () => {
    if (currentLessonData && !completedLessons.has(currentLessonData.lessonKey)) {
      await toggleLessonComplete(currentLessonData.lessonKey);
    }
  };

  /** ✅ Get all lessons in order for navigation */
  const getAllLessons = () => {
    if (!courseData?.sections) return [];
    const allLessons = [];
    courseData.sections.forEach((section, sIndex) => {
      section.lessons?.forEach((lesson, lIndex) => {
        const sectionId = section.id || `section-${sIndex}`;
        const lessonKey = `${sectionId}-${lesson.id || lIndex}`;
        allLessons.push({
          ...lesson,
          sectionId,
          sectionTitle: section.title,
          lessonKey,
          globalIndex: allLessons.length,
          completed: completedLessons.has(lessonKey),
          bookmarked: bookmarkedLessons.has(lessonKey),
        });
      });
    });
    return allLessons;
  };

  const fetchPlaylists = async (query) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/youtube/search-playlists",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ q: query }),
        }
      );

      const data = await response.json();
      if (data.playlists) {
        setPlaylists(data.playlists);
      } else {
        console.error("No playlists found");
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  /** ✅ NEW: Fetch Quiz Content */
  const fetchQuizContent = async (lessonKey) => {
    if (quizData[lessonKey] || loadingQuiz[lessonKey]) return;

    setLoadingQuiz(prev => ({ ...prev, [lessonKey]: true }));

    try {
      const res = await fetch(
        "http://localhost:5000/api/quiz/generate-quiz",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            topic: currentLessonData.topic, 
            lessonTitle: currentLessonData.title 
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to fetch quiz content");
      const data = await res.json();

      setQuizData(prev => ({
        ...prev,
        [lessonKey]: data
      }));
    } catch (err) {
      console.error("❌ Quiz fetch error:", err);
      setQuizData(prev => ({
        ...prev,
        [lessonKey]: { error: "Failed to load quiz" }
      }));
    } finally {
      setLoadingQuiz(prev => {
        const updated = { ...prev };
        delete updated[lessonKey];
        return updated;
      });
    }
  };

  /** ✅ NEW: Handle Quiz Answer Selection */
  const handleQuizAnswer = (questionId, selectedAnswer) => {
    if (quizSubmitted) return;

    setCurrentQuizAnswers(prev => ({
      ...prev,
      [questionId]: selectedAnswer
    }));
  };

  /** ✅ NEW: Submit Quiz */
  const submitQuiz = () => {
    setQuizSubmitted(true);
    setShowQuizResults(true);
  };

  /** ✅ NEW: Reset Quiz */
  const resetQuiz = () => {
    setCurrentQuizAnswers({});
    setQuizSubmitted(false);
    setShowQuizResults(false);
  };

  /** ✅ NEW: Calculate Quiz Score */
  const calculateQuizScore = () => {
    if (!currentLessonData) return { score: 0, total: 0, percentage: 0 };
    
    const quiz = quizData[currentLessonData.lessonKey];
    if (!quiz || !quiz.questions) return { score: 0, total: 0, percentage: 0 };

    const total = quiz.questions.length;
    const correct = quiz.questions.filter((q, index) => 
      currentQuizAnswers[index] === q.correctAnswer
    ).length;
    
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    return { score: correct, total, percentage };
  };

  /** ✅ Get current lesson index */
  const getCurrentLessonIndex = () => {
    if (!currentLessonData) return -1;
    const allLessons = getAllLessons();
    return allLessons.findIndex(
      (lesson) => lesson.lessonKey === currentLessonData.lessonKey
    );
  };

  /** ✅ Navigate to next/previous lesson */
  const navigateLesson = async (direction) => {
    const allLessons = getAllLessons();
    const currentIndex = getCurrentLessonIndex();
    let newIndex;

    // Auto-complete current lesson when going to next
    if (direction === "next") {
      await autoCompleteCurrentLesson();
      newIndex = currentIndex + 1;
    } else {
      newIndex = currentIndex - 1;
    }

    if (newIndex >= 0 && newIndex < allLessons.length) {
      const nextLesson = allLessons[newIndex];
      await openLessonModal(nextLesson, courseData.title, nextLesson.sectionId);
    }
  };

  /** ✅ Toggle Section Expand/Collapse */
  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  /** ✅ Open Lesson Modal */
  const openLessonModal = async (lesson, topic, sectionId) => {
    const lessonKey = `${sectionId}-${lesson.id}`;

    // Set current lesson data
    const lessonData = {
      ...lesson,
      lessonKey,
      sectionId,
      topic,
      completed: completedLessons.has(lessonKey),
      bookmarked: bookmarkedLessons.has(lessonKey),
    };
    setCurrentLessonData(lessonData);
    setModalOpen(true);
    setActiveModalTab("content");
    setShowMobileNav(false);

    // Reset quiz state when opening new lesson
    setCurrentQuizAnswers({});
    setQuizSubmitted(false);
    setShowQuizResults(false);

    // Skip fetch if already loaded
    if (lessonContents[lessonKey]) return;

    setLoadingLessons((prev) => ({ ...prev, [lessonKey]: true }));

    try {
      const res = await fetch(
        "http://localhost:5000/api/courses/generate-lesson-content",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, lessonTitle: lesson.title }),
        }
      );

      if (!res.ok) throw new Error("Failed to fetch lesson content");
      const data = await res.json();

      setLessonContents((prev) => ({
        ...prev,
        [lessonKey]: data.content,
      }));
    } catch (err) {
      console.error("❌ Lesson fetch error:", err);
    } finally {
      setLoadingLessons((prev) => {
        const updated = { ...prev };
        delete updated[lessonKey];
        return updated;
      });
    }
  };

  /** ✅ Close Modal */
  const closeModal = () => {
    setModalOpen(false);
    setCurrentLessonData(null);
    setActiveModalTab("content");
    setShowMobileNav(false);
    // Reset quiz state
    setCurrentQuizAnswers({});
    setQuizSubmitted(false);
    setShowQuizResults(false);
  };

  /** ✅ Handle lesson click */
  const handleLessonClick = async (e, lesson, topic, sectionId) => {
    e.preventDefault();
    e.stopPropagation();
    await openLessonModal(lesson, topic, sectionId);
  };

  /** ✅ Progress Calculation */
  const calculateProgress = () => {
    if (!courseData?.sections) return 0;
    const allLessons = getAllLessons();
    const completed = allLessons.filter((l) => l.completed).length;
    return allLessons.length
      ? Math.round((completed / allLessons.length) * 100)
      : 0;
  };

  /** ✅ Handle Back Navigation */
  const handleBack = () => navigate("/");

  /** ✅ Loading & Error States */
  if (loadingCourse)
    return <div className="text-white p-10">Loading course...</div>;
  if (error) return <div className="text-red-400 p-10">Error: {error}</div>;
  if (!courseData)
    return <div className="text-white p-10">No course data found</div>;

  const allLessons = getAllLessons();
  const currentIndex = getCurrentLessonIndex();
  const canGoNext = currentIndex < allLessons.length - 1;
  const canGoPrev = currentIndex > 0;
  const currentProgress = calculateProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 font-inter">
      {/* ✅ Header */}
      <div className="bg-black/40 backdrop-blur-md border-b border-white/10 flex justify-between px-4 py-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">CourseAI</span>
        </div>
        <button
          onClick={handleBack}
          className="bg-red-500 px-4 py-2 rounded-lg text-white font-semibold hover:bg-red-600"
        >
          Back
        </button>
      </div>

      {/* ✅ Course Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ✅ Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* ✅ Course Overview */}
          <div className="bg-black/30 rounded-2xl p-8 border border-white/10">
            <h1 className="text-4xl font-bold text-white mb-4">
              {courseData.title}
            </h1>
            <p className="text-white/80 mb-6">{courseData.description}</p>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/80 font-medium">Your Progress</span>
                <span className="text-white font-bold">{currentProgress}%</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500 ease-out"
                  style={{ width: `${currentProgress}%` }}
                ></div>
              </div>
              <div className="text-white/60 text-sm mt-1">
                {allLessons.filter(l => l.completed).length} of {allLessons.length} lessons completed
              </div>
            </div>

            <div className="flex items-center space-x-6 text-white/70">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <span>4.8</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>1200 students</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>8h 30m</span>
              </div>
            </div>
          </div>

          {/* ✅ Lessons */}
          <div className="bg-black/30 rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Course Content
            </h2>

            {courseData.sections?.map((section, sIndex) => {
              const sectionId = section.id || `section-${sIndex}`;
              const sectionLessons = section.lessons || [];
              const completedInSection = sectionLessons.filter(lesson => 
                completedLessons.has(`${sectionId}-${lesson.id || sectionLessons.indexOf(lesson)}`)
              ).length;

              return (
                <div
                  key={sectionId}
                  className="bg-black/20 rounded-xl border border-white/10 mb-4"
                >
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(sectionId)}
                    className="w-full px-6 py-4 flex justify-between items-center hover:bg-black/20"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-semibold">
                        {sIndex + 1}
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-white">
                          {section.title}
                        </h3>
                        <p className="text-white/60 text-sm">
                          {completedInSection}/{sectionLessons.length} lessons completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {completedInSection === sectionLessons.length && sectionLessons.length > 0 && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                      {expandedSections[sectionId] ? (
                        <ChevronDown className="text-white/60" />
                      ) : (
                        <ChevronRight className="text-white/60" />
                      )}
                    </div>
                  </button>

                  {/* Lessons */}
                  {expandedSections[sectionId] && (
                    <div className="px-6 pb-4 space-y-2">
                      {section.lessons?.map((lesson, lIndex) => {
                        const lessonKey = `${sectionId}-${lesson.id || lIndex}`;
                        const isCompleted = completedLessons.has(lessonKey);
                        const isBookmarked = bookmarkedLessons.has(lessonKey);

                        return (
                          <div key={lessonKey} className="space-y-2">
                            {/* Lesson Item */}
                            <div
                              className="flex justify-between items-center p-4 bg-black/20 rounded-lg hover:bg-black/30 cursor-pointer transition-colors"
                              onClick={(e) =>
                                handleLessonClick(
                                  e,
                                  lesson,
                                  courseData.title,
                                  sectionId
                                )
                              }
                            >
                              <div className="flex items-center space-x-3">
                                {isCompleted ? (
                                  <CheckCircle className="text-green-400" />
                                ) : (
                                  <Circle className="text-white/40" />
                                )}
                                <div>
                                  <h4 className="text-white flex items-center space-x-2">
                                    <span>{lesson.title}</span>
                                    {isBookmarked && (
                                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                    )}
                                  </h4>
                                  <p className="text-white/60 text-sm">
                                    {lesson.duration || "N/A"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <FileText className="text-white/60" />
                                <Youtube className="text-red-400 w-5 h-5" />
                                <HelpCircle className="text-blue-400 w-5 h-5" />
                                <ChevronRight className="text-white/60" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ✅ Right Column (Stats) */}
        <div className="space-y-6">
          <div className="bg-black/30 p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl text-white mb-4">Course Stats</h3>
            <div className="space-y-2 text-white/70">
              <div className="flex justify-between">
                <span>Total Lessons</span>
                <span>{allLessons.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed</span>
                <span className="text-green-400 font-semibold">
                  {allLessons.filter(l => l.completed).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Bookmarked</span>
                <span className="text-yellow-400 font-semibold">
                  {allLessons.filter(l => l.bookmarked).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Progress</span>
                <span className="text-blue-400 font-semibold">{currentProgress}%</span>
              </div>
            </div>
          </div>

          {/* Achievement Badge */}
          {currentProgress === 100 && (
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 rounded-2xl text-center">
              <Award className="w-12 h-12 text-white mx-auto mb-3" />
              <h3 className="text-white font-bold text-lg">Course Completed!</h3>
              <p className="text-white/90 text-sm">Congratulations on finishing the course!</p>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Enhanced Responsive Lesson Modal with Quiz Tab */}
      {modalOpen && currentLessonData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-2 sm:p-4">
          {/* Modal Container - Responsive Layout */}
          <div className="w-full h-full sm:h-[95vh] sm:max-w-7xl flex flex-col sm:flex-row bg-white sm:rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Mobile Header - Only visible on mobile */}
            <div className="sm:hidden bg-gradient-to-r from-slate-900 to-slate-800 p-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowMobileNav(!showMobileNav)}
                  className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="font-semibold text-sm truncate max-w-[200px]">
                    {currentLessonData.title}
                  </h3>
                  <p className="text-slate-400 text-xs">
                    {currentIndex + 1}/{allLessons.length}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-slate-700/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Left Side - Navigation Panel */}
            <div className={`
              ${showMobileNav ? 'block' : 'hidden'} sm:block
              absolute sm:relative top-16 sm:top-0 left-0 right-0 sm:w-80
              bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 
              border-b sm:border-b-0 sm:border-r border-slate-700/50 
              flex flex-col shadow-2xl z-10 sm:z-auto
              max-h-[calc(100vh-4rem)] sm:max-h-full
            `}>
              {/* Navigation Header - Hidden on mobile */}
              <div className="hidden sm:block p-6 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-semibold">
                      Course Navigation
                    </span>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Current Lesson Info */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-medium text-sm">
                      {currentLessonData.title}
                    </h3>
                    <div className="flex items-center space-x-1">
                      {currentLessonData.completed && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                      {currentLessonData.bookmarked && (
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      )}
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs">
                    {allLessons.find(l => l.lessonKey === currentLessonData.lessonKey)?.sectionTitle}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-purple-400 text-xs font-medium">
                      Lesson {currentIndex + 1} of {allLessons.length}
                    </span>
                    <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                        style={{
                          width: `${((currentIndex + 1) / allLessons.length) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Progress - Scrollable */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                <h4 className="text-white font-medium mb-4 text-sm">
                  Course Progress ({currentProgress}%)
                </h4>
                <div className="space-y-3">
                  {courseData.sections?.map((section, sIndex) => {
                    const sectionId = section.id || `section-${sIndex}`;
                    const sectionLessons = section.lessons || [];
                    const completedInSection = sectionLessons.filter(lesson => 
                      completedLessons.has(`${sectionId}-${lesson.id || sectionLessons.indexOf(lesson)}`)
                    ).length;
                    const sectionProgress = sectionLessons.length
                      ? (completedInSection / sectionLessons.length) * 100
                      : 0;

                    return (
                      <div
                        key={sectionId}
                        className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-slate-300 text-xs font-medium truncate pr-2">
                            {section.title}
                          </span>
                          <span className="text-slate-400 text-xs whitespace-nowrap">
                            {completedInSection}/{sectionLessons.length}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                            style={{ width: `${sectionProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Side - Content Area */}
            <div className="flex-1 bg-white flex flex-col overflow-hidden">
              {/* Content Header with Tabs */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200/50 flex-shrink-0">
                {/* Lesson Info - Hidden on mobile (shown in mobile header) */}
                <div className="hidden sm:block p-6 border-b border-gray-200/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                          {currentLessonData.title}
                        </h1>
                        <div className="flex items-center space-x-1">
                          {currentLessonData.completed && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {currentLessonData.bookmarked && (
                            <Star className="w-5 h-5 text-yellow-500 fill-current" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{currentLessonData.duration || "N/A"}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BookOpen className="w-4 h-4" />
                          <span>
                            {allLessons.find(l => l.lessonKey === currentLessonData.lessonKey)?.sectionTitle}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                      {currentIndex + 1}/{allLessons.length}
                    </div>
                  </div>
                </div>

                {/* Tab Navigation - Updated with Quiz Tab */}
                <div className="flex border-b border-gray-200/50">
                  <button
                    onClick={() => {
                      setActiveModalTab("content");
                      setShowMobileNav(false);
                    }}
                    className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
                      activeModalTab === "content"
                        ? "bg-white text-purple-600 border-b-2 border-purple-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Content</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveModalTab("quiz");
                      setShowMobileNav(false);
                      fetchQuizContent(currentLessonData.lessonKey);
                    }}
                    className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
                      activeModalTab === "quiz"
                        ? "bg-white text-orange-600 border-b-2 border-orange-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
                    }`}
                  >
                    <Brain className="w-4 h-4" />
                    <span className="hidden sm:inline">Quiz</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveModalTab("youtube");
                      setShowMobileNav(false);
                    }}
                    className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
                      activeModalTab === "youtube"
                        ? "bg-white text-red-600 border-b-2 border-red-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
                    }`}
                  >
                    <Youtube className="w-4 h-4" />
                    <span className="hidden sm:inline">Videos</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-auto">
                {/* Content Tab */}
                {activeModalTab === "content" && (
                  <div className="p-4 sm:p-8">
                    {loadingLessons[currentLessonData.lessonKey] ? (
                      <div className="flex flex-col items-center justify-center h-64 sm:h-96 space-y-4">
                        <div className="relative">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-purple-200 rounded-full"></div>
                          <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-700 font-medium">
                            Loading lesson content...
                          </p>
                          <p className="text-gray-500 text-sm mt-1">
                            Preparing your learning experience
                          </p>
                        </div>
                      </div>
                    ) : lessonContents[currentLessonData.lessonKey] ? (
                      <div className="prose prose-gray prose-sm sm:prose-lg max-w-none">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 pb-2 sm:pb-4 border-b-2 border-gradient-to-r from-purple-500 to-blue-500">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mt-6 sm:mt-8 mb-3 sm:mb-4 flex items-center">
                                <div className="w-1 h-4 sm:h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full mr-2 sm:mr-3"></div>
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-base sm:text-xl font-semibold text-gray-800 mt-4 sm:mt-6 mb-2 sm:mb-3 flex items-center">
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full mr-2 sm:mr-3"></div>
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className="text-gray-700 leading-relaxed mb-3 sm:mb-5 text-sm sm:text-base">
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="text-gray-700 mb-3 sm:mb-5 pl-4 sm:pl-6 space-y-1 sm:space-y-2">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="text-gray-700 mb-3 sm:mb-5 pl-4 sm:pl-6 space-y-1 sm:space-y-2">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="relative pl-1 sm:pl-2 text-sm sm:text-base">{children}</li>
                            ),
                            code: ({ inline, children }) =>
                              inline ? (
                                <code className="bg-purple-50 text-purple-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-mono border border-purple-200">
                                  {children}
                                </code>
                              ) : (
                                <code className="block bg-gray-900 text-green-400 p-3 sm:p-6 rounded-lg sm:rounded-xl text-xs sm:text-sm font-mono overflow-x-auto mb-4 sm:mb-6 border border-gray-700 shadow-inner">
                                  {children}
                                </code>
                              ),
                            pre: ({ children }) => (
                              <div className="relative">
                                <pre className="bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-6 mb-4 sm:mb-6 overflow-x-auto border border-gray-700 shadow-2xl">
                                  {children}
                                </pre>
                                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex space-x-1">
                                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full"></div>
                                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                                </div>
                              </div>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-gradient-to-b from-purple-500 to-blue-500 bg-gradient-to-r from-purple-50 to-blue-50 pl-3 sm:pl-6 pr-2 sm:pr-4 py-2 sm:py-4 italic text-gray-700 my-3 sm:my-6 rounded-r-lg shadow-sm text-sm sm:text-base">
                                {children}
                              </blockquote>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-gray-900 bg-yellow-100 px-0.5 sm:px-1 rounded">
                                {children}
                              </strong>
                            ),
                          }}
                        >
                          {lessonContents[currentLessonData.lessonKey]}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 sm:h-96 space-y-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center">
                          <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-gray-700 font-medium">
                            No content available
                          </p>
                          <p className="text-gray-500 text-sm">
                            This lesson content couldn't be loaded.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ✅ NEW: Quiz Tab */}
                {activeModalTab === "quiz" && (
                  <div className="p-4 sm:p-8">
                    {loadingQuiz[currentLessonData.lessonKey] ? (
                      <div className="flex flex-col items-center justify-center h-64 sm:h-96 space-y-4">
                        <div className="relative">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-orange-200 rounded-full"></div>
                          <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 border-4 border-orange-600 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-700 font-medium">Loading quiz...</p>
                          <p className="text-gray-500 text-sm mt-1">
                            Generating questions for you
                          </p>
                        </div>
                      </div>
                    ) : quizData[currentLessonData.lessonKey] ? (
                      <div className="max-w-4xl mx-auto">
                        {/* Quiz Header */}
                        <div className="text-center mb-6 sm:mb-8">
                          <div className="flex items-center justify-center space-x-3 mb-4">
                            <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                              {quizData[currentLessonData.lessonKey].title}
                            </h2>
                          </div>
                          <p className="text-gray-600 text-sm sm:text-base">
                            Test your understanding of this lesson with 5 questions
                          </p>
                        </div>

                        {/* Quiz Results */}
                        {showQuizResults && (
                          <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                            <div className="text-center">
                              {(() => {
                                const { score, total, percentage } = calculateQuizScore();
                                const isPassingGrade = percentage >= 70;
                                
                                return (
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-center space-x-3">
                                      {isPassingGrade ? (
                                        <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500" />
                                      ) : (
                                        <Target className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />
                                      )}
                                      <div>
                                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                                          Quiz Complete!
                                        </h3>
                                        <p className="text-sm sm:text-base text-gray-600">
                                          You scored {score} out of {total} questions
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-center space-x-4">
                                      <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                                        isPassingGrade 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-orange-100 text-orange-800'
                                      }`}>
                                        {percentage}%
                                      </div>
                                      <button
                                        onClick={resetQuiz}
                                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                        <span>Retake Quiz</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                        {/* Quiz Questions */}
                        {quizData[currentLessonData.lessonKey].questions?.map((question, qIndex) => {
                          const userAnswer = currentQuizAnswers[qIndex];
                          const isCorrect = userAnswer === question.correctAnswer;
                          const showFeedback = quizSubmitted;

                          return (
                            <div
                              key={qIndex}
                              className={`mb-6 p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 ${
                                showFeedback
                                  ? userAnswer !== undefined
                                    ? isCorrect
                                      ? 'bg-green-50 border-green-200'
                                      : 'bg-red-50 border-red-200'
                                    : 'bg-gray-50 border-gray-200'
                                  : 'bg-white border-gray-200 hover:border-orange-300'
                              }`}
                            >
                              {/* Question Header */}
                              <div className="flex items-start space-x-3 mb-4">
                                <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                                  showFeedback && userAnswer !== undefined
                                    ? isCorrect
                                      ? 'bg-green-500'
                                      : 'bg-red-500'
                                    : 'bg-orange-500'
                                }`}>
                                  {showFeedback && userAnswer !== undefined ? (
                                    isCorrect ? (
                                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                    ) : (
                                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                    )
                                  ) : (
                                    qIndex + 1
                                  )}
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex-1">
                                  {question.question}
                                </h3>
                              </div>

                              {/* Answer Options */}
                              <div className="space-y-2 sm:space-y-3 ml-6 sm:ml-11">
                                {question.options?.map((option, oIndex) => {
                                  const isSelected = userAnswer === oIndex;
                                  const isCorrectOption = oIndex === question.correctAnswer;
                                  
                                  let optionClass = "p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 text-sm sm:text-base";
                                  
                                  if (quizSubmitted) {
                                    if (isCorrectOption) {
                                      optionClass += " bg-green-100 border-green-300 text-green-800";
                                    } else if (isSelected && !isCorrectOption) {
                                      optionClass += " bg-red-100 border-red-300 text-red-800";
                                    } else {
                                      optionClass += " bg-gray-50 border-gray-200 text-gray-600";
                                    }
                                  } else {
                                    if (isSelected) {
                                      optionClass += " bg-orange-100 border-orange-400 text-orange-800";
                                    } else {
                                      optionClass += " bg-white border-gray-200 hover:border-orange-200 hover:bg-orange-50 text-gray-700";
                                    }
                                  }

                                  return (
                                    <div
                                      key={oIndex}
                                      className={optionClass}
                                      onClick={() => handleQuizAnswer(qIndex, oIndex)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                          <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${
                                            isSelected
                                              ? quizSubmitted
                                                ? isCorrectOption
                                                  ? 'border-green-500 bg-green-500'
                                                  : 'border-red-500 bg-red-500'
                                                : 'border-orange-500 bg-orange-500'
                                              : 'border-gray-300'
                                          }`}>
                                            {isSelected && (
                                              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white"></div>
                                            )}
                                          </div>
                                          <span className="font-medium">
                                            {String.fromCharCode(65 + oIndex)}. {option}
                                          </span>
                                        </div>
                                        {quizSubmitted && isCorrectOption && (
                                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Explanation */}
                              {showFeedback && question.explanation && (
                                <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200 ml-6 sm:ml-11">
                                  <div className="flex items-start space-x-2">
                                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="font-medium text-blue-900 text-sm">Explanation:</p>
                                      <p className="text-blue-800 text-sm mt-1">{question.explanation}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Quiz Submit Button */}
                        {!quizSubmitted && (
                          <div className="text-center mt-6 sm:mt-8">
                            <button
                              onClick={submitQuiz}
                              disabled={Object.keys(currentQuizAnswers).length === 0}
                              className={`px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 ${
                                Object.keys(currentQuizAnswers).length > 0
                                  ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl'
                                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              Submit Quiz ({Object.keys(currentQuizAnswers).length}/{quizData[currentLessonData.lessonKey].questions?.length || 0})
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 sm:h-96 space-y-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 rounded-full flex items-center justify-center">
                          <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />
                        </div>
                        <div className="text-center">
                          <p className="text-gray-700 font-medium">No quiz available</p>
                          <p className="text-gray-500 text-sm">
                            Quiz content couldn't be generated for this lesson.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* YouTube Tab */}
                {activeModalTab === "youtube" && (
                  <div className="p-4 sm:p-8">
                    <YouTubeComponent
                      lessonTitle={currentLessonData.title}
                      topic={currentLessonData.topic}
                      isVisible={activeModalTab === "youtube"}
                    />
                  </div>
                )}
              </div>

              {/* Content Footer - Action Bar */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-t border-gray-200/50 p-3 sm:p-6 flex-shrink-0">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
                    <button 
                      onClick={() => currentLessonData && toggleLessonComplete(currentLessonData.lessonKey)}
                      disabled={updatingProgress}
                      className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg text-sm ${
                        currentLessonData?.completed
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-200 hover:bg-green-600 hover:text-white text-gray-700"
                      } ${updatingProgress ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {updatingProgress ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      <span>
                        {currentLessonData?.completed ? "Completed" : "Mark Complete"}
                      </span>
                    </button>
                    <button 
                      onClick={() => currentLessonData && toggleBookmark(currentLessonData.lessonKey)}
                      disabled={updatingProgress}
                      className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                        currentLessonData?.bookmarked
                          ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                          : "bg-gray-200 hover:bg-yellow-500 hover:text-white text-gray-700"
                      } ${updatingProgress ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {updatingProgress ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Star className={`w-4 h-4 ${currentLessonData?.bookmarked ? "fill-current" : ""}`} />
                      )}
                      <span className="hidden sm:inline">
                        {currentLessonData?.bookmarked ? "Bookmarked" : "Bookmark"}
                      </span>
                      <span className="sm:hidden">
                        {currentLessonData?.bookmarked ? "Saved" : "Save"}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
                    <button
                      onClick={() => navigateLesson("prev")}
                      disabled={!canGoPrev || updatingProgress}
                      className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
                        canGoPrev && !updatingProgress
                          ? "bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-md hover:shadow-lg"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Prev</span>
                    </button>

                    <button
                      onClick={() => navigateLesson("next")}
                      disabled={!canGoNext || updatingProgress}
                      className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
                        canGoNext && !updatingProgress
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg hover:shadow-xl"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Overlay */}
          {showMobileNav && (
            <div
              className="sm:hidden fixed inset-0 bg-black/20 z-0"
              onClick={() => setShowMobileNav(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default CourseView;

// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import ReactMarkdown from "react-markdown";
// import {
//   Play,
//   Clock,
//   Users,
//   Star,
//   BookOpen,
//   ChevronRight,
//   ChevronDown,
//   CheckCircle,
//   Circle,
//   Award,
//   FileText,
//   Loader,
//   X,
//   ChevronLeft,
//   ArrowRight,
//   ArrowLeft,
//   Monitor,
//   PanelLeftClose,
//   Youtube,
// } from "lucide-react";
// import YouTubeComponent from "../components/YoutubeComponent"; // Import the YouTube component

// const CourseView = () => {
//   /** ✅ Get course ID from URL */
//   const { courseId } = useParams();
//   const navigate = useNavigate();

//   /** ✅ State */
//   const [courseData, setCourseData] = useState(null);
//   const [loadingCourse, setLoadingCourse] = useState(true);
//   const [error, setError] = useState(null);

//   const [activeLesson, setActiveLesson] = useState(null);
//   const [lessonContents, setLessonContents] = useState({});
//   const [loadingLessons, setLoadingLessons] = useState({});
//   const [expandedSections, setExpandedSections] = useState({});

//   // Modal state
//   const [modalOpen, setModalOpen] = useState(false);
//   const [currentLessonData, setCurrentLessonData] = useState(null);

//   // YouTube integration state
//   const [activeModalTab, setActiveModalTab] = useState("content"); // 'content' or 'youtube'
//   const [playlists, setPlaylists] = useState([]);
//   const [youtubeVideos, setYoutubeVideos] = useState([]);

//   /** ✅ Fetch Course from MongoDB on Mount */
//   useEffect(() => {
//     const fetchCourseAndVideos = async () => {
//       try {
//         // Step 1: Fetch course data
//         const res = await fetch(
//           `http://localhost:5000/api/courses/${courseId}`
//         );
//         if (!res.ok) throw new Error("Failed to fetch course data");
//         const data = await res.json();
//         setCourseData(data);

//         // Step 2: Extract query (e.g., course title or topic)
//         const courseTitle = data.title || "React course";

//         // Step 3: Fetch YouTube playlists based on course title
//         const ytRes = await fetch(
//           "http://localhost:5000/api/youtube/search-playlists",
//           {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//               query: courseTitle || "programming",
//             }),
//           }
//         );

//         if (!ytRes.ok) throw new Error("Failed to fetch YouTube playlists");

//         const ytData = await ytRes.json();
//         setYoutubeVideos(ytData); // Assuming you’ve created this state
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoadingCourse(false);
//       }
//     };

//     fetchCourseAndVideos();
//   }, [courseId]);

//   /** ✅ Get all lessons in order for navigation */
//   const getAllLessons = () => {
//     if (!courseData?.sections) return [];
//     const allLessons = [];
//     courseData.sections.forEach((section, sIndex) => {
//       section.lessons?.forEach((lesson, lIndex) => {
//         allLessons.push({
//           ...lesson,
//           sectionId: section.id || `section-${sIndex}`,
//           sectionTitle: section.title,
//           lessonKey: `${section.id || `section-${sIndex}`}-${
//             lesson.id || lIndex
//           }`,
//           globalIndex: allLessons.length,
//         });
//       });
//     });
//     return allLessons;
//   };

//   const fetchPlaylists = async (query) => {
//     try {
//       const response = await fetch(
//         "http://localhost:5000/api/youtube/search-playlists",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ q: query }),
//         }
//       );

//       const data = await response.json();
//       if (data.playlists) {
//         setPlaylists(data.playlists);
//       } else {
//         console.error("No playlists found");
//       }
//     } catch (error) {
//       console.error("Error fetching playlists:", error);
//     }
//   };

//   /** ✅ Get current lesson index */
//   const getCurrentLessonIndex = () => {
//     if (!currentLessonData) return -1;
//     const allLessons = getAllLessons();
//     return allLessons.findIndex(
//       (lesson) => lesson.lessonKey === currentLessonData.lessonKey
//     );
//   };

//   /** ✅ Navigate to next/previous lesson */
//   const navigateLesson = async (direction) => {
//     const allLessons = getAllLessons();
//     const currentIndex = getCurrentLessonIndex();
//     let newIndex;

//     if (direction === "next") {
//       newIndex = currentIndex + 1;
//     } else {
//       newIndex = currentIndex - 1;
//     }

//     if (newIndex >= 0 && newIndex < allLessons.length) {
//       const nextLesson = allLessons[newIndex];
//       await openLessonModal(nextLesson, courseData.title, nextLesson.sectionId);
//     }
//   };

//   /** ✅ Toggle Section Expand/Collapse */
//   const toggleSection = (sectionId) => {
//     setExpandedSections((prev) => ({
//       ...prev,
//       [sectionId]: !prev[sectionId],
//     }));
//   };

//   /** ✅ Open Lesson Modal */
//   const openLessonModal = async (lesson, topic, sectionId) => {
//     const lessonKey = `${sectionId}-${lesson.id}`;

//     // Set current lesson data
//     const lessonData = {
//       ...lesson,
//       lessonKey,
//       sectionId,
//       topic,
//     };
//     setCurrentLessonData(lessonData);
//     setModalOpen(true);
//     setActiveModalTab("content"); // Reset to content tab when opening new lesson

//     // Skip fetch if already loaded
//     if (lessonContents[lessonKey]) return;

//     setLoadingLessons((prev) => ({ ...prev, [lessonKey]: true }));

//     try {
//       const res = await fetch(
//         "http://localhost:5000/api/courses/generate-lesson-content",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ topic, lessonTitle: lesson.title }),
//         }
//       );

//       if (!res.ok) throw new Error("Failed to fetch lesson content");
//       const data = await res.json();

//       setLessonContents((prev) => ({
//         ...prev,
//         [lessonKey]: data.content,
//       }));
//     } catch (err) {
//       console.error("❌ Lesson fetch error:", err);
//     } finally {
//       setLoadingLessons((prev) => {
//         const updated = { ...prev };
//         delete updated[lessonKey];
//         return updated;
//       });
//     }
//   };

//   /** ✅ Close Modal */
//   const closeModal = () => {
//     setModalOpen(false);
//     setCurrentLessonData(null);
//     setActiveModalTab("content");
//   };

//   /** ✅ Handle lesson click */
//   const handleLessonClick = async (e, lesson, topic, sectionId) => {
//     e.preventDefault();
//     e.stopPropagation();
//     await openLessonModal(lesson, topic, sectionId);
//   };

//   /** ✅ Progress Calculation */
//   const calculateProgress = () => {
//     if (!courseData?.sections) return 0;
//     const allLessons = courseData.sections.flatMap((s) => s.lessons || []);
//     const completed = allLessons.filter((l) => l.completed).length;
//     return allLessons.length
//       ? Math.round((completed / allLessons.length) * 100)
//       : 0;
//   };

//   /** ✅ Handle Back Navigation */
//   const handleBack = () => navigate("/");

//   /** ✅ Loading & Error States */
//   if (loadingCourse)
//     return <div className="text-white p-10">Loading course...</div>;
//   if (error) return <div className="text-red-400 p-10">Error: {error}</div>;
//   if (!courseData)
//     return <div className="text-white p-10">No course data found</div>;

//   const allLessons = getAllLessons();
//   const currentIndex = getCurrentLessonIndex();
//   const canGoNext = currentIndex < allLessons.length - 1;
//   const canGoPrev = currentIndex > 0;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 font-inter">
//       {/* ✅ Header */}
//       <div className="bg-black/40 backdrop-blur-md border-b border-white/10 flex justify-between px-4 py-6">
//         <div className="flex items-center space-x-3">
//           <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
//             <BookOpen className="w-6 h-6 text-white" />
//           </div>
//           <span className="text-xl font-bold text-white">CourseAI</span>
//         </div>
//         <button
//           onClick={handleBack}
//           className="bg-red-500 px-4 py-2 rounded-lg text-white font-semibold hover:bg-red-600"
//         >
//           Back
//         </button>
//       </div>

//       {/* ✅ Course Content */}
//       <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* ✅ Left Column */}
//         <div className="lg:col-span-2 space-y-8">
//           {/* ✅ Course Overview */}
//           <div className="bg-black/30 rounded-2xl p-8 border border-white/10">
//             <h1 className="text-4xl font-bold text-white mb-4">
//               {courseData.title}
//             </h1>
//             <p className="text-white/80 mb-6">{courseData.description}</p>
//             <div className="flex items-center space-x-6 text-white/70">
//               <div className="flex items-center space-x-2">
//                 <Star className="w-5 h-5 text-yellow-400" />
//                 <span>4.8</span>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <Users className="w-5 h-5" />
//                 <span>1200 students</span>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <Clock className="w-5 h-5" />
//                 <span>8h 30m</span>
//               </div>
//             </div>
//           </div>

//           {/* ✅ Lessons */}
//           <div className="bg-black/30 rounded-2xl p-8 border border-white/10">
//             <h2 className="text-2xl font-bold text-white mb-6">
//               Course Content
//             </h2>

//             {courseData.sections?.map((section, sIndex) => {
//               const sectionId = section.id || `section-${sIndex}`;

//               return (
//                 <div
//                   key={sectionId}
//                   className="bg-black/20 rounded-xl border border-white/10 mb-4"
//                 >
//                   {/* Section Header */}
//                   <button
//                     onClick={() => toggleSection(sectionId)}
//                     className="w-full px-6 py-4 flex justify-between items-center hover:bg-black/20"
//                   >
//                     <div className="flex items-center space-x-3">
//                       <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-semibold">
//                         {sIndex + 1}
//                       </div>
//                       <div>
//                         <h3 className="text-lg font-semibold text-white">
//                           {section.title}
//                         </h3>
//                         <p className="text-white/60 text-sm">
//                           {section.lessons?.length} lessons
//                         </p>
//                       </div>
//                     </div>
//                     {expandedSections[sectionId] ? (
//                       <ChevronDown className="text-white/60" />
//                     ) : (
//                       <ChevronRight className="text-white/60" />
//                     )}
//                   </button>

//                   {/* Lessons */}
//                   {expandedSections[sectionId] && (
//                     <div className="px-6 pb-4 space-y-2">
//                       {section.lessons?.map((lesson, lIndex) => {
//                         const lessonKey = `${sectionId}-${lesson.id || lIndex}`;

//                         return (
//                           <div key={lessonKey} className="space-y-2">
//                             {/* Lesson Item */}
//                             <div
//                               className="flex justify-between items-center p-4 bg-black/20 rounded-lg hover:bg-black/30 cursor-pointer transition-colors"
//                               onClick={(e) =>
//                                 handleLessonClick(
//                                   e,
//                                   lesson,
//                                   courseData.title,
//                                   sectionId
//                                 )
//                               }
//                             >
//                               <div className="flex items-center space-x-3">
//                                 {lesson.completed ? (
//                                   <CheckCircle className="text-green-400" />
//                                 ) : (
//                                   <Circle className="text-white/40" />
//                                 )}
//                                 <div>
//                                   <h4 className="text-white">{lesson.title}</h4>
//                                   <p className="text-white/60 text-sm">
//                                     {lesson.duration || "N/A"}
//                                   </p>
//                                 </div>
//                               </div>
//                               <div className="flex items-center space-x-2">
//                                 <FileText className="text-white/60" />
//                                 <Youtube className="text-red-400 w-5 h-5" />
//                                 <ChevronRight className="text-white/60" />
//                               </div>
//                             </div>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* ✅ Right Column (Stats) */}
//         <div className="space-y-6">
//           <div className="bg-black/30 p-6 rounded-2xl border border-white/10">
//             <h3 className="text-xl text-white mb-4">Course Stats</h3>
//             <div className="space-y-2 text-white/70">
//               <div className="flex justify-between">
//                 <span>Total Lessons</span>
//                 <span>
//                   {courseData.sections.reduce(
//                     (a, s) => a + (s.lessons?.length || 0),
//                     0
//                   )}
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span>Completed</span>
//                 <span>
//                   {courseData.sections.reduce(
//                     (a, s) =>
//                       a + (s.lessons?.filter((l) => l.completed).length || 0),
//                     0
//                   )}
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span>Progress</span>
//                 <span>{calculateProgress()}%</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ✅ Enhanced Lesson Modal with YouTube Integration */}
//       {modalOpen && currentLessonData && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4">
//           {/* Modal Container */}
//           <div className="w-full max-w-7xl h-[90vh] flex">
//             {/* Left Side - Lesson Navigation Panel */}
//             <div className="w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-l-2xl flex flex-col shadow-2xl">
//               {/* Navigation Header */}
//               <div className="p-6 border-b border-slate-700/50">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="flex items-center space-x-2">
//                     <Monitor className="w-5 h-5 text-purple-400" />
//                     <span className="text-white font-semibold">
//                       Course Navigation
//                     </span>
//                   </div>
//                   <button
//                     onClick={closeModal}
//                     className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
//                   >
//                     <X className="w-5 h-5" />
//                   </button>
//                 </div>

//                 {/* Current Lesson Info */}
//                 <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
//                   <h3 className="text-white font-medium text-sm mb-1">
//                     {currentLessonData.title}
//                   </h3>
//                   <p className="text-slate-400 text-xs">
//                     {
//                       allLessons.find(
//                         (l) => l.lessonKey === currentLessonData.lessonKey
//                       )?.sectionTitle
//                     }
//                   </p>
//                   <div className="mt-3 flex items-center justify-between">
//                     <span className="text-purple-400 text-xs font-medium">
//                       Lesson {currentIndex + 1} of {allLessons.length}
//                     </span>
//                     <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
//                       <div
//                         className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
//                         style={{
//                           width: `${
//                             ((currentIndex + 1) / allLessons.length) * 100
//                           }%`,
//                         }}
//                       ></div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Course Progress - Moved up and made scrollable */}
//               <div className="flex-1 p-6 overflow-y-auto">
//                 <h4 className="text-white font-medium mb-4 text-sm">
//                   Course Progress
//                 </h4>
//                 <div className="space-y-3">
//                   {courseData.sections?.map((section, sIndex) => {
//                     const completedLessons =
//                       section.lessons?.filter((l) => l.completed).length || 0;
//                     const totalLessons = section.lessons?.length || 0;
//                     const sectionProgress = totalLessons
//                       ? (completedLessons / totalLessons) * 100
//                       : 0;

//                     return (
//                       <div
//                         key={section.id}
//                         className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30"
//                       >
//                         <div className="flex justify-between items-center mb-2">
//                           <span className="text-slate-300 text-xs font-medium">
//                             {section.title}
//                           </span>
//                           <span className="text-slate-400 text-xs">
//                             {completedLessons}/{totalLessons}
//                           </span>
//                         </div>
//                         <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
//                           <div
//                             className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
//                             style={{ width: `${sectionProgress}%` }}
//                           ></div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>

//             {/* Right Side - Content Area with Tabs */}
//             <div className="flex-1 bg-white rounded-r-2xl shadow-2xl overflow-hidden border border-gray-200/50 flex flex-col">
//               {/* Content Header with Tabs */}
//               <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200/50">
//                 {/* Lesson Info */}
//                 <div className="p-6 border-b border-gray-200/30">
//                   <div className="flex items-start justify-between">
//                     <div className="flex-1">
//                       <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
//                         {currentLessonData.title}
//                       </h1>
//                       <div className="flex items-center space-x-4 text-sm text-gray-600">
//                         <div className="flex items-center space-x-1">
//                           <Clock className="w-4 h-4" />
//                           <span>{currentLessonData.duration || "N/A"}</span>
//                         </div>
//                         <div className="flex items-center space-x-1">
//                           <BookOpen className="w-4 h-4" />
//                           <span>
//                             {
//                               allLessons.find(
//                                 (l) =>
//                                   l.lessonKey === currentLessonData.lessonKey
//                               )?.sectionTitle
//                             }
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
//                       {currentIndex + 1}/{allLessons.length}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Tab Navigation */}
//                 <div className="flex border-b border-gray-200/50">
//                   <button
//                     onClick={() => setActiveModalTab("content")}
//                     className={`flex-1 px-6 py-4 font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
//                       activeModalTab === "content"
//                         ? "bg-white text-purple-600 border-b-2 border-purple-600 shadow-sm"
//                         : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
//                     }`}
//                   >
//                     <FileText className="w-4 h-4" />
//                     <span>Lesson Content</span>
//                   </button>
//                   <button
//                     onClick={() => setActiveModalTab("youtube")}
//                     className={`flex-1 px-6 py-4 font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
//                       activeModalTab === "youtube"
//                         ? "bg-white text-red-600 border-b-2 border-red-600 shadow-sm"
//                         : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
//                     }`}
//                   >
//                     <Youtube className="w-4 h-4" />
//                     <span>YouTube Videos</span>
//                   </button>
//                 </div>
//               </div>

//               {/* Scrollable Content Area */}
//               <div className="flex-1 overflow-auto">
//                 {activeModalTab === "content" && (
//                   <div className="p-8">
//                     {loadingLessons[currentLessonData.lessonKey] ? (
//                       <div className="flex flex-col items-center justify-center h-96 space-y-4">
//                         <div className="relative">
//                           <div className="w-16 h-16 border-4 border-purple-200 rounded-full"></div>
//                           <div className="absolute top-0 left-0 w-16 h-16 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
//                         </div>
//                         <div className="text-center">
//                           <p className="text-gray-700 font-medium">
//                             Loading lesson content...
//                           </p>
//                           <p className="text-gray-500 text-sm mt-1">
//                             Preparing your learning experience
//                           </p>
//                         </div>
//                       </div>
//                     ) : lessonContents[currentLessonData.lessonKey] ? (
//                       <div className="prose prose-gray prose-lg max-w-none">
//                         <ReactMarkdown
//                           components={{
//                             h1: ({ children }) => (
//                               <h1
//                                 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-gradient-to-r from-purple-500 to-blue-500"
//                                 style={{
//                                   borderImage:
//                                     "linear-gradient(90deg, #8b5cf6, #3b82f6) 1",
//                                 }}
//                               >
//                                 {children}
//                               </h1>
//                             ),
//                             h2: ({ children }) => (
//                               <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 flex items-center">
//                                 <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full mr-3"></div>
//                                 {children}
//                               </h2>
//                             ),
//                             h3: ({ children }) => (
//                               <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3 flex items-center">
//                                 <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
//                                 {children}
//                               </h3>
//                             ),
//                             p: ({ children }) => (
//                               <p className="text-gray-700 leading-relaxed mb-5 text-base">
//                                 {children}
//                               </p>
//                             ),
//                             ul: ({ children }) => (
//                               <ul className="text-gray-700 mb-5 pl-6 space-y-2">
//                                 {children}
//                               </ul>
//                             ),
//                             ol: ({ children }) => (
//                               <ol className="text-gray-700 mb-5 pl-6 space-y-2">
//                                 {children}
//                               </ol>
//                             ),
//                             li: ({ children }) => (
//                               <li className="relative pl-2">{children}</li>
//                             ),
//                             code: ({ inline, children }) =>
//                               inline ? (
//                                 <code className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-sm font-mono border border-purple-200">
//                                   {children}
//                                 </code>
//                               ) : (
//                                 <code className="block bg-gray-900 text-green-400 p-6 rounded-xl text-sm font-mono overflow-x-auto mb-6 border border-gray-700 shadow-inner">
//                                   {children}
//                                 </code>
//                               ),
//                             pre: ({ children }) => (
//                               <div className="relative">
//                                 <pre className="bg-gray-900 rounded-xl p-6 mb-6 overflow-x-auto border border-gray-700 shadow-2xl">
//                                   {children}
//                                 </pre>
//                                 <div className="absolute top-4 right-4 flex space-x-1">
//                                   <div className="w-3 h-3 bg-red-500 rounded-full"></div>
//                                   <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
//                                   <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//                                 </div>
//                               </div>
//                             ),
//                             blockquote: ({ children }) => (
//                               <blockquote className="border-l-4 border-gradient-to-b from-purple-500 to-blue-500 bg-gradient-to-r from-purple-50 to-blue-50 pl-6 pr-4 py-4 italic text-gray-700 my-6 rounded-r-lg shadow-sm">
//                                 {children}
//                               </blockquote>
//                             ),
//                             strong: ({ children }) => (
//                               <strong className="font-semibold text-gray-900 bg-yellow-100 px-1 rounded">
//                                 {children}
//                               </strong>
//                             ),
//                           }}
//                         >
//                           {lessonContents[currentLessonData.lessonKey]}
//                         </ReactMarkdown>
//                       </div>
//                     ) : (
//                       <div className="flex flex-col items-center justify-center h-96 space-y-4">
//                         <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
//                           <FileText className="w-10 h-10 text-gray-400" />
//                         </div>
//                         <div className="text-center">
//                           <p className="text-gray-700 font-medium">
//                             No content available
//                           </p>
//                           <p className="text-gray-500 text-sm">
//                             This lesson content couldn't be loaded.
//                           </p>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {activeModalTab === "youtube" && (
//                   <div className="p-8">
//                     <YouTubeComponent
//                       lessonTitle={currentLessonData.title}
//                       topic={currentLessonData.topic}
//                       isVisible={activeModalTab === "youtube"}
//                     />
//                   </div>
//                 )}
//               </div>

//               {/* Content Footer - Action Bar */}
//               <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-t border-gray-200/50 p-6">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center space-x-4">
//                     <button className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg">
//                       <CheckCircle className="w-4 h-4" />
//                       <span>Mark Complete</span>
//                     </button>
//                     <button className="flex items-center space-x-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all duration-200">
//                       <Star className="w-4 h-4" />
//                       <span>Bookmark</span>
//                     </button>
//                   </div>

//                   <div className="flex items-center space-x-3">
//                     <button
//                       onClick={() => navigateLesson("prev")}
//                       disabled={!canGoPrev}
//                       className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
//                         canGoPrev
//                           ? "bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-md hover:shadow-lg"
//                           : "bg-gray-100 text-gray-400 cursor-not-allowed"
//                       }`}
//                     >
//                       <ArrowLeft className="w-4 h-4" />
//                       <span>Prev</span>
//                     </button>

//                     <button
//                       onClick={() => navigateLesson("next")}
//                       disabled={!canGoNext}
//                       className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
//                         canGoNext
//                           ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg hover:shadow-xl"
//                           : "bg-gray-100 text-gray-400 cursor-not-allowed"
//                       }`}
//                     >
//                       <span>Next</span>
//                       <ArrowRight className="w-4 h-4" />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CourseView;
