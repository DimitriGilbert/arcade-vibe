import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

export interface UseAutoScrollReturn {
  shouldAutoScroll: boolean;
  showScrollButton: boolean;
  scrollToBottom: () => void;
}

const SCROLL_THRESHOLD = 32;

export function useAutoScroll(
  ref: RefObject<HTMLElement | null>,
  isStreaming: boolean
): UseAutoScrollReturn {
  const userScrollIntentRef = useRef(false);
  const isAutoScrollingRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const getScrollElement = useCallback((): HTMLElement | null => {
    const root = ref.current;
    if (!root) return null;
    const scroller = root.querySelector(".streaming-code-viewer__scroll");
    return scroller instanceof HTMLElement ? scroller : null;
  }, [ref]);

  useEffect(() => {
    const scroller = getScrollElement();
    if (!scroller) return;

    const markUserScrollIntent = () => {
      userScrollIntentRef.current = true;
    };

    const onScroll = () => {
      const isNearBottom =
        scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < SCROLL_THRESHOLD;
      if (isAutoScrollingRef.current && userScrollIntentRef.current && !isNearBottom) {
        isAutoScrollingRef.current = false;
      }
      setShowScrollButton(!isNearBottom);
      if (isNearBottom) {
        userScrollIntentRef.current = false;
      }
    };

    scroller.addEventListener("wheel", markUserScrollIntent, { passive: true });
    scroller.addEventListener("touchstart", markUserScrollIntent, { passive: true });
    scroller.addEventListener("mousedown", markUserScrollIntent);
    scroller.addEventListener("scroll", onScroll);
    return () => {
      scroller.removeEventListener("wheel", markUserScrollIntent);
      scroller.removeEventListener("touchstart", markUserScrollIntent);
      scroller.removeEventListener("mousedown", markUserScrollIntent);
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [getScrollElement]);

  useEffect(() => {
    if (isStreaming) {
      isAutoScrollingRef.current = true;
      setShowScrollButton(false);
    }
  }, [isStreaming]);

  useEffect(() => {
    if (!isStreaming) return;
    if (!isAutoScrollingRef.current) return;

    const scroller = getScrollElement();
    if (scroller) {
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, [isStreaming, getScrollElement]);

  const scrollToBottom = useCallback(() => {
    const scroller = getScrollElement();
    if (!scroller) return;
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    userScrollIntentRef.current = false;
    isAutoScrollingRef.current = true;
    setShowScrollButton(false);
  }, [getScrollElement]);

  return {
    shouldAutoScroll: isAutoScrollingRef.current,
    showScrollButton,
    scrollToBottom,
  };
}
