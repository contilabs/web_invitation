// Música de fondo (T23, RF-5). El navegador bloquea el autoplay: solo suena tras un
// gesto del invitado (INGRESAR o el botón flotante). `play()` se llama dentro del gesto
// para que los navegadores estrictos (Safari) lo permitan.
import { useCallback, useRef, useState } from "react";

export function useMusic({ source = null, enabled = true } = {}) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const play = useCallback(() => {
    if (!enabled) return;
    const audio = audioRef.current;
    setPlaying(true);
    if (!audio) return;

    audio.play().catch((error) => {
      console.log("No se pudo reproducir la música automáticamente:", error);
      setPlaying(false);
    });
  }, [enabled]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (playing) pause();
    else play();
  }, [playing, pause, play]);

  return { audioRef, playing, play, pause, toggle, enabled };
}
