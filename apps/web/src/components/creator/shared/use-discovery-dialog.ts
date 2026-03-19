"use client";

import { useState, useCallback } from "react";

interface UseDiscoveryDialogOptions {
  onOpen?: () => void;
  onClose?: () => void;
}

export function useDiscoveryDialog(options: UseDiscoveryDialogOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [excludeGameIds, setExcludeGameIds] = useState<string[]>([]);
  const [page, setPage] = useState(0);

  const open = useCallback((gameIdsToExclude: string[] = []) => {
    setExcludeGameIds(gameIdsToExclude);
    setPage(0);
    setIsOpen(true);
    options.onOpen?.();
  }, [options]);

  const close = useCallback(() => {
    setIsOpen(false);
    options.onClose?.();
  }, [options]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  return {
    isOpen,
    excludeGameIds,
    page,
    open,
    close,
    toggle,
    dialogProps: {
      open: isOpen,
      onOpenChange: setIsOpen,
      excludeGameIds,
      page,
      onNextPage: () => setPage((currentPage) => currentPage + 1),
      onPreviousPage: () => setPage((currentPage) => Math.max(0, currentPage - 1)),
    },
  };
}
