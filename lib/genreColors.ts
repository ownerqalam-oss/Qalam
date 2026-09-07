export const GENRE_COLORS: Record<
  string,
  { badgeText: string; badgeBg: string; cardBorder: string; dot: string }
> = {
  article: {
    badgeText: "text-brand-800",
    badgeBg: "bg-brand-100",
    cardBorder: "border-t-brand-900",
    dot: "bg-brand-900",
  },
  poetry: {
    badgeText: "text-[#8A6A1E]",
    badgeBg: "bg-gold-100",
    cardBorder: "border-t-gold-600",
    dot: "bg-gold-600",
  },
  story: {
    badgeText: "text-[#9A4A1F]",
    badgeBg: "bg-[#F3DDC9]",
    cardBorder: "border-t-rust-600",
    dot: "bg-rust-600",
  },
  reflection: {
    badgeText: "text-[#7A4B6B]",
    badgeBg: "bg-[#EDE0E8]",
    cardBorder: "border-t-mauve-600",
    dot: "bg-mauve-600",
  },
};

export function getGenreColor(type: string) {
  return GENRE_COLORS[type] ?? GENRE_COLORS.article;
}
