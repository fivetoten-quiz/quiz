import React, { useState, useMemo, useEffect } from 'react';
import { useQuizAttempts } from '../../Hooks/useQuizAttempts';
import { useCourseData } from '../../Hooks/useCourseData';
import { useBatchChapterData } from '../../Hooks/useBatchChapterData';
import { useBatchSectionData } from '../../Hooks/useBatchSectionData';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';

const Score = () => {
  const navigate = useNavigate();

  // 1. Fetch all quiz attempts
  const { organizedAttempts, loading: attemptsLoading, error: attemptsError } = useQuizAttempts();

  // 2. Get all unique course IDs
  const courseIds = useMemo(() => {
    return Object.keys(organizedAttempts);
  }, [organizedAttempts]);

  // 3. Fetch all course names
  const { courses: coursesData, loading: coursesLoading } = useCourseData(courseIds);

  // 4. Prepare chapter data fetches
  const chapterQueries = useMemo(() => {
    return Object.entries(organizedAttempts).flatMap(([courseId, courseData]) => 
      Object.keys(courseData.chapters).map(chapterId => ({ courseId, chapterId }))
    );
  }, [organizedAttempts]);

  // 5. Fetch all chapters in a batch
  const { chapters: chaptersData, loading: chaptersLoading } = useBatchChapterData(chapterQueries);

  // 6. Prepare section data fetches
  const sectionQueries = useMemo(() => {
    return Object.entries(organizedAttempts).flatMap(([courseId, courseData]) =>
      Object.entries(courseData.chapters).flatMap(([chapterId, chapterData]) =>
        chapterData.attempts.map(attempt => ({
          courseId,
          chapterId,
          sectionId: attempt.sectionId
        }))
      )
    );
  }, [organizedAttempts]);

  // 7. Fetch all sections in a batch
  const { sections: sectionsData, loading: sectionsLoading } = useBatchSectionData(sectionQueries);

  // State management - moved all state hooks together
  const [expandedCourses, setExpandedCourses] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});

  // Calculate overall stats
  const overallStats = useMemo(() => {
    let totalAttempts = 0;
    let totalScore = 0;
    let totalQuestions = 0;
    let highestScore = 0;
    
    Object.values(organizedAttempts).forEach(courseData => {
      totalAttempts += courseData.stats.totalAttempts;
      highestScore = Math.max(highestScore, courseData.stats.highestScore);
      
      Object.values(courseData.chapters).forEach(chapterData => {
        chapterData.attempts.forEach(attempt => {
          totalScore += attempt.score;
          totalQuestions += attempt.totalQuestions;
        });
      });
    });
    
    const averageScore = totalAttempts > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    
    return {
      totalAttempts,
      averageScore,
      highestScore
    };
  }, [organizedAttempts]);

  // Helper functions
  const getCourseName = (courseId) => {
    return coursesData[courseId]?.Subject || courseId;
  };

  const getChapterName = (chapterId) => {
    return chaptersData[chapterId]?.Title || chapterId;
  };

  const getSectionName = (sectionId) => {
    return sectionsData[sectionId]?.SectionName || sectionId;
  };

  const toggleCourse = (courseId) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const toggleChapter = (courseId, chapterId) => {
    setExpandedChapters(prev => ({
      ...prev,
      [`${courseId}-${chapterId}`]: !prev[`${courseId}-${chapterId}`]
    }));
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      timestamp = timestamp.toDate ? timestamp.toDate() : timestamp;
      return timestamp.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const formatPercentage = (score, total) => {
    return Math.round((score / total) * 100);
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (percentage) => {
    if (percentage >= 80) return '🎉';
    if (percentage >= 60) return '👍';
    return '📝';
  };

  const handleMoreDetails = (attempt) => {
    const user = auth.currentUser;
    navigate(`/home/score/sectionScore`, {
      state: {
        courseId: attempt.courseId,
        chapterId: attempt.chapterId,
        sectionId: attempt.sectionId,
        userId: user.uid
      }
    });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4
      }
    }
  };

  const dropdownVariants = {
    hidden: { 
      opacity: 0, 
      height: 0,
      transition: {
        duration: 0.3
      }
    },
    visible: { 
      opacity: 1, 
      height: "auto",
      transition: {
        duration: 0.4
      }
    }
  };

  // Loading/error states
  if (attemptsLoading || coursesLoading || chaptersLoading || sectionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Loading Results</h2>
          <p className="text-gray-600">Please wait while we fetch your quiz data...</p>
        </motion.div>
      </div>
    );
  }

  if (attemptsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center"
        >
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Results</h2>
          <p className="text-gray-600 mb-6">We couldn't load your quiz attempts. Please try again later.</p>
          <button
            onClick={() => navigate('/home')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Return Home
          </button>
        </motion.div>
      </div>
    );
  }

  if (Object.keys(organizedAttempts).length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center"
        >
          <div className="text-gray-500 text-5xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Quiz Results Yet</h2>
          <p className="text-gray-600 mb-6">You haven't completed any quizzes yet. Start practicing to see your results here!</p>
          <button
            onClick={() => navigate('/home/practice')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium mr-3"
          >
            Start Practicing
          </button>
          <button
            onClick={() => navigate('/home')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            Return Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    // from-blue-50 to-indigo-100
    <div className="min-h-screen bg-gradient-to-br p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz Results</h1>
            <p className="text-gray-600">Review your performance across all courses</p>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="hidden md:block mt-4 md:mt-0 px-5 py-2.5 bg-white text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-50 font-medium shadow-sm"
          >
            ← Back to Home
          </button>
        </motion.div>

        {/* Overall Stats Card */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="hidden md:block bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Overall Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div variants={itemVariants} className="bg-blue-50 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{overallStats.totalAttempts}</div>
              <p className="text-sm text-blue-800 font-medium">Total Attempts</p>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-green-50 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{overallStats.averageScore}%</div>
              <p className="text-sm text-green-800 font-medium">Average Score</p>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-purple-50 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{overallStats.highestScore}%</div>
              <p className="text-sm text-purple-800 font-medium">Highest Score</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Courses List */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {Object.entries(organizedAttempts).map(([courseId, courseData]) => (
            <motion.div 
              key={courseId} 
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              {/* Course Header */}
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-200"
                onClick={() => toggleCourse(courseId)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-xl mr-4">
                      <span className="text-blue-600 text-xl">📚</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        {getCourseName(courseId)}
                      </h2>
                      <p className="text-gray-600">{courseData.stats.chaptersCount} chapters</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-4 text-right">
                      <p className="text-sm text-gray-500">Best Score</p>
                      <p className="text-lg font-bold text-blue-600">{courseData.stats.highestScore}%</p>
                    </div>
                    <span className="text-gray-500 text-xl">
                      {expandedCourses[courseId] ? '▼' : '▶'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chapters List */}
              <AnimatePresence>
                {expandedCourses[courseId] && (
                  <motion.div 
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={dropdownVariants}
                    className="p-6 bg-gray-50"
                  >
                    {Object.entries(courseData.chapters).map(([chapterId, chapterData]) => (
                      <motion.div 
                        key={chapterId} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mb-6 last:mb-0 bg-white rounded-xl shadow-sm overflow-hidden"
                      >
                        {/* Chapter Header */}
                        <div 
                          className="p-5 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-200"
                          onClick={() => toggleChapter(courseId, chapterId)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="bg-green-100 p-2.5 rounded-lg mr-4">
                                <span className="text-green-600">📖</span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-800">
                                  {getChapterName(chapterId)}
                                </h3>
                                <p className="text-sm text-gray-600">{chapterData.stats.totalAttempts} attempts</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className="mr-4 text-right">
                                <p className="text-sm text-gray-500">Best Score</p>
                                <p className="font-bold text-green-600">{chapterData.stats.highestScore}%</p>
                              </div>
                              <span className="text-gray-500">
                                {expandedChapters[`${courseId}-${chapterId}`] ? '▼' : '▶'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Attempts List */}
                        <AnimatePresence>
                          {expandedChapters[`${courseId}-${chapterId}`] && (
                            <motion.div 
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                              variants={dropdownVariants}
                              className="p-5 bg-gray-50"
                            >
                              <h4 className="font-medium text-gray-700 mb-4 flex items-center">
                                <span className="mr-2">📋</span> Recent Attempts
                              </h4>
                              <div className="space-y-4">
                                {chapterData.attempts
                                  .sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis())
                                  .slice(0, 5)
                                  .map((attempt, index) => {
                                    const percentage = formatPercentage(attempt.score, attempt.totalQuestions);
                                    return (
                                      <motion.div 
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-white rounded-lg p-4 shadow border border-gray-200 hover:shadow-md transition-shadow"
                                      >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                                          <div className="mb-3 md:mb-0 md:flex-1">
                                            <div className="flex items-center mb-2">
                                              <span className="text-xl mr-3">{getScoreIcon(percentage)}</span>
                                              <h5 className="font-medium text-gray-800">
                                                {getSectionName(attempt.sectionId)}
                                              </h5>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                              <span>
                                                <span className="font-medium">Score:</span> {attempt.score}/{attempt.totalQuestions}
                                              </span>
                                              <span className={getScoreColor(percentage)}>
                                                <span className="font-medium">Percentage:</span> {percentage}%
                                              </span>
                                              <span>
                                                <span className="font-medium">Date:</span> {formatDate(attempt.timestamp)}
                                              </span>
                                            </div>
                                          </div>
                                          
                                          <button 
                                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium whitespace-nowrap"
                                            onClick={() => handleMoreDetails(attempt)}
                                          >
                                            View Details
                                          </button>
                                        </div>
                                      </motion.div>
                                    );
                                  })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Score;
// import React, { useEffect, useState } from 'react';
// import { collection, getDocs } from 'firebase/firestore';
// import { db, auth } from '../../firebase';

// const ScoreBrowser = () => {
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [chapters, setChapters] = useState([]);
//   const [sections, setSections] = useState([]);
//   const [attempts, setAttempts] = useState([]);
//   const [currentView, setCurrentView] = useState('chapters'); // chapters | sections | attempts
//   const [selectedChapter, setSelectedChapter] = useState(null);
//   const [selectedSection, setSelectedSection] = useState(null);

//   useEffect(() => {
//     const fetchChapters = async () => {
//       try {
//         setLoading(true);
//         const user = auth.currentUser;
//         if (!user) throw new Error('User not authenticated');

//         // Get all courses with quiz results (assuming 1 course for simplicity)
//         const coursesRef = collection(db, 'users', user.uid, 'quizResults');
//         const coursesSnap = await getDocs(coursesRef);    
//         console.log(coursesSnap);    
                
//         // if (coursesSnap.empty) {
//         //   setChapters([]);
//         //   return;
//         // }

//         //need fix here set apa apa to false then display null

//         // Get all chapters for the first course (expand this if you have multiple courses)
//         const courseDoc = coursesSnap.docs[0];
//         const chaptersRef = collection(coursesRef, courseDoc.id, 'chapters');

//         console.log(courseDoc);
//         const chaptersSnap = await getDocs(chaptersRef);


//         setChapters(chaptersSnap.docs.map(doc => ({
//           id: doc.id,
//           ...doc.data(),
//           courseId: courseDoc.id
//         })));
//       } catch (error) {
//         console.error("Error fetching chapters:", error);
//         setError(error.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchChapters();
//   }, []);

//   const fetchSections = async (chapter) => {
//     try {
//       setLoading(true);
//       setSelectedChapter(chapter);
      
//       const user = auth.currentUser;
//       const sectionsRef = collection(
//         db,
//         'users', 
//         user.uid,
//         'quizResults',
//         chapter.courseId,
//         'chapters',
//         chapter.id,
//         'sections'
//       );
      
//       const sectionsSnap = await getDocs(sectionsRef);
//       setSections(sectionsSnap.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       })));
//       setCurrentView('sections');
//     } catch (error) {
//       console.error("Error fetching sections:", error);
//       setError(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchAttempts = async (section) => {
//     try {
//       setLoading(true);
//       setSelectedSection(section);
      
//       const user = auth.currentUser;
//       const attemptsRef = collection(
//         db,
//         'users', 
//         user.uid,
//         'quizResults',
//         selectedChapter.courseId,
//         'chapters',
//         selectedChapter.id,
//         'sections',
//         section.id,
//         'attempts'
//       );
      
//       const attemptsSnap = await getDocs(attemptsRef);
//       setAttempts(attemptsSnap.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data(),
//         timestamp: doc.data().timestamp?.toDate()
//       })));
//       setCurrentView('attempts');
//     } catch (error) {
//       console.error("Error fetching attempts:", error);
//       setError(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (date) => {
//     if (!date) return 'No date recorded';
//     return date.toLocaleString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const goBack = () => {
//     if (currentView === 'attempts') {
//       setCurrentView('sections');
//     } else if (currentView === 'sections') {
//       setCurrentView('chapters');
//     }
//   };

//   if (loading) return <div className="text-center py-8">Loading...</div>;
//   if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

//   return (
//     <div className="max-w-3xl mx-auto p-4">
//       <h2 className="text-2xl font-bold mb-6">Your Quiz Results</h2>
      
//       {currentView !== 'chapters' && (
//         <button 
//           onClick={goBack}
//           className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
//         >
//           <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//           </svg>
//           Back
//         </button>
//       )}

//       {currentView === 'chapters' && (
//         <div className="space-y-2">
//           <h3 className="text-lg font-medium mb-2">Select a Chapter</h3>
//           {chapters.length === 0 ? (
//             <p className="text-gray-500">No chapters with quiz results found</p>
//           ) : (
//             chapters.map(chapter => (
//               <button
//                 key={chapter.id}
//                 onClick={() => fetchSections(chapter)}
//                 className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
//               >
//                 {chapter.name || `Chapter ${chapter.id}`}
//               </button>
//             ))
//           )}
//         </div>
//       )}

//       {currentView === 'sections' && (
//         <div className="space-y-2">
//           <h3 className="text-lg font-medium mb-2">
//             Sections in {selectedChapter?.name || 'this chapter'}
//           </h3>
//           {sections.length === 0 ? (
//             <p className="text-gray-500">No sections with quiz results found</p>
//           ) : (
//             sections.map(section => (
//               <button
//                 key={section.id}
//                 onClick={() => fetchAttempts(section)}
//                 className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
//               >
//                 {section.name || `Section ${section.id}`}
//               </button>
//             ))
//           )}
//         </div>
//       )}

//       {currentView === 'attempts' && (
//         <div className="space-y-4">
//           <h3 className="text-lg font-medium mb-2">
//             Attempts for {selectedSection?.name || 'this section'}
//           </h3>
//           {attempts.length === 0 ? (
//             <p className="text-gray-500">No quiz attempts found</p>
//           ) : (
//             attempts.map((attempt, index) => (
//               <div 
//                 key={attempt.id}
//                 className={`p-4 border rounded-lg ${
//                   index === 0 ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 
//                   'border-gray-200 dark:border-gray-700'
//                 }`}
//               >
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <h3 className="font-medium">
//                       Attempt #{attempts.length - index}
//                       {index === 0 && (
//                         <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full dark:bg-green-900 dark:text-green-200">
//                           Latest
//                         </span>
//                       )}
//                     </h3>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">
//                       {formatDate(attempt.timestamp)}
//                     </p>
//                   </div>
//                   <div className="text-right">
//                     <span className="text-2xl font-bold">
//                       {attempt.score}/{attempt.totalQuestions}
//                     </span>
//                     <div className="text-sm">
//                       {Math.round(attempt.percentage)}% correct
//                     </div>
//                   </div>
//                 </div>
                
//                 <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
//                   <div 
//                     className={`h-2.5 rounded-full ${
//                       attempt.percentage >= 80 ? 'bg-green-500' :
//                       attempt.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
//                     }`}
//                     style={{ width: `${attempt.percentage}%` }}
//                   ></div>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default ScoreBrowser;