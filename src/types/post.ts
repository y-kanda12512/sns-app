export type Post = {
  id: string;
  authorId: string;
  authorDisplayName: string;
  authorUsername: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  createdAt: Date | null;
};
