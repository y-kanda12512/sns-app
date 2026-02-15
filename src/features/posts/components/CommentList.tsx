"use client";

import Link from "next/link";
import UserAvatar from "@/features/common/components/UserAvatar";
import { timeAgo } from "@/features/posts/lib/timeAgo";
import type { Comment } from "@/features/posts/types/comment";

export default function CommentList({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        まだコメントはありません
      </p>
    );
  }

  return (
    <div>
      {comments.map((comment) => (
        <div key={comment.id} className="border-b border-gray-100 py-3">
          <div className="flex gap-3">
            <UserAvatar userId={comment.authorId} size="sm" />
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
      ))}
    </div>
  );
}
