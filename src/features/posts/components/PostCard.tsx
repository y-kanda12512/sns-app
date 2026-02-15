"use client";

import { useState } from "react";
import Link from "next/link";
import {
  deleteDoc,
  doc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/features/common/components/UserAvatar";
import { timeAgo } from "@/features/posts/lib/timeAgo";
import type { Post } from "@/types/post";

export default function PostCard({
  post,
  onDeleted,
  initialLiked = false,
}: {
  post: Post;
  onDeleted?: () => void;
  initialLiked?: boolean;
}) {
  const { user } = useAuth();
  const isMine = user?.uid === post.authorId;
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [liking, setLiking] = useState(false);

  const handleLike = async () => {
    if (!user || liking) return;
    setLiking(true);

    try {
      const likesQuery = query(
        collection(db, "postLikes"),
        where("postId", "==", post.id),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(likesQuery);

      if (snapshot.empty) {
        await addDoc(collection(db, "postLikes"), {
          postId: post.id,
          userId: user.uid,
        });
        await updateDoc(doc(db, "posts", post.id), {
          likesCount: increment(1),
        });
        setLiked(true);
        setLikesCount((prev) => prev + 1);
      } else {
        await deleteDoc(snapshot.docs[0].ref);
        await updateDoc(doc(db, "posts", post.id), {
          likesCount: increment(-1),
        });
        setLiked(false);
        setLikesCount((prev) => prev - 1);
      }
    } catch (err) {
      console.error("いいねエラー:", err);
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("この投稿を削除しますか？")) return;
    try {
      await deleteDoc(doc(db, "posts", post.id));
      onDeleted?.();
    } catch (err) {
      console.error("投稿削除エラー:", err);
    }
  };

  return (
    <div className="border-b border-gray-200 py-4">
      <div className="flex gap-3">
        <UserAvatar userId={post.authorId} size="md" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${post.authorId}`}
              className="font-bold hover:underline"
            >
              {post.authorDisplayName}
            </Link>
            <span className="text-sm text-gray-500">
              @{post.authorUsername}
            </span>
            <span className="text-sm text-gray-400">
              ・{timeAgo(post.createdAt)}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-gray-800">
            {post.content}
          </p>
          <div className="mt-2 flex items-center gap-6">
            <Link
              href={`/posts/${post.id}`}
              className="text-sm text-gray-400 hover:text-blue-500"
            >
              💬 {post.commentsCount}
            </Link>
            <button
              onClick={handleLike}
              disabled={liking}
              className={`text-sm transition-colors ${
                liked
                  ? "text-red-500"
                  : "text-gray-400 hover:text-red-500"
              }`}
            >
              {liked ? "❤️" : "♡"} {likesCount}
            </button>
            {isMine && (
              <button
                onClick={handleDelete}
                className="text-sm text-gray-400 hover:text-red-500"
              >
                削除
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
