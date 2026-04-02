"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function ConfettiBurst() {
  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.3 },
      colors: ["#2C4A2E", "#FFFFFF", "#D4AF37"],
    });
  }, []);

  return null;
}
