import { POST_TABLE, USER_TABLE } from "@/convex/schema";

// Type for enriched post data from getPaginatedPosts
export type EnrichedPost = POST_TABLE & {
  author: USER_TABLE | null;
  hasLiked: boolean;
};
