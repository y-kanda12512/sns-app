"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    // 自分のプロフィールなら /profile へリダイレクト
    if (user.uid === id) {
      router.push("/profile");
      return;
    }

    const fetchProfile = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", id));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            uid: id,
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
  }, [id, user, authLoading, router]);

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
    </div>
  );
}
