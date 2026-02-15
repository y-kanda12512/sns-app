"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import type { UserProfile } from "@/types/user";

export default function MyProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    const fetchData = async () => {
      try {
        const [profileSnap, followersSnap, followingSnap] = await Promise.all([
          getDoc(doc(db, "users", user.uid)),
          getDocs(
            query(collection(db, "follows"), where("followingId", "==", user.uid))
          ),
          getDocs(
            query(collection(db, "follows"), where("followerId", "==", user.uid))
          ),
        ]);

        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setProfile({
            uid: user.uid,
            displayName: data.displayName,
            username: data.username,
            bio: data.bio,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          });
        }

        setFollowersCount(followersSnap.size);
        setFollowingCount(followingSnap.size);
      } catch (err) {
        console.error("プロフィール取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, authLoading, router]);

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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-gray-500">プロフィールが未設定です</p>
        <Link
          href="/profile/edit"
          className="rounded-lg bg-blue-500 px-6 py-2 font-medium text-white hover:bg-blue-600"
        >
          プロフィールを設定する
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          href={`/profile/${user.uid}/following`}
          className="hover:underline"
        >
          <span className="font-bold">{followingCount}</span>
          <span className="ml-1 text-gray-500">フォロー中</span>
        </Link>
        <Link
          href={`/profile/${user.uid}/followers`}
          className="hover:underline"
        >
          <span className="font-bold">{followersCount}</span>
          <span className="ml-1 text-gray-500">フォロワー</span>
        </Link>
      </div>

      <Link
        href="/profile/edit"
        className="block w-full rounded-lg border border-blue-500 py-2 text-center font-medium text-blue-500 transition-colors hover:bg-blue-50"
      >
        プロフィールを編集
      </Link>
    </div>
  );
}
