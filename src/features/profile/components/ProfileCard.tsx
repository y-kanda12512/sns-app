"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/features/common/components/UserAvatar";
import Loading from "@/features/common/components/Loading";
import Link from "next/link";
import type { UserProfile } from "@/types/user";

export default function ProfileCard({ userId }: { userId?: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isMyProfile = !userId || userId === user?.uid;
  const targetId = userId || user?.uid;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user || !targetId) return;

    if (userId && userId === user.uid) {
      router.push("/profile");
      return;
    }

    const fetchProfile = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", targetId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            uid: targetId,
            displayName: data.displayName,
            username: data.username,
            bio: data.bio,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          });
        }
      } catch (err) {
        console.error("プロフィール取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [targetId, userId, user, authLoading, router]);

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user) return null;

  if (!profile) {
    if (isMyProfile) {
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">ユーザーが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isMyProfile && (
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← 戻る
        </Link>
      )}

      <div className="flex items-start gap-4">
        <UserAvatar userId={profile.uid} size="lg" />
        <div className="flex-1">
          <h1 className="text-xl font-bold">{profile.displayName}</h1>
          <p className="text-sm text-gray-500">@{profile.username}</p>
        </div>
      </div>

      {profile.bio && (
        <p className="whitespace-pre-wrap text-gray-700">{profile.bio}</p>
      )}

      {isMyProfile && (
        <Link
          href="/profile/edit"
          className="block w-full rounded-lg border border-blue-500 py-2 text-center font-medium text-blue-500 transition-colors hover:bg-blue-50"
        >
          プロフィールを編集
        </Link>
      )}
    </div>
  );
}
