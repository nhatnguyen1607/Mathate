import { useEffect } from "react";
export default function useDialog(open, selector, close, busy = false) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement,
      dialog = document.querySelector(selector);
    if (!dialog) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => [
      ...dialog.querySelectorAll(
        'button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]',
      ),
    ];
    focusable()[0]?.focus();
    const handle = (e) => {
      if (e.key === "Escape" && !busy) {
        e.preventDefault();
        close();
      }
      if (e.key !== "Tab") return;
      const list = focusable();
      if (!list.length) {
        e.preventDefault();
        return;
      }
      const first = list[0],
        last = list.at(-1);
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          !dialog.contains(document.activeElement))
      ) {
        e.preventDefault();
        last.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last ||
          !dialog.contains(document.activeElement))
      ) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, [open, selector, busy]);
}
