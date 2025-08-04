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
} from "lucide-react";

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

  /** ✅ Fetch Course from MongoDB on Mount */
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/courses/${courseId}`);
        if (!res.ok) throw new Error("Failed to fetch course data");
        const data = await res.json();
        setCourseData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingCourse(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  /** ✅ Get all lessons in order for navigation */
  const getAllLessons = () => {
    if (!courseData?.sections) return [];
    const allLessons = [];
    courseData.sections.forEach((section, sIndex) => {
      section.lessons?.forEach((lesson, lIndex) => {
        allLessons.push({
          ...lesson,
          sectionId: section.id || `section-${sIndex}`,
          sectionTitle: section.title,
          lessonKey: `${section.id || `section-${sIndex}`}-${lesson.id || lIndex}`,
          globalIndex: allLessons.length,
        });
      });
    });
    return allLessons;
  };

  /** ✅ Get current lesson index */
  const getCurrentLessonIndex = () => {
    if (!currentLessonData) return -1;
    const allLessons = getAllLessons();
    return allLessons.findIndex(lesson => lesson.lessonKey === currentLessonData.lessonKey);
  };

  /** ✅ Navigate to next/previous lesson */
  const navigateLesson = async (direction) => {
    const allLessons = getAllLessons();
    const currentIndex = getCurrentLessonIndex();
    let newIndex;

    if (direction === 'next') {
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
    };
    setCurrentLessonData(lessonData);
    setModalOpen(true);

    // Skip fetch if already loaded
    if (lessonContents[lessonKey]) return;

    setLoadingLessons((prev) => ({ ...prev, [lessonKey]: true }));

    try {
      const res = await fetch("http://localhost:5000/api/courses/generate-lesson-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, lessonTitle: lesson.title }),
      });

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
    const allLessons = courseData.sections.flatMap((s) => s.lessons || []);
    const completed = allLessons.filter((l) => l.completed).length;
    return allLessons.length ? Math.round((completed / allLessons.length) * 100) : 0;
  };

  /** ✅ Handle Back Navigation */
  const handleBack = () => navigate("/");

  /** ✅ Loading & Error States */
  if (loadingCourse) return <div className="text-white p-10">Loading course...</div>;
  if (error) return <div className="text-red-400 p-10">Error: {error}</div>;
  if (!courseData) return <div className="text-white p-10">No course data found</div>;

  const allLessons = getAllLessons();
  const currentIndex = getCurrentLessonIndex();
  const canGoNext = currentIndex < allLessons.length - 1;
  const canGoPrev = currentIndex > 0;

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
            <h1 className="text-4xl font-bold text-white mb-4">{courseData.title}</h1>
            <p className="text-white/80 mb-6">{courseData.description}</p>
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
            <h2 className="text-2xl font-bold text-white mb-6">Course Content</h2>

            {courseData.sections?.map((section, sIndex) => {
              const sectionId = section.id || `section-${sIndex}`;

              return (
                <div key={sectionId} className="bg-black/20 rounded-xl border border-white/10 mb-4">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(sectionId)}
                    className="w-full px-6 py-4 flex justify-between items-center hover:bg-black/20"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-semibold">
                        {sIndex + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                        <p className="text-white/60 text-sm">{section.lessons?.length} lessons</p>
                      </div>
                    </div>
                    {expandedSections[sectionId] ? (
                      <ChevronDown className="text-white/60" />
                    ) : (
                      <ChevronRight className="text-white/60" />
                    )}
                  </button>

                  {/* Lessons */}
                  {expandedSections[sectionId] && (
                    <div className="px-6 pb-4 space-y-2">
                      {section.lessons?.map((lesson, lIndex) => {
                        const lessonKey = `${sectionId}-${lesson.id || lIndex}`;

                        return (
                          <div key={lessonKey} className="space-y-2">
                            {/* Lesson Item */}
                            <div
                              className="flex justify-between items-center p-4 bg-black/20 rounded-lg hover:bg-black/30 cursor-pointer transition-colors"
                              onClick={(e) => handleLessonClick(e, lesson, courseData.title, sectionId)}
                            >
                              <div className="flex items-center space-x-3">
                                {lesson.completed ? <CheckCircle className="text-green-400" /> : <Circle className="text-white/40" />}
                                <div>
                                  <h4 className="text-white">{lesson.title}</h4>
                                  <p className="text-white/60 text-sm">{lesson.duration || "N/A"}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <FileText className="text-white/60" />
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
                <span>{courseData.sections.reduce((a, s) => a + (s.lessons?.length || 0), 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed</span>
                <span>{courseData.sections.reduce((a, s) => a + (s.lessons?.filter((l) => l.completed).length || 0), 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Progress</span>
                <span>{calculateProgress()}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Enhanced Lesson Modal */}
      {modalOpen && currentLessonData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          {/* Modal Container - Portrait orientation */}
          <div className="w-full max-w-4xl h-[90vh] flex">
            {/* Left Side - Lesson Navigation Panel */}
            <div className="w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-l-2xl flex flex-col shadow-2xl">
              {/* Navigation Header */}
              <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-semibold">Course Navigation</span>
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
                  <h3 className="text-white font-medium text-sm mb-1">{currentLessonData.title}</h3>
                  <p className="text-slate-400 text-xs">{allLessons.find(l => l.lessonKey === currentLessonData.lessonKey)?.sectionTitle}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-purple-400 text-xs font-medium">
                      Lesson {currentIndex + 1} of {allLessons.length}
                    </span>
                    <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / allLessons.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Progress - Moved up and made scrollable */}
              <div className="flex-1 p-6 overflow-y-auto">
                <h4 className="text-white font-medium mb-4 text-sm">Course Progress</h4>
                <div className="space-y-3">
                  {courseData.sections?.map((section, sIndex) => {
                    const completedLessons = section.lessons?.filter(l => l.completed).length || 0;
                    const totalLessons = section.lessons?.length || 0;
                    const sectionProgress = totalLessons ? (completedLessons / totalLessons) * 100 : 0;
                    
                    return (
                      <div key={section.id} className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-slate-300 text-xs font-medium">{section.title}</span>
                          <span className="text-slate-400 text-xs">{completedLessons}/{totalLessons}</span>
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

            {/* Right Side - Lesson Content */}
            <div className="flex-1 bg-white rounded-r-2xl shadow-2xl overflow-hidden border border-gray-200/50 flex flex-col">
              {/* Content Header */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200/50 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                      {currentLessonData.title}
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{currentLessonData.duration || "N/A"}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{allLessons.find(l => l.lessonKey === currentLessonData.lessonKey)?.sectionTitle}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                    {currentIndex + 1}/{allLessons.length}
                  </div>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-auto">
                <div className="p-8">
                  {loadingLessons[currentLessonData.lessonKey] ? (
                    <div className="flex flex-col items-center justify-center h-96 space-y-4">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-purple-200 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-700 font-medium">Loading lesson content...</p>
                        <p className="text-gray-500 text-sm mt-1">Preparing your learning experience</p>
                      </div>
                    </div>
                  ) : lessonContents[currentLessonData.lessonKey] ? (
                    <div className="prose prose-gray prose-lg max-w-none">
                      <ReactMarkdown 
                        components={{
                          h1: ({children}) => (
                            <h1 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-gradient-to-r from-purple-500 to-blue-500" 
                                style={{borderImage: 'linear-gradient(90deg, #8b5cf6, #3b82f6) 1'}}>
                              {children}
                            </h1>
                          ),
                          h2: ({children}) => (
                            <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 flex items-center">
                              <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full mr-3"></div>
                              {children}
                            </h2>
                          ),
                          h3: ({children}) => (
                            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3 flex items-center">
                              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                              {children}
                            </h3>
                          ),
                          p: ({children}) => <p className="text-gray-700 leading-relaxed mb-5 text-base">{children}</p>,
                          ul: ({children}) => <ul className="text-gray-700 mb-5 pl-6 space-y-2">{children}</ul>,
                          ol: ({children}) => <ol className="text-gray-700 mb-5 pl-6 space-y-2">{children}</ol>,
                          li: ({children}) => <li className="relative pl-2">{children}</li>,
                          code: ({inline, children}) => 
                            inline ? 
                              <code className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-sm font-mono border border-purple-200">{children}</code> :
                              <code className="block bg-gray-900 text-green-400 p-6 rounded-xl text-sm font-mono overflow-x-auto mb-6 border border-gray-700 shadow-inner">{children}</code>,
                          pre: ({children}) => (
                            <div className="relative">
                              <pre className="bg-gray-900 rounded-xl p-6 mb-6 overflow-x-auto border border-gray-700 shadow-2xl">{children}</pre>
                              <div className="absolute top-4 right-4 flex space-x-1">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              </div>
                            </div>
                          ),
                          blockquote: ({children}) => (
                            <blockquote className="border-l-4 border-gradient-to-b from-purple-500 to-blue-500 bg-gradient-to-r from-purple-50 to-blue-50 pl-6 pr-4 py-4 italic text-gray-700 my-6 rounded-r-lg shadow-sm">
                              {children}
                            </blockquote>
                          ),
                          strong: ({children}) => <strong className="font-semibold text-gray-900 bg-yellow-100 px-1 rounded">{children}</strong>,
                        }}
                      >
                        {lessonContents[currentLessonData.lessonKey]}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-96 space-y-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                        <FileText className="w-10 h-10 text-gray-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-gray-700 font-medium">No content available</p>
                        <p className="text-gray-500 text-sm">This lesson content couldn't be loaded.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Footer - Action Bar */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-t border-gray-200/50 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span>Mark Complete</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all duration-200">
                      <Star className="w-4 h-4" />
                      <span>Bookmark</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => navigateLesson('prev')}
                      disabled={!canGoPrev}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                        canGoPrev 
                          ? 'bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-md hover:shadow-lg' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Prev</span>
                    </button>

                    <button
                      onClick={() => navigateLesson('next')}
                      disabled={!canGoNext}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                        canGoNext 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg hover:shadow-xl' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
// } from "lucide-react";

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

//   /** ✅ Fetch Course from MongoDB on Mount */
//   useEffect(() => {
//     const fetchCourse = async () => {
//       try {
//         const res = await fetch(`http://localhost:5000/api/courses/${courseId}`);
//         if (!res.ok) throw new Error("Failed to fetch course data");
//         const data = await res.json();
//         setCourseData(data);
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoadingCourse(false);
//       }
//     };
//     fetchCourse();
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
//           lessonKey: `${section.id || `section-${sIndex}`}-${lesson.id || lIndex}`,
//           globalIndex: allLessons.length,
//         });
//       });
//     });
//     return allLessons;
//   };

//   /** ✅ Get current lesson index */
//   const getCurrentLessonIndex = () => {
//     if (!currentLessonData) return -1;
//     const allLessons = getAllLessons();
//     return allLessons.findIndex(lesson => lesson.lessonKey === currentLessonData.lessonKey);
//   };

//   /** ✅ Navigate to next/previous lesson */
//   const navigateLesson = async (direction) => {
//     const allLessons = getAllLessons();
//     const currentIndex = getCurrentLessonIndex();
//     let newIndex;

//     if (direction === 'next') {
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

//     // Skip fetch if already loaded
//     if (lessonContents[lessonKey]) return;

//     setLoadingLessons((prev) => ({ ...prev, [lessonKey]: true }));

//     try {
//       const res = await fetch("http://localhost:5000/api/courses/generate-lesson-content", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ topic, lessonTitle: lesson.title }),
//       });

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
//     return allLessons.length ? Math.round((completed / allLessons.length) * 100) : 0;
//   };

//   /** ✅ Handle Back Navigation */
//   const handleBack = () => navigate("/");

//   /** ✅ Loading & Error States */
//   if (loadingCourse) return <div className="text-white p-10">Loading course...</div>;
//   if (error) return <div className="text-red-400 p-10">Error: {error}</div>;
//   if (!courseData) return <div className="text-white p-10">No course data found</div>;

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
//             <h1 className="text-4xl font-bold text-white mb-4">{courseData.title}</h1>
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
//             <h2 className="text-2xl font-bold text-white mb-6">Course Content</h2>

//             {courseData.sections?.map((section, sIndex) => {
//               const sectionId = section.id || `section-${sIndex}`;

//               return (
//                 <div key={sectionId} className="bg-black/20 rounded-xl border border-white/10 mb-4">
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
//                         <h3 className="text-lg font-semibold text-white">{section.title}</h3>
//                         <p className="text-white/60 text-sm">{section.lessons?.length} lessons</p>
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
//                               onClick={(e) => handleLessonClick(e, lesson, courseData.title, sectionId)}
//                             >
//                               <div className="flex items-center space-x-3">
//                                 {lesson.completed ? <CheckCircle className="text-green-400" /> : <Circle className="text-white/40" />}
//                                 <div>
//                                   <h4 className="text-white">{lesson.title}</h4>
//                                   <p className="text-white/60 text-sm">{lesson.duration || "N/A"}</p>
//                                 </div>
//                               </div>
//                               <div className="flex items-center space-x-2">
//                                 <FileText className="text-white/60" />
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
//                 <span>{courseData.sections.reduce((a, s) => a + (s.lessons?.length || 0), 0)}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span>Completed</span>
//                 <span>{courseData.sections.reduce((a, s) => a + (s.lessons?.filter((l) => l.completed).length || 0), 0)}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span>Progress</span>
//                 <span>{calculateProgress()}%</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ✅ Lesson Modal */}
//       {modalOpen && currentLessonData && (
//         <div className="fixed inset-0  backdrop-blur-md flex items-center justify-center z-50 p-4">
//           <div className="w-full max-w-2xl h-[96vh] flex flex-col">
//             {/* Modal Header - Outside the content area */}
//             <div className="flex items-center justify-between mb-6 bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/10">
//               <div className="flex-1">
//                 <h2 className="text-2xl font-bold text-white mb-1">{currentLessonData.title}</h2>
//                 <p className="text-white/70 text-sm">
//                   {allLessons.find(l => l.lessonKey === currentLessonData.lessonKey)?.sectionTitle}
//                 </p>
//               </div>
//               <button
//                 onClick={closeModal}
//                 className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-200 ml-4"
//               >
//                 <X className="w-6 h-6" />
//               </button>
//             </div>

//             {/* Modal Content - A4-like white paper */}
//             <div className="flex-1 bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200">
//               <div className="h-full overflow-auto p-12">
//                 {loadingLessons[currentLessonData.lessonKey] ? (
//                   <div className="flex items-center justify-center h-full">
//                     <div className="flex items-center space-x-3 text-gray-600">
//                       <Loader className="animate-spin w-6 h-6" />
//                       <span className="text-lg">Loading lesson content...</span>
//                     </div>
//                   </div>
//                 ) : lessonContents[currentLessonData.lessonKey] ? (
//                   <div className="prose prose-gray prose-lg max-w-none">
//                     <ReactMarkdown 
//                       components={{
//                         h1: ({children}) => <h1 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">{children}</h1>,
//                         h2: ({children}) => <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">{children}</h2>,
//                         h3: ({children}) => <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">{children}</h3>,
//                         p: ({children}) => <p className="text-gray-700 leading-relaxed mb-4">{children}</p>,
//                         ul: ({children}) => <ul className="text-gray-700 mb-4 pl-6">{children}</ul>,
//                         ol: ({children}) => <ol className="text-gray-700 mb-4 pl-6">{children}</ol>,
//                         li: ({children}) => <li className="mb-2">{children}</li>,
//                         code: ({inline, children}) => 
//                           inline ? 
//                             <code className="bg-gray-100 text-purple-700 px-2 py-1 rounded text-sm font-mono">{children}</code> :
//                             <code className="block bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto mb-4">{children}</code>,
//                         pre: ({children}) => <pre className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">{children}</pre>,
//                         blockquote: ({children}) => <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-600 my-4">{children}</blockquote>,
//                         strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>
//                       }}
//                     >
//                       {lessonContents[currentLessonData.lessonKey]}
//                     </ReactMarkdown>
//                   </div>
//                 ) : (
//                   <div className="flex items-center justify-center h-full text-gray-500">
//                     <p className="text-lg">No content available for this lesson.</p>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Modal Footer - Outside the content area */}
//             <div className="mt-6 flex items-center justify-between bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/10">
//               <button
//                 onClick={() => navigateLesson('prev')}
//                 disabled={!canGoPrev}
//                 className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 font-medium ${
//                   canGoPrev 
//                     ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-500/25' 
//                     : 'bg-gray-600 text-gray-400 cursor-not-allowed'
//                 }`}
//               >
//                 <ArrowLeft className="w-4 h-4" />
//                 <span>Previous</span>
//               </button>

//               <div className="text-white/80 text-sm font-medium bg-white/10 px-4 py-2 rounded-lg">
//                 Lesson {currentIndex + 1} of {allLessons.length}
//               </div>

//               <button
//                 onClick={() => navigateLesson('next')}
//                 disabled={!canGoNext}
//                 className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 font-medium ${
//                   canGoNext 
//                     ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-500/25' 
//                     : 'bg-gray-600 text-gray-400 cursor-not-allowed'
//                 }`}
//               >
//                 <span>Next</span>
//                 <ArrowRight className="w-4 h-4" />
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CourseView;
