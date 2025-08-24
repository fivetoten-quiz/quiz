import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../Context/AuthContext';
import NicknamePopup from "../../Components/Registration/NicknamePopUp";
//'/Components/registration/NicknamePopup';
import studyImage from "../../images/Study.png";

const Dashboard = () => {  
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showNicknamePopup, setShowNicknamePopup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserProfile = async () => {
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);
        
        if (!docSnap.exists() || !docSnap.data().nickname) {
          setShowNicknamePopup(true);
        }
        setLoading(false);
      }
    };

    checkUserProfile();
  }, [currentUser]);

    // Sample data for dashboard metrics
  const userStats = {
    completedCourses: 3,
    totalPoints: 1240,
    currentStreak: 7,
    rank: 'Novice Explorer'
  };

  const dashboardCards = [
    {
      title: "Let's Play Quiz",
      description: "Test your knowledge with interactive quizzes",
      path: "/home/quizMenu",
      icon: "📊",
      color: "from-blue-500 to-blue-600",
      textColor: "text-blue-100"
    },
    {
      title: "Practice Questions",
      description: "Sharpen your skills with practice problems",
      path: "/home/practice",
      icon: "📝",
      color: "from-green-500 to-green-600",
      textColor: "text-green-100"
    },
    {
      title: "View Scores",
      description: "Track your progress and achievements",
      path: "/home/score",
      icon: "🏆",
      color: "from-amber-500 to-amber-600",
      textColor: "text-amber-100"
    },
    {
      title: "Learning Paths",
      description: "Explore structured learning journeys",
      path: "/home/learning-paths",
      icon: "🛣️",
      color: "from-purple-500 to-purple-600",
      textColor: "text-purple-100"
    }
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, Learner!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Continue your learning journey and track your progress
        </p>
      </div>

      {/* Stats Overview */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 mr-4">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Courses Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.completedCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 mr-4">
              <span className="text-2xl">⭐</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Points</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.totalPoints}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 mr-4">
              <span className="text-2xl">🔥</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.currentStreak} days</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 mr-4">
              <span className="text-2xl">🏅</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your Rank</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{userStats.rank}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.path)}
              className={`bg-gradient-to-br ${card.color} rounded-xl p-6 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer group`}
            >
              <div className="text-center">
                <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">
                  {card.icon}
                </div>
                <h3 className={`font-bold text-lg mb-2 ${card.textColor}`}>
                  {card.title}
                </h3>
                <p className={`text-sm ${card.textColor} opacity-90`}>
                  {card.description}
                </p>
                <div className={`mt-4 ${card.textColor} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <span className="text-sm">Click to explore →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
              <span className="text-blue-600 dark:text-blue-400">✅</span>
            </div>
            <div>
              <p className="text-gray-900 dark:text-white">Completed Algebra Basics quiz</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Scored 85% • 2 hours ago</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
              <span className="text-green-600 dark:text-green-400">⭐</span>
            </div>
            <div>
              <p className="text-gray-900 dark:text-white">Earned 50 points in Geometry practice</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Yesterday at 3:45 PM</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg mr-3">
              <span className="text-amber-600 dark:text-amber-400">🔥</span>
            </div>
            <div>
              <p className="text-gray-900 dark:text-white">7-day streak achieved!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Keep up the good work</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  // return (
  //   <div>
  //     {showNicknamePopup && (
  //       <NicknamePopup onClose={() => setShowNicknamePopup(false)} />
  //     )}

  //     <div className="min-h-screen p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700">
  //       <div 
  //         className="flex flex-col items-center justify-center h-48 mb-4 rounded-sm bg-gray-50 dark:bg-gray-800 cursor-pointer"
  //         onClick={() => navigate('/home/courses')}
  //       >
  //         <img
  //           src={studyImage}
  //           alt="Math-Class"
  //           className="max-h-[40%] max-w-[40%] object-contain"
  //         />
  //         <p className="mt-2">Let's play Quiz</p>
  //       </div>

  //       <div 
  //         className="flex flex-col items-center justify-center h-48 mb-4 rounded-sm bg-gray-50 dark:bg-gray-800 cursor-pointer"
  //         onClick={() => navigate('/home/practice')}
  //       >
  //         <img
  //           src={studyImage}
  //           alt="Math-Class"
  //           className="max-h-[40%] max-w-[40%] object-contain"
  //         />
  //         <p className="mt-2">Practice Question</p>
  //       </div>

  //       <div 
  //         className="flex flex-col items-center justify-center h-48 mb-4 rounded-sm bg-gray-50 dark:bg-gray-800 cursor-pointer"
  //         onClick={() => navigate('/home/score')}
  //       >
  //         <img
  //           src={studyImage}
  //           alt="Math-Class"
  //           className="max-h-[40%] max-w-[40%] object-contain"
  //         />
  //         <p className="mt-2">View Score</p>
  //       </div>
  //     </div>
  //   </div>
  // );
};

export default Dashboard;