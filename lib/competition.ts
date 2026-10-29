// Entries are ordinary poetry drafts carrying this tag, so the
// competition needs no schema of its own.
export const COMPETITION = {
  slug: "change-within",
  tag: "Change Within",
  title: "Change Within",
  prompt: "Write a poem about change: in yourself, your community, or the world.",
  path: "/week-for-change",
  deadlineLabel: "12 November",
  // End of 12 November in Ireland (GMT in November). Must match the
  // cutoff in supabase/migrations/0013_competition_deadline.sql.
  closesAt: new Date("2026-11-13T00:00:00Z"),
};

export const COMPETITION_EDITOR_URL = `/editor?type=poetry&competition=${COMPETITION.slug}`;

export function isCompetitionClosed(now = new Date()) {
  return now >= COMPETITION.closesAt;
}

export function hasCompetitionTag(tags: string[] | null | undefined) {
  return (tags ?? []).some(
    (tag) => tag.trim().toLowerCase() === COMPETITION.tag.toLowerCase()
  );
}

export function isCompetitionEntry(tags: string) {
  return hasCompetitionTag(tags.split(","));
}
