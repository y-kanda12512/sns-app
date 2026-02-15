"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

const MAX_LENGTH = 280;

export default function PostForm({ onPosted }: { onPosted?: () => void }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim() || posting) return;
    setError("");
    setPosting(true);

    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) {
        setError("先にプロフィールを設定してください");
        return;
      }
      const userData = userSnap.data();

      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorDisplayName: userData.displayName,
        authorUsername: userData.username,
        content: content.trim(),
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
      });

      setContent("");
      onPosted?.();
    } catch {
      setError("投稿に失敗しました");
    } finally {
      setPosting(false);
    }
  };

  const remaining = MAX_LENGTH - content.length;

  return (
    <form onSubmit={handleSubmit} className="border-b border-gray-200 pb-4">
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={MAX_LENGTH}
        rows={3}
        placeholder="いまどうしてる？"
        className="block w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <div className="mt-2 flex items-center justify-between">
        <span
          className={`text-xs ${
            remaining <= 20 ? "text-red-500" : "text-gray-400"
          }`}
        >
          {remaining}
        </span>
        <button
          type="submit"
          disabled={!content.trim() || posting}
          className="rounded-full bg-blue-500 px-5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
        >
          {posting ? "投稿中..." : "投稿する"}
        </button>
      </div>
    </form>
  );
}
