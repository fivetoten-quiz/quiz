import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';

const Practice = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [courses, setCourses] = useState([]);
  const [chapters, setChapters] = useState({});
  const [sections, setSections] = useState({});
  const [chapterCounts, setChapterCounts] = useState({});
  const [sectionCounts, setSectionCounts] = useState({});
  
  // 1. Fetch all courses, their chapter counts, and section counts
  useEffect(() => {
    const fetchAllData = async () => {
      const coursesQuery = query(collection(db, 'courses'));
      const coursesSnapshot = await getDocs(coursesQuery);
      const coursesData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch chapters and section counts for each course
      const chapterCountData = {};
      const sectionCountData = {};
      
      for (const course of coursesData) {
        const chaptersQuery = query(collection(db, `courses/${course.id}/Chapters`));
        const chaptersSnapshot = await getDocs(chaptersQuery);
        chapterCountData[course.id] = chaptersSnapshot.size;
        
        // Pre-fetch chapters for each course
        const sortedChapters = chaptersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            const numA = parseFloat(a.Number);
            const numB = parseFloat(b.Number);
            return numA - numB;
          });
        
        setChapters(prev => ({
          ...prev,
          [course.id]: sortedChapters
        }));
        
        // Pre-fetch section counts for each chapter
        for (const chapter of sortedChapters) {
          const sectionsQuery = query(collection(db, `courses/${course.id}/Chapters/${chapter.id}/Section`));
          const sectionsSnapshot = await getDocs(sectionsQuery);
          const key = `${course.id}-${chapter.id}`;
          sectionCountData[key] = sectionsSnapshot.size;
          
          // Pre-fetch sections for each chapter (optional - can remove if too many)
          const sortedSections = sectionsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
              return a.SectionNumber.localeCompare(b.SectionNumber, undefined, {
                numeric: true,
                sensitivity: 'base'
              });
            });
            
          setSections(prev => ({
            ...prev,
            [key]: sortedSections
          }));
        }
      }
      
      setChapterCounts(chapterCountData);
      setSectionCounts(sectionCountData);
      setCourses(coursesData);
      setLoading(false);
    };
    
    fetchAllData();
  }, []);

  // 2. Fetch sections when a chapter is expanded (if not already pre-fetched)
  const fetchSections = async (courseId, chapterId) => {
    const key = `${courseId}-${chapterId}`;
    if (sections[key]) return;
    
    const q = query(collection(db, `courses/${courseId}/Chapters/${chapterId}/Section`));
    const snapshot = await getDocs(q);
    
    // Sort sections by their SectionNumber property
    const sortedSections = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          return a.SectionNumber.localeCompare(b.SectionNumber, undefined, {
            numeric: true,
            sensitivity: 'base'
          });
        });

    setSections(prev => ({
        ...prev,
        [key]: sortedSections
    }));
    
    // Update section count
    setSectionCounts(prev => ({
      ...prev,
      [key]: sortedSections.length
    }));
  };

  const toggleCourse = (courseId) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
      setExpandedChapter(null);
    } else {
      setExpandedCourse(courseId);
      setExpandedChapter(null);
    }
  };

  const toggleChapter = async (courseId, chapterId) => {
    if (expandedChapter === chapterId) {
      setExpandedChapter(null);
    } else {
      await fetchSections(courseId, chapterId);
      setExpandedChapter(chapterId);
    }
  };

  // Helper function to get a color based on course index
  const getCourseColor = (index) => {
    const colors = ['blue', 'green', 'purple', 'orange', 'red', 'indigo'];
    return colors[index % colors.length];
  };

    // Animation variants for Framer Motion
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

  const dropdownVariants = {
    hidden: { 
      opacity: 0, 
      height: 0,
      transition: {
        duration: 0.2
      }
    },
    visible: { 
      opacity: 1, 
      height: "auto",
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
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10 text-center"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-3">Practice Questions</h1>
        <p className="text-xl text-gray-600">Select a course and chapter to practice questions</p>
      </motion.div>
      
      {/* Stats Overview */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-5 mb-10"
      >
        <motion.div variants={itemVariants} className="bg-white rounded-xl p-5 shadow-md border border-gray-200 flex items-center">
          <div className="p-4 rounded-xl bg-blue-100 text-blue-600 mr-5">
            <i className="fas fa-book text-2xl"></i>
          </div>
          <div>
            <p className="text-base text-gray-500">Active Courses</p>
            <p className="text-2xl font-bold text-gray-800">{courses.length}</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="bg-white rounded-xl p-5 shadow-md border border-gray-200 flex items-center">
          <div className="p-4 rounded-xl bg-green-100 text-green-600 mr-5">
            <i className="fas fa-check-circle text-2xl"></i>
          </div>
          <div>
            <p className="text-base text-gray-500">Completed Chapters</p>
            <p className="text-2xl font-bold text-gray-800">0/{Object.values(chapters).flat().length}</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="bg-white rounded-xl p-5 shadow-md border border-gray-200 flex items-center">
          <div className="p-4 rounded-xl bg-purple-100 text-purple-600 mr-5">
            <i className="fas fa-trophy text-2xl"></i>
          </div>
          <div>
            <p className="text-base text-gray-500">Average Score</p>
            <p className="text-2xl font-bold text-gray-800">0%</p>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Courses List */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {courses.map((course, index) => {
          const color = getCourseColor(index);
          const colorClass = `border-${color}-500 bg-${color}-100 text-${color}-600`;
          
          return (
            <motion.div 
              key={course.id} 
              variants={itemVariants}
              className={`course-card bg-white rounded-xl shadow-md border-l-5 border-${color}-500 overflow-hidden`}
            >
              {/* Course Header */}
              <div 
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                onClick={() => toggleCourse(course.id)}
              >
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="font-semibold text-gray-800 text-xl">{course.Subject}</h2>
                    <span className={`text-base font-medium px-3 py-1.5 rounded-full ${colorClass}`}>
                      {chapters[course.id]?.length || '0'} Chapters
                    </span>
                  </div>
                  <p className="text-base text-gray-600 mb-3">Tutor: {course.Tutor}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <span>Progress</span>
                      <span>0%</span>
                    </div>
                    <div className="progress-bar bg-gray-200 w-full h-2.5 rounded-full">
                      <div 
                        className={`progress-fill bg-${color}-500 h-full rounded-full transition-all duration-500`} 
                        style={{width: '0%'}}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="ml-5 text-gray-400 text-xl">
                  <i className={`fas fa-chevron-down transition-transform duration-300 ${expandedCourse === course.id ? 'rotate-180' : ''}`}></i>
                </div>
              </div>

              {/* Chapters Dropdown */}
              <AnimatePresence>
                {expandedCourse === course.id && (
                  <motion.div 
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={dropdownVariants}
                    className="border-t border-gray-200 overflow-hidden"
                  >
                    {chapters[course.id]?.map(chapter => (
                      <div key={chapter.id} className="chapter-item p-5 bg-gray-50 border-b border-gray-200">
                        {/* Chapter Header */}
                        <div 
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() => toggleChapter(course.id, chapter.id)}
                        >
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800 text-lg">{chapter.Number}. {chapter.Title}</h3>
                            <div className="flex items-center mt-2">
                              <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 mr-3">
                                Not started
                              </span>
                              <span className="text-sm text-gray-500">
                                {sections[`${course.id}-${chapter.id}`]?.length || '0'} sections
                              </span>
                            </div>
                          </div>
                          <div className="ml-5 text-gray-400 text-lg">
                            <i className={`fas fa-chevron-down transition-transform duration-300 ${expandedChapter === chapter.id ? 'rotate-180' : ''}`}></i>
                          </div>
                        </div>

                        {/* Sections Dropdown */}
                        <AnimatePresence>
                          {expandedChapter === chapter.id && (
                            <motion.div 
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                              variants={dropdownVariants}
                              className="mt-4 pl-5 space-y-4 overflow-hidden"
                            >
                              {sections[`${course.id}-${chapter.id}`]?.map(section => (
                                <motion.div 
                                  key={section.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="p-4 bg-white rounded-lg border border-gray-200 flex justify-between items-center shadow-sm"
                                >
                                  <div>
                                    <h4 className="font-medium text-gray-800 text-base">{section.SectionNumber} {section.SectionName}</h4>
                                    {/* <div className="flex items-center mt-2">
                                      <span className="text-sm text-gray-500 mr-2">Status: </span>
                                      <span className="text-sm font-medium text-gray-600">Not started</span>
                                    </div> */}
                                    {section.QuizVideoLink && (
                                      <a 
                                        href={section.QuizVideoLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 text-sm hover:underline inline-flex items-center mt-2"
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
                                      onClick={() => navigate(`/home/practice/quiz`, {
                                        state: {
                                          courseId: course.id,
                                          chapterId: chapter.id,
                                          sectionId: section.id
                                        }
                                      })}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base font-medium transition-colors duration-200"
                                    >
                                      Practice
                                    </button>
                                  </div>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default Practice;
// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { collection, query, where, getDocs } from 'firebase/firestore';
// import { db } from '../../firebase';

// const Practice = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [expandedCourse, setExpandedCourse] = useState(null);
//   const [expandedChapter, setExpandedChapter] = useState(null);
//   const [courses, setCourses] = useState([]);
//   const [chapters, setChapters] = useState({});
//   const [sections, setSections] = useState({});
  
//   // 1. Fetch all courses
//   useEffect(() => {
//     const fetchCourses = async () => {
//       const q = query(collection(db, 'courses'));
//       const snapshot = await getDocs(q);
//       setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
//     };
//     fetchCourses();
//   }, []);

//     // 2. Fetch chapters when a course is expanded (with sorting)
//     const fetchChapters = async (courseId) => {
//     if (chapters[courseId]) return; // Already loaded
    
//     const q = query(collection(db, `courses/${courseId}/Chapters`));
//     const snapshot = await getDocs(q);
    
//     // Sort chapters by their Number property (treating as numeric)
//     const sortedChapters = snapshot.docs
//         .map(doc => ({ id: doc.id, ...doc.data() }))
//         .sort((a, b) => {
//         // Convert string numbers to actual numbers for comparison
//         const numA = parseFloat(a.Number);
//         const numB = parseFloat(b.Number);
//         return numA - numB; // Ascending order
//         });

//     setChapters(prev => ({
//         ...prev,
//         [courseId]: sortedChapters
//     }));
//     };

//     // 3. Fetch sections when a chapter is expanded (with sorting)
//     const fetchSections = async (courseId, chapterId) => {
//     const key = `${courseId}-${chapterId}`;
//     if (sections[key]) return;
    
//     const q = query(collection(db, `courses/${courseId}/Chapters/${chapterId}/Section`));
//     const snapshot = await getDocs(q);
    
//     // Sort sections by their SectionNumber property
//     const sortedSections = snapshot.docs
//         .map(doc => ({ id: doc.id, ...doc.data() }))
//         .sort((a, b) => {
//         // Compare section numbers (like "2.1", "2.2", etc.)
//         return a.SectionNumber.localeCompare(b.SectionNumber, undefined, {
//             numeric: true,
//             sensitivity: 'base'
//         });
//         });

//     setSections(prev => ({
//         ...prev,
//         [key]: sortedSections
//     }));
//     };

//   const toggleCourse = async (courseId) => {
//     if (expandedCourse === courseId) {
//       setExpandedCourse(null);
//       setExpandedChapter(null);
//     } else {
//       await fetchChapters(courseId);
//       setExpandedCourse(courseId);
//       setExpandedChapter(null);
//     }
//   };

//   const toggleChapter = async (courseId, chapterId) => {
//     if (expandedChapter === chapterId) {
//       setExpandedChapter(null);
//     } else {
//       await fetchSections(courseId, chapterId);
//       setExpandedChapter(chapterId);
//     }
//   };

//     return (
//     <div className="p-4 max-w-4xl mx-auto space-y-4">
//         <h1 className="text-2xl font-bold mb-6">Practice Questions</h1>
        
//         {courses.map(course => (
//         <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//             {/* Course Header */}
//             <div 
//             className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
//             onClick={() => toggleCourse(course.id)}
//             >
//             <div>
//                 <h2 className="font-semibold">{course.Subject}</h2>
//                 <p className="text-sm text-gray-600">Tutor: {course.Tutor}</p>
//             </div>
//             <svg 
//                 className={`w-5 h-5 text-gray-500 transform transition-transform ${
//                 expandedCourse === course.id ? 'rotate-180' : ''
//                 }`}
//                 fill="none" 
//                 stroke="currentColor" 
//                 viewBox="0 0 24 24"
//             >
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//             </svg>
//             </div>

//             {/* Chapters Dropdown */}
//             {expandedCourse === course.id && (
//             <div className="border-t border-gray-200">
//                 {chapters[course.id]?.map(chapter => (
//                 <div key={chapter.id} className="p-4 bg-gray-50">
//                     {/* Chapter Header */}
//                     <div 
//                     className="flex justify-between items-center cursor-pointer"
//                     onClick={() => toggleChapter(course.id, chapter.id)}
//                     >
//                     <div>
//                         <h3 className="font-medium">{chapter.Number}. {chapter.Title}</h3>
//                     </div>
//                     <svg 
//                         className={`w-5 h-5 text-gray-500 transform transition-transform ${
//                         expandedChapter === chapter.id ? 'rotate-180' : ''
//                         }`}
//                         fill="none" 
//                         stroke="currentColor" 
//                         viewBox="0 0 24 24"
//                     >
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                     </svg>
//                     </div>

//                     {/* Sections Dropdown */}
//                     {expandedChapter === chapter.id && (
//                     <div className="mt-3 pl-4 space-y-3">
//                         {sections[`${course.id}-${chapter.id}`]?.map(section => (
//                         <div key={section.id} className="p-3 bg-white rounded border border-gray-200 flex justify-between items-center">
//                             <div>
//                             <h4 className="font-medium">{section.SectionNumber} {section.SectionName}</h4>
//                             {section.QuizVideoLink && (
//                                 <a 
//                                 href={section.QuizVideoLink} 
//                                 target="_blank" 
//                                 rel="noopener noreferrer"
//                                 className="text-blue-600 text-sm hover:underline"
//                                 >
//                                 Watch Video
//                                 </a>
//                             )}
//                             </div>
//                             <button
//                             onClick={() => navigate(`/home/practice/quiz`, {
//                                 state: {
//                                 courseId: course.id,
//                                 chapterId: chapter.id,
//                                 sectionId: section.id
//                                 }
//                             })}
//                             className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
//                             >
//                             Practice
//                             </button>
//                         </div>
//                         ))}
//                     </div>
//                     )}
//                 </div>
//                 ))}
//             </div>
//             )}
//         </div>
//         ))}
//     </div>
//     );
// };

// export default Practice;