"use client";

import { useEffect, useState } from "react";
import { Amiri } from "next/font/google";
import { ayahs } from "../lib/ayahs";

const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic"],
});

function randomIndex(excluding?: number) {
  if (ayahs.length <= 1) return 0;

  let next = Math.floor(Math.random() * ayahs.length);

  while (next === excluding) {
    next = Math.floor(Math.random() * ayahs.length);
  }

  return next;
}

export default function AyahLoader() {
  // Starts on ayahs[0] so the server-rendered markup matches the
  // client's initial render exactly - picking randomly here would
  // mismatch between server and client and trigger a hydration error.
  // The random rotation kicks in client-side once mounted, below.
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const firstPick = setTimeout(() => {
      setVisible(false);

      setTimeout(() => {
        setIndex((current) => randomIndex(current));
        setVisible(true);
      }, 300);
    }, 0);

    const interval = setInterval(() => {
      setVisible(false);

      setTimeout(() => {
        setIndex((current) => randomIndex(current));
        setVisible(true);
      }, 300);
    }, 4000);

    return () => {
      clearTimeout(firstPick);
      clearInterval(interval);
    };
  }, []);

  const ayah = ayahs[index];

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <div
        className={`animate-verse transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <p
          dir="rtl"
          className={`${amiri.className} text-3xl leading-relaxed text-[#053400] md:text-4xl`}
        >
          {ayah.arabic}
        </p>

        <p className="mx-auto mt-5 max-w-md text-sm italic leading-6 text-[#70655C]">
          &ldquo;{ayah.english}&rdquo;
        </p>

        <p className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-[#9A9188]">
          {ayah.reference}
        </p>
      </div>
    </div>
  );
}
