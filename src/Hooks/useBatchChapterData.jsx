import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useBatchChapterData = (queries) => {
  const [chapters, setChapters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!queries.length) {
      setLoading(false);
      return;
    }

    let active = true;
    const unsubscribes = [];
    const expectedCount = queries.length;
    let loadedCount = 0;

    queries.forEach(({ courseId, chapterId }) => {
      const unsubscribe = onSnapshot(
        doc(db, 'courses', courseId, 'Chapters', chapterId),
        (doc) => {
          if (!active) return;
          
          setChapters(prev => ({
            ...prev,
            [chapterId]: doc.exists() ? { ...doc.data(), id: doc.id } : null
          }));

          loadedCount++;
          if (loadedCount === expectedCount) {
            setLoading(false);
          }
        },
        (err) => {
          if (!active) return;
          setError(err.message);
          setLoading(false);
        }
      );
      unsubscribes.push(unsubscribe);
    });

    return () => {
      active = false;
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [queries]);

  return { chapters, loading, error };
};