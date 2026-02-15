"use client";

import ProfileCard from "@/features/profile/components/ProfileCard";

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ProfileCard userId={id} />;
}
