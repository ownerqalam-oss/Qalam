export const ADMIN_EMAILS = ["owner.qalam@gmail.com"];

export function isAdminEmail(email: string | null | undefined) {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
