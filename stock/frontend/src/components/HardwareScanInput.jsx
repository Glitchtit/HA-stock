import { useEffect, useRef } from 'react';

const isEditable = (node) =>
  node?.tagName === 'INPUT' || node?.tagName === 'TEXTAREA' || node?.isContentEditable;

// Captures input from a Bluetooth (HID) barcode scanner without ever raising
// Android's on-screen keyboard.
//
// The scanner is a HID keyboard, and Android WebViews only deliver hardware-key
// events reliably to a FOCUSED element — a document-level listener drops them.
// But a normal focused text input pops the soft keyboard. The fix: a focused
// `readOnly` input. readOnly suppresses the on-screen keyboard, yet the focused
// element still receives `keydown` for every physical key, so we assemble the
// barcode ourselves and emit it on the scanner's Enter terminator (CR&LF).
//
// While mounted it keeps itself focused so no scan is missed, but never steals
// focus from a real input/textarea the user is typing in.
export function HardwareScanInput({ onScan }) {
  const ref = useRef(null);
  const bufferRef = useRef('');
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    // While a finger is down we must NOT call el.focus(): the WebView blurs the
    // focused input when a drag starts, which fires focusout — and refocusing
    // mid-gesture cancels the active touch (touchcancel), killing the row
    // swipe / hold-to-swipe gestures. So we suppress refocus during a touch and
    // re-assert focus once the gesture ends (so the next scan still lands).
    let touchActive = false;

    const focusSelf = () => {
      if (touchActive) return;
      const ae = document.activeElement;
      // Refocus self, but don't grab focus from a field the user is editing.
      if (ae === el || !isEditable(ae)) el.focus({ preventScroll: true });
    };

    const onFocusOut = () => setTimeout(focusSelf, 0);
    // After a screensaver / app switch, Android's key navigation can land focus
    // on the first button (no focusout fires on our input when that happens),
    // so the next scan's Enter would "click" it. Pull focus back on any
    // non-editable focus and whenever the window/page comes back.
    const onFocusIn = (e) => { if (e.target !== el && !isEditable(e.target)) setTimeout(focusSelf, 0); };
    const onVisible = () => { if (!document.hidden) setTimeout(focusSelf, 0); };
    // Keys that still reach another non-editable element (before the refocus
    // lands) are part of a scan: feed them into the buffer instead.
    const onDocKeyDown = (e) => {
      if (e.target === el || isEditable(e.target)) return;
      handleKey(e);
      focusSelf();
    };
    const onTouchStart = () => { touchActive = true; };
    const onTouchEnd = () => { touchActive = false; setTimeout(focusSelf, 0); };

    focusSelf();
    document.addEventListener('focusout', onFocusOut);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('keydown', onDocKeyDown, true);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true });
    return () => {
      document.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('keydown', onDocKeyDown, true);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('touchstart', onTouchStart, { capture: true });
      document.removeEventListener('touchend', onTouchEnd, { capture: true });
      document.removeEventListener('touchcancel', onTouchEnd, { capture: true });
    };
  }, []);

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      const code = bufferRef.current.trim();
      bufferRef.current = '';
      // Only swallow Enter that ends a scan, so keyboard users can still
      // activate a focused button.
      if (code || e.target === ref.current) e.preventDefault();
      if (code) onScanRef.current(code);
    } else if (e.key === 'Backspace') {
      bufferRef.current = bufferRef.current.slice(0, -1);
    } else if (e.key.length === 1) {
      // A single printable character — part of the barcode.
      bufferRef.current += e.key;
    }
    // Ignore everything else (Shift, Tab, arrows, …).
  };

  return (
    <input
      ref={ref}
      type="text"
      readOnly
      inputMode="none"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      aria-hidden="true"
      tabIndex={-1}
      onKeyDown={handleKey}
      // Offscreen but focusable (display:none can't hold focus).
      style={{
        position: 'absolute',
        left: -9999,
        top: 0,
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
