"use client";

import Link from "next/link";
import UserAvatar from "@/features/common/components/UserAvatar";
import Loading from "@/features/common/components/Loading";

type UserListItem = {
  uid: string;
  displayName: string;
  username: string;
};

export default function UserList({
  users,
  loading,
  emptyMessage = "ユーザーがいません",
}: {
  users: UserListItem[];
  loading: boolean;
  emptyMessage?: string;
}) {
  if (loading) {
    return <Loading />;
  }

  if (users.length === 0) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {users.map((u) => (
        <Link
          key={u.uid}
          href={`/profile/${u.uid}`}
          className="flex items-center gap-3 border-b border-gray-100 py-3 transition-colors hover:bg-gray-50"
        >
          <UserAvatar userId={u.uid} size="md" />
          <div>
            <p className="font-bold">{u.displayName}</p>
            <p className="text-sm text-gray-500">@{u.username}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
