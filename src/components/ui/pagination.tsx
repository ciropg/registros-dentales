import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  currentCount: number;
  itemLabel: string;
  prevHref?: string;
  nextHref?: string;
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
}: PaginationProps) {
  const start = totalCount ? (currentPage - 1) * pageSize + 1 : 0;
  const end = totalCount ? start + currentCount - 1 : 0;

  return (
    <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-line bg-white/70 px-4 py-4 text-sm text-muted md:flex-row md:items-center md:justify-between">
      <p>
        Mostrando {start}-{end} de {totalCount} {itemLabel}. Pagina {currentPage} de {totalPages}.
      </p>
      <div className="flex flex-wrap gap-2">
        {prevHref ? (
          <Link href={prevHref} className={buttonStyles({ variant: "secondary", size: "sm" })}>
            Anterior
          </Link>
        ) : (
          <span className={buttonStyles({ variant: "secondary", size: "sm", className: "pointer-events-none opacity-60" })}>
            Anterior
          </span>
        )}
        {nextHref ? (
          <Link href={nextHref} className={buttonStyles({ variant: "secondary", size: "sm" })}>
            Siguiente
          </Link>
        ) : (
          <span className={buttonStyles({ variant: "secondary", size: "sm", className: "pointer-events-none opacity-60" })}>
            Siguiente
          </span>
        )}
      </div>
    </div>
  );
}
