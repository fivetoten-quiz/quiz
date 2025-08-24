import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useCourseData = (courseIds) => {
  const [courses, setCourses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseIds.length) {
      setLoading(false);
      return;
    }

    const unsubscribe = courseIds.map(courseId => {
      return onSnapshot(doc(db, 'courses', courseId), (doc) => {
        setCourses(prev => ({
          ...prev,
          [courseId]: doc.exists() ? { id: doc.id, ...doc.data() } : null
        }));
      });
    });

    return () => unsubscribe.forEach(fn => fn());
  }, [courseIds]);

  return { courses, loading, error };
};