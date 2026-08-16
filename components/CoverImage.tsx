import { getGenreColor } from "../lib/genreColors";
import InkFlourish from "./InkFlourish";

interface CoverImageProps {
  src?: string | null;
  type: string;
  alt: string;
  className?: string;
}

export default function CoverImage({
  src,
  type,
  alt,
  className = "",
}: CoverImageProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={`object-cover ${className}`} />
    );
  }

  const genreColor = getGenreColor(type);

  return (
    <div
      className={`flex items-center justify-center ${genreColor.badgeBg} ${className}`}
    >
      <InkFlourish className="w-2/3 opacity-40" />
    </div>
  );
}
