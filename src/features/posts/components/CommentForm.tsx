"use client";

import { useState } from "react";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function CommentForm({
  postId,
  onCommented,
}: {
  postId: string;
  onCommented?: () => void;
}) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || posting) return;
    setPosting(true);

    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) return;
      const userData = userSnap.data();

      await addDoc(collection(db, "posts", postId, "comments"), {
        authorId: user.uid,
        authorDisplayName: userData.displayName,
        authorUsername: userData.username,
        content: newComment.trim(),
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "posts", postId), {
        commentsCount: increment(1),
      });

      setNewComment("");
      onCommented?.();
    } catch (err) {
      console.error("コメント投稿エラー:", err);
    } finally {
      setPosting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-b border-gray-200 py-4">
      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        maxLength={280}
        rows={2}
        placeholder="コメントを入力..."
        className="block w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={!newComment.trim() || posting}
          className="rounded-full bg-blue-500 px-5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
        >
          {posting ? "送信中..." : "コメント"}
        </button>
      </div>
    </form>
  );
}
