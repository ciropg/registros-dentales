"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "rounded-2xl px-4 py-3 text-sm font-semibold transition",
        active ? "bg-brand text-brand-ink" : "text-foreground hover:bg-white/70",
      )}
    >
      {label}
    </Link>
  );
}
