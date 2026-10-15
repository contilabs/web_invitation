// Música de fondo (T23, RF-5). El navegador bloquea el autoplay: solo suena tras un
// gesto del invitado (INGRESAR o el botón flotante). `play()` se llama dentro del gesto
// para que los navegadores estrictos (Safari) lo permitan.
import { useCallback, useRef, useState } from "react";

export function useMusica({ fuente = null, habilitada = true } = {}) {
  const audioRef = useRef(null);
  const [sonando, setSonando] = useState(false);

  const reproducir = useCallback(() => {
    if (!habilitada) return;
    const audio = audioRef.current;
    setSonando(true);
    if (!audio) return;

    audio.play().catch((error) => {
      console.log("No se pudo reproducir la música automáticamente:", error);
      setSonando(false);
    });
  }, [habilitada]);

  const pausar = useCallback(() => {
    audioRef.current?.pause();
    setSonando(false);
  }, []);

  const alternar = useCallback(() => {
    if (sonando) pausar();
    else reproducir();
  }, [sonando, pausar, reproducir]);

  return { audioRef, sonando, reproducir, pausar, alternar, habilitada };
}
