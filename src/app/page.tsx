"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import PostForm from "@/components/PostForm";
import PostCard from "@/components/PostCard";
import type { Post } from "@/types/post";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    try {
      const [postsSnapshot, likesSnapshot] = await Promise.all([
        getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"))),
        getDocs(
          query(
            collection(db, "postLikes"),
            where("userId", "==", user.uid)
          )
        ),
      ]);

      const likedIds = new Set<string>();
      likesSnapshot.forEach((doc) => {
        likedIds.add(doc.data().postId);
      });
      setLikedPostIds(likedIds);

      const postList: Post[] = postsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          authorId: data.authorId,
          authorDisplayName: data.authorDisplayName,
          authorUsername: data.authorUsername,
          content: data.content,
          likesCount: data.likesCount || 0,
          commentsCount: data.commentsCount || 0,
          createdAt: data.createdAt?.toDate() || null,
        };
      });
      setPosts(postList);
    } catch (err) {
      console.error("投稿取得エラー:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;
    fetchPosts();
  }, [user, authLoading, router, fetchPosts]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-4">
      <PostForm onPosted={fetchPosts} />

      {posts.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <p className="text-gray-500">まだ投稿がありません</p>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDeleted={fetchPosts}
              initialLiked={likedPostIds.has(post.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
