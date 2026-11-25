"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

export function PaginatedTableBody({ rows }: { rows: ReactNode[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <tbody>{visibleRows}</tbody>
      {rows.length > 0 && (
        <tfoot>
          <tr>
            <td colSpan={20} className="border-t border-[#eeeee9] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[#8a928a]">
                  Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, rows.length)} de {rows.length} registros
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    disabled={currentPage === 1}
                    aria-label="Página anterior"
                    className="inline-flex items-center gap-1 rounded-lg border border-[#dedfd7] px-3 py-2 text-xs font-medium text-[#536057] transition hover:bg-[#f7f7f3] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={14} /> Anterior
                  </button>
                  <span className="min-w-16 text-center text-xs text-[#69736b]">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Próxima página"
                    className="inline-flex items-center gap-1 rounded-lg border border-[#dedfd7] px-3 py-2 text-xs font-medium text-[#536057] transition hover:bg-[#f7f7f3] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Próxima <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tfoot>
      )}
    </>
  );
}
