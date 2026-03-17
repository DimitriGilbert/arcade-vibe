import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  ContextMenuItem,
  ContextMenuItemOrDivider,
} from "./types";

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItemOrDivider[];
  onClose: () => void;
}

function isDivider(item: ContextMenuItemOrDivider): item is { type: "divider" } {
  return "type" in item && item.type === "divider";
}

interface KeyedItem {
  key: string;
  item: ContextMenuItemOrDivider;
  actionableIndex: number;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const actionableItems = useMemo(
    () => items.filter((item) => !isDivider(item)) as ContextMenuItem[],
    [items]
  );

  const keyedItems = useMemo((): KeyedItem[] => {
    let actionableCounter = -1;
    let dividerCounter = 0;
    return items.map((item) => {
      if (isDivider(item)) {
        return { key: `d${dividerCounter++}`, item, actionableIndex: -1 };
      }
      actionableCounter++;
      return { key: `a${actionableCounter}`, item, actionableIndex: actionableCounter };
    });
  }, [items]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((i) => (i + 1) % actionableItems.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex(
            (i) => (i - 1 + actionableItems.length) % actionableItems.length
          );
          break;
        case "Enter": {
          e.preventDefault();
          const item = actionableItems[focusedIndex];
          if (item && !item.disabled) {
            item.onClick();
            onClose();
          }
          break;
        }
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, actionableItems, focusedIndex]);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const newX =
        x + rect.width > window.innerWidth
          ? window.innerWidth - rect.width - 8
          : x;
      const newY =
        y + rect.height > window.innerHeight
          ? window.innerHeight - rect.height - 8
          : y;
      if (newX !== x || newY !== y) {
        ref.current.style.left = `${newX}px`;
        ref.current.style.top = `${newY}px`;
      }
    }
  }, [x, y]);

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-40 py-1 bg-popover border border-border shadow-lg"
      style={{ left: x, top: y, borderRadius: "var(--radius)" }}
    >
      {keyedItems.map(({ key, item, actionableIndex }) => {
        if (isDivider(item)) {
          return <div key={key} className="my-1 border-t border-border" />;
        }

        const isFocused = actionableIndex === focusedIndex;

        return (
          <button
            key={key}
            type="button"
            onClick={() => {
              item.onClick();
              onClose();
            }}
            disabled={item.disabled}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left",
              "hover:bg-accent hover:text-accent-foreground",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isFocused && "bg-accent text-accent-foreground",
              item.variant === "destructive" &&
                "text-destructive hover:bg-destructive/10 hover:text-destructive"
            )}
          >
            {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
