interface InkFlourishProps {
  className?: string;
  animate?: boolean;
}

export default function InkFlourish({
  className = "w-[160px]",
  animate = false,
}: InkFlourishProps) {
  return (
    <svg
      viewBox="0 0 300 40"
      className={`text-[#B8860B] ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10,20 C70,4 110,36 160,16 C210,-2 250,22 290,12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength={animate ? 1 : undefined}
        className={animate ? "animate-draw-line" : undefined}
      />
      <circle
        cx="290"
        cy="12"
        r="4"
        fill="currentColor"
        className={animate ? "animate-ink-drop" : undefined}
      />
    </svg>
  );
}
