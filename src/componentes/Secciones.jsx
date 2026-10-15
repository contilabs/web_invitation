// Secciones de contenido de la invitación (T15/T24, RF-2, RF-4, RF-6, RF-11, RF-14). Todas
// leen del registro único (`datos/boda.js`): aquí no quedan nombres, fechas, lugares ni
// textos de contenido, solo el rótulo de interfaz («Cómo llegar», «Ver hotel»).
import { coupleNames } from "../utils/couple.js";
import { restrictionMessages } from "../utils/restrictions.js";
import { FOTO_HERO, FOTO_RETRATO } from "./fotos.js";

import icoComida from "../../assets/icons/comida.png";
import icoCopas from "../../assets/icons/copas.png";
import icoDisco from "../../assets/icons/disco.png";
import icoHotel from "../../assets/icons/hotel.png";
import icoIglesia from "../../assets/icons/iglesia.png";
import icoMansion from "../../assets/icons/mansion.png";

// Los iconos son presentación: el registro guarda una clave y aquí se elige el archivo.
const ICONOS = {
  iglesia: icoIglesia,
  mansion: icoMansion,
  copas: icoCopas,
  comida: icoComida,
  disco: icoDisco,
};

export function Hero({ pareja, fechaTexto }) {
  const nombres = coupleNames(pareja);

  return (
    <section className="hero" id="inicio" tabIndex={-1}>
      <img
        className="hero-img"
        {...FOTO_HERO}
        alt={nombres.paraMostrar}
        fetchPriority="low"
        decoding="async"
      />
      <div className="hero-velo" aria-hidden="true"></div>

      <div className="hero-texto">
        <h1 className="hero-nombres">
          {nombres.primera} <span className="amp">&amp;</span> {nombres.segunda}
        </h1>
        <p className="hero-fecha">{fechaTexto}</p>
      </div>

      <a className="hero-flecha" href="#fecha" aria-label="Continuar con la invitación">
        <span aria-hidden="true"></span>
      </a>
    </section>
  );
}

export function Retrato() {
  return (
    <section className="Nombres reveal" aria-hidden="true">
      <img {...FOTO_RETRATO} loading="lazy" decoding="async" />
    </section>
  );
}

function enlaceDeMapa(ubicacion) {
  if (ubicacion?.mapaUrl) return ubicacion.mapaUrl;
  const consulta = [ubicacion?.lugar, ubicacion?.direccion].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`;
}

function CardLugar({ icono, ubicacion }) {
  const detalles = [ubicacion?.lugar, ubicacion?.direccion].filter(Boolean).join(" · ");

  return (
    <article className="card-lugar">
      {icono && <img className="ico" src={icono} alt="" loading="lazy" decoding="async" />}
      <h3>{ubicacion?.nombre}</h3>
      <p className="lugar-dato">
        {detalles}
        {ubicacion?.hora && <span className="chip">{ubicacion.hora}</span>}
      </p>
      <a
        className="boton boton-linea"
        href={enlaceDeMapa(ubicacion)}
        target="_blank"
        rel="noopener noreferrer"
      >
        Cómo llegar
      </a>
    </article>
  );
}

const ICONOS_UBICACION = { ceremonia: icoIglesia, recepcion: icoMansion };

export function Lugares({ ubicaciones }) {
  const lugares = ["ceremonia", "recepcion"]
    .map((clave) => ({ clave, ...(ubicaciones?.[clave] ?? {}) }))
    .filter((u) => u.nombre || u.lugar || u.direccion);

  return (
    <section className="Lugares reveal" id="lugares">
      <div className="wrap">
        {ubicaciones?.titulo && <h2>{ubicaciones.titulo}</h2>}

        <div className="rejilla-2">
          {lugares.map((u) => (
            <CardLugar key={u.clave} icono={ICONOS_UBICACION[u.clave]} ubicacion={u} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function Itinerario({ itinerario }) {
  const momentos = Array.isArray(itinerario?.momentos) ? itinerario.momentos : [];

  return (
    <section className="timeline-section reveal" id="itinerario">
      <div className="wrap">
        {itinerario?.titulo && <h2>{itinerario.titulo}</h2>}

        <ul className="timeline">
          {momentos.map((momento, i) => (
            <li className="event" key={`${momento?.titulo ?? "momento"}-${i}`}>
              <span className="event-ico">
                {ICONOS[momento?.icono] && (
                  <img
                    className="ico"
                    src={ICONOS[momento.icono]}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </span>
              <p className="time">{momento?.hora}</p>
              <p className="label">{momento?.titulo}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Hoteles({ hoteles }) {
  const lista = Array.isArray(hoteles?.lista) ? hoteles.lista : [];

  return (
    <section className="hoteles reveal" id="hospedaje">
      <div className="wrap">
        {hoteles?.titulo && <h2>{hoteles.titulo}</h2>}

        <div className="rejilla-3">
          {lista.map((hotel, i) => {
            const enlace = hotel?.bookingUrl ?? hotel?.mapaUrl ?? null;
            const interior = (
              <>
                <img className="ico" src={icoHotel} alt="" loading="lazy" decoding="async" />
                <span className="hotel-nombre">{hotel?.nombre}</span>
                {hotel?.precio && <span className="hotel-precio">{hotel.precio}</span>}
                {enlace && <span className="hotel-enlace">Ver hotel</span>}
              </>
            );
            const clave = `${hotel?.nombre ?? "hotel"}-${i}`;

            return enlace ? (
              <a
                className="card-hotel"
                href={enlace}
                target="_blank"
                rel="noopener noreferrer"
                key={clave}
              >
                {interior}
              </a>
            ) : (
              <article className="card-hotel" key={clave}>
                {interior}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Restricciones({ restricciones }) {
  const mensajes = restrictionMessages(restricciones);
  if (mensajes.length === 0) return null;

  return (
    <section className="restricciones reveal" id="restricciones">
      <div className="wrap-estrecho">
        {restricciones?.titulo && <h2>{restricciones.titulo}</h2>}
        <ul className="restricciones-lista">
          {mensajes.map((mensaje, i) => (
            <li key={i}>{mensaje}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Pie({ pareja, fechaTexto, lugar, credito }) {
  const nombres = coupleNames(pareja);

  return (
    <footer>
      <p className="footer-nombres">
        {nombres.primera} <span className="amp">&amp;</span> {nombres.segunda}
      </p>
      <p className="footer-fecha">
        {fechaTexto}
        {lugar ? ` · ${lugar}` : ""}
      </p>
      {credito && (
        <p className="footer-credito">
          Diseño de Invitación Digital ·{" "}
          <a href={credito} target="_blank" rel="noopener noreferrer">
            Más información aquí
          </a>
        </p>
      )}
    </footer>
  );
}
