import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { Review } from '@/data/branchesData';
import { toast } from '@/hooks/use-toast';
import {
  db,
  seedFirestoreIfEmpty,
  handleFirestoreError,
  OperationType,
} from '@/lib/firebase';

export const useReviews = (branchId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!branchId) return;

    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      await seedFirestoreIfEmpty();

      const q = query(collection(db, 'reviews'), where('branch_id', '==', branchId));
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const loaded: Review[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              userId: data.userId || 'anon',
              userName: data.userName || 'Anonymous',
              rating: Number(data.rating || 5),
              comment: data.comment || '',
              date: data.date || new Date().toISOString().split('T')[0],
              helpful: Number(data.helpful || 0),
            };
          });

          loaded.sort((a, b) => (a.date < b.date ? 1 : -1));
          setReviews(loaded);
        },
        (error) => {
          console.error('Error listening to branch reviews:', error);
        }
      );
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [branchId]);

  const addReview = useCallback(
    async (review: Omit<Review, 'id' | 'date' | 'helpful'>) => {
      const now = new Date().toISOString();
      const reviewId = `review_${Date.now()}`;
      const newReview: Review = {
        ...review,
        id: reviewId,
        date: now.split('T')[0],
        helpful: 0,
      };

      try {
        await setDoc(doc(db, 'reviews', reviewId), {
          id: reviewId,
          branch_id: branchId,
          userId: newReview.userId,
          userName: newReview.userName,
          rating: newReview.rating,
          comment: newReview.comment,
          date: newReview.date,
          helpful: 0,
          created_at: now,
          updated_at: now,
        });

        toast({
          title: 'Review Submitted',
          description: 'Thank you for your feedback!',
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `reviews/${reviewId}`);
      }

      return newReview;
    },
    [branchId]
  );

  const markHelpful = useCallback(
    async (reviewId: string) => {
      const target = reviews.find((r) => r.id === reviewId);
      if (!target) return;

      const now = new Date().toISOString();
      try {
        await updateDoc(doc(db, 'reviews', reviewId), {
          helpful: target.helpful + 1,
          updated_at: now,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `reviews/${reviewId}`);
      }
    },
    [reviews]
  );

  const getAverageRating = useCallback(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  return {
    reviews,
    addReview,
    markHelpful,
    getAverageRating,
  };
};
