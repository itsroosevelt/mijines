"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Video de YouTube como fondo (sin controles, sin sonido, en bucle) que funciona
 * también en iPhone, iPad y Android:
 *
 * - Usa la IFrame API de YouTube y llama a playVideo() en cuanto el reproductor
 *   está listo, al primer toque/scroll y al volver a la pestaña. En celulares el
 *   parámetro autoplay=1 por sí solo muchas veces se ignora.
 * - Mientras no reproduce se ve la miniatura del video y el reproductor recibe
 *   toques: si el sistema bloquea la reproducción automática (modo de bajo
 *   consumo en iOS, ahorro de datos en Android), basta tocar el video.
 * - El tamaño se calcula en píxeles con JavaScript (como object-fit: cover), así
 *   funciona también en iOS antiguos que no soportan unidades cqw/cqh.
 */

// Alto extra arriba y abajo del iframe donde caen el título y los controles de
// YouTube, para que queden fuera de la vista.
const UI_MARGIN = 120;

type YTPlayer = {
  playVideo: () => void;
  mute: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getPlayerState: () => number;
  setPlaybackQuality: (quality: string) => void;
  destroy: () => void;
  getIframe: () => HTMLIFrameElement;
};

let apiPromise: Promise<any> | null = null;

function loadYouTubeApi(): Promise<any> {
  const w = window as any;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const previous = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve(w.YT);
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    });
  }
  return apiPromise;
}

interface YouTubeBackgroundProps {
  videoId: string;
  title: string;
  /** Calidad pedida a YouTube; la ajusta según pantalla y conexión. */
  quality?: string;
}

export default function YouTubeBackground({ videoId, title, quality = "hd1080" }: YouTubeBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [posterSrc, setPosterSrc] = useState(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`);

  // Tamaño "cover" en píxeles enteros (medio píxel desenfoca el video).
  useEffect(() => {
    const container = containerRef.current;
    const frame = frameRef.current;
    if (!container || !frame) return;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      const videoWidth = Math.ceil(Math.max(width, (height * 16) / 9));
      const videoHeight = Math.ceil((videoWidth * 9) / 16);
      frame.style.width = `${videoWidth}px`;
      frame.style.height = `${videoHeight + UI_MARGIN * 2}px`;
      frame.style.left = `${Math.round((width - videoWidth) / 2)}px`;
      frame.style.top = `${Math.round((height - videoHeight) / 2) - UI_MARGIN}px`;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    let player: YTPlayer | null = null;
    let cancelled = false;

    const play = () => {
      if (!player) return;
      try {
        player.mute();
        player.playVideo();
      } catch {
        // el reproductor aún no está listo
      }
    };

    // YT.Player reemplaza el elemento por el iframe: lo creamos a mano para que
    // React no administre ese nodo.
    const host = document.createElement("div");
    frame.appendChild(host);

    loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      player = new YT.Player(host, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          loop: 1,
          playlist: videoId,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          fs: 0,
          disablekb: 1,
          cc_load_policy: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            e.target.getIframe().title = title;
            e.target.setPlaybackQuality(quality);
            play();
          },
          onStateChange: (e: { data: number; target: YTPlayer }) => {
            if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
            // El visitante no puede pausarlo (no hay controles): si se pausa, lo hizo el sistema.
            if (e.data === YT.PlayerState.PAUSED && document.visibilityState === "visible") play();
            if (e.data === YT.PlayerState.ENDED) {
              e.target.seekTo(0, true);
              play();
            }
          },
        },
      });
    });

    // Reintentos: primer toque o scroll, y al volver a la pestaña/app.
    const onInteraction = () => {
      if (player && player.getPlayerState?.() !== 1) play();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") onInteraction();
    };
    window.addEventListener("touchstart", onInteraction, { passive: true });
    window.addEventListener("scroll", onInteraction, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener("touchstart", onInteraction);
      window.removeEventListener("scroll", onInteraction);
      document.removeEventListener("visibilitychange", onVisibility);
      player?.destroy();
      frame.innerHTML = "";
    };
  }, [videoId, quality, title]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-black">
      {/* Miniatura mientras el video carga o si el sistema bloquea la reproducción */}
      <img
        src={posterSrc}
        alt=""
        aria-hidden
        onError={() => setPosterSrc(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`)}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        ref={frameRef}
        // Invisible pero tocable hasta que reproduce; después ignora los toques.
        className={`absolute transition-opacity duration-700 [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0 ${
          playing ? "opacity-100 pointer-events-none" : "opacity-0"
        }`}
      />
    </div>
  );
}
