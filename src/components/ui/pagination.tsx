import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { getMessages } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/config";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  currentCount: number;
  itemLabel: string;
  prevHref?: string;
  nextHref?: string;
  locale?: Locale;
};

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  currentCount,
  itemLabel,
  prevHref,
  nextHref,
  locale = "es",
}: PaginationProps) {
  const copy = getMessages(locale);
  const start = totalCount ? (currentPage - 1) * pageSize + 1 : 0;
  const end = totalCount ? start + currentCount - 1 : 0;

  return (
    <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-line bg-white/70 px-4 py-4 text-sm text-muted md:flex-row md:items-center md:justify-between">
      <p>{copy.pagination.summary({ start, end, totalCount, itemLabel, currentPage, totalPages })}</p>
      <div className="flex flex-wrap gap-2">
        {prevHref ? (
          <Link href={prevHref} className={buttonStyles({ variant: "secondary", size: "sm" })}>
            {copy.pagination.previous}
          </Link>
        ) : (
          <span className={buttonStyles({ variant: "secondary", size: "sm", className: "pointer-events-none opacity-60" })}>
            {copy.pagination.previous}
          </span>
        )}
        {nextHref ? (
          <Link href={nextHref} className={buttonStyles({ variant: "secondary", size: "sm" })}>
            {copy.pagination.next}
          </Link>
        ) : (
          <span className={buttonStyles({ variant: "secondary", size: "sm", className: "pointer-events-none opacity-60" })}>
            {copy.pagination.next}
          </span>
        )}
      </div>
    </div>
  );
}
