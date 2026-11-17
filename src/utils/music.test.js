// Pruebas de `musica` (T10, RF-5): el estado siguiente es la alternancia simple.
import { strict as assert } from "node:assert";
import test from "node:test";
import { readFileSync } from "node:fs";
import { nextMusicState } from "./music.js";

test("alterna entre reproducir y pausar", () => {
  assert.equal(nextMusicState(false), true);
  assert.equal(nextMusicState(true), false);
});

test("alternar dos veces vuelve al estado inicial", () => {
  for (const initial of [true, false]) {
    assert.equal(nextMusicState(nextMusicState(initial)), initial);
  }
});

// Adaptador mínimo de React para probar el control del audio sin DOM ni dependencias nuevas.
const reactAdapter = `
  export const state = { playing: false };
  export const useCallback = (callback) => callback;
  export const useRef = (current) => ({ current });
  export const useState = (initial) => [initial, (value) => { state.playing = value; }];
`;
const adapterUrl = `data:text/javascript,${encodeURIComponent(reactAdapter)}`;
const hookSource = readFileSync(new URL("../hooks/useMusic.js", import.meta.url), "utf8")
  .replace('from "react"', `from "${adapterUrl}"`);
const { useMusic } = await import(`data:text/javascript,${encodeURIComponent(hookSource)}`);
const { state } = await import(adapterUrl);

function createAudio(readyState = 1) {
  return {
    readyState,
    currentTime: 0,
    starts: [],
    pauses: 0,
    play() {
      this.starts.push(this.currentTime);
      return Promise.resolve();
    },
    pause() { this.pauses += 1; },
  };
}

test("la música prepara 00:00 solo después de cargar metadatos y no reinicia al reanudar", () => {
  const music = useMusic();
  const audio = createAudio(0);
  music.audioRef.current = audio;
  music.initialize();
  assert.equal(audio.currentTime, 0);
  audio.readyState = 1;
  music.initialize();
  assert.equal(audio.currentTime, 0);
  music.play();
  audio.currentTime = 37.5;
  music.pause();
  music.initialize();
  music.play();
  assert.deepEqual(audio.starts, [0, 37.5]);
  assert.equal(audio.pauses, 1);
});

test("un clic con metadatos listos fija 00:00 antes de solicitar reproducción", () => {
  const music = useMusic();
  const audio = createAudio();
  music.audioRef.current = audio;
  music.play();
  assert.deepEqual(audio.starts, [0]);
});

test("una entrada rápida conserva la solicitud del gesto y se posiciona al llegar metadatos", () => {
  const music = useMusic();
  const audio = createAudio(0);
  music.audioRef.current = audio;
  music.play();
  assert.equal(audio.starts.length, 1);
  audio.readyState = 1;
  music.initialize();
  assert.equal(audio.currentTime, 0);
});

test("al terminar vuelve a 00:00 y una nueva invitación vuelve a preparar ese inicio", () => {
  const music = useMusic();
  const audio = createAudio();
  music.audioRef.current = audio;
  music.play();
  audio.currentTime = 200;
  music.restart();
  assert.deepEqual(audio.starts, [0, 0]);
  const reopened = useMusic();
  reopened.audioRef.current = audio;
  audio.currentTime = 52;
  reopened.play();
  assert.equal(audio.currentTime, 0);
});

test("el recurso de audio conserva la canción completa sin fragmento temporal", () => {
  const app = readFileSync(new URL("../app/App.jsx", import.meta.url), "utf8");
  assert.match(app, /<source src=\{audioUrl\}/);
  assert.doesNotMatch(app, /#t=/);
});

test("un rechazo antiguo de play no cambia el estado de una reanudación posterior", async () => {
  const music = useMusic();
  const audio = createAudio();
  let rejectFirst;
  audio.play = () => new Promise((resolve, reject) => { rejectFirst ??= reject; });
  music.audioRef.current = audio;
  music.play();
  music.pause();
  music.play();
  rejectFirst(new Error("reproducción anterior cancelada"));
  await Promise.resolve();
  assert.equal(state.playing, true);
});

test("la música deshabilitada no se reproduce ni se reinicia", () => {
  const music = useMusic({ enabled: false });
  const audio = createAudio();
  music.audioRef.current = audio;
  music.play();
  music.restart();
  assert.deepEqual(audio.starts, []);
});
