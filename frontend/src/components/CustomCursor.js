"use client";

import { useEffect, useRef, useState } from "react";

const isTouchDevice = () => {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
};

const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const frameRef = useRef(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isTouchDevice() || prefersReducedMotion()) return;

    const html = document.documentElement;
    html.classList.add("custom-cursor-enabled");
    setEnabled(true);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    const speed = 0.15;

    const updateMouse = ({ clientX, clientY }) => {
      mouseX = clientX;
      mouseY = clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${clientX}px, ${clientY}px, 0)`;
      }
      if (ringRef.current) {
        ringRef.current.classList.add("is-moving");
      }
    };

    const animate = () => {
      ringX += (mouseX - ringX) * speed;
      ringY += (mouseY - ringY) * speed;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }
      frameRef.current = requestAnimationFrame(animate);
    };

    const onPointerDown = () => ringRef.current?.classList.add("is-pressed");
    const onPointerUp = () => ringRef.current?.classList.remove("is-pressed");
    const onPointerLeave = () => ringRef.current?.classList.remove("is-moving");

    window.addEventListener("mousemove", updateMouse);
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("mouseout", onPointerLeave);

    animate();

    return () => {
      window.removeEventListener("mousemove", updateMouse);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("mouseout", onPointerLeave);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      html.classList.remove("custom-cursor-enabled");
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div ref={dotRef} className="custom-cursor-dot" />
      <div ref={ringRef} className="custom-cursor-ring" />
    </>
  );
}
