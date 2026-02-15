import Link from "next/link";

type UserAvatarProps = {
  userId: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-lg",
  lg: "h-20 w-20 text-3xl",
};

export default function UserAvatar({ userId, size = "md" }: UserAvatarProps) {
  return (
    <Link href={`/profile/${userId}`}>
      <div
        className={`flex items-center justify-center rounded-full bg-gray-200 text-gray-400 ${sizeClasses[size]}`}
      >
        👤
      </div>
    </Link>
  );
}
