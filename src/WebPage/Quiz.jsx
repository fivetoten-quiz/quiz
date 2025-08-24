import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, setDoc, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from "../firebase";
import { useAuth } from '../Context/AuthContext'; // Assuming you have auth context
import { auth } from '../firebase'; // Import your Firebase auth instance

const Quiz = () => {  
  const { courseId, chapterId, sectionId } = useParams();
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

  const [animationStage, setAnimationStage] = useState(0); // 0 = no animation, 1 = darken others, 2 = show correct

    const handleAnswerSelect = (answerIndex) => {
      setSelectedIndex(answerIndex);
      setSelectedAnswer(quiz[currentQuestionIndex].Options[answerIndex]);
      
      const currentQuestion = quiz[currentQuestionIndex];
      const userAnswer = quiz[currentQuestionIndex].Options[answerIndex];
      if (userAnswer.toString() === currentQuestion.CorrectAnswer) {
        setScore(prev => prev + 1);
      }

      setShowResult(true);
      setAnimationStage(1); // Start animation sequence
      
      // Animation sequence timing
      setTimeout(() => {
        setAnimationStage(2); // Show correct answer
      }, 1000);
    };

  const getOptionColor = (index, question) => {
    if (!showResult) return ''; // No override before answer selection
    
    const userAnswer = quiz[currentQuestionIndex].Options[index];
    const isSelected = selectedIndex === index;
    const isCorrect = userAnswer.toString() === question.CorrectAnswer;

    if (animationStage === 1) {
      // Stage 1: Darken all except selected
      return (isSelected) ? '' : 'opacity-50';
    } else if (animationStage === 2) {
      // Stage 2: Show correct/wrong states
      if (isCorrect) return '!bg-green-500 !text-white'; // Force green for correct
      if (!isCorrect) return '!bg-red-500/75 !text-white'; // Force red for wrong selection
      return 'opacity-70'; // Fade out other options
    }
    return '';
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setShowResult('completed');
      
      // Save results when quiz is completed
      await saveQuizResults();
    }
  };

//   const saveQuizResults = async () => {
//   try {
//     const user = auth.currentUser;
//     if (!user) return;

//     // 1. Prepare result data
//     const resultData = {
//       score: score,
//       totalQuestions: quiz.length,
//       correctAnswers: score,
//       percentage: Math.round((score / quiz.length) * 100),
//       timestamp: new Date(),
//       courseId: courseId, // From your URL params
//       chapterId: chapterId, // From your URL params
//       sectionId: sectionId, // From your URL params (you'll need to get this)
//     };

//     // 2. Get reference to attempts subcollection
//     const attemptsRef = collection(
//       db,
//       'users',
//       user.uid,
//       'quizResults',
//       courseId,
//       'chapters',
//       chapterId,
//       'sections',
//       sectionId,
//       'attempts'
//     );

//     // 3. Get existing attempts (to maintain max 10)
//     const querySnapshot = await getDocs(attemptsRef);
//     const attempts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

//     // 4. Sort by timestamp (oldest first) and limit to 9
//     const sortedAttempts = attempts
//       .sort((a, b) => a.timestamp - b.timestamp)
//       .slice(0, 9);

//     // 5. Delete oldest if we have 10 attempts
//     if (attempts.length >= 10) {
//       const oldestAttempt = sortedAttempts[0];
//       await deleteDoc(doc(attemptsRef, oldestAttempt.id));
//     }

//     // 6. Add new attempt with auto-generated ID
//     await addDoc(attemptsRef, resultData);

//     console.log('Quiz results saved successfully!');
//   } catch (error) {
//     console.error('Error saving quiz results:', error);
//   }
// };

const saveQuizResults = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    // Prepare result data
    const resultData = {
      score,
      totalQuestions: quiz.length,
      percentage: Math.round((score / quiz.length) * 100),
      timestamp: new Date(),
      courseId,
      chapterId,
      sectionId,
    };

    // 1. Nested path with attempt limiting
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

    // Get existing attempts to maintain max 10
    const querySnapshot = await getDocs(attemptsRef);
    const attempts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort by timestamp (oldest first) and limit to 9
    const sortedAttempts = attempts
      .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis())
      .slice(0, 9);

    // Delete oldest if we have 10 attempts
    const deleteOperations = [];
    if (attempts.length >= 10) {
      const oldestAttempt = sortedAttempts[0];
      deleteOperations.push(deleteDoc(doc(attemptsRef, oldestAttempt.id)));
    }

    // Add new attempt
    const addNestedAttempt = addDoc(attemptsRef, resultData);

    // 2. Flat collection (no limit needed)
    const flatResultsRef = doc(
      db,
      'users',
      user.uid,
      'allQuizAttempts',
      `${courseId}_${chapterId}_${sectionId}`
    );
    const addFlatAttempt = setDoc(flatResultsRef, resultData);

    // Execute all operations in parallel
    await Promise.all([...deleteOperations, addNestedAttempt, addFlatAttempt]);

    console.log('Quiz results saved successfully!');
  } catch (error) {
    console.error('Error saving quiz results:', error);
  }
};

  const handleReload = () => {
    window.location.reload(); // Full page reload
  };

  if (loading) return <div className="text-center py-8">Loading quiz...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!quiz || quiz.length === 0) return <p className="text-center py-8">No quiz questions found.</p>;

  //console.log(embedUrl);
  if (!quizStarted) {
  return (
    <div className="p-6 max-w-3xl mx-auto text-center">
      {courseInfo && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h2 className="text-xl font-bold">{courseInfo.Subject}</h2>
                  <p className="text-gray-600 dark:text-gray-300">Tutor: {courseInfo.Tutor}</p>
                  <p className="text-gray-600 dark:text-gray-300">
                    {quiz.length} questions ready
                  </p>
                </div>
      )}
      {countdown > 0 ? (
        <div className="text-6xl font-bold my-16 animate-bounce">
          {countdown}
        </div>
      ) : (
        <>
          {/* Video Section - Only shown before quiz starts */}
          {!quizVideoShown ? (
            <>               
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Watch This First</h2>
                <div className="aspect-w-16 aspect-h-9">
                  {section.QuizVideoLink ? (
                    <iframe
                      className="w-full h-96 rounded-lg"
                      src={getEmbedUrl(section.QuizVideoLink)}
                      title="Quiz Preparation Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="bg-gray-100 dark:bg-gray-800 h-96 flex items-center justify-center rounded-lg">
                      <p>Video URL not available</p>
                    </div>
                  )}
                  </div>
              </div>
              <button
                onClick={() => setQuizVideoShown(true)}
                className="px-8 py-3 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700"
              >
                Next
              </button>

              <br /><br />

              <button
              onClick={() => navigate(`/home/courses/${courseId}/chapters/${chapterId}/section`)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
              Exit quiz
              </button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-6">Are you ready?</h2>
              <button
                onClick={startQuiz}
                className="px-8 py-4 bg-green-600 text-white text-xl rounded-lg hover:bg-green-700"
              >
                START QUIZ
              </button>

              <br /><br />

              <button
                onClick={() => setQuizVideoShown(false)}
                className="px-8 py-4 bg-red-600 text-white text-xl rounded-lg hover:bg-red-700"
              >
                Back
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

  if (showResult === 'completed') {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
        <p className="text-xl">Your final score: {score}/{quiz.length}</p>
        
        <br />

        <button 
          onClick={handleReload}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Reload Quiz
        </button>

        <br /><br />

        <button
          onClick={() => navigate(`/home/courses/${courseId}/chapters/${chapterId}/section`)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currentQuestion = quiz[currentQuestionIndex];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h2 className="text-xl font-bold">{courseInfo.Subject}</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Question {currentQuestionIndex + 1} of {quiz.length}
        </p>
        <p className="text-gray-600 dark:text-gray-300">Score: {score}/{quiz.length}</p>
      </div>

      <div className="p-4 border rounded-lg dark:border-gray-600">
        <h3 className="font-semibold text-lg mb-3">
          {currentQuestion.Question || 'No question text available'}
        </h3>

        {/* UI DESIGN, WE HAVE this part of code dy */}
        <div className="space-y-2">
          {/* Option 1 - Red */}
          <div 
            className={`flex items-center p-3 rounded-lg transition-all duration-300 ${getOptionColor(0, currentQuestion)} text-white bg-red-400 dark:bg-red-900/30`}
          >
            <input
              type="radio"
              id={`q-${currentQuestion.id}-0`}
              name={`q-${currentQuestion.id}`}
              checked={selectedAnswer === 0}
              onChange={() => handleAnswerSelect(0)}
              disabled={showResult}
              className="h-4 w-4"
            />
            <label htmlFor={`q-${currentQuestion.id}-0`} className="ml-3 cursor-pointer">
              {currentQuestion.Options[0] || 'Option 1'}
            </label>
          </div>

          {/* Option 2 - Blue */}
          <div 
            className={`flex items-center p-3 rounded-lg transition-all duration-300 ${getOptionColor(1, currentQuestion)} text-white bg-blue-400 dark:bg-blue-900/30`}
          >
            <input
              type="radio"
              id={`q-${currentQuestion.id}-1`}
              name={`q-${currentQuestion.id}`}
              checked={selectedAnswer === 1}
              onChange={() => handleAnswerSelect(1)}
              disabled={showResult}
              className="h-4 w-4"
            />
            <label htmlFor={`q-${currentQuestion.id}-1`} className="ml-3 cursor-pointer">
              {currentQuestion.Options[1] || 'Option 2'}
            </label>
          </div>

          {/* Option 3 - Yellow */}
          <div 
            className={`flex items-center p-3 rounded-lg transition-all duration-300 ${getOptionColor(2, currentQuestion)} text-white bg-yellow-400 dark:bg-yellow-900/30`}
          >
            <input
              type="radio"
              id={`q-${currentQuestion.id}-2`}
              name={`q-${currentQuestion.id}`}
              checked={selectedAnswer === 2}
              onChange={() => handleAnswerSelect(2)}
              disabled={showResult}
              className="h-4 w-4"
            />
            <label htmlFor={`q-${currentQuestion.id}-2`} className="ml-3 cursor-pointer">
              {currentQuestion.Options[2] || 'Option 3'}
            </label>
          </div>

          {/* Option 4 - Green */}
          <div 
            className={`flex items-center p-3 rounded-lg transition-all duration-300 ${getOptionColor(3, currentQuestion)} text-white bg-green-400 dark:bg-green-900/30`}
          >
            <input
              type="radio"
              id={`q-${currentQuestion.id}-3`}
              name={`q-${currentQuestion.id}`}
              checked={selectedAnswer === 3}
              onChange={() => handleAnswerSelect(3)}
              disabled={showResult}
              className="h-4 w-4"
            />
            <label htmlFor={`q-${currentQuestion.id}-3`} className="ml-3 cursor-pointer">
              {currentQuestion.Options[3] || 'Option 4'}
            </label>
          </div>
        </div>
        {showResult && (
          <div className="mt-4 flex justify-between items-center">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
              {selectedAnswer.toString() === currentQuestion.CorrectAnswer
                ? 'Correct!'
                : 'Incorrect!'}
            </div>
            <button
              onClick={handleNextQuestion}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={!selectedAnswer}
            >
              {currentQuestionIndex < quiz.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;