import { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";
type Shape = "pill" | "block";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-brand-900 text-white hover:bg-brand-700 active:scale-95 shadow-sm",
  secondary:
    "border border-border text-brand-900 hover:bg-brand-50 active:scale-95",
  ghost: "text-brand-900 hover:text-brand-700",
};

// "pill" is the rounded-full CTA used for nav/marketing actions.
// "block" is the rounded-lg, larger full-width button used on forms
// (signup, login, complete-profile, forgot/reset password).
const SHAPE_CLASSES: Record<Shape, string> = {
  pill: "rounded-full px-6 py-2.5 text-[13px]",
  block: "rounded-lg px-6 py-3 text-sm",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 font-medium transition disabled:opacity-60 disabled:pointer-events-none";

function classes(variant: Variant, shape: Shape, className?: string) {
  return `${BASE_CLASSES} ${SHAPE_CLASSES[shape]} ${VARIANT_CLASSES[variant]} ${className ?? ""}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  shape?: Shape;
}

export function Button({
  variant = "primary",
  shape = "pill",
  className,
  ...props
}: ButtonProps) {
  return <button className={classes(variant, shape, className)} {...props} />;
}

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  shape?: Shape;
  href: string;
}

export function ButtonLink({
  variant = "primary",
  shape = "pill",
  className,
  href,
  ...props
}: ButtonLinkProps) {
  return (
    <Link href={href} className={classes(variant, shape, className)} {...props} />
  );
}
