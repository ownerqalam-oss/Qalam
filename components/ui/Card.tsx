import { AnchorHTMLAttributes, HTMLAttributes } from "react";
import Link from "next/link";

const BASE_CLASSES =
  "rounded-xl border border-border bg-cream-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`${BASE_CLASSES} ${className ?? ""}`} {...props} />;
}

interface CardLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export function CardLink({ className, href, ...props }: CardLinkProps) {
  return (
    <Link href={href} className={`group block ${BASE_CLASSES} ${className ?? ""}`} {...props} />
  );
}
