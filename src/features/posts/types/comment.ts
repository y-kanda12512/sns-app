export type Comment = {
  id: string;
  authorId: string;
  authorDisplayName: string;
  authorUsername: string;
  content: string;
  createdAt: Date | null;
};
