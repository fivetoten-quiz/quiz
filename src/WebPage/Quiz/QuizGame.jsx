import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, setDoc, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import { useAuth } from '../../Context/AuthContext';
import { db, auth } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { div } from 'framer-motion/client';

const QuizGame = () => {  
  const { state } = useLocation();
  const { courseId, chapterId, sectionId } = state || {};
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [quiz, setQuiz] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courseInfo, setCourseInfo] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [chapter, setChapter] = useState([{name: "Loading...", id: "intializing..."}]);
  const [section, setSection] = useState([{name: "Loading...", id: "intializing..."}]);
  const [quizVideoShown, setQuizVideoShown] = useState(false);
  const [animationStage, setAnimationStage] = useState(0);
  const [isMobile] = useState(window.innerWidth < 768); // Check if screen is mobile size

  // Get colors based on performance
  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com/embed')) return url;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null;
  };

  useEffect(() => {
    const courseRef = doc(db, 'courses', courseId);
    const courseUnsubscribe = onSnapshot(courseRef, (doc) => {
      if (doc.exists()) {
        setCourseInfo(doc.data());
      }
    });

    const chapterRef = doc(db, "courses", courseId, "Chapters", chapterId);    
    const unsubscribeChapter = onSnapshot(
      chapterRef,
      (doc) => {
        if (doc.exists()) {
          setChapter({...doc.data(), id: doc.id});
        } else {
          console.log("No such chapter document!");
        }
      },
      (err) => {
        console.error('Firestore error:', err);
        setError(err.message);
      }, [courseId, chapterId]
    );

    const sectionRef = doc(db, "courses", courseId, "Chapters", chapterId, "Section", sectionId);    
    const unsubscribeSection = onSnapshot(
      sectionRef,
      (doc) => {
        if (doc.exists()) {
          setSection({...doc.data(), id: doc.id});
        } else {
          console.log("No such section document!");
        }
      },
      (err) => {
        console.error('Firestore error:', err);
        setError(err.message);
      }, [courseId, chapterId, sectionId]
    );

    const quizCollectionRef = collection(db, 'courses', courseId, 'Chapters', chapterId, "Section", sectionId, 'Quiz');
    console.log(quizCollectionRef);
    const unsubscribe = onSnapshot(
      quizCollectionRef,
      (querySnapshot) => {
        const quizzes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setQuiz(quizzes);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error:', err);
        setError(err.message);
      }
    );

    return () => {
      courseUnsubscribe();
      unsubscribe();
    };
  }, [courseId]);

  const startQuiz = () => {
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setQuizStarted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswerSelect = (answerIndex) => {
    setSelectedIndex(answerIndex);
    setSelectedAnswer(quiz[currentQuestionIndex].Options[answerIndex]);
    
    const currentQuestion = quiz[currentQuestionIndex];
    const userAnswer = quiz[currentQuestionIndex].Options[answerIndex];
    if (userAnswer.toString() === currentQuestion.CorrectAnswer) {
      setScore(prev => prev + 1);
    }

    setShowResult(true);
    setAnimationStage(1);
    
    setTimeout(() => {
      setAnimationStage(2);
    }, 1000);
  };

  const getOptionColor = (index, question) => {
    if (!showResult) {
      // Return the original color classes when no result is shown
      return index === 0 ? 'bg-red-400 text-white' : 
             index === 1 ? 'bg-blue-400 text-white' : 
             index === 2 ? 'bg-yellow-400 text-white' : 
             'bg-green-400 text-white';
    }
    
    const userAnswer = quiz[currentQuestionIndex].Options[index];
    const isSelected = selectedIndex === index;
    const isCorrect = userAnswer.toString() === question.CorrectAnswer;

    if (animationStage === 1) {
      // Keep original colors but apply opacity to non-selected options
      const baseColor = index === 0 ? 'bg-red-400' : 
                       index === 1 ? 'bg-blue-400' : 
                       index === 2 ? 'bg-yellow-400' : 
                       'bg-green-400';
      return isSelected ? `${baseColor} text-white` : `${baseColor} text-white opacity-50`;
    } else if (animationStage === 2) {
      if (isCorrect) return '!bg-green-500 !text-white';
      if (isSelected && !isCorrect) return '!bg-red-500/75 !text-white';
      return 'bg-gray-300 opacity-70';
    }
    return '';
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setAnimationStage(0);
    } else {
      setShowResult('completed');
      await saveQuizResults();
    }
  };

  const saveQuizResults = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const resultData = {
        score,
        totalQuestions: quiz.length,
        percentage: Math.round((score / quiz.length) * 100),
        timestamp: new Date(),
        courseId,
        chapterId,
        sectionId,
      };

      const attemptsRef = collection(
        db,
        'users',
        user.uid,
        'quizResults',
        courseId,
        'chapters',
        chapterId,
        'sections',
        sectionId,
        'attempts'
      );

      const querySnapshot = await getDocs(attemptsRef);
      const attempts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const sortedAttempts = attempts
        .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis())
        .slice(0, 9);

      const deleteOperations = [];
      if (attempts.length >= 10) {
        const oldestAttempt = sortedAttempts[0];
        deleteOperations.push(deleteDoc(doc(attemptsRef, oldestAttempt.id)));
      }

      const addNestedAttempt = addDoc(attemptsRef, resultData);

      const flatResultsRef = doc(
        db,
        'users',
        user.uid,
        'allQuizAttempts',
        `${courseId}_${chapterId}_${sectionId}`
      );
      const addFlatAttempt = setDoc(flatResultsRef, resultData);

      await Promise.all([...deleteOperations, addNestedAttempt, addFlatAttempt]);

      console.log('Quiz results saved successfully!');
    } catch (error) {
      console.error('Error saving quiz results:', error);
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading quiz...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md">
          <span className="block sm:inline">⚠️ Error: {error}</span>
        </div>
      </div>
    );
  }
  
  if (!quiz || quiz.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded max-w-md mx-auto">
          <p>No quiz questions found.</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!quizStarted) {
    return (


      <div className="p-6 max-w-4xl mx-auto text-center">
        {courseInfo && (
          <div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="block md:hidden mb-6 p-6 bg-white rounded-2xl shadow-lg border border-gray-200"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{courseInfo.Subject}</h2>
              <p className="text-gray-600">Tutor: {courseInfo.Tutor}</p>
              <div className="mt-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-full inline-block">
                <i className="fas fa-question-circle mr-2"></i>
                {quiz.length} questions ready
              </div>
            </motion.div>
            <div>
              {/* Section Information Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden md:block bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200 transition-all duration-300 hover:shadow-lg text-left"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-sm font-medium text-gray-500">Course</h2>
                      <p className="text-lg font-semibold">{courseInfo.Subject}</p>
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
                      <p className="text-lg font-semibold">{chapter.Title}</p>
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
                      <p className="text-lg font-semibold">{section.SectionName}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
        
        {countdown > 0 ? (
          <motion.div 
            key={countdown}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-8xl font-bold my-16 text-blue-600"
          >
            {countdown}
          </motion.div>
        ) : (
          <>
            {!quizVideoShown ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8"
              >
                <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center justify-center">
                  <i className="fas fa-video mr-3 text-blue-500"></i>
                  Watch This First
                </h2>
                <div className="mb-6">
                  {section.QuizVideoLink ? (
                    <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-xl shadow-lg">
                      <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={getEmbedUrl(section.QuizVideoLink)}
                        title="Quiz Preparation Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="bg-gray-100 h-64 flex items-center justify-center rounded-xl">
                      <p className="text-gray-500">No video available</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setQuizVideoShown(true)}
                    className="px-6 py-3 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <i className="fas fa-arrow-right mr-2"></i>
                    Next
                  </button>
                  
                  <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 bg-red-500 text-white text-lg rounded-lg hover:bg-red-600 flex items-center"
                  >
                    <i className="fas fa-times mr-2"></i>
                    Exit Quiz
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 mb-8">
                  <h2 className="text-3xl font-bold mb-6 text-gray-800">
                    Are you ready?
                  </h2>
                  <div className="text-5xl mb-6">🎯</div>
                  <p className="text-gray-600 mb-6">
                    You'll answer {quiz.length} questions. Do your best!
                  </p>
                  
                  <button
                    onClick={startQuiz}
                    className="px-8 py-4 bg-green-600 text-white text-xl rounded-lg hover:bg-green-700 flex items-center mx-auto"
                  >
                    <i className="fas fa-play mr-2"></i>
                    START QUIZ
                  </button>
                </div>
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setQuizVideoShown(false)}
                    className="px-6 py-3 bg-gray-300 text-gray-700 text-lg rounded-lg hover:bg-gray-400 flex items-center"
                  >
                    <i className="fas fa-arrow-left mr-2"></i>
                    Back to Video
                  </button>
                  
                  <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 bg-red-500 text-white text-lg rounded-lg hover:bg-red-600 flex items-center"
                  >
                    <i className="fas fa-times mr-2"></i>
                    Exit Quiz
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    );
  }

  if (showResult === 'completed') {
    const percentage = Math.round((score / quiz.length) * 100);
    
    return (
      <div className="p-6 max-w-3xl mx-auto text-center">
        {courseInfo && (
          <div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="block md:hidden mb-6 p-6 bg-white rounded-2xl shadow-lg border border-gray-200"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{courseInfo.Subject}</h2>
              <p className="text-gray-600">Tutor: {courseInfo.Tutor}</p>
              <div className="mt-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-full inline-block">
                <i className="fas fa-question-circle mr-2"></i>
                {quiz.length} questions ready
              </div>
            </motion.div>
            <div>
              {/* Section Information Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden md:block bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200 transition-all duration-300 hover:shadow-lg text-left"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-sm font-medium text-gray-500">Course</h2>
                      <p className="text-lg font-semibold">{courseInfo.Subject}</p>
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
                      <p className="text-lg font-semibold">{chapter.Title}</p>
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
                      <p className="text-lg font-semibold">{section.SectionName}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        <motion.div 
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Quiz Completed! {percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '😊'}
          </h2>
          
          <div className="mb-6">
            <div className="text-6xl font-bold mb-2">
              <span className={getPerformanceColor(percentage)}>
                {score}/{quiz.length}
              </span>
            </div>
            <div className="text-xl text-gray-600">
              ({percentage}% Correct)
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
            <div 
              className={`h-4 rounded-full ${percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button 
              onClick={handleReload}
              className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <i className="fas fa-redo mr-2"></i>
              Play Again
            </button>

            <button
              onClick={() => navigate('/home/Practice')}
              className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:bg-gray-400 flex items-center"
            >
              <i className="fas fa-book-open mr-2"></i>
              Practice Quiz
            </button>

            <button
              onClick={() => navigate('/home/Score')}
              className="px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:bg-gray-400 flex items-center"
            >
              <i className="fas fa-chart-line mr-2"></i>
              View Score
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = quiz[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / quiz.length) * 100;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6 bg-white rounded-xl p-4 shadow-md border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">
            Question {currentQuestionIndex + 1} of {quiz.length}
          </span>
          <span className="text-sm font-medium text-gray-600">
            Score: {score}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <motion.div 
        key={currentQuestionIndex}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6"
      >
        <h3 className="font-bold text-xl mb-6 text-gray-800 text-center">
          {currentQuestion.Question || 'No question text available'}
        </h3>

        <div className="space-y-4">
          {currentQuestion.Options.map((option, index) => (
              <motion.div 
                key={index}
                whileHover={{ scale: !showResult ? 1.02 : 1 }}
                whileTap={{ scale: !showResult ? 0.98 : 1 }}
                className={`flex items-center p-4 rounded-xl cursor-pointer transition-all duration-300 ${getOptionColor(index, currentQuestion)}`}
                onClick={() => !showResult && handleAnswerSelect(index)}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-4 ${!showResult || animationStage === 1 ? 'bg-white/20' : ''}`}>
                  <span className="font-bold">{String.fromCharCode(65 + index)}</span>
                </div>
                <span className="text-lg">{option || `Option ${index + 1}`}</span>
              </motion.div>
          ))}
        </div>

        {showResult && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex justify-between items-center"
          >
            <div className={`p-3 rounded-lg ${selectedAnswer.toString() === currentQuestion.CorrectAnswer ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {selectedAnswer.toString() === currentQuestion.CorrectAnswer ? (
                <span><i className="fas fa-check-circle mr-2"></i> Correct!</span>
              ) : (
                <span><i className="fas fa-times-circle mr-2"></i> Incorrect! The correct answer is: {currentQuestion.CorrectAnswer}</span>
              )}
            </div>
            <button
              onClick={handleNextQuestion}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              {currentQuestionIndex < quiz.length - 1 ? (
                <>
                  Next <i className="fas fa-arrow-right ml-2"></i>
                </>
              ) : (
                <>
                  Finish <i className="fas fa-flag-checkered ml-2"></i>
                </>
              )}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default QuizGame;