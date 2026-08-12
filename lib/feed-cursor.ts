import "server-only";

import { z } from "zod";

const cursorSchema = z.object({ timestamp: z.iso.datetime(), id: z.uuid() });
export type FeedCursor = z.infer<typeof cursorSchema>;

export function encodeFeedCursor(cursor: FeedCursor) {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function parseFeedCursor(value: string | undefined) {
  if (!value) return null;
  try {
    return cursorSchema.parse(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));
  } catch {
    return null;
  }
}

export function cursorFilter(timestampColumn: string, idColumn: string, cursor: FeedCursor) {
  return `${timestampColumn}.lt."${cursor.timestamp}",and(${timestampColumn}.eq."${cursor.timestamp}",${idColumn}.lt.${cursor.id})`;
}
