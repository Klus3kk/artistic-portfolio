"use client";

import { useEffect } from "react";

// Component to add 'js' class to HTML element when JavaScript is enabled
export function JsReady() {
  useEffect(() => {
    document.documentElement.classList.add("js");
  }, []);

  return null;
}

