import { adventurer } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { faker } from "@faker-js/faker";
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
      const { id, email_addresses } = evt.data;
      const email = email_addresses[0].email_address;

      try {
        // 1. Get current user count
        const countDoc = await ctx.runQuery(internal.users.getCount, {});
        const latestCount = countDoc?.count ?? 0;

        // 2. Increment user count
        await ctx.runMutation(internal.users.increment, {});

        // 3. Generate anonymous Reddit-style username
        const adjective = faker.word.adjective({ length: { min: 4, max: 8 } });
        const animal = faker.animal.type(); // e.g. "Tiger", "Otter"
        const userName = `${adjective}${animal}${latestCount + 1}`;

        // 4. Generate avatar
        const avatar = createAvatar(adventurer, {
          seed: userName,
          backgroundType: ["gradientLinear", "solid"],
          backgroundColor: ["4B50B2", "F38F2F", "1976D2"],
          radius: 50,
          scale: 120,
          translateY: 5,
        }).toString();

        // 5. Create the user
        await ctx.runMutation(internal.users.createUser, {
          emailAddress: email,
          clerkId: id,
          userName,
          imageUrl: avatar,
          postsPublished: 0,
        });
      } catch (error) {
        console.log("Error creating user", error);
        return new Response("Error occurred", {
          status: 500,
        });
      }
    } else if (eventType === "user.deleted") {
      const { id } = evt.data;
      await ctx.runMutation(internal.triggers.deleteUserCascade, {
        clerkId: id,
      });
    }

    return new Response("Webhook processed successfully", { status: 200 });
  }),
});

export default http;
