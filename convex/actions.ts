import { v } from "convex/values";
import { internalAction } from "./_generated/server";

export const deleteExternalPushTokens = internalAction({
  args: { userId: v.id("users") },
  handler: async (_, { userId }) => {
    try {
      const res = await fetch(
        "https://himisiri-app.onrender.com/api/push-tokens/delete",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`External API delete failed: ${text}`);
      }

      const result = await res.json();
      console.log("External API deleted push tokens:", result);
      return result;
    } catch (err) {
      console.error("Error calling external API:", err);
      throw err;
    }
  },
});
