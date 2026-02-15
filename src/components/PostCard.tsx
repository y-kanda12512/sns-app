"use client";

import Link from "next/link";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { Post } from "@/types/post";

function timeAgo(date: Date | null): string {
  if (!date) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}日前`;
  return date.toLocaleDateString("ja-JP");
}

export default function PostCard({
  post,
  onDeleted,
}: {
  post: Post;
  onDeleted?: () => void;
}) {
  const { user } = useAuth();
  const isMine = user?.uid === post.authorId;

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
        <Link href={`/profile/${post.authorId}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-lg text-gray-400">
            👤
          </div>
        </Link>
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
            <span className="text-sm text-gray-400">
              💬 {post.commentsCount}
            </span>
            <span className="text-sm text-gray-400">
              ♡ {post.likesCount}
            </span>
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
