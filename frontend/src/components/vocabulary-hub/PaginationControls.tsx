import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PaginationMeta } from './types';

const LIMIT_OPTIONS = [16, 32, 48, 64];
const VISIBLE_PAGE_OPTIONS = [5, 10, 15, 20];

interface PaginationControlsProps {
  pagination?: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

type PageToken = number | 'left-ellipsis' | 'right-ellipsis';

const clampPage = (page: number, totalPages: number) => Math.min(Math.max(page, 1), totalPages);

function buildPageTokens(currentPage: number, totalPages: number, visibleCount: number): PageToken[] {
  if (totalPages <= visibleCount) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const middleSlots = Math.max(visibleCount - 2, 3);
  const half = Math.floor(middleSlots / 2);
  let start = currentPage - half;
  let end = currentPage + half;

  if (middleSlots % 2 === 0) start += 1;
  if (start < 2) {
    start = 2;
    end = start + middleSlots - 1;
  }
  if (end > totalPages - 1) {
    end = totalPages - 1;
    start = end - middleSlots + 1;
  }

  const tokens: PageToken[] = [1];
  if (start > 2) tokens.push('left-ellipsis');

  for (let page = start; page <= end; page += 1) {
    tokens.push(page);
  }

  if (end < totalPages - 1) tokens.push('right-ellipsis');
  tokens.push(totalPages);

  return tokens;
}

export function PaginationControls({ pagination, onPageChange, onLimitChange }: PaginationControlsProps) {
  const [visibleCount, setVisibleCount] = useState(7);

  const tokens = useMemo(() => {
    if (!pagination) return [];
    return buildPageTokens(pagination.page, pagination.totalPages, visibleCount);
  }, [pagination, visibleCount]);

  if (!pagination) return null;

  const goToPage = (page: number) => onPageChange(clampPage(page, pagination.totalPages));

  return (
    <div className="flex flex-col gap-4 border-t border-slate-200 pt-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-sm font-medium text-slate-500">
          Trang <span className="font-semibold text-slate-900">{pagination.page}</span> / {pagination.totalPages}
          <span className="ml-2 text-slate-400">({pagination.total} thẻ)</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={pagination.limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500"
          >
            {LIMIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} thẻ/trang
              </option>
            ))}
          </select>

          <select
            value={visibleCount}
            onChange={(event) => setVisibleCount(Number(event.target.value))}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500"
          >
            {VISIBLE_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                hiện {option} số
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" disabled={!pagination.hasPrev} onClick={() => goToPage(pagination.page - 1)}>
          Trước
        </Button>

        {tokens.map((token) => {
          if (typeof token !== 'number') {
            return (
              <span key={token} className="px-2 text-sm font-semibold text-slate-400">
                ...
              </span>
            );
          }

          const active = token === pagination.page;
          return (
            <button
              key={token}
              type="button"
              onClick={() => goToPage(token)}
              className={cn(
                'h-9 min-w-9 rounded-lg border px-3 text-sm font-semibold transition',
                active
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800',
              )}
              aria-current={active ? 'page' : undefined}
            >
              {token}
            </button>
          );
        })}

        <Button variant="outline" disabled={!pagination.hasNext} onClick={() => goToPage(pagination.page + 1)}>
          Sau
        </Button>
      </div>
    </div>
  );
}
