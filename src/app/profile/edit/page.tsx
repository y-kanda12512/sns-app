"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileEditPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDisplayName(data.displayName || "");
          setUsername(data.username || "");
          setBio(data.bio || "");
        }
      } catch (err) {
        console.error("プロフィール取得エラー:", err);
        setError("プロフィールの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");

    if (!displayName.trim()) {
      setError("表示名を入力してください");
      return;
    }
    if (!username.trim()) {
      setError("ユーザー名を入力してください");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("ユーザー名は半角英数字とアンダースコアのみ使用できます");
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      await setDoc(docRef, {
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        updatedAt: serverTimestamp(),
        ...(!docSnap.exists() && { createdAt: serverTimestamp() }),
      });

      router.push("/profile");
    } catch {
      setError("プロフィールの保存に失敗しました");
    } finally {
      setSaving(false);
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

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">プロフィール編集</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
            表示名 <span className="text-red-500">*</span>
          </label>
          <input
            id="displayName"
            type="text"
            required
            maxLength={30}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="表示される名前"
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            ユーザー名 <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-2 text-gray-400">@</span>
            <input
              id="username"
              type="text"
              required
              maxLength={20}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="username"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            半角英数字とアンダースコアのみ
          </p>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
            自己紹介
          </label>
          <textarea
            id="bio"
            rows={3}
            maxLength={160}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="自己紹介を入力してください"
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {bio.length}/160
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-blue-500 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存する"}
        </button>
      </form>
    </div>
  );
}
