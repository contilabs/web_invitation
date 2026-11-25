// Aparición de las secciones al hacer scroll (T16, RF-6). Añade la clase `visible` a
// cada `.reveal` la primera vez que entra en pantalla. Con movimiento reducido el CSS
// lo muestra igual, así que no hace falta una rama aparte.
import { useEffect, useRef } from "react";

// Adelgaza la tinta rasterizada de Kalista hasta obtener recorridos centrales de pluma.
// Se calcula una vez a escala doble, fuera del bucle de animación y sin tocar el texto.
function handwritingPaths(context, width, height) {
  const rgba = context.getImageData(0, 0, width, height).data;
  const ink = new Uint8Array(width * height);
  for (let index = 0; index < ink.length; index += 1) ink[index] = rgba[index * 4 + 3] > 48 ? 1 : 0;
  const neighbors = [-width, 1 - width, 1, width + 1, width, width - 1, -1, -width - 1];
  let changed = true;
  while (changed) {
    changed = false;
    for (let phase = 0; phase < 2; phase += 1) {
      const remove = [];
      for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
          const index = y * width + x;
          if (!ink[index]) continue;
          const p = neighbors.map((offset) => ink[index + offset]);
          const count = p.reduce((sum, value) => sum + value, 0);
          if (count < 2 || count > 6) continue;
          let transitions = 0;
          for (let n = 0; n < 8; n += 1) if (!p[n] && p[(n + 1) % 8]) transitions += 1;
          if (transitions !== 1) continue;
          const first = phase ? p[0] * p[2] * p[6] : p[0] * p[2] * p[4];
          const second = phase ? p[0] * p[4] * p[6] : p[2] * p[4] * p[6];
          if (!first && !second) remove.push(index);
        }
      }
      remove.forEach((index) => { ink[index] = 0; });
      if (remove.length) changed = true;
    }
  }
  const visited = new Uint8Array(ink.length);
  const strokes = [];
  // Orden por x dentro de cada línea. Las ramas vuelven sobre tinta ya descubierta.
  for (let x = 1; x < width - 1; x += 1) {
    for (let y = 1; y < height - 1; y += 1) {
      const start = y * width + x;
      if (!ink[start] || visited[start]) continue;
      const stack = [start];
      const points = [start];
      visited[start] = 1;
      while (stack.length) {
        const current = stack[stack.length - 1];
        const next = neighbors.map((offset) => current + offset)
          .find((index) => ink[index] && !visited[index]);
        if (next !== undefined) {
          visited[next] = 1;
          stack.push(next);
          points.push(next);
        } else {
          stack.pop();
          if (stack.length) points.push(stack[stack.length - 1]);
        }
      }
      strokes.push(points.map((index, order) =>
        `${order ? "L" : "M"}${(index % width) / 2},${Math.floor(index / width) / 2}`).join(" ") +
        (points.length === 1 ? " l0.01,0" : ""));
    }
  }
  return strokes;
}

// Conserva el texto compuesto por el navegador: los rangos solo miden sus líneas.
export function useHandwritingReveal(text) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!node || motion.matches || !window.IntersectionObserver || !window.ResizeObserver ||
      !CSS.supports("mask-image", 'url("#handwriting")')) return;

    let disposed = false;
    let started = false;
    let visible = false;
    let prepared = false;
    let frame;
    let svg;
    let paths = [];
    let totalLength = 0;
    let measuredWidth = 0;
    let measuredHeight = 0;
    const main = node.closest("main");
    const namespace = "http://www.w3.org/2000/svg";
    const maskId = `handwriting-${crypto.randomUUID()}`;
    const create = (tag, attributes) => {
      const element = document.createElementNS(namespace, tag);
      Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
      return element;
    };
    const finish = () => {
      disposed = true;
      cancelAnimationFrame(frame);
      node.removeAttribute("data-handwriting");
      node.style.removeProperty("--handwriting-mask");
      svg?.remove();
      intersection.disconnect();
      resize.disconnect();
      entrance.disconnect();
    };
    const prepare = () => {
      if (disposed) return;
      const bounds = node.getBoundingClientRect();
      if (bounds.width === measuredWidth && bounds.height === measuredHeight) return;
      // Un giro de pantalla durante la escritura muestra el texto sin recortar ni repetir.
      if (started) { finish(); return; }
      svg?.remove();
      measuredWidth = bounds.width;
      measuredHeight = bounds.height;
      const content = node.firstChild;
      if (!bounds.width || content?.nodeType !== Node.TEXT_NODE) return;
      const range = document.createRange();
      const lines = [];
      for (let index = 0; index < content.length; index += 1) {
        range.setStart(content, index);
        range.setEnd(content, index + 1);
        const rect = range.getBoundingClientRect();
        if (!rect.width) continue;
        let line = lines.find((item) => Math.abs(item.top - rect.top) < 2);
        if (!line) {
          line = { top: rect.top, left: rect.left, right: rect.right, height: rect.height, start: index, end: index + 1 };
          lines.push(line);
        }
        line.left = Math.min(line.left, rect.left);
        line.right = Math.max(line.right, rect.right);
        line.end = index + 1;
      }
      if (!lines.length) return;
      svg = create("svg", { width: 0, height: 0, "aria-hidden": "true", focusable: "false" });
      svg.style.position = "absolute";
      const defs = create("defs", {});
      const mask = create("mask", {
        id: maskId, maskUnits: "userSpaceOnUse", maskContentUnits: "userSpaceOnUse",
        x: -16, y: -16, width: bounds.width + 32, height: bounds.height + 32,
        "mask-type": "alpha",
      });
      paths = [];
      totalLength = 0;
      const style = getComputedStyle(node);
      const fontSize = parseFloat(style.fontSize);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) { finish(); return; }
      lines.forEach((line) => {
        const padding = fontSize;
        canvas.width = Math.ceil((line.right - line.left + padding * 2) * 2);
        canvas.height = Math.ceil((line.height + padding * 2) * 2);
        context.scale(2, 2);
        context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const value = content.textContent.slice(line.start, line.end);
        const metrics = context.measureText(value);
        const ascent = metrics.fontBoundingBoxAscent ?? line.height * 0.8;
        context.fillText(value, padding, padding + ascent);
        handwritingPaths(context, canvas.width, canvas.height).forEach((d) => {
          const path = create("path", {
            d, fill: "none", stroke: "white", "stroke-width": fontSize * 0.15,
            transform: `translate(${line.left - bounds.left - padding} ${line.top - bounds.top - padding})`,
            "stroke-linecap": "round", "stroke-linejoin": "round",
          });
          mask.append(path);
          paths.push({ path, offset: totalLength });
        });
      });
      defs.append(mask);
      svg.append(defs);
      node.append(svg);
      paths.forEach((item) => {
        item.length = item.path.getTotalLength();
        item.offset = totalLength;
        item.width = Math.max(1, item.length);
        totalLength += item.width;
        item.path.style.strokeDasharray = `${item.length} ${item.length}`;
        item.path.style.strokeDashoffset = item.length;
        item.path.style.visibility = "hidden";
      });
      node.style.setProperty("--handwriting-mask", `url("#${maskId}")`);
      if (!totalLength) { finish(); return; }
      prepared = true;
    };
    const begin = () => {
      if (disposed || started || !prepared || !visible || main?.inert) return;
      started = true;
      let origin;
      const draw = (now) => {
        if (disposed) return;
        origin ??= now;
        const elapsed = now - origin - 450;
        const progress = Math.min(1, Math.max(0, elapsed / 3200));
        // Variación continua de velocidad, sin pausas discretas entre caracteres.
        const distance = (progress - Math.sin(progress * Math.PI * 4) * 0.012) * totalLength;
        paths.forEach(({ path, length, offset, width }) => {
          const local = Math.max(0, Math.min(1, (distance - offset) / width));
          path.style.strokeDashoffset = length * (1 - local);
          path.style.visibility = local > 0 ? "visible" : "hidden";
        });
        if (progress >= 1) finish();
        else frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);
    };
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      begin();
    }, { threshold: 0.65 });
    const resize = new ResizeObserver(() => { prepare(); begin(); });
    const entrance = new MutationObserver(begin);
    const motionChanged = () => { if (motion.matches) finish(); };
    node.dataset.handwriting = "waiting";
    intersection.observe(node);
    if (main) entrance.observe(main, { attributes: true, attributeFilter: ["inert"] });
    motion.addEventListener("change", motionChanged);
    const font = getComputedStyle(node);
    document.fonts.load(`${font.fontWeight} ${font.fontSize} ${font.fontFamily}`, text).then(() => {
      if (disposed) return;
      prepare();
      resize.observe(node);
      begin();
    }).catch(finish);
    return () => {
      finish();
      motion.removeEventListener("change", motionChanged);
    };
  }, [text]);

  return ref;
}

// Cada imagen espera tanto su carga como su entrada; al terminar se retira la máscara.
export function useWatercolorReveal(selector = ".ceremony-image") {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || motion.matches || typeof IntersectionObserver === "undefined" ||
      !CSS.supports("mask-image", "radial-gradient(black, transparent)")) return;

    const images = [...root.querySelectorAll(selector)];
    const entered = new WeakSet();
    const finish = (event) => {
      if (event.type === "animationend" && event.animationName !== "watercolor-bloom") return;
      event.target.removeAttribute("data-watercolor");
    };
    const start = (image) => {
      // Cambiar la fuente puede disparar otra carga después de la primera entrada.
      if (image.dataset.watercolor !== "waiting") return;
      if (!entered.has(image) || !image.complete || !image.naturalWidth) return;
      image.dataset.watercolor = "painting";
      observer.unobserve(image);
    };
    const loaded = (event) => start(event.target);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        entered.add(target);
        start(target);
      });
    }, { threshold: 0.12 });
    const clear = () => {
      observer.disconnect();
      images.forEach((image) => {
        image.removeAttribute("data-watercolor");
        image.removeEventListener("load", loaded);
        image.removeEventListener("error", finish);
        image.removeEventListener("animationend", finish);
      });
    };
    images.forEach((image) => {
      image.dataset.watercolor = "waiting";
      image.addEventListener("load", loaded);
      image.addEventListener("error", finish);
      image.addEventListener("animationend", finish);
      observer.observe(image);
    });
    const motionChanged = () => { if (motion.matches) clear(); };
    motion.addEventListener("change", motionChanged);
    return () => {
      clear();
      motion.removeEventListener("change", motionChanged);
    };
  }, [selector]);

  return ref;
}

export function useReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);
}
