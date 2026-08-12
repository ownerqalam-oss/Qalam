import { getAvatarUrl } from "../lib/profiles";

export function Avatar({ path, name, size = "md" }: { path: string | null; name: string; size?: "sm" | "md" | "lg" }) {
  const url = getAvatarUrl(path);
  const sizes = { sm: "h-10 w-10 text-sm", md: "h-20 w-20 text-2xl", lg: "h-32 w-32 text-4xl" };
  return (
    <div
      role={url ? "img" : undefined}
      aria-label={url ? `${name}'s avatar` : undefined}
      style={url ? { backgroundImage: `url("${url}")` } : undefined}
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#E7DED2] bg-cover bg-center font-semibold text-[#42614A] ${sizes[size]}`}
    >
      {!url && (name.trim()[0] ?? "Q").toUpperCase()}
    </div>
  );
}
