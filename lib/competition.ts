// Entries are ordinary poetry drafts carrying this tag, so the
// competition needs no schema of its own.
export const COMPETITION = {
  slug: "change-within",
  tag: "Change Within",
  title: "Change Within",
  prompt: "Write a poem about change: in yourself, your community, or the world.",
  path: "/week-for-change",
};

export const COMPETITION_EDITOR_URL = `/editor?type=poetry&competition=${COMPETITION.slug}`;

export function isCompetitionEntry(tags: string) {
  return tags
    .split(",")
    .some((tag) => tag.trim().toLowerCase() === COMPETITION.tag.toLowerCase());
}
