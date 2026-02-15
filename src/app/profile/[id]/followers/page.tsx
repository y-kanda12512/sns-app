"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import type { UserProfile } from "@/types/user";

export default function FollowersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    const fetchFollowers = async () => {
      try {
        const snapshot = await getDocs(
          query(collection(db, "follows"), where("followingId", "==", id))
        );
        const profiles = await Promise.all(
          snapshot.docs.map(async (d) => {
            const uid = d.data().followerId;
            const userSnap = await getDoc(doc(db, "users", uid));
            if (!userSnap.exists()) return null;
            const data = userSnap.data();
            return {
              uid,
              displayName: data.displayName,
              username: data.username,
              bio: data.bio,
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
            } as UserProfile;
          })
        );
        setUsers(profiles.filter((p): p is UserProfile => p !== null));
      } catch (err) {
        console.error("フォロワー取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFollowers();
  }, [id, user, authLoading, router]);

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
      <Link href={`/profile/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
        ← 戻る
      </Link>
      <h1 className="text-xl font-bold">フォロワー</h1>
      {users.length === 0 ? (
        <p className="py-8 text-center text-gray-500">フォロワーはいません</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Link
              key={u.uid}
              href={`/profile/${u.uid}`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-lg text-gray-400">
                👤
              </div>
              <div>
                <p className="font-bold">{u.displayName}</p>
                <p className="text-sm text-gray-500">@{u.username}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
