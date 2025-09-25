import { Id } from "@/convex/_generated/dataModel";
import { POST_TABLE, USER_TABLE } from "@/convex/schema";

// Type for enriched post data from getPaginatedPosts
export type EnrichedPost = POST_TABLE & {
  author: USER_TABLE | null;
  hasLiked: boolean;
};
export type CommentCardProps = {
  comment: {
    _id: Id<"comments">;
    _creationTime: number;
    content: string;
    likesCount: number;
    hasLiked: boolean;
    editedAt?: number;
    author?: USER_TABLE | null;
  };
  postId?: Id<"posts">;
  onPress?: () => void;
  isHighlighted?: boolean;
};
