import { useState, useMemo } from 'react';

export interface PaginationConfig {
  itemsPerPage: number;
  initialPage?: number;
}

export const usePagination = <T>(data: T[], config: PaginationConfig) => {
  const { itemsPerPage, initialPage = 1 } = config;
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = useMemo(() =>
    Math.ceil(data.length / itemsPerPage),
    [data.length, itemsPerPage]
  );

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirst = () => goToPage(1);
  const goToLast = () => goToPage(totalPages);
  const goToPrevious = () => goToPage(currentPage - 1);
  const goToNext = () => goToPage(currentPage + 1);

  const pageRange = useMemo(() => {
    const range = [];
    const showPages = 5; // Number of page buttons to show
    let start = Math.max(1, currentPage - Math.floor(showPages / 2));
    let end = Math.min(totalPages, start + showPages - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < showPages) {
      start = Math.max(1, end - showPages + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }, [currentPage, totalPages]);

  return {
    currentPage,
    totalPages,
    paginatedData,
    pageRange,
    canGoToPrevious: currentPage > 1,
    canGoToNext: currentPage < totalPages,
    goToPage,
    goToFirst,
    goToLast,
    goToPrevious,
    goToNext,
    setCurrentPage,
    totalItems: data.length,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, data.length)
  };
};