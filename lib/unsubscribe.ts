import { createHmac, timingSafeEqual } from "crypto";

export function signUserId(userId: string): string {
  return createHmac("sha256", process.env.SUPABASE_WEBHOOK_SECRET!)
    .update(userId)
    .digest("hex");
}

export function isValidSignature(userId: string, signature: string): boolean {
  const expected = Buffer.from(signUserId(userId));
  const actual = Buffer.from(signature);

  if (expected.length !== actual.length) return false;

  return timingSafeEqual(expected, actual);
}

export function unsubscribeUrl(userId: string): string {
  return `https://qalam.ie/api/unsubscribe?uid=${userId}&sig=${signUserId(userId)}`;
}
