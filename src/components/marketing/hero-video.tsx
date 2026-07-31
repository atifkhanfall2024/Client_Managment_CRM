"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

/** Brighter desk/workspace clip for light mode */
const LIGHT_VIDEO =
  "https://videos.pexels.com/video-files/4463352/4463352-hd_1920_1080_25fps.mp4";
const LIGHT_POSTER =
  "https://images.pexels.com/videos/4463352/free-video-4463352.jpg?auto=compress&cs=tinysrgb&w=1920";

/** Deeper office atmosphere for dark mode */
const DARK_VIDEO =
  "https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_25fps.mp4";
const DARK_POSTER =
  "https://images.pexels.com/videos/3129957/free-video-3129957.jpg?auto=compress&cs=tinysrgb&w=1920";

export function HeroVideoBackground({
  variant = "landing",
}: {
  variant?: "landing" | "auth";
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isAuth = variant === "auth";

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const src = isDark ? DARK_VIDEO : LIGHT_VIDEO;
  const poster = isDark ? DARK_POSTER : LIGHT_POSTER;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.load();
    el.muted = true;
    const play = el.play();
    if (play) play.catch(() => undefined);
  }, [src]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <video
        key={src}
        ref={ref}
        className="absolute inset-0 h-full w-full scale-110 object-cover motion-safe:animate-[auth-video-drift_28s_ease-in-out_infinite_alternate]"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={poster}
        aria-hidden
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Light: soft steel wash */}
      <div
        className={
          isAuth
            ? "absolute inset-0 bg-[#b7c8dc]/78 dark:hidden"
            : "absolute inset-0 bg-[#c5d3e4]/72 dark:hidden"
        }
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#24548c]/25 via-[#d0dbe8]/40 to-[#b8cce3]/70 dark:hidden" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(36,84,140,0.22),_transparent_55%)] dark:hidden" />

      {/* Dark: deep charcoal wash */}
      <div
        className={
          isAuth
            ? "absolute inset-0 hidden bg-[#0b1018]/84 dark:block"
            : "absolute inset-0 hidden bg-[#0b1018]/80 dark:block"
        }
      />
      <div className="absolute inset-0 hidden bg-gradient-to-br from-[#24548c]/40 via-transparent to-[#0b1018]/75 dark:block" />

      {isAuth ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(36,84,140,0.35),transparent_42%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(212,222,234,0.12),transparent_40%)]" />
        </>
      ) : (
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/70 to-transparent" />
      )}
    </div>
  );
}
