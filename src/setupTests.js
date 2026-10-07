import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// react-router v7 needs these and the jsdom used by react-scripts 5 does not provide them.
if (typeof global.TextEncoder === "undefined") global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === "undefined") global.TextDecoder = TextDecoder;

// jsdom has no matchMedia; react-hot-toast reads it when a toast is shown.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
