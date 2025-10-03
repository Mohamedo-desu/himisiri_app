import { HATE_WORDS } from "@/constants/moderation";

export const moderateContent = (text: string | undefined) => {
  try {
    if (!text) return null;

    let moderated: string = text;

    // List of common hate and swear words

    const hatePattern = new RegExp(
      "\\b(" + HATE_WORDS.join("|") + ")\\b",
      "gi"
    );

    moderated = moderated.replace(hatePattern, "***");

    return moderated;
  } catch (error) {
    console.error("Error moderating content", error);
    return text; // Return original text in case of error
  }
};
