import React from 'react';

export default function FootagePagination({ currentPage, pageCount, pendingPage, onPageChange, resultsRef }) {
    if (pageCount <= 1) return null;

    const center = Math.max(2, Math.min(currentPage, pageCount - 1));
    const pages = [...new Set([1, center - 1, center, center + 1, pageCount])]
        .filter((page) => page <= pageCount);
    const busy = pendingPage !== null;

    const selectPage = async (page) => {
        if (busy || page === currentPage) return;
        if (await onPageChange(page)) resultsRef.current?.scrollIntoView({ block: 'start' });
    };

    return (
        <nav className="footage-pagination" aria-label="Footage pages" aria-busy={busy}>
            <button type="button" className="pagination-btn" aria-label="Previous page" disabled={currentPage === 1}
                aria-disabled={busy || currentPage === 1} onClick={() => selectPage(currentPage - 1)}>
                <span aria-hidden="true">‹</span>
            </button>
            {pages.map((page, index) => (
                <React.Fragment key={page}>
                    {index > 0 && page - pages[index - 1] > 1 && <span aria-hidden="true">…</span>}
                    <button type="button" className="pagination-btn" aria-label={`Page ${page}`}
                        aria-current={page === currentPage ? 'page' : undefined}
                        aria-disabled={busy || page === currentPage} onClick={() => selectPage(page)}>
                        {page}
                    </button>
                </React.Fragment>
            ))}
            <button type="button" className="pagination-btn" aria-label="Next page" disabled={currentPage === pageCount}
                aria-disabled={busy || currentPage === pageCount} onClick={() => selectPage(currentPage + 1)}>
                <span aria-hidden="true">›</span>
            </button>
            <span className="footage-pagination-status" role="status">
                {busy ? `Loading page ${pendingPage}…` : `Page ${currentPage} of ${pageCount}`}
            </span>
        </nav>
    );
}
