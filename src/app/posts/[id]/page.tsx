"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import PostCard from "@/features/posts/components/PostCard";
import CommentForm from "@/features/posts/components/CommentForm";
import CommentList from "@/features/posts/components/CommentList";
import Loading from "@/features/common/components/Loading";
import type { Post } from "@/types/post";
import type { Comment } from "@/features/posts/types/comment";

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
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
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
  }, [id, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;
    fetchData();
  }, [user, authLoading, router, fetchData]);

  if (authLoading || loading) {
    return <Loading />;
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
      <CommentForm postId={id} onCommented={fetchData} />
      <CommentList comments={comments} />
    </div>
  );
}
