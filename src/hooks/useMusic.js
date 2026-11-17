// Música de fondo: la solicitud de reproducción permanece dentro del gesto del invitado.
// Los metadatos preparan el inicio; la pausa conserva la posición y el final reinicia en 00:00.
import { useCallback, useRef, useState } from "react";

const MUSIC_START_SECONDS = 0;
const MUSIC_START_VOLUME = 0.05;
const MUSIC_TARGET_VOLUME = 0.65;
const MUSIC_FADE_DURATION_MS = 4000;

export function useMusic({ source = null, enabled = true } = {}) {
  const audioRef = useRef(null);
  const initialized = useRef(false);
  const playbackRequest = useRef(0);
  const fadeFrame = useRef(null);
  const hasStarted = useRef(false);
  const [playing, setPlaying] = useState(false);

  const cancelFade = useCallback(() => {
    if (fadeFrame.current === null) return;
    if (typeof globalThis.cancelAnimationFrame === "function") {
      globalThis.cancelAnimationFrame(fadeFrame.current);
    }
    fadeFrame.current = null;
  }, []);

  const fadeIn = useCallback((audio) => {
    cancelFade();
    audio.volume = MUSIC_START_VOLUME;

    if (typeof globalThis.requestAnimationFrame !== "function") {
      audio.volume = MUSIC_TARGET_VOLUME;
      return;
    }

    const startedAt = typeof performance === "undefined" ? Date.now() : performance.now();
    const updateVolume = (now) => {
      const elapsed = now - startedAt;
      const progress = Math.min(elapsed / MUSIC_FADE_DURATION_MS, 1);
      audio.volume = MUSIC_START_VOLUME + ((MUSIC_TARGET_VOLUME - MUSIC_START_VOLUME) * progress);
      if (progress < 1) {
        fadeFrame.current = globalThis.requestAnimationFrame(updateVolume);
      } else {
        fadeFrame.current = null;
      }
    };

    fadeFrame.current = globalThis.requestAnimationFrame(updateVolume);
  }, [cancelFade]);

  const initialize = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.readyState < 1 || initialized.current) return;
    audio.currentTime = MUSIC_START_SECONDS;
    initialized.current = true;
  }, []);

  const play = useCallback(() => {
    if (!enabled) return;
    const audio = audioRef.current;
    if (!audio) return;

    initialize();
    if (!hasStarted.current) {
      fadeIn(audio);
      hasStarted.current = true;
    }
    setPlaying(true);
    const request = ++playbackRequest.current;
    // En una entrada rápida play() solicita permiso dentro del gesto, pero no suena
    // hasta cargar datos. loadedmetadata prepara el inicio desde el segundo cero.
    audio.play().catch((error) => {
      if (request !== playbackRequest.current) return;
      cancelFade();
      hasStarted.current = false;
      console.log("No se pudo reproducir la música automáticamente:", error);
      setPlaying(false);
    });
  }, [cancelFade, enabled, fadeIn, initialize]);

  const pause = useCallback(() => {
    playbackRequest.current += 1;
    cancelFade();
    audioRef.current?.pause();
    setPlaying(false);
  }, [cancelFade]);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !enabled) return;
    audio.currentTime = MUSIC_START_SECONDS;
    initialized.current = true;
    hasStarted.current = false;
    play();
  }, [enabled, play]);

  const toggle = useCallback(() => {
    if (playing) pause();
    else play();
  }, [playing, pause, play]);

  return { audioRef, playing, play, pause, toggle, enabled, initialize, restart };
}
