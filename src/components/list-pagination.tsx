import Link from "next/link";
import { Button } from "@/components/ui/button";

type ListPaginationProps = {
  page: number;
  totalPages: number;
  prevHref?: string;
  nextHref?: string;
};

export function ListPagination({ page, totalPages, prevHref, nextHref }: ListPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <p className="text-muted-foreground">
        Halaman {page} dari {totalPages}
      </p>
      <div className="flex gap-2">
        {prevHref ? (
          <Button asChild size="sm" variant="outline">
            <Link href={prevHref}>Sebelumnya</Link>
          </Button>
        ) : null}
        {nextHref ? (
          <Button asChild size="sm" variant="outline">
            <Link href={nextHref}>Berikutnya</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}