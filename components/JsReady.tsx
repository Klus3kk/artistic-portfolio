"use client";

import { useEffect } from "react";

export function JsReady() {
  useEffect(() => {
    document.documentElement.classList.add("js");
  }, []);

  return null;
}

