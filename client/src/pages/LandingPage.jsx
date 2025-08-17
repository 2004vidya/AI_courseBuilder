import React, { useState } from "react";
import {
  BookOpen,
  Zap,
  Brain,
  Users,
  Star,
  ArrowRight,
  Sparkles,
  Target,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCourseData } from "../redux/courseSlice";

export default function LandingPage() {
  const [courseInput, setCourseInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [authMode, setAuthMode] = useState("register");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [username, setUsername] = useState("");
  

  const navigate = useNavigate();
  const dispatch = useDispatch();

const handleGenerateCourse = async () => {
  if (!courseInput.trim()) return;

  setIsGenerating(true);

  try {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const response = await fetch(`${API_URL}/generate-course-structure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: courseInput }),
    });

    const data = await response.json();

    if (data.success && data.course && data.course._id) {
      // ✅ Dispatch Redux (if needed)
      dispatch(setCourseData(data.course));

      // ✅ Navigate to correct course page with ID
      // 🔥 KEY FIX: Navigate with state to maintain loading animation
      navigate(`/course/${data.course._id}`, {
        state: { 
          preloadedCourse: data.course,
          fromGeneration: true,
          topic: courseInput 
        }
      });
      
      console.log("✅ Navigating to course:", data.course._id);
    } else {
      console.error("❌ Invalid response format:", data);
      setIsGenerating(false); // Only stop animation on error
    }
  } catch (error) {
    console.error("❌ Error generating course:", error);
    setIsGenerating(false); // Only stop animation on error
  }
  // 🔥 IMPORTANT: Don't call setIsGenerating(false) on success
  // Let the CourseView component handle the transition
};

  const handleRegister = async () => {
    if (!username || !email || !password) {
      setLoginError("All fields are required");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registration successful!");
        setShowAuthModal(false);
        setLoginError("");
        setUsername("");
        setEmail("");
        setPassword("");
      } else {
        setLoginError(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setLoginError("Something went wrong during registration.");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setLoginError("Please enter both email and password");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Login successful");
        console.log(data.user);
        setShowAuthModal(false);
        setEmail("");
        setPassword("");
        setLoginError("");
      } else {
        setLoginError(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50">
          <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white rounded-2xl p-12 shadow-2xl text-center border border-white/20">
            <div className="relative mb-8">
              {/* Outer spinning ring */}
              <div className="w-20 h-20 mx-auto border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              {/* Inner pulsing circle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Generating Your Course
            </h3>
            <p className="text-gray-300 mb-6">
              Our AI is creating a comprehensive course structure for "{courseInput}"
            </p>
            
            {/* Progress indicators */}
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-sm text-blue-300">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <span>Analyzing topic...</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-purple-300">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <span>Creating lesson structure...</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-pink-300">
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <span>Generating quizzes...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              CourseAI
            </span>
          </div>
          <div className="hidden md:flex space-x-20">
            <a
              href="#features"
              className="hover:text-blue-300 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-blue-300 transition-colors"
            >
              How it Works
            </a>
            <a
              href="#pricing"
              className="hover:text-blue-300 transition-colors"
            >
              
            </a>
          </div>
          <div className="flex items-center space-x-4">
            <button
              className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
              onClick={() => {
                setShowAuthModal(true);
                setAuthMode("register"); // default to register
              }}
            >
              Sign In
            </button>
            {showAuthModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/10">
                <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white rounded-2xl p-8 shadow-xl w-full max-w-md relative">
                  <button
                    onClick={() => setShowAuthModal(false)}
                    className="absolute top-3 right-3 text-gray-300 hover:text-white text-xl"
                  >
                    &times;
                  </button>

                  <h2 className="text-3xl font-bold mb-6 text-center">
                    {authMode === "register"
                      ? "Create an Account"
                      : "Welcome Back"}
                  </h2>

                  <div className="space-y-4">
                    {authMode === "register" && (
                      <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-white/10 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}

                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />

                    <button
                      onClick={
                        authMode === "register" ? handleRegister : handleLogin
                      }
                      disabled={!email || !password}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
                    >
                      {authMode === "register" ? "Register" : "Log In"}
                    </button>

                    {loginError && (
                      <p className="text-red-400 text-sm">{loginError}</p>
                    )}

                    <p className="text-sm text-gray-300 text-center pt-4">
                      {authMode === "register" ? (
                        <>
                          Already have an account?{" "}
                          <button
                            onClick={() => setAuthMode("login")}
                            className="text-blue-400 hover:underline"
                          >
                            Log in
                          </button>
                        </>
                      ) : (
                        <>
                          Don't have an account?{" "}
                          <button
                            onClick={() => setAuthMode("register")}
                            className="text-blue-400 hover:underline"
                          >
                            Register
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm">AI-Powered Course Generation</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Create Amazing
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {" "}
              Courses{" "}
            </span>
            in Minutes
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Transform any topic into a comprehensive, structured course with AI.
            Generate lessons, quizzes, and interactive content automatically.
          </p>

          {/* Course Input Section */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 mb-12 border border-white/10">
            <h3 className="text-2xl font-semibold mb-6">
              Try it now - Enter any topic:
            </h3>
            <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
              <input
                type="text"
                value={courseInput}
                onChange={(e) => setCourseInput(e.target.value)}
                placeholder="e.g., C++, Digital Marketing, Data Science..."
                className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isGenerating}
              />
              <button
                onClick={handleGenerateCourse}
                disabled={isGenerating || !courseInput.trim()}
                className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    <span>Generate Course</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">10K+</div>
              <div className="text-gray-400">Courses Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">500+</div>
              <div className="text-gray-400">Topics Covered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400">95%</div>
              <div className="text-gray-400">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">5 Min</div>
              <div className="text-gray-400">Avg. Generation</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Powerful Features for
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {" "}
              Modern Learning
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Everything you need to create, manage, and deliver exceptional
            online courses
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-blue-500/50 transition-all duration-300 group">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg w-fit mb-6 group-hover:scale-110 transition-transform">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">
              AI-Powered Generation
            </h3>
            <p className="text-gray-300 mb-6">
              Advanced AI creates comprehensive course outlines, lessons, and
              quizzes tailored to your topic and learning objectives.
            </p>
            <div className="flex items-center text-blue-400 group-hover:text-blue-300">
              <span className="font-semibold">Learn More</span>
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all duration-300 group">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-lg w-fit mb-6 group-hover:scale-110 transition-transform">
              <Target className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">Interactive Quizzes</h3>
            <p className="text-gray-300 mb-6">
              Automatically generated quizzes with multiple choice, true/false,
              and open-ended questions to test knowledge retention.
            </p>
            <div className="flex items-center text-purple-400 group-hover:text-purple-300">
              <span className="font-semibold">Explore</span>
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-pink-500/50 transition-all duration-300 group">
            <div className="bg-gradient-to-r from-pink-500 to-orange-600 p-3 rounded-lg w-fit mb-6 group-hover:scale-110 transition-transform">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">Rapid Deployment</h3>
            <p className="text-gray-300 mb-6">
              From topic input to complete course in minutes. Save time and
              focus on what matters most - teaching.
            </p>
            <div className="flex items-center text-pink-400 group-hover:text-pink-300">
              <span className="font-semibold">Get Started</span>
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">How It Works</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Create professional courses in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold">1</span>
            </div>
            <h3 className="text-2xl font-semibold mb-4">Enter Topic</h3>
            <p className="text-gray-300">
              Simply type in your course topic - from programming languages to
              business skills
            </p>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold">2</span>
            </div>
            <h3 className="text-2xl font-semibold mb-4">AI Generation</h3>
            <p className="text-gray-300">
              Our AI analyzes your topic and creates a comprehensive course
              structure with lessons and quizzes
            </p>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-pink-500 to-orange-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold">3</span>
            </div>
            <h3 className="text-2xl font-semibold mb-4">Publish & Share</h3>
            <p className="text-gray-300">
              Review, customize, and publish your course. Start teaching
              immediately!
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-white/10">
        <div className="text-center text-gray-400">
          <p>&copy; 2025 CourseAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
// import React, { useState } from "react";
// import {
//   BookOpen,
//   Zap,
//   Brain,
//   Users,
//   Star,
//   ArrowRight,
//   Sparkles,
//   Target,
//   Clock,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";
// import { setCourseData } from "../redux/courseSlice";

// export default function LandingPage() {
//   const [courseInput, setCourseInput] = useState("");
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loginError, setLoginError] = useState("");
//   const [authMode, setAuthMode] = useState("register");
//   const [showAuthModal, setShowAuthModal] = useState(false);
//   const [username, setUsername] = useState("");
  

//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//  const handleGenerateCourse = async () => {
//   try {
//     const response = await fetch("http://localhost:5000/api/generate-course-structure", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ topic: courseInput }),
//     });

//     const data = await response.json();

//     console.log("🔍 Raw data from backend:", data);

//     // Check what's actually inside data
//     dispatch(setCourseData(data)); // TEMPORARILY remove `.content`
//     navigate("/course");
//   } catch (error) {
//     console.error("❌ Error generating course:", error);
//   }
// };

//   const handleRegister = async () => {
//     if (!username || !email || !password) {
//       setLoginError("All fields are required");
//       return;
//     }

//     try {
//       const response = await fetch("http://localhost:5000/api/auth/register", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         credentials: "include",
//         body: JSON.stringify({ username, email, password }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         alert("Registration successful!");
//         setShowAuthModal(false);
//         setLoginError("");
//         setUsername("");
//         setEmail("");
//         setPassword("");
//       } else {
//         setLoginError(data.message || "Registration failed");
//       }
//     } catch (err) {
//       console.error("Registration error:", err);
//       setLoginError("Something went wrong during registration.");
//     }
//   };

//   const handleLogin = async () => {
//     if (!email || !password) {
//       setLoginError("Please enter both email and password");
//       return;
//     }

//     try {
//       const response = await fetch("http://localhost:5000/api/auth/login", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         credentials: "include",
//         body: JSON.stringify({ email, password }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         alert("Login successful");
//         console.log(data.user);
//         setShowAuthModal(false);
//         setEmail("");
//         setPassword("");
//         setLoginError("");
//       } else {
//         setLoginError(data.message || "Login failed");
//       }
//     } catch (error) {
//       console.error("Login error:", error);
//       setLoginError("Something went wrong.");
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
//       {/* Header */}
//       <header className="container mx-auto px-6 py-8">
//         <nav className="flex items-center justify-between">
//           <div className="flex items-center space-x-2">
//             <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
//               <Brain className="h-8 w-8 text-white" />
//             </div>
//             <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
//               CourseAI
//             </span>
//           </div>
//           <div className="hidden md:flex space-x-8">
//             <a
//               href="#features"
//               className="hover:text-blue-300 transition-colors"
//             >
//               Features
//             </a>
//             <a
//               href="#how-it-works"
//               className="hover:text-blue-300 transition-colors"
//             >
//               How it Works
//             </a>
//             <a
//               href="#pricing"
//               className="hover:text-blue-300 transition-colors"
//             >
//               Pricing
//             </a>
//           </div>
//           <div className="flex items-center space-x-4">
//             <button
//               className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
//               onClick={() => {
//                 setShowAuthModal(true);
//                 setAuthMode("register"); // default to register
//               }}
//             >
//               Sign In
//             </button>
//             {showAuthModal && (
//               <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/10">
//                 <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white rounded-2xl p-8 shadow-xl w-full max-w-md relative">
//                   <button
//                     onClick={() => setShowAuthModal(false)}
//                     className="absolute top-3 right-3 text-gray-300 hover:text-white text-xl"
//                   >
//                     &times;
//                   </button>

//                   <h2 className="text-3xl font-bold mb-6 text-center">
//                     {authMode === "register"
//                       ? "Create an Account"
//                       : "Welcome Back"}
//                   </h2>

//                   <div className="space-y-4">
//                     {authMode === "register" && (
//                       <input
//                         type="text"
//                         placeholder="Username"
//                         value={username}
//                         onChange={(e) => setUsername(e.target.value)}
//                         className="w-full px-4 py-3 rounded-lg bg-white/10 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       />
//                     )}

//                     <input
//                       type="email"
//                       placeholder="Email"
//                       value={email}
//                       onChange={(e) => setEmail(e.target.value)}
//                       className="w-full px-4 py-3 rounded-lg bg-white/10 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     />
//                     <input
//                       type="password"
//                       placeholder="Password"
//                       value={password}
//                       onChange={(e) => setPassword(e.target.value)}
//                       className="w-full px-4 py-3 rounded-lg bg-white/10 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
//                     />

//                     <button
//                       onClick={
//                         authMode === "register" ? handleRegister : handleLogin
//                       }
//                       disabled={!email || !password}
//                       className="w-full bg-gradient-to-r from-blue-500 to-purple-600 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
//                     >
//                       {authMode === "register" ? "Register" : "Log In"}
//                     </button>

//                     {loginError && (
//                       <p className="text-red-400 text-sm">{loginError}</p>
//                     )}

//                     <p className="text-sm text-gray-300 text-center pt-4">
//                       {authMode === "register" ? (
//                         <>
//                           Already have an account?{" "}
//                           <button
//                             onClick={() => setAuthMode("login")}
//                             className="text-blue-400 hover:underline"
//                           >
//                             Log in
//                           </button>
//                         </>
//                       ) : (
//                         <>
//                           Don’t have an account?{" "}
//                           <button
//                             onClick={() => setAuthMode("register")}
//                             className="text-blue-400 hover:underline"
//                           >
//                             Register
//                           </button>
//                         </>
//                       )}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </nav>
//       </header>

//       {/* Hero Section */}
//       <section className="container mx-auto px-6 py-20 text-center">
//         <div className="max-w-4xl mx-auto">
//           <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
//             <Sparkles className="h-4 w-4 text-yellow-400" />
//             <span className="text-sm">AI-Powered Course Generation</span>
//           </div>

//           <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
//             Create Amazing
//             <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
//               {" "}
//               Courses{" "}
//             </span>
//             in Minutes
//           </h1>

//           <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
//             Transform any topic into a comprehensive, structured course with AI.
//             Generate lessons, quizzes, and interactive content automatically.
//           </p>

//           {/* Course Input Section */}
//           <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 mb-12 border border-white/10">
//             <h3 className="text-2xl font-semibold mb-6">
//               Try it now - Enter any topic:
//             </h3>
//             <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
//               <input
//                 type="text"
//                 value={courseInput}
//                 onChange={(e) => setCourseInput(e.target.value)}
//                 placeholder="e.g., C++, Digital Marketing, Data Science..."
//                 className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               />
//               <button
//                 onClick={handleGenerateCourse}
//                 disabled={isGenerating || !courseInput.trim()}
//                 className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
//               >
//                 {isGenerating ? (
//                   <>
//                     <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
//                     <span>Generating...</span>
//                   </>
//                 ) : (
//                   <>
//                     <Zap className="h-5 w-5" />
//                     <span>Generate Course</span>
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>

//           {/* Stats */}
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
//             <div className="text-center">
//               <div className="text-3xl font-bold text-blue-400">10K+</div>
//               <div className="text-gray-400">Courses Created</div>
//             </div>
//             <div className="text-center">
//               <div className="text-3xl font-bold text-purple-400">500+</div>
//               <div className="text-gray-400">Topics Covered</div>
//             </div>
//             <div className="text-center">
//               <div className="text-3xl font-bold text-pink-400">95%</div>
//               <div className="text-gray-400">Success Rate</div>
//             </div>
//             <div className="text-center">
//               <div className="text-3xl font-bold text-green-400">5 Min</div>
//               <div className="text-gray-400">Avg. Generation</div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section id="features" className="container mx-auto px-6 py-20">
//         <div className="text-center mb-16">
//           <h2 className="text-4xl md:text-5xl font-bold mb-6">
//             Powerful Features for
//             <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
//               {" "}
//               Modern Learning
//             </span>
//           </h2>
//           <p className="text-xl text-gray-300 max-w-2xl mx-auto">
//             Everything you need to create, manage, and deliver exceptional
//             online courses
//           </p>
//         </div>

//         <div className="grid md:grid-cols-3 gap-8">
//           <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-blue-500/50 transition-all duration-300 group">
//             <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg w-fit mb-6 group-hover:scale-110 transition-transform">
//               <Brain className="h-8 w-8 text-white" />
//             </div>
//             <h3 className="text-2xl font-semibold mb-4">
//               AI-Powered Generation
//             </h3>
//             <p className="text-gray-300 mb-6">
//               Advanced AI creates comprehensive course outlines, lessons, and
//               quizzes tailored to your topic and learning objectives.
//             </p>
//             <div className="flex items-center text-blue-400 group-hover:text-blue-300">
//               <span className="font-semibold">Learn More</span>
//               <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
//             </div>
//           </div>

//           <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all duration-300 group">
//             <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-lg w-fit mb-6 group-hover:scale-110 transition-transform">
//               <Target className="h-8 w-8 text-white" />
//             </div>
//             <h3 className="text-2xl font-semibold mb-4">Interactive Quizzes</h3>
//             <p className="text-gray-300 mb-6">
//               Automatically generated quizzes with multiple choice, true/false,
//               and open-ended questions to test knowledge retention.
//             </p>
//             <div className="flex items-center text-purple-400 group-hover:text-purple-300">
//               <span className="font-semibold">Explore</span>
//               <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
//             </div>
//           </div>

//           <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-pink-500/50 transition-all duration-300 group">
//             <div className="bg-gradient-to-r from-pink-500 to-orange-600 p-3 rounded-lg w-fit mb-6 group-hover:scale-110 transition-transform">
//               <Clock className="h-8 w-8 text-white" />
//             </div>
//             <h3 className="text-2xl font-semibold mb-4">Rapid Deployment</h3>
//             <p className="text-gray-300 mb-6">
//               From topic input to complete course in minutes. Save time and
//               focus on what matters most - teaching.
//             </p>
//             <div className="flex items-center text-pink-400 group-hover:text-pink-300">
//               <span className="font-semibold">Get Started</span>
//               <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* How It Works */}
//       <section id="how-it-works" className="container mx-auto px-6 py-20">
//         <div className="text-center mb-16">
//           <h2 className="text-4xl md:text-5xl font-bold mb-6">How It Works</h2>
//           <p className="text-xl text-gray-300 max-w-2xl mx-auto">
//             Create professional courses in three simple steps
//           </p>
//         </div>

//         <div className="grid md:grid-cols-3 gap-8">
//           <div className="text-center">
//             <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
//               <span className="text-2xl font-bold">1</span>
//             </div>
//             <h3 className="text-2xl font-semibold mb-4">Enter Topic</h3>
//             <p className="text-gray-300">
//               Simply type in your course topic - from programming languages to
//               business skills
//             </p>
//           </div>

//           <div className="text-center">
//             <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
//               <span className="text-2xl font-bold">2</span>
//             </div>
//             <h3 className="text-2xl font-semibold mb-4">AI Generation</h3>
//             <p className="text-gray-300">
//               Our AI analyzes your topic and creates a comprehensive course
//               structure with lessons and quizzes
//             </p>
//           </div>

//           <div className="text-center">
//             <div className="bg-gradient-to-r from-pink-500 to-orange-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
//               <span className="text-2xl font-bold">3</span>
//             </div>
//             <h3 className="text-2xl font-semibold mb-4">Publish & Share</h3>
//             <p className="text-gray-300">
//               Review, customize, and publish your course. Start teaching
//               immediately!
//             </p>
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="container mx-auto px-6 py-20">
//         <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-lg rounded-3xl p-12 text-center border border-white/10">
//           <h2 className="text-4xl md:text-5xl font-bold mb-6">
//             Ready to Create Your First Course?
//           </h2>
//           <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
//             Join thousands of educators who are already using AI to create
//             amazing learning experiences
//           </p>
//           <button className="bg-gradient-to-r from-blue-500 to-purple-600 px-12 py-4 rounded-lg font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105">
//             Start Creating Now
//           </button>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="container mx-auto px-6 py-12 border-t border-white/10">
//         <div className="text-center text-gray-400">
//           <p>&copy; 2025 CourseAI. All rights reserved.</p>
//         </div>
//       </footer>
//     </div>
//   );
// }
