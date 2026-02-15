"use client";

import { useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function FollowButton({
  targetUserId,
  initialFollowing = false,
}: {
  targetUserId: string;
  initialFollowing?: boolean;
}) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!user || loading) return;
    setLoading(true);

    try {
      const followQuery = query(
        collection(db, "follows"),
        where("followerId", "==", user.uid),
        where("followingId", "==", targetUserId)
      );
      const snapshot = await getDocs(followQuery);

      if (snapshot.empty) {
        await addDoc(collection(db, "follows"), {
          followerId: user.uid,
          followingId: targetUserId,
        });
        setFollowing(true);
      } else {
        await deleteDoc(snapshot.docs[0].ref);
        setFollowing(false);
      }
    } catch (err) {
      console.error("フォローエラー:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.uid === targetUserId) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        following
          ? "border border-gray-300 text-gray-700 hover:border-red-300 hover:text-red-500"
          : "bg-blue-500 text-white hover:bg-blue-600"
      }`}
    >
      {following ? "フォロー中" : "フォローする"}
    </button>
  );
}
