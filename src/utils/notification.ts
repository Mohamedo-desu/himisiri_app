import { isSameDay, subDays } from "date-fns";

export type NotificationSection<T> = {
  title: string;
  data: T[];
};

/**
 * Groups notifications into Today, Yesterday, and Earlier using date-fns.
 * Requires each item to have an `_creationTime` number (Convex document field).
 */
export const groupNotifications = <T extends { _creationTime: number }>(
  notifications: T[]
): NotificationSection<T>[] => {
  const sorted = [...notifications].sort(
    (a, b) => b._creationTime - a._creationTime
  );

  const today: T[] = [];
  const yesterday: T[] = [];
  const earlier: T[] = [];

  const now = new Date();
  const yesterdayDate = subDays(now, 1);

  for (const n of sorted) {
    const createdAt = new Date(n._creationTime);
    if (isSameDay(createdAt, now)) {
      today.push(n);
    } else if (isSameDay(createdAt, yesterdayDate)) {
      yesterday.push(n);
    } else {
      earlier.push(n);
    }
  }

  return [
    { title: "Today", data: today },
    { title: "Yesterday", data: yesterday },
    { title: "Earlier", data: earlier },
  ];
};
