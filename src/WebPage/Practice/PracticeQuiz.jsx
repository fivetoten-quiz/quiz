import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useCourseData } from '../../Hooks/useCourseData';
import { useBatchChapterData } from '../../Hooks/useBatchChapterData';
import { useBatchSectionData } from '../../Hooks/useBatchSectionData';
import { motion, AnimatePresence } from 'framer-motion';

const PracticeQuiz = () => {
  const { state } = useLocation();
  const { courseId, chapterId, sectionId } = state || {};
  const navigate = useNavigate();
  
  const [quizzes, setQuizzes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [hasScored, setHasScored] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);

  // Fetch metadata for naming
  const { courses: coursesData } = useCourseData([courseId]);
  const { chapters: chaptersData } = useBatchChapterData([{ courseId, chapterId }]);
  const { sections: sectionsData } = useBatchSectionData([{ courseId, chapterId, sectionId }]);
  
  // Get names using your existing functions
  const getCourseName = (id) => coursesData[id]?.Subject || id;
  const getCourseTutor = (id) => coursesData[id]?.Tutor || id;
  const getChapterName = (id) => chaptersData[id]?.Title || id;
  const getSectionName = (id) => sectionsData[id]?.SectionName || id;

  // Fetch quizzes
  useEffect(() => {
    if (!courseId || !chapterId || !sectionId) {
      setError('Missing required parameters');
      setLoading(false);
      return;
    }

    const quizCollectionRef = collection(
      db, 
      'courses', 
      courseId, 
      'Chapters', 
      chapterId, 
      'Section', 
      sectionId, 
      'Quiz'
    );

    const unsubscribe = onSnapshot(
      quizCollectionRef,
      (querySnapshot) => {
        const quizData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setQuizzes(quizData);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [courseId, chapterId, sectionId]);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setIsFlipped(true);
    
    // Record the answer
    setAnsweredQuestions(prev => [
      ...prev, 
      { 
        question: quizzes[currentIndex].Question, 
        selected: option, 
        correct: option === quizzes[currentIndex].CorrectAnswer 
      }
    ]);
    
    if (option === quizzes[currentIndex].CorrectAnswer && !hasScored) {
      setHasScored(true);
    }
  };

  const handleNextQuestion = () => {
    // Start transition
    setIsTransitioning(true);
    
    // Reset the card to front position before changing question
    setIsFlipped(false);
    
    // Wait for the flip animation to complete before changing the question
    setTimeout(() => {
      if(hasScored === true) {
        setScore(prev => prev + 1);
        setHasScored(false);
      }

      if (currentIndex < quizzes.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
      } else {
        setShowResult(true);
      }
      
      // End transition
      setIsTransitioning(false);
    }, 500); // Match this duration with your CSS transition duration
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsFlipped(false);
    setScore(0);
    setShowResult(false);
    setHasScored(false);
    setIsTransitioning(false);
    setAnsweredQuestions([]);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Quiz</h2>
          <p className="text-gray-600">Preparing your questions...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Quiz</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/home/practice')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Back to Practice
          </button>
        </div>
      </div>
    );
  }
  
  if (quizzes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-gray-500 text-5xl mb-4">❓</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Questions Available</h2>
          <p className="text-gray-600 mb-6">This section doesn't have any quiz questions yet.</p>
          <button 
            onClick={() => navigate('/home/practice')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Back to Practice
          </button>
        </div>
      </div>
    );
  }
  
  if (showResult) {
    const percentage = Math.round((score / quizzes.length) * 100);
    let resultEmoji = "🫣";
    let resultColor = "text-yellow-600";
    let resultMessage = "Good effort!";
    
    if (percentage >= 90) {
      resultEmoji = "🎉";
      resultColor = "text-green-600";
      resultMessage = "Outstanding!";
    } else if (percentage >= 70) {
      resultEmoji = "👍";
      resultColor = "text-blue-600";
      resultMessage = "Well done!";
    } else if (percentage >= 50) {
      resultEmoji = "🙂";
      resultColor = "text-yellow-600";
      resultMessage = "Good effort!";
    }
    
    return (
      <>
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="block md:hidden mb-6 p-6 bg-white rounded-2xl shadow-lg border border-gray-200 text-center"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{getCourseName(courseId)}</h2>
              <p className="text-gray-600">Tutor: {getCourseTutor(courseId)}</p>
              <div className="mt-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-full inline-block">
                <i className="fas fa-question-circle mr-2"></i>
                {quizzes.length} questions completed
              </div>
          </motion.div>

          {/* Section Information Card */}
          <div className="hidden md:block bg-white rounded-2xl shadow-md p-6 mb-8 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center md:text-left">
                <h2 className="text-sm font-medium text-gray-500 mb-1">Course</h2>
                <p className="text-lg font-semibold text-blue-700">{getCourseName(courseId)}</p>
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-sm font-medium text-gray-500 mb-1">Chapter</h2>
                <p className="text-lg font-semibold text-green-700">{getChapterName(chapterId)}</p>
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-sm font-medium text-gray-500 mb-1">Section</h2>
                <p className="text-lg font-semibold text-purple-700">{getSectionName(sectionId)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <span className="text-6xl">{resultEmoji}</span>
              <h2 className="text-2xl font-bold text-gray-800 mt-2">Practice Complete</h2>
              <p className={`text-xl font-semibold mt-2 ${resultColor}`}>{resultMessage}</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{score}/{quizzes.length}</div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{percentage}%</div>
                  <div className="text-sm text-gray-600">Percentage</div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button 
                onClick={resetQuiz}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
              >
                Try Again
              </button>
              <button 
                onClick={() => navigate('/home/practice')}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
              >
                Back to Practice
              </button>
              <button 
                onClick={() => navigate('/home/quizMenu')}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
              >
                Play Quiz Now
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const currentQuiz = quizzes[currentIndex];
  const progressPercentage = ((currentIndex) / quizzes.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with progress and navigation */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate('/home/practice')}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <span className="mr-2">←</span> Back
          </button>
          
          <div className="flex-1 mx-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-600">
                Question {currentIndex + 1} of {quizzes.length}
              </span>
              <span className="text-sm font-medium text-blue-600">
                Score: {score}/{currentIndex}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Section Information Card */}
        <div className="hidden md:block bg-white rounded-2xl shadow-md p-6 mb-8 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-sm font-medium text-gray-500 mb-1">Course</h2>
              <p className="text-lg font-semibold text-blue-700">{getCourseName(courseId)}</p>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-sm font-medium text-gray-500 mb-1">Chapter</h2>
              <p className="text-lg font-semibold text-green-700">{getChapterName(chapterId)}</p>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-sm font-medium text-gray-500 mb-1">Section</h2>
              <p className="text-lg font-semibold text-purple-700">{getSectionName(sectionId)}</p>
            </div>
          </div>
        </div>

        {/* Quiz Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-200">
          {/* Question */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Question {currentIndex + 1}</h3>
            <p className="text-lg text-gray-700">{currentQuiz.Question}</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {currentQuiz.Options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQuiz.CorrectAnswer;
              const showCorrectness = isFlipped && (isSelected || isCorrect);
              
              let optionStyle = "bg-white border-gray-300 hover:bg-gray-50";
              if (showCorrectness) {
                optionStyle = isCorrect ? "bg-green-100 border-green-500" : "bg-red-100 border-red-500";
              } else if (isSelected) {
                optionStyle = "bg-blue-100 border-blue-500";
              }
              
              return (
                <button
                  key={idx}
                  onClick={() => !isTransitioning && !isFlipped && handleOptionSelect(option)}
                  disabled={isTransitioning || isFlipped}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 ${optionStyle} ${(isTransitioning || isFlipped) ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3 font-medium">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-gray-800">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Answer Reveal Section */}
          {isFlipped && (
            <div className="bg-blue-50 rounded-xl p-5 mb-6 border border-blue-200 animate-fadeIn">
              <h4 className="text-lg font-semibold text-blue-800 mb-2">Explanation</h4>
              <div className="flex items-start">
                <span className={`text-2xl mr-3 ${selectedOption === currentQuiz.CorrectAnswer ? 'text-green-500' : 'text-red-500'}`}>
                  {selectedOption === currentQuiz.CorrectAnswer ? '✓' : '✗'}
                </span>
                <div>
                  <p className="text-blue-800">
                    The correct answer is <span className="font-bold">{currentQuiz.CorrectAnswer}</span>
                  </p>
                  {currentQuiz.Explanation && (
                    <p className="mt-2 text-blue-700">{currentQuiz.Explanation}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <button
              onClick={() => !isTransitioning && setIsFlipped(false)}
              disabled={!isFlipped || isTransitioning}
              className={`px-5 py-2.5 rounded-lg font-medium ${isFlipped && !isTransitioning ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              Redo Question
            </button>
            <button
              onClick={handleNextQuestion}
              disabled={!isFlipped || isTransitioning}
              className={`px-5 py-2.5 rounded-lg font-medium ${isFlipped && !isTransitioning ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-300 text-white cursor-not-allowed'}`}
            >
              {currentIndex < quizzes.length - 1 ? 'Next Question →' : 'See Results'}
            </button>
          </div>
        </div>

        {/* Quick Navigation Dots */}
        <div className="flex justify-center space-x-2 mb-8">
          {quizzes.map((_, index) => (
            <div 
              key={index}
              className={`w-3 h-3 rounded-full ${index === currentIndex ? 'bg-blue-600' : index < currentIndex ? 'bg-green-500' : 'bg-gray-300'}`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PracticeQuiz;

// import React, { useState, useEffect } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { collection, onSnapshot } from 'firebase/firestore';
// import { db } from '../../firebase';
// import { useCourseData } from '../../Hooks/useCourseData';
// import { useBatchChapterData } from '../../Hooks/useBatchChapterData';
// import { useBatchSectionData } from '../../Hooks/useBatchSectionData';

// const PracticeQuiz = () => {
//   const { state } = useLocation();
//   const { courseId, chapterId, sectionId } = state || {};
//   const navigate = useNavigate();
  
//   const [quizzes, setQuizzes] = useState([]);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [selectedOption, setSelectedOption] = useState(null);
//   const [isFlipped, setIsFlipped] = useState(false);
//   const [score, setScore] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [showResult, setShowResult] = useState(false);
//   const [hasScored, setHasScored] = useState(false);
//   const [isTransitioning, setIsTransitioning] = useState(false); // New state to track transition

//     // Fetch metadata for naming
//     const { courses: coursesData } = useCourseData([courseId]);
//     const { chapters: chaptersData } = useBatchChapterData([{ courseId, chapterId }]);
//     const { sections: sectionsData } = useBatchSectionData([{ courseId, chapterId, sectionId }]);
//       // Get names using your existing functions
//   const getCourseName = (id) => coursesData[id]?.Subject || id;
//   const getChapterName = (id) => chaptersData[id]?.Title || id;
//   const getSectionName = (id) => sectionsData[id]?.SectionName || id;

//   // Fetch quizzes
//   useEffect(() => {
//     if (!courseId || !chapterId || !sectionId) {
//       setError('Missing required parameters');
//       setLoading(false);
//       return;
//     }

//     const quizCollectionRef = collection(
//       db, 
//       'courses', 
//       courseId, 
//       'Chapters', 
//       chapterId, 
//       'Section', 
//       sectionId, 
//       'Quiz'
//     );

//     const unsubscribe = onSnapshot(
//       quizCollectionRef,
//       (querySnapshot) => {
//         const quizData = querySnapshot.docs.map(doc => ({
//           id: doc.id,
//           ...doc.data()
//         }));
//         setQuizzes(quizData);
//         setLoading(false);
//       },
//       (err) => {
//         console.error('Firestore error:', err);
//         setError(err.message);
//         setLoading(false);
//       }
//     );

//     return () => unsubscribe();
//   }, [courseId, chapterId, sectionId]);

//   const handleOptionSelect = (option) => {
//     setSelectedOption(option);
//     setIsFlipped(true);
    
//     if (option === quizzes[currentIndex].CorrectAnswer && !hasScored) {
//       setHasScored(true);
//     }
//   };

//   const handleNextQuestion = () => {
//     // Start transition
//     setIsTransitioning(true);
    
//     // Reset the card to front position before changing question
//     setIsFlipped(false);
    
//     // Wait for the flip animation to complete before changing the question
//     setTimeout(() => {
//       if(hasScored === true) {
//         setScore(prev => prev + 1);
//         setHasScored(false);
//       }

//       if (currentIndex < quizzes.length - 1) {
//         setCurrentIndex(prev => prev + 1);
//         setSelectedOption(null);
//       } else {
//         setShowResult(true);
//       }
      
//       // End transition
//       setIsTransitioning(false);
//     }, 500); // Match this duration with your CSS transition duration
//   };

//   const resetQuiz = () => {
//     setCurrentIndex(0);
//     setSelectedOption(null);
//     setIsFlipped(false);
//     setScore(0);
//     setShowResult(false);
//     setHasScored(false);
//     setIsTransitioning(false);
//   };

//   if (loading) return <div className="flex justify-center items-center h-64">Loading quiz...</div>;
//   if (error) return <div className="flex justify-center items-center h-64 text-red-500">{error}</div>;
//   if (quizzes.length === 0) return <div className="flex justify-center items-center h-64">No quiz questions found</div>;
//   if (showResult) {
//     return (
//       <div className="flex flex-col items-center justify-center h-64">
//         <h2 className="text-2xl font-bold mb-4">Practice Result</h2>
//         <p className="text-lg mb-6">
//           You scored {score} out of {quizzes.length} ({Math.round((score / quizzes.length) * 100)}%)
//         </p>

//         <div className="flex space-x-4">
//           <button 
//             onClick={resetQuiz}
//             className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//           >
//             Try Again
//           </button>
//           <button 
//             onClick={() => navigate('/home/practice')}
//             className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
//           >
//             Back to Practice
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const currentQuiz = quizzes[currentIndex];

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
//       <div className="w-full max-w-md">
//       {/* display somthing instead of empty */}
//       {/* Section Information Card */}
//       <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div>
//             <h2 className="text-sm font-medium text-gray-500">Course</h2>
//             <p className="text-lg font-semibold">{getCourseName(courseId)}</p>
//           </div>
//           <div>
//             <h2 className="text-sm font-medium text-gray-500">Chapter</h2>
//             <p className="text-lg font-semibold">{getChapterName(chapterId)}</p>
//           </div>
//           <div>
//             <h2 className="text-sm font-medium text-gray-500">Section</h2>
//             <p className="text-lg font-semibold">{getSectionName(sectionId)}</p>
//           </div>
//         </div>
//       </div>

//         {/* Progress indicator */}
//         <div className="mb-4">
//           <div className="flex justify-between items-center mb-1">
//             <span className="text-sm font-medium">
//               Question {currentIndex + 1} of {quizzes.length}
//             </span>
//           </div>
//           <div className="w-full bg-gray-200 rounded-full h-2.5">
//             <div 
//               className="bg-blue-600 h-2.5 rounded-full" 
//               style={{ width: `${((currentIndex) / quizzes.length) * 100}%` }}
//             ></div>
//           </div>
//         </div>

//         {/* Flip card container */}
//         <div 
//           className={`relative w-full h-64 cursor-pointer mb-6 perspective-1000 ${isFlipped ? 'flipped' : ''}`}
//           onClick={() => !isTransitioning && setIsFlipped(!isFlipped)}
//         >
//           {/* Front of card - question */}
//           <div className={`absolute w-full h-full backface-hidden transition-transform duration-500 ease-in-out ${isFlipped ? 'rotate-y-180' : 'rotate-y-0'}`}>
//             <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-full flex flex-col">
//               <h3 className="text-xl font-semibold mb-4">{currentQuiz.Question}</h3>
//               <div className="grid grid-cols-2 gap-3 mt-auto">
//                 {currentQuiz.Options.map((option, idx) => (
//                   <button
//                     key={idx}
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       !isTransitioning && handleOptionSelect(option);
//                     }}
//                     disabled={isTransitioning || isFlipped}
//                     className={`p-3 rounded border ${selectedOption === option 
//                       ? option === currentQuiz.CorrectAnswer 
//                         ? 'bg-green-100 border-green-500' 
//                         : 'bg-red-100 border-red-500'
//                       : 'bg-white border-gray-300 hover:bg-gray-50'} ${(isTransitioning || isFlipped) ? 'opacity-70' : ''}`}
//                   >
//                     {option}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Back of card - answer */}
//           <div className={`absolute w-full h-full backface-hidden transition-transform duration-500 ease-in-out ${isFlipped ? 'rotate-y-0' : 'rotate-y-180'}`}>
//             <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-full flex flex-col justify-center items-center">
//               <h3 className="text-xl font-semibold mb-2">Answer</h3>
//               <p className="text-2xl font-bold mb-4 text-blue-600">
//                 {currentQuiz.CorrectAnswer}
//               </p>
//               <p className={`text-lg mb-6 ${
//                 selectedOption === currentQuiz.CorrectAnswer 
//                   ? 'text-green-600' 
//                   : 'text-red-600'
//               }`}>
//                 {selectedOption === currentQuiz.CorrectAnswer 
//                   ? 'Correct!' 
//                   : 'Incorrect!'}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Navigation buttons */}
//         <div className="flex justify-between">
//           <button
//             onClick={() => !isTransitioning && setIsFlipped(false)}
//             disabled={!isFlipped || isTransitioning}
//             className={`px-4 py-2 rounded ${isFlipped && !isTransitioning ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
//           >
//             Redo Question
//           </button>
//           <button
//             onClick={handleNextQuestion}
//             disabled={!isFlipped || isTransitioning}
//             className={`px-4 py-2 rounded ${isFlipped && !isTransitioning ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-300 text-white cursor-not-allowed'}`}
//           >
//             {currentIndex < quizzes.length - 1 ? 'Next Question' : 'See Results'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PracticeQuiz;