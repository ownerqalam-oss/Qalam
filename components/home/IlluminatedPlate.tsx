"use client";

import { useEffect, useRef } from "react";
import { drawPlate } from "./ornaments";

// The Al-Qalam verse in its illuminated frame. Drawn in the browser so it stays sharp at any size.
export default function IlluminatedPlate({
  id,
  uid,
  className,
  decorative = false,
}: {
  id?: string;
  uid: string;
  className?: string;
  decorative?: boolean;
}) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (ref.current) drawPlate(ref.current, uid);
  }, [uid]);

  return (
    <svg
      ref={ref}
      id={id}
      viewBox="0 0 520 660"
      className={className}
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": "Surah Al-Qalam, verses 1 and 2, in an illuminated frame" })}
    />
  );
}
