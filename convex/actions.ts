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

      return result;
    } catch (err) {
      console.error("Error calling external API:", err);
      throw err;
    }
  },
});

type ExpoPushTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
};

export const sendToAllUsers = internalAction({
  args: {
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    tokens: v.array(v.any()), // ✅ Strongly typed tokens
  },
  handler: async (_ctx, { title, body, data, tokens }) => {
    const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    if (!tokens.length) {
      console.log("⚠️ No push tokens found. Exiting.");
      return { success: true, sent: 0 };
    }

    // ✅ Filter valid Expo push tokens
    const validTokens = tokens
      .map((t) => t.pushToken)
      .filter(
        (token) =>
          typeof token === "string" &&
          (token.startsWith("ExponentPushToken[") ||
            token.startsWith("ExpoPushToken["))
      );

    if (validTokens.length === 0) {
      console.log("⚠️ No valid Expo push tokens found. Exiting.");
      return { success: true, sent: 0 };
    }

    // ✅ Create Expo push messages
    const messages = validTokens.map((token) => ({
      to: token,
      sound: "update.wav",
      title,
      body,
      data: data || {},
      priority: "high",
      channelId: "app-updates",
    }));

    const batchSize = 100;
    let totalSent = 0;
    const errors: string[] = [];

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);

      try {
        const response = await fetch(EXPO_PUSH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch),
        });

        const result = await response.json();

        if (Array.isArray(result.data)) {
          const tickets = result.data as ExpoPushTicket[];

          const okCount = tickets.filter((r) => r.status === "ok").length;
          totalSent += okCount;

          const failed = tickets.filter((r) => r.status !== "ok");
          if (failed.length) {
            errors.push(
              ...failed.map(
                (f) => f.message || f.details?.error || "Unknown push error"
              )
            );
          }
        } else {
          console.warn("⚠️ Unexpected Expo response:", result);
        }

        // Small delay to avoid rate limits
        await new Promise((res) => setTimeout(res, 100));
      } catch (err: any) {
        console.error("❌ Error sending push batch:", err);
        errors.push(err.message);
      }
    }

    console.log(
      `✅ Push broadcast complete. Sent: ${totalSent}/${validTokens.length}, Errors: ${errors.length}`
    );

    return {
      success: true,
      sent: totalSent,
      total: validTokens.length,
      errors,
    };
  },
});
