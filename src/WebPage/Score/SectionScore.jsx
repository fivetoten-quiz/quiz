import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useCourseData } from '../../Hooks/useCourseData';
import { useBatchChapterData } from '../../Hooks/useBatchChapterData';
import { useBatchSectionData } from '../../Hooks/useBatchSectionData';
import AttemptsChart from './AttemptsChart';
import { motion, AnimatePresence } from 'framer-motion';

const SectionScore = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { courseId, chapterId, sectionId, userId } = location.state || {};
  
  // Fetch metadata for naming
  const { courses: coursesData } = useCourseData([courseId]);
  const { chapters: chaptersData } = useBatchChapterData([{ courseId, chapterId }]);
  const { sections: sectionsData } = useBatchSectionData([{ courseId, chapterId, sectionId }]);
  
  // State for attempts and UI
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAttempt, setExpandedAttempt] = useState(null);
  const [showAllAttempts, setShowAllAttempts] = useState(false);

  // Get names using your existing functions
  const getCourseName = (id) => coursesData[id]?.Subject || id;
  const getChapterName = (id) => chaptersData[id]?.Title || id;
  const getSectionName = (id) => sectionsData[id]?.SectionName || id;

  useEffect(() => {
    if (!courseId || !chapterId || !sectionId || !userId) {
      setError('Missing required parameters');
      setLoading(false);
      return;
    }

    const fetchAttempts = async () => {
      try {
        setLoading(true);
        const attemptsPath = `users/${userId}/quizResults/${courseId}/chapters/${chapterId}/sections/${sectionId}/attempts`;
        const attemptsRef = collection(db, attemptsPath);
        // Order by timestamp descending to get newest first
        const q = query(attemptsRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const attemptsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamp to JS Date object
          date: doc.data().timestamp?.toDate() 
        }));
        
        setAttempts(attemptsData);
      } catch (err) {
        console.error("Error fetching attempts:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAttempts();
  }, [courseId, chapterId, sectionId, userId]);

  const formatPercentage = (score, total) => Math.round((score / total) * 100);
  const formatDate = (date) => {
    return date?.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) || 'N/A';
  };

  // Get performance color based on score percentage
  const getPerformanceColor = (score, total) => {
    const percentage = formatPercentage(score, total);
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get performance icon based on score percentage
  const getPerformanceIcon = (score, total) => {
    const percentage = formatPercentage(score, total);
    if (percentage >= 80) return '🎯'; // Bullseye/target
    if (percentage >= 60) return '📊'; // Chart
    return '📝'; // Memo
  };

  // Get creative attempt name based on score and index
  const getAttemptName = (attempt, index, totalAttempts) => {
    const percentage = formatPercentage(attempt.score, attempt.totalQuestions);
    const attemptNumber = totalAttempts - index; // Since we're displaying newest first
    
    // Performance-based names
    if (percentage >= 90) return `Exceptional Performance #${attemptNumber}`;
    if (percentage >= 80) return `Great Work #${attemptNumber}`;
    if (percentage >= 70) return `Solid Effort #${attemptNumber}`;
    if (percentage >= 60) return `Good Try #${attemptNumber}`;
    if (percentage >= 50) return `Practice Needed #${attemptNumber}`;
    return `Let's Improve #${attemptNumber}`;
  };

  // Get time-based description
  const getTimeDescription = (date) => {
    const now = new Date();
    const attemptDate = new Date(date);
    const diffInHours = Math.floor((now - attemptDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return formatDate(date);
  };

  // Get displayed attempts (latest 3 or all)
  const displayedAttempts = showAllAttempts ? attempts : attempts.slice(0, 3);

  // Variants for the whole attempts list expand/collapse
  const listVariants = {
    collapsed: { 
      opacity: 0, 
      height: 0, 
      transition: { duration: 0.4 } 
    },
    expanded: { 
      opacity: 1, 
      height: "auto", 
      transition: { duration: 0.4 } 
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-gray-600">Loading your results...</span>
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center h-64">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md">
        <span className="block sm:inline">⚠️ Error: {error}</span>
      </div>
    </div>
  );

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header with navigation back */}
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 transform hover:-translate-x-1"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Scores
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Attempt Details
        </h1>
        <div className="w-24"></div> {/* Spacer for alignment */}
      </div>

      {/* Section Information Card */}
      <div className="hidden md:block bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200 transition-all duration-300 hover:shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Course</h2>
              <p className="text-lg font-semibold">{getCourseName(courseId)}</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-green-100 p-2 rounded-full mr-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Chapter</h2>
              <p className="text-lg font-semibold">{getChapterName(chapterId)}</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-purple-100 p-2 rounded-full mr-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Section</h2>
              <p className="text-lg font-semibold">{getSectionName(sectionId)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attempts List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Quiz Attempts
        </h2>
        
        {attempts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-100 rounded-lg animate-pulse">
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2">No attempts found for this section</p>
          </div>
        ) : (
          <>
            {attempts.slice(0,3).map((attempt, index) => (
                            <div 
                key={attempt.id} 
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                {/* Attempt Summary */}
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setExpandedAttempt(expandedAttempt === attempt.id ? null : attempt.id)}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getPerformanceIcon(attempt.score, attempt.totalQuestions)}</span>
                    <div>
                      <p className="font-medium">
                        {getAttemptName(attempt, index, attempts.length)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getTimeDescription(attempt.date)}
                      </p>
                      <p className={`text-sm font-semibold ${getPerformanceColor(attempt.score, attempt.totalQuestions)}`}>
                        Score: {attempt.score}/{attempt.totalQuestions} ({formatPercentage(attempt.score, attempt.totalQuestions)}%)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2 text-sm">
                      {expandedAttempt === attempt.id ? 'Hide details' : 'Show details'}
                    </span>
                    <svg 
                      className={`w-5 h-5 text-gray-500 transform transition-transform duration-300 ${expandedAttempt === attempt.id ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded Attempt Details */}
                <AnimatePresence>
                    {expandedAttempt === attempt.id && (
                      <motion.div 
                          key="extraAttempts"
                          initial="collapsed"
                          animate="expanded"
                          exit="collapsed"
                          variants={listVariants}
                          className="p-4 border-t border-gray-200 bg-gray-50 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Date Completed</h3>
                              <p>{formatDate(attempt.date)}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Time Spent</h3>
                              <p>{attempt.timeSpent || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Correct Answers</h3>
                              <p>{attempt.score}/{attempt.totalQuestions}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Percentage</h3>
                              <p className={getPerformanceColor(attempt.score, attempt.totalQuestions)}>
                                {formatPercentage(attempt.score, attempt.totalQuestions)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                </AnimatePresence>

              </div>
            ))}

            <AnimatePresence>
              {showAllAttempts && (
                <motion.div          
                    key="extraAttempts"
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    variants={listVariants}
                    className="space-y-4 overflow-hidden">

                      {displayedAttempts.slice(3).map((attempt, index) => (
                                    <div 
                        key={attempt.id} 
                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md"
                      >
                        {/* Attempt Summary */}
                        <div 
                          className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => setExpandedAttempt(expandedAttempt === attempt.id ? null : attempt.id)}
                        >
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{getPerformanceIcon(attempt.score, attempt.totalQuestions)}</span>
                            <div>
                              <p className="font-medium">
                                {getAttemptName(attempt, index, attempts.length - 3)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {getTimeDescription(attempt.date)}
                              </p>
                              <p className={`text-sm font-semibold ${getPerformanceColor(attempt.score, attempt.totalQuestions)}`}>
                                Score: {attempt.score}/{attempt.totalQuestions} ({formatPercentage(attempt.score, attempt.totalQuestions)}%)
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-500 mr-2 text-sm">
                              {expandedAttempt === attempt.id ? 'Hide details' : 'Show details'}
                            </span>
                            <svg 
                              className={`w-5 h-5 text-gray-500 transform transition-transform duration-300 ${expandedAttempt === attempt.id ? 'rotate-180' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {/* Expanded Attempt Details */}
                        <AnimatePresence>
                            {expandedAttempt === attempt.id && (
                              <motion.div 
                                  key="extraAttempts"
                                  initial="collapsed"
                                  animate="expanded"
                                  exit="collapsed"
                                  variants={listVariants}
                                  className="p-4 border-t border-gray-200 bg-gray-50 animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <div>
                                      <h3 className="text-sm font-medium text-gray-500">Date Completed</h3>
                                      <p>{formatDate(attempt.date)}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                      <h3 className="text-sm font-medium text-gray-500">Time Spent</h3>
                                      <p>{attempt.timeSpent || 'N/A'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                      <h3 className="text-sm font-medium text-gray-500">Correct Answers</h3>
                                      <p>{attempt.score}/{attempt.totalQuestions}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <div>
                                      <h3 className="text-sm font-medium text-gray-500">Percentage</h3>
                                      <p className={getPerformanceColor(attempt.score, attempt.totalQuestions)}>
                                        {formatPercentage(attempt.score, attempt.totalQuestions)}%
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                        </AnimatePresence>

                      </div>
                    ))}
                </motion.div>
              )}
            </AnimatePresence>


            
            {/* View More/Less Button */}
            {attempts.length > 3 && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setShowAllAttempts(!showAllAttempts)}
                  className="px-6 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 flex items-center"
                >
                  {showAllAttempts ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Show Less
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      View All
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        <AttemptsChart attempts={attempts} />
      </div>

      {/* Add custom animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default SectionScore;