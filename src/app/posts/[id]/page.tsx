"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import PostCard from "@/components/PostCard";
import type { Post } from "@/types/post";

type Comment = {
  id: string;
  authorId: string;
  authorDisplayName: string;
  authorUsername: string;
  content: string;
  createdAt: Date | null;
};

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

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [postSnap, commentsSnapshot, likesSnapshot] = await Promise.all([
        getDoc(doc(db, "posts", id)),
        getDocs(
          query(
            collection(db, "posts", id, "comments"),
            orderBy("createdAt", "asc")
          )
        ),
        getDocs(
          query(
            collection(db, "postLikes"),
            where("postId", "==", id),
            where("userId", "==", user.uid)
          )
        ),
      ]);

      if (postSnap.exists()) {
        const data = postSnap.data();
        setPost({
          id,
          authorId: data.authorId,
          authorDisplayName: data.authorDisplayName,
          authorUsername: data.authorUsername,
          content: data.content,
          likesCount: data.likesCount || 0,
          commentsCount: data.commentsCount || 0,
          createdAt: data.createdAt?.toDate() || null,
        });
      }

      setLiked(!likesSnapshot.empty);

      const commentList: Comment[] = commentsSnapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          authorId: data.authorId,
          authorDisplayName: data.authorDisplayName,
          authorUsername: data.authorUsername,
          content: data.content,
          createdAt: data.createdAt?.toDate() || null,
        };
      });
      setComments(commentList);
    } catch (err) {
      console.error("投稿詳細取得エラー:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, authLoading, router]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || posting) return;
    setPosting(true);

    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) return;
      const userData = userSnap.data();

      await addDoc(collection(db, "posts", id, "comments"), {
        authorId: user.uid,
        authorDisplayName: userData.displayName,
        authorUsername: userData.username,
        content: newComment.trim(),
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "posts", id), {
        commentsCount: increment(1),
      });

      setNewComment("");
      fetchData();
    } catch (err) {
      console.error("コメント投稿エラー:", err);
    } finally {
      setPosting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!user) return null;

  if (!post) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">投稿が見つかりません</p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/" className="mb-4 block text-sm text-gray-500 hover:text-gray-700">
        ← タイムラインに戻る
      </Link>

      <PostCard post={post} initialLiked={liked} />

      {/* コメント入力 */}
      <form onSubmit={handleComment} className="border-b border-gray-200 py-4">
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

      {/* コメント一覧 */}
      <div>
        {comments.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            まだコメントはありません
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-100 py-3">
              <div className="flex gap-3">
                <Link href={`/profile/${comment.authorId}`}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm text-gray-400">
                    👤
                  </div>
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${comment.authorId}`}
                      className="text-sm font-bold hover:underline"
                    >
                      {comment.authorDisplayName}
                    </Link>
                    <span className="text-xs text-gray-500">
                      @{comment.authorUsername}
                    </span>
                    <span className="text-xs text-gray-400">
                      ・{timeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
