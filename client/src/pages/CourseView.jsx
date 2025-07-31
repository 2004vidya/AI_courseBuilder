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

  /** ✅ Toggle Section Expand/Collapse */
  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  /** ✅ Fetch Lesson Content from Backend */
  const toggleLessonContent = async (e, lesson, topic, sectionId) => {
    e.preventDefault();
    e.stopPropagation();

    const lessonKey = `${sectionId}-${lesson.id}`;

    // ✅ Collapse if clicked again
    if (activeLesson === lessonKey) {
      setActiveLesson(null);
      return;
    }

    setActiveLesson(lessonKey);

    // ✅ Skip fetch if already loaded
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
                        const isExpanded = activeLesson === lessonKey;
                        const isLoading = loadingLessons[lessonKey];
                        const content = lessonContents[lessonKey];

                        return (
                          <div key={lessonKey} className="space-y-2">
                            {/* Lesson Item */}
                            <div
                              className="flex justify-between items-center p-4 bg-black/20 rounded-lg hover:bg-black/30 cursor-pointer"
                              onClick={(e) => toggleLessonContent(e, lesson, courseData.title, sectionId)}
                            >
                              <div className="flex items-center space-x-3">
                                {lesson.completed ? <CheckCircle className="text-green-400" /> : <Circle className="text-white/40" />}
                                <div>
                                  <h4 className="text-white">{lesson.title}</h4>
                                  <p className="text-white/60 text-sm">{lesson.duration || "N/A"}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {isLoading && <Loader className="animate-spin text-white/60" />}
                                <FileText className="text-white/60" />
                                {isExpanded ? <ChevronDown className="text-white/60" /> : <ChevronRight className="text-white/60" />}
                              </div>
                            </div>

                            {/* Lesson Content */}
                            {isExpanded && content && (
                              <div className="text-white ml-8 mr-4 p-6 bg-black/30 rounded-xl border border-white/10">
                                <div className="prose prose-invert max-w-none">
                                  <ReactMarkdown>{content}</ReactMarkdown>
                                </div>
                              </div>
                            )}
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
    </div>
  );
};

export default CourseView;



// import React, { useState } from "react";
// import { useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
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
// } from "lucide-react";

// const CourseView = () => {
//   const rawCourseData = useSelector((state) => state.course.currentCourse);
//   const [expandedSections, setExpandedSections] = useState({});
//   const [activeLesson, setActiveLesson] = useState(null);
//   const [quizAnswers, setQuizAnswers] = useState({});
//   const [showQuiz, setShowQuiz] = useState(false);
//   const [selectedLesson, setSelectedLesson] = useState(null);

//   const navigate = useNavigate();

//   // ✅ 1. Parse only course structure (no lesson content expected yet)
//   let courseData = null;
//   if (rawCourseData) {
//     const raw = rawCourseData.course;
//     if (typeof raw === "string") {
//       try {
//         const start = raw.indexOf("{");
//         const end = raw.lastIndexOf("}");
//         if (start !== -1 && end !== -1 && end > start) {
//           const jsonString = raw.slice(start, end + 1);
//           courseData = JSON.parse(jsonString);
//         } else {
//           console.error("⚠️ Could not find valid JSON bounds.");
//         }
//       } catch (e) {
//         console.error("❌ Failed to parse course JSON:", e);
//       }
//     } else if (typeof raw === "object") {
//       courseData = raw;
//     }
//   }

//   console.log("📦 Parsed course structure:", courseData);

//   // ✅ 2. Toggle section open/close
//   const toggleSection = (sectionId) => {
//     setExpandedSections((prev) => ({
//       ...prev,
//       [sectionId]: !prev[sectionId],
//     }));
//   };

//   // ✅ 3. Handle progress calculation (still works)
//   const calculateProgress = () => {
//     if (!courseData?.sections) return 0;
//     const allLessons = courseData.sections.flatMap((s) => s.lessons || []);
//     const completed = allLessons.filter((l) => l.completed).length;
//     return allLessons.length > 0
//       ? Math.round((completed / allLessons.length) * 100)
//       : 0;
//   };

//   // ✅ 4. Handle quiz answers (if any)
//   const handleQuizAnswer = (questionId, optionIndex) => {
//     setQuizAnswers((prev) => ({
//       ...prev,
//       [questionId]: optionIndex,
//     }));
//   };

//   const fetchLessonContent = async (lesson, topic) => {
//     try {
//       // ✅ Call new backend endpoint for detailed content
//       const response = await fetch(
//         "http://localhost:5000/api/generate-lesson-content",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ topic, lessonTitle: lesson.title }),
//         }
//       );

//       if (!response.ok) throw new Error("Failed to fetch lesson content");

//       const data = await response.json();

//       // ✅ Update lesson with generated content dynamically
//       setActiveLesson({
//         ...lesson,
//         content: data.content,
//       });
//     } catch (error) {
//       console.error("❌ Error loading lesson content:", error);
//     }
//   };

//   // ✅ 6. Handle missing course case
//   if (!courseData || !courseData.title) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
//         <div className="text-white text-center text-2xl font-bold mb-4">
//           No course data found…
//         </div>
//         <button
//           className="bg-blue-500 px-6 py-3 rounded-lg text-white font-semibold"
//           onClick={() => navigate("/")}
//         >
//           Generate a Course
//         </button>
//       </div>
//     );
//   }

//   // 3. (Below this, your regular component rendering as before) ...
//   //    The rest of your code that uses courseData.title, courseData.sections, etc.

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
//       {/* Header */}
//       <div className="bg-black/40 backdrop-blur-md border-b border-white/10">
//         <div className="max-w-7xl mx-auto px-4 py-6">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
//                 <BookOpen className="w-6 h-6 text-white" />
//               </div>
//               <span className="text-xl font-bold text-white">CourseAI</span>
//             </div>
//             <div className="flex items-center space-x-4">
//               <div className="text-white/80">
//                 Progress: {calculateProgress()}%
//               </div>
//               <div className="w-32 bg-white/20 rounded-full h-2">
//                 <div
//                   className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500"
//                   style={{ width: `${calculateProgress()}%` }}
//                 ></div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Course Content */}
//       <div className="max-w-7xl mx-auto px-4 py-8">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Left: Main */}
//           <div className="lg:col-span-2 space-y-8">
//             {/* Title */}
//             <div className="bg-black/30 backdrop-blur-md rounded-2xl p-8 border border-white/10">
//               <div className="flex items-start justify-between mb-6">
//                 <div className="flex-1">
//                   <h1 className="text-4xl font-bold text-white mb-4">
//                     {courseData.title}
//                   </h1>
//                   <p className="text-white/80 text-lg mb-6">
//                     {courseData.overview}
//                   </p>

//                   <div className="flex items-center space-x-6 text-white/70">
//                     <div className="flex items-center space-x-2">
//                       <Star className="w-5 h-5 text-yellow-400 fill-current" />
//                       <span>{courseData.rating}</span>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <Users className="w-5 h-5" />
//                       <span>
//                         {courseData.students &&
//                         courseData.students.toLocaleString
//                           ? courseData.students.toLocaleString()
//                           : courseData.students}{" "}
//                         students
//                       </span>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <Clock className="w-5 h-5" />
//                       <span>{courseData.duration}</span>
//                     </div>
//                   </div>
//                 </div>
//                 <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2">
//                   <Play className="w-5 h-5" />
//                   <span>Start Course</span>
//                 </button>
//               </div>
//             </div>

//             {/* Lessons */}
//             <div className="bg-black/30 backdrop-blur-md rounded-2xl p-8 border border-white/10">
//               <h2 className="text-2xl font-bold text-white mb-6">
//                 Course Content
//               </h2>

//               <div className="space-y-4">
//                 {Array.isArray(courseData.sections) &&
//                 courseData.sections.length > 0 ? (
//                   courseData.sections.map((section) => (
//                     <div
//                       key={section.id}
//                       className="bg-black/20 rounded-xl border border-white/10"
//                     >
//                       <button
//                         onClick={() => toggleSection(section.id)}
//                         className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-black/20 transition-colors duration-200"
//                       >
//                         <div className="flex items-center space-x-3">
//                           <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-semibold">
//                             {section.id}
//                           </div>
//                           <div>
//                             <h3 className="text-lg font-semibold text-white">
//                               {section.title}
//                             </h3>
//                             <p className="text-white/60 text-sm">
//                               {section.lessons.length} lessons
//                             </p>
//                           </div>
//                         </div>
//                         {expandedSections[section.id] ? (
//                           <ChevronDown className="w-5 h-5 text-white/60" />
//                         ) : (
//                           <ChevronRight className="w-5 h-5 text-white/60" />
//                         )}
//                       </button>

//                       {expandedSections[section.id] && (
//                         <div className="px-6 pb-4 space-y-2">
//                           {Array.isArray(section.lessons) &&
//                             section.lessons.map((lesson) => (
//                               <div
//                                 key={lesson.id}
//                                 className="flex items-center justify-between p-4 bg-black/20 rounded-lg hover:bg-black/30 transition-colors duration-200 cursor-pointer"
//                                 onClick={() => fetchLessonContent(lesson, courseData.title)}
//                               >
//                                 <div className="flex items-center space-x-3">
//                                   {lesson.completed ? (
//                                     <CheckCircle className="w-5 h-5 text-green-400" />
//                                   ) : (
//                                     <Circle className="w-5 h-5 text-white/40" />
//                                   )}
//                                   <div>
//                                     <h4 className="text-white font-medium">
//                                       {lesson.title}
//                                     </h4>
//                                     <p className="text-white/60 text-sm">
//                                       {lesson.duration}
//                                     </p>
//                                   </div>
//                                 </div>
//                                 <FileText className="w-4 h-4 text-white/60" />
//                               </div>
//                             ))}
//                         </div>
//                       )}
//                     </div>
//                   ))
//                 ) : (
//                   <div className="text-white/60">No course sections found.</div>
//                 )}
//               </div>
//               {activeLesson && (
//                 <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow">
//                   <h3 className="text-xl font-semibold mb-2">
//                     {activeLesson.title}
//                   </h3>
//                   <p className="text-gray-800 whitespace-pre-line">
//                     {activeLesson.content}
//                   </p>
//                 </div>
//               )}
//             </div>

//             {/* Quiz */}
//             <div className="bg-black/30 backdrop-blur-md rounded-2xl p-8 border border-white/10">
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-2xl font-bold text-white">Course Quiz</h2>
//                 <button
//                   onClick={() => setShowQuiz(!showQuiz)}
//                   className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
//                 >
//                   {showQuiz ? "Hide Quiz" : "Take Quiz"}
//                 </button>
//               </div>

//               {showQuiz && Array.isArray(courseData.quiz) && (
//                 <div className="space-y-6">
//                   {courseData.quiz.map((question, index) => (
//                     <div
//                       key={question.id || index}
//                       className="bg-black/20 rounded-xl p-6 border border-white/10"
//                     >
//                       <h3 className="text-lg font-semibold text-white mb-4">
//                         {index + 1}. {question.question}
//                       </h3>
//                       <div className="space-y-3">
//                         {(question.options || []).map((option, optionIndex) => (
//                           <button
//                             key={optionIndex}
//                             onClick={() =>
//                               handleQuizAnswer(question.id, optionIndex)
//                             }
//                             className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
//                               quizAnswers[question.id] === optionIndex
//                                 ? "bg-blue-500/20 border-blue-400 text-white"
//                                 : "bg-black/20 border-white/10 text-white/80 hover:bg-black/30"
//                             }`}
//                           >
//                             {String.fromCharCode(65 + optionIndex)}. {option}
//                           </button>
//                         ))}
//                       </div>
//                     </div>
//                   ))}

//                   <div className="flex justify-center">
//                     <button className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-300 flex items-center space-x-2">
//                       <Award className="w-5 h-5" />
//                       <span>Submit Quiz</span>
//                     </button>
//                   </div>
//                 </div>
//               )}
//               {showQuiz &&
//                 (!courseData.quiz || courseData.quiz.length === 0) && (
//                   <div className="text-white/80">No quiz for this course.</div>
//                 )}
//             </div>
//           </div>

//           {/* Right: Stats */}
//           <div className="space-y-6">
//             <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 border border-white/10">
//               <h3 className="text-xl font-bold text-white mb-4">
//                 Course Stats
//               </h3>
//               <div className="space-y-4">
//                 <div className="flex justify-between">
//                   <span className="text-white/70">Total Lessons</span>
//                   <span className="text-white font-semibold">
//                     {Array.isArray(courseData.sections)
//                       ? courseData.sections.reduce(
//                           (acc, section) => acc + section.lessons.length,
//                           0
//                         )
//                       : 0}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-white/70">Completed</span>
//                   <span className="text-white font-semibold">
//                     {Array.isArray(courseData.sections)
//                       ? courseData.sections.reduce(
//                           (acc, section) =>
//                             acc +
//                             section.lessons.filter((lesson) => lesson.completed)
//                               .length,
//                           0
//                         )
//                       : 0}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-white/70">Quiz Questions</span>
//                   <span className="text-white font-semibold">
//                     {courseData.quiz ? courseData.quiz.length : 0}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CourseView;
