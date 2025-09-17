import { avataaars } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { httpRouter } from "convex/server";
import { Webhook } from "svix";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Webhook handler for Clerk events:
// - user.created: Creates a new user in the database
// - user.deleted: Deletes the user's data from the database
http.route({
  path: "/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error(
        "Missing webhook secret. Please set CLERK_WEBHOOK_SECRET in your .env.local file."
      );
    }

    //   CHECK HEADERS
    const svix_id = request.headers.get("svix-id");
    const svix_signature = request.headers.get("svix-signature");
    const svix_timestamp = request.headers.get("svix-timestamp");

    if (!svix_id || !svix_signature || !svix_timestamp) {
      return new Response("Missing svix headers", {
        status: 400,
      });
    }

    const payload = await request.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(webhookSecret);

    let evt: any;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as any;
    } catch (error) {
      console.error("Error verifying webhook", error);
      return new Response("Error occurred", {
        status: 400,
      });
    }

    const eventType = evt.type;

    if (eventType === "user.created") {
      const { id, email_addresses, image_url } = evt.data;

      const email = email_addresses[0].email_address;
      const imageUrl = image_url;
      const userName = email.split("@")[0];

      try {
        const avatar = createAvatar(avataaars, {
          seed: userName,
        });
        const svg = avatar.toString();

        await ctx.runMutation(internal.users.createUser, {
          emailAddress: email,
          clerkId: id,
          userName,
          imageUrl: svg || imageUrl,
          emailVerified: true,
          followers: 0,
          following: 0,
          postsPublished: 0,
          bio: "Hey there! I'm using Himisiri.",
          age: 18,
          gender: "other",
        });
      } catch (error) {
        console.log("Error creating user", error);
        return new Response("Error occurred", {
          status: 500,
        });
      }
    } else if (eventType === "user.deleted") {
      const { id } = evt.data;
      await ctx.runMutation(internal.users.deleteAccountByClerkId, {
        clerkId: id,
      });
    }

    return new Response("Webhook processed successfully", { status: 200 });
  }),
});

export default http;
