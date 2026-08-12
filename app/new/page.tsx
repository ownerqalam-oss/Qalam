import Link from "next/link";

const writingTypes = [
  { value: "article", label: "Article" },
  { value: "reflection", label: "Reflection" },
  { value: "poetry", label: "Poetry" },
  { value: "story", label: "Short Story" },
];

export default function NewPage() {
  return <main className="mx-auto flex max-w-2xl flex-col px-5 py-14 sm:px-6 sm:py-20"><h1 className="mb-10 text-center text-4xl font-bold">What are you writing?</h1><div className="space-y-4">{writingTypes.map(({ value, label }) => <Link key={value} href={`/editor?type=${value}`} className="block rounded-xl border p-6 text-xl transition hover:bg-gray-50">{label}</Link>)}</div></main>;
}
