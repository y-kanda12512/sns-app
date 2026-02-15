"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import type { UserProfile } from "@/types/user";

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [toggling, setToggling] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    if (user.uid === id) {
      router.push("/profile");
      return;
    }

    const fetchData = async () => {
      try {
        const [profileSnap, followingSnap, followersSnap, followingCountSnap] =
          await Promise.all([
            getDoc(doc(db, "users", id)),
            getDocs(
              query(
                collection(db, "follows"),
                where("followerId", "==", user.uid),
                where("followingId", "==", id)
              )
            ),
            getDocs(
              query(
                collection(db, "follows"),
                where("followingId", "==", id)
              )
            ),
            getDocs(
              query(
                collection(db, "follows"),
                where("followerId", "==", id)
              )
            ),
          ]);

        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setProfile({
            uid: id,
            displayName: data.displayName,
            username: data.username,
            bio: data.bio,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          });
        }

        setIsFollowing(!followingSnap.empty);
        setFollowersCount(followersSnap.size);
        setFollowingCount(followingCountSnap.size);
      } catch (err) {
        console.error("データ取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user, authLoading, router]);

  const handleToggleFollow = async () => {
    if (!user || toggling) return;
    setToggling(true);

    try {
      const followQuery = query(
        collection(db, "follows"),
        where("followerId", "==", user.uid),
        where("followingId", "==", id)
      );
      const snapshot = await getDocs(followQuery);

      if (snapshot.empty) {
        await addDoc(collection(db, "follows"), {
          followerId: user.uid,
          followingId: id,
        });
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      } else {
        await deleteDoc(snapshot.docs[0].ref);
        setIsFollowing(false);
        setFollowersCount((prev) => prev - 1);
      }
    } catch (err) {
      console.error("フォローエラー:", err);
    } finally {
      setToggling(false);
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

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">ユーザーが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
        ← 戻る
      </Link>

      <div className="flex items-start gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-3xl text-gray-400">
          👤
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{profile.displayName}</h1>
          <p className="text-sm text-gray-500">@{profile.username}</p>
        </div>
      </div>

      {profile.bio && (
        <p className="whitespace-pre-wrap text-gray-700">{profile.bio}</p>
      )}

      <div className="flex gap-4 text-sm">
        <Link
          href={`/profile/${id}/following`}
          className="hover:underline"
        >
          <span className="font-bold">{followingCount}</span>
          <span className="ml-1 text-gray-500">フォロー中</span>
        </Link>
        <Link
          href={`/profile/${id}/followers`}
          className="hover:underline"
        >
          <span className="font-bold">{followersCount}</span>
          <span className="ml-1 text-gray-500">フォロワー</span>
        </Link>
      </div>

      <button
        onClick={handleToggleFollow}
        disabled={toggling}
        className={`w-full rounded-lg py-2 font-medium transition-colors ${
          isFollowing
            ? "border border-gray-300 text-gray-700 hover:border-red-300 hover:text-red-500"
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
      >
        {isFollowing ? "フォロー中" : "フォローする"}
      </button>
    </div>
  );
}
