"use client";

import { useState, useCallback } from "react";

interface UseDiscoveryDialogOptions {
  onOpen?: () => void;
  onClose?: () => void;
}

export function useDiscoveryDialog(options: UseDiscoveryDialogOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [excludeGameIds, setExcludeGameIds] = useState<string[]>([]);

  const open = useCallback((gameIdsToExclude: string[] = []) => {
    setExcludeGameIds(gameIdsToExclude);
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
    open,
    close,
    toggle,
    dialogProps: {
      open: isOpen,
      onOpenChange: setIsOpen,
      excludeGameIds,
    },
  };
}
