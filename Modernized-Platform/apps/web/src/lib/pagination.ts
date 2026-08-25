export type PageToken = number | 'ellipsis';

/** Sliding window of page numbers with ellipses, always including first/last. */
export function pageWindow(current: number, lastPage: number, siblings = 1): PageToken[] {
  const last = Math.max(1, Math.floor(lastPage) || 1);
  const page = Math.min(last, Math.max(1, Math.floor(current) || 1));
  const span = Math.max(0, siblings);
  const start = Math.max(2, page - span);
  const end = Math.min(last - 1, page + span);
  const tokens: PageToken[] = [1];
  if (start > 2) tokens.push('ellipsis');
  for (let n = start; n <= end; n += 1) tokens.push(n);
  if (end < last - 1) tokens.push('ellipsis');
  if (last > 1) tokens.push(last);
  return tokens;
}

export function lastPage(total: number, perPage: number): number {
  const size = Math.max(1, perPage);
  return Math.max(1, Math.ceil(Math.max(0, total) / size));
}

export function pageRangeLabel(page: number, perPage: number, total: number): string {
  if (total <= 0) return '0 profiles';
  const start = (page - 1) * perPage + 1;
  const end = Math.min(total, page * perPage);
  return `Showing ${start}–${end} of ${total}`;
}

export function paginationHtml(opts: {
  page: number;
  lastPage: number;
  total: number;
  perPage: number;
}): string {
  const last = lastPage(opts.total, opts.perPage);
  const page = Math.min(last, Math.max(1, opts.page));
  if (opts.total <= 0 || last <= 1) {
    return `<p class="text-xs text-navy-500">${pageRangeLabel(page, opts.perPage, opts.total)}</p>`;
  }

  const prevDisabled = page <= 1;
  const nextDisabled = page >= last;
  const buttons = pageWindow(page, last, 1)
    .map((token) => {
      if (token === 'ellipsis') {
        return `<span class="px-2 text-xs font-bold text-navy-400" aria-hidden="true">…</span>`;
      }
      const active = token === page;
      return `<button type="button" data-page="${token}" aria-label="Page ${token}" aria-current="${active ? 'page' : 'false'}" class="min-w-9 h-9 px-3 rounded-full text-xs font-bold transition-all ${
        active
          ? 'bg-gradient-to-r from-brand-500 via-brand-600 to-pink-600 text-white shadow-lg shadow-brand-500/30'
          : 'bg-white border border-navy-200 text-navy-700 hover:bg-navy-50'
      }">${token}</button>`;
    })
    .join('');

  return `
    <div class="flex flex-col items-center gap-3">
      <p class="text-xs text-navy-500">${pageRangeLabel(page, opts.perPage, opts.total)}</p>
      <nav class="flex flex-wrap items-center justify-center gap-1.5" aria-label="Discover pagination">
        <button type="button" data-page="${page - 1}" ${prevDisabled ? 'disabled' : ''} class="h-9 px-3 rounded-full text-xs font-bold bg-white border border-navy-200 text-navy-700 hover:bg-navy-50 disabled:opacity-40 disabled:cursor-not-allowed">Prev</button>
        ${buttons}
        <button type="button" data-page="${page + 1}" ${nextDisabled ? 'disabled' : ''} class="h-9 px-3 rounded-full text-xs font-bold bg-white border border-navy-200 text-navy-700 hover:bg-navy-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
      </nav>
    </div>`;
}
