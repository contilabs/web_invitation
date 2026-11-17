// Música de fondo: la solicitud de reproducción permanece dentro del gesto del invitado.
// Los metadatos preparan el inicio; la pausa conserva la posición y el final reinicia en 00:00.
import { useCallback, useRef, useState } from "react";

const MUSIC_START_SECONDS = 0;

export function useMusic({ source = null, enabled = true } = {}) {
  const audioRef = useRef(null);
  const initialized = useRef(false);
  const playbackRequest = useRef(0);
  const [playing, setPlaying] = useState(false);

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
    setPlaying(true);
    const request = ++playbackRequest.current;
    // En una entrada rápida play() solicita permiso dentro del gesto, pero no suena
    // hasta cargar datos. loadedmetadata prepara el inicio desde el segundo cero.
    audio.play().catch((error) => {
      if (request !== playbackRequest.current) return;
      console.log("No se pudo reproducir la música automáticamente:", error);
      setPlaying(false);
    });
  }, [enabled, initialize]);

  const pause = useCallback(() => {
    playbackRequest.current += 1;
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !enabled) return;
    audio.currentTime = MUSIC_START_SECONDS;
    initialized.current = true;
    play();
  }, [enabled, play]);

  const toggle = useCallback(() => {
    if (playing) pause();
    else play();
  }, [playing, pause, play]);

  return { audioRef, playing, play, pause, toggle, enabled, initialize, restart };
}
