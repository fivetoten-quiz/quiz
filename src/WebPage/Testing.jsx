import { onSnapshot, collection} from 'firebase/firestore';
import React, {useEffect, useState} from 'react'
import { db } from "../firebase";

const Testing = () => {
  const [courses, setCourses] = useState([{name: "Loading...", id: "intializing..."}]);

//console.log(courses)
  useEffect(
    () => {
      onSnapshot(collection(db, "courses"), (snapshot) => {
        setCourses(snapshot.docs.map((doc) => ({...doc.data(), id: doc.id})));
      });
  })
  return (
    <div>
      <button className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-yellow-400 dark:text-black dark:hover:bg-yellow-300 transition-colors duration-300">
        New
      </button>

      <ul>
        {courses.map((courses) => (
          <li key={courses.id}>
            <a href="">
              edit
            </a>

            {courses.Subject}
            {courses.Tutor}
        </li>
        ))}


      </ul>
    </div>
  )
}

export default Testing