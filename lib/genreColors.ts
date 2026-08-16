export const GENRE_COLORS: Record<
  string,
  { badgeText: string; badgeBg: string; cardBorder: string; dot: string }
> = {
  article: {
    badgeText: "text-[#2E5138]",
    badgeBg: "bg-[#E4EDE6]",
    cardBorder: "border-t-[#053400]",
    dot: "bg-[#053400]",
  },
  poetry: {
    badgeText: "text-[#8A6A1E]",
    badgeBg: "bg-[#F5E6C8]",
    cardBorder: "border-t-[#B8860B]",
    dot: "bg-[#B8860B]",
  },
  story: {
    badgeText: "text-[#9A4A1F]",
    badgeBg: "bg-[#F3DDC9]",
    cardBorder: "border-t-[#B5651D]",
    dot: "bg-[#B5651D]",
  },
  reflection: {
    badgeText: "text-[#7A4B6B]",
    badgeBg: "bg-[#EDE0E8]",
    cardBorder: "border-t-[#8B5A78]",
    dot: "bg-[#8B5A78]",
  },
};

export function getGenreColor(type: string) {
  return GENRE_COLORS[type] ?? GENRE_COLORS.article;
}
