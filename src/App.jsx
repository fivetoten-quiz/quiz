import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Registration from "./Components/Registration/Registration";
import Home from './WebPage/Home';
import TopNav from "./Components/NavBar/TopNav";
import Dashboard from "./WebPage//Dashboard/Dashboard";
import Settings from "./WebPage/Settings";
import SideNavUserPanel from "./Components/NavBar/SideNavUserPanel";
import MobileNav from "./Components/NavBar/MobileNav";
import Testing from "./WebPage/Testing";
import Courses from "./WebPage/Courses";
import Quiz from "./WebPage/Quiz";
import Chapters from "./WebPage/Chapters";
import Section from "./WebPage/Section";
import Score from "./WebPage/Score/Score";
import { AuthProvider } from '../src/Context/AuthContext';
import SectionScore from "./WebPage/Score/SectionScore";
import Practice from "./WebPage/Practice/Practice";
import PracticeQuiz from "./WebPage/Practice/PracticeQuiz";
import QuizMenu from "./WebPage/Quiz/QuizMenu";
import QuizGame from "./WebPage/Quiz/QuizGame";

const App = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <AuthProvider>              
          <Router>
            <div className="bg-white dark:bg-gray-800 rounded-lg ring shadow-xl ring-gray-900/5 min-h-screen">
              <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"></link>
              <Routes>
                <Route path="/quiz" element={<Registration />} />
                <Route path="/home" element={
                  <>
                    <Home/> {/* Inside becomes your layout component */}   
                  </>
                }>
                  {/* Nested routes for home section */}
                  <Route index element={<Dashboard  />} />
                  <Route path="testing" element={<Testing  />} />
                  {/* <Route path="courses" element={<Courses  />} />    
                  <Route path="courses/:courseId/quiz" element={<Quiz  />} />                    */}
                  <Route path="courses" element={<Courses  />} />    
                  <Route path="courses/:courseId/chapters" element={<Chapters  />} />   
                  <Route path="courses/:courseId/chapters/:chapterId/section" element={<Section  />} />
                  <Route path="courses/:courseId/chapters/:chapterId/section/:sectionId/quiz" element={<Quiz  />} />      

                  <Route path="quizMenu" element={<QuizMenu/>}/>
                  <Route path="quizMenu/quizGame" element={<QuizGame/>}/> 

                  <Route path="score" element={<Score/>}/>    
                  <Route path="score/sectionScore" element={<SectionScore/>}/>    

                  <Route path="practice" element={<Practice/>}/>
                  <Route path="practice/quiz" element={<PracticeQuiz/>}/>                    
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </div>
          </Router>
    </AuthProvider>

);
};

export default App;
