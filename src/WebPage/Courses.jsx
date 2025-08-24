import { onSnapshot, collection} from 'firebase/firestore';
import React, {useEffect, useState} from 'react'
import { db } from "../firebase";
import { useNavigate } from 'react-router-dom';

//image import 
import mathBook from "../images/math-book.png"; // Add this import

const Courses = () => {
      const [courses, setCourses] = useState([{name: "Loading...", id: "intializing..."}]);
      const navigate = useNavigate();
    
    console.log(courses)
      useEffect(
        () => {
          onSnapshot(collection(db, "courses"), (snapshot) => {
            setCourses(snapshot.docs.map((doc) => ({...doc.data(), id: doc.id})));
          });
      })

        //       {courses.map((courses) => (
        //   <li key={courses.id}>
        //     <a href="">
        //       edit
        //     </a>

        //     {courses.Subject}
        //     {courses.Tutor}
        // </li>
        // ))}

  return (
    <div>
        <div class="min-h-screen p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700">
            Let's Play!

            Select Your Courses

            <button
            onClick={() => navigate(`/home`)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
            Go Back
            </button>

            {/* one row one box */}
            {courses.map((courses) => (
                 <div 
                  key={courses.id} 
                  class="flex items-center justify-center h-48 mb-4 rounded-sm bg-gray-50 dark:bg-gray-800"
                  onClick={() => navigate(`/home/courses/${courses.id}/chapters`)}>
                    <img
                    src={mathBook} // Use the imported image
                    alt="Math-Class"
                    className="max-h-[40%] max-w-[40%] object-contain"
                    // onClick={() => {
                    //     window.history.back();
                    // }}
                    />

                    <br />
                    Tutor: {courses.Tutor}
                    <br />
                    Subject: {courses.Subject}
                    
                </div>
            ))}

            {/* one row one box */}
            <div class="flex items-center justify-center h-48 mb-4 rounded-sm bg-gray-50 dark:bg-gray-800">
                <p class="text-2xl text-gray-400 dark:text-gray-500">
                    <svg class="w-3.5 h-3.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 1v16M1 9h16"/>
                     </svg>
                </p>
            </div>

            {/* one row one box */}
            <div class="flex items-center justify-center h-48 mb-4 rounded-sm bg-gray-50 dark:bg-gray-800">
                <p class="text-2xl text-gray-400 dark:text-gray-500">
                    <svg class="w-3.5 h-3.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 1v16M1 9h16"/>
                    </svg>
                </p>
            </div>            
        </div>
    </div>
  )
}

export default Courses