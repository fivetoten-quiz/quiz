import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';

export const useQuizAttempts = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [organizedAttempts, setOrganizedAttempts] = useState({});

  useEffect(() => {
    const fetchAllAttempts = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        const flatResultsRef = collection(db, 'users', user.uid, 'allQuizAttempts');
        const snapshot = await getDocs(flatResultsRef);

        if (snapshot.empty) {
          setOrganizedAttempts({});
          return;
        }

        // Organize by courseId -> chapterId -> attempts
        const organized = snapshot.docs.reduce((acc, doc) => {
          const attempt = doc.data();
          const { courseId, chapterId } = attempt;

          if (!acc[courseId]) {
            acc[courseId] = {
              chapters: {},
              stats: {
                totalAttempts: 0,
                highestScore: 0,
                chaptersCount: 0,
                latestAttempt: null
              }
            };
          }

          if (!acc[courseId].chapters[chapterId]) {
            acc[courseId].chapters[chapterId] = {
              attempts: [],
              stats: {
                totalAttempts: 0,
                highestScore: 0,
                sectionsCount: new Set(),
                latestAttempt: null
              }
            };
            acc[courseId].stats.chaptersCount++;
          }

          // Add attempt to chapter
          acc[courseId].chapters[chapterId].attempts.push(attempt);
          acc[courseId].chapters[chapterId].stats.totalAttempts++;
          acc[courseId].chapters[chapterId].stats.sectionsCount.add(attempt.sectionId);
          
          // Update stats
          acc[courseId].chapters[chapterId].stats.highestScore = Math.max(
            acc[courseId].chapters[chapterId].stats.highestScore,
            attempt.percentage
          );

          const attemptTimestamp = attempt.timestamp.toMillis();
          if (!acc[courseId].chapters[chapterId].stats.latestAttempt || 
              attemptTimestamp > acc[courseId].chapters[chapterId].stats.latestAttempt.timestamp.toMillis()) {
            acc[courseId].chapters[chapterId].stats.latestAttempt = attempt;
          }

          // Update course stats
          acc[courseId].stats.totalAttempts++;
          acc[courseId].stats.highestScore = Math.max(
            acc[courseId].stats.highestScore,
            attempt.percentage
          );
          
          if (!acc[courseId].stats.latestAttempt || 
              attemptTimestamp > acc[courseId].stats.latestAttempt.timestamp.toMillis()) {
            acc[courseId].stats.latestAttempt = attempt;
          }

          return acc;
        }, {});

        setOrganizedAttempts(organized);
      } catch (error) {
        console.error("Error fetching quiz attempts:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAttempts();
  }, []);

  return { organizedAttempts, loading, error };
};