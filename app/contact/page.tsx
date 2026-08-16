import { Poppins, Inter } from "next/font/google";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#F7F1E8] text-[#46382F]">
      <section className="mx-auto max-w-3xl px-6 py-20 md:px-8">

        <p
          className={`${inter.className} text-[11px] font-medium uppercase tracking-[0.3em] text-[#42614A]`}
        >
          GET IN TOUCH
        </p>

        <h1
          className={`${poppins.className} mt-4 text-5xl font-medium text-[#053400]`}
        >
          Contact
        </h1>

        <p
          className={`${inter.className} mt-6 max-w-2xl text-[17px] leading-8 text-[#70655C]`}
        >
          Have a question, a piece of feedback, or want to get involved with
          Qalam? Reach out at{" "}
          <a
            href="mailto:owner.qalam@gmail.com"
            className="text-[#053400] hover:underline"
          >
            owner.qalam@gmail.com
          </a>
          .
        </p>

      </section>
    </main>
  );
}
