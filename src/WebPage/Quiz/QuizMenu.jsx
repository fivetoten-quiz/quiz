import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';

const QuizMenu = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [chapters, setChapters] = useState({});
  const [sections, setSections] = useState({});
  
  // Navigation state
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [navigationStack, setNavigationStack] = useState([]);
  
  // Animation states
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 1. Fetch all courses and their chapters
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all courses
        const coursesQuery = query(collection(db, 'courses'));
        const coursesSnapshot = await getDocs(coursesQuery);
        const coursesData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCourses(coursesData);
        
        // Fetch chapters for each course
        const chaptersData = {};
        for (const course of coursesData) {
          const chaptersQuery = query(collection(db, `courses/${course.id}/Chapters`));
          const chaptersSnapshot = await getDocs(chaptersQuery);
          
          // Sort chapters by their Number property
          const sortedChapters = chaptersSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
              const numA = parseFloat(a.Number);
              const numB = parseFloat(b.Number);
              return numA - numB;
            });
          
          chaptersData[course.id] = sortedChapters;
          
          // Fetch sections for each chapter
          const sectionsData = {};
          for (const chapter of sortedChapters) {
            const sectionsQuery = query(collection(db, `courses/${course.id}/Chapters/${chapter.id}/Section`));
            const sectionsSnapshot = await getDocs(sectionsQuery);
            
            // Sort sections by their SectionNumber property
            const sortedSections = sectionsSnapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .sort((a, b) => {
                return a.SectionNumber.localeCompare(b.SectionNumber, undefined, {
                  numeric: true,
                  sensitivity: 'base'
                });
              });
            
            sectionsData[`${course.id}-${chapter.id}`] = sortedSections;
          }
          
          // Update sections state with the fetched data
          setSections(prev => ({ ...prev, ...sectionsData }));
        }
        
        // Update chapters state with the fetched data
        setChapters(chaptersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle course selection
  const handleCourseSelect = async (course) => {
    setIsTransitioning(true);
    setSelectedCourse(course);
    setNavigationStack([{ type: 'course', data: course }]);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Handle chapter selection
  const handleChapterSelect = async (chapter) => {
    setIsTransitioning(true);
    setSelectedChapter(chapter);
    setNavigationStack(prev => [...prev, { type: 'chapter', data: chapter }]);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Handle section selection
  const handleSectionSelect = (section) => {
    setSelectedSection(section);
    navigate(`/home/quizMenu/quizGame`, {
      state: {
        courseId: selectedCourse.id,
        chapterId: selectedChapter.id,
        sectionId: section.id
      }
    });
  };

  // Navigate back
  const navigateBack = (step = 1) => {
    setIsTransitioning(true);
    
    if (navigationStack.length <= step) {
      // Go back to the beginning
      setSelectedCourse(null);
      setSelectedChapter(null);
      setNavigationStack([]);
    } else {
      // Go back to the specified step
      const newStack = navigationStack.slice(0, navigationStack.length - step);
      const lastItem = newStack[newStack.length - 1];
      
      if (!lastItem) {
        setSelectedCourse(null);
        setSelectedChapter(null);
      } else if (lastItem.type === 'course') {
        setSelectedCourse(lastItem.data);
        setSelectedChapter(null);
      } else if (lastItem.type === 'chapter') {
        setSelectedChapter(lastItem.data);
      }
      
      setNavigationStack(newStack);
    }
    
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Get a color based on index
  const getColor = (index) => {
    const colors = ['blue', 'green', 'purple', 'orange', 'red', 'indigo'];
    return colors[index % colors.length];
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
        duration: 0.3
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto flex justify-center items-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading courses...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10 text-center"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-3">Quiz Questions</h1>
        <p className="text-xl text-gray-600 hidden sm:block">Test your knowledge with quiz today!</p>
      </motion.div>
      
      {/* Breadcrumb Navigation */}
      {navigationStack.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 flex items-center justify-center"
        >
          <button 
            onClick={() => navigateBack(1)}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium mr-4 px-4 py-2 bg-blue-100 rounded-full"
          >
            <i className="fas fa-arrow-left mr-2"></i> Back
          </button>
          
          <div className="flex items-center text-sm text-gray-600">
            <span 
              className={`cursor-pointer hover:text-blue-600 ${navigationStack.length > 1 ? 'font-medium' : ''}`}
              onClick={() => navigateBack(navigationStack.length)}
            >
              All Courses
            </span>
            
            {navigationStack.map((item, index) => (
              <React.Fragment key={index}>
                <i className="fas fa-chevron-right mx-2 text-xs"></i>
                <span 
                  className={`cursor-pointer hover:text-blue-600 ${index === navigationStack.length - 1 ? 'font-bold text-blue-700' : ''}`}
                  onClick={() => navigateBack(navigationStack.length - 1 - index)}
                >
                  {item.data.Subject || item.data.Title || item.data.SectionName}
                </span>
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Main Content Area */}
      <div className="relative min-h-96">
        <AnimatePresence mode="wait">
          {!isTransitioning && (
            <motion.div
              key={navigationStack.length}
              initial={{ opacity: 0, x: navigationStack.length > 0 ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: navigationStack.length > 0 ? -50 : 50 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              {/* Course Selection View */}
              {!selectedCourse && (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {courses.map((course, index) => {
                    const color = getColor(index);
                    
                    return (
                      <motion.div 
                        key={course.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        className={`bg-white rounded-2xl p-6 shadow-lg border-l-8 border-${color}-500 cursor-pointer transition-all duration-300 hover:shadow-xl`}
                        onClick={() => handleCourseSelect(course)}
                      >
                        <div className="flex items-center mb-4">
                          <div className={`p-3 rounded-xl bg-${color}-100 text-${color}-600 mr-4`}>
                            <i className="fas fa-book text-2xl"></i>
                          </div>
                          <h2 className="text-xl font-bold text-gray-800">{course.Subject}</h2>
                        </div>
                        <p className="text-gray-600 mb-4">Tutor: {course.Tutor}</p>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm font-medium px-3 py-1 rounded-full bg-${color}-100 text-${color}-700`}>
                            {chapters[course.id]?.length || '0'} Chapters
                          </span>
                          <button className={`px-4 py-2 bg-${color}-500 text-white rounded-lg font-medium`}>
                            Choose <i className="fas fa-arrow-right ml-2"></i>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
              
              {/* Chapter Selection View */}
              {selectedCourse && !selectedChapter && (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                      <div className="p-2 rounded-xl bg-blue-100 text-blue-600 mr-3">
                        <i className="fas fa-book"></i>
                      </div>
                      {selectedCourse.Subject}
                    </h2>
                    <p className="text-gray-600">Select a chapter to practice</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {chapters[selectedCourse.id]?.map((chapter, index) => {
                      const color = getColor(index);
                      
                      return (
                        <motion.div 
                          key={chapter.id}
                          variants={itemVariants}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`bg-white rounded-xl p-5 shadow-sm border-l-4 border-${color}-500 cursor-pointer transition-all duration-300 hover:shadow-md`}
                          onClick={() => handleChapterSelect(chapter)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-bold text-lg py-1.5 text-gray-800">
                                {chapter.Number}. {chapter.Title}
                              </h3>
                              <p className={`text-sm font-medium px-3 py-1 rounded-full text-${color}-700`}>
                                {sections[`${selectedCourse.id}-${chapter.id}`]?.length || '0'} sections available
                              </p>
                            </div>
                            <button className={`px-4 py-2 bg-${color}-500 text-white rounded-lg font-medium`}>
                              Select <i className="fas fa-arrow-right ml-2"></i>
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
              
              {/* Section Selection View */}
              {selectedCourse && selectedChapter && (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                      <div className="p-2 rounded-xl bg-green-100 text-green-600 mr-3">
                        <i className="fas fa-layer-group"></i>
                      </div>
                      {selectedCourse.Subject} - Chapter {selectedChapter.Number}
                    </h2>
                    <p className="text-gray-600">Select a section to practice</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {sections[`${selectedCourse.id}-${selectedChapter.id}`]?.map((section, index) => {
                      const color = getColor(index);
                      
                      return (
                        <motion.div 
                          key={section.id}
                          variants={itemVariants}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`bg-white rounded-xl p-5 shadow-sm border-l-4 border-${color}-500 transition-all duration-300 hover:shadow-md`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-800">
                                {section.SectionNumber} {section.SectionName}
                              </h3>
                              <div className="flex items-center mt-2">
                                <span className="text-sm text-gray-500 mr-2">Status: </span>
                                <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                                  Not started
                                </span>
                              </div>
                              {section.QuizVideoLink && (
                                <a 
                                  href={section.QuizVideoLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 text-sm hover:underline inline-flex items-center mt-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <i className="fas fa-video mr-2 text-xs"></i> Watch Video
                                </a>
                              )}
                            </div>
                            <div className="flex space-x-3">
                              {section.QuizVideoLink && (
                                <button 
                                  className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-full transition-colors duration-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(section.QuizVideoLink, '_blank');
                                  }}
                                >
                                  <i className="fas fa-video text-lg"></i>
                                </button>
                              )}
                              <button
                                onClick={() => handleSectionSelect(section)}
                                className={`px-4 py-2 bg-${color}-500 text-white rounded-lg font-medium hover:bg-${color}-600 transition-colors duration-200`}
                              >
                                Play Quiz
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuizMenu;