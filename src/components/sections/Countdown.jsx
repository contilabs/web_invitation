// Cuenta regresiva: recibe el instante objetivo del registro y conserva los cuatro valores
// en cero al llegar a la fecha, sin cambiar la distribución visual.
import { useCountdown } from "../../hooks/useCountdown.js";

const twoDigits = (number) => String(number).padStart(2, "0");

// La misma rama gira en la esquina opuesta; el marco nunca estira las hojas.
function BotanicalCorner({ className }) {
  return (
    <svg className={`countdown-branch ${className}`} viewBox="70 290 270 380" fill="currentColor" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M326 370C276 370 231 376 210 359C199 350 195 340 193 326" />
        <path d="M248 370C205 369 167 381 143 407C118 434 101 472 104 508C106 548 122 577 139 602" />
        <path d="M194 378C174 390 159 410 155 431M159 388C144 381 132 375 118 370M143 407C125 413 110 420 98 423M126 431C121 450 124 469 131 488M109 540C113 559 129 576 149 585" />
      </g>
      <path d="M223 344C198 339 188 324 190 300C214 301 225 320 223 344ZM210 359C186 361 166 350 157 339C179 328 199 340 210 359ZM153 385C124 387 102 376 94 358C121 355 144 365 153 385ZM132 406C116 430 98 434 84 424C93 407 112 400 132 406ZM170 402C172 423 164 443 152 453C141 434 151 416 170 402ZM139 477C149 497 146 520 145 538C123 525 116 497 124 479C129 475 135 475 139 477ZM122 574C148 571 169 581 175 598C153 600 136 590 122 574ZM137 594C155 609 158 630 150 646C137 632 136 612 137 594Z" />
    </svg>
  );
}

function Box({ number, label }) {
  return (
    <div className="box">
      <span className="box-number">{number}</span>
      <span className="box-label">{label}</span>
    </div>
  );
}

export function Countdown({ instantMs }) {
  const { days, hours, minutes, seconds } = useCountdown(instantMs);

  return (
    <section className="countdown-date reveal" id="fecha">
      <div className="countdown-frame">
        <BotanicalCorner className="countdown-branch--top" />
        <BotanicalCorner className="countdown-branch--bottom" />
        <div className="band-content">
          <p className="date-day">Faltan</p>

          <div id="cuenta-regresiva" className="countdown">
            <Box number={days} label="Días" />
            <Box number={twoDigits(hours)} label="Horas" />
            <Box number={twoDigits(minutes)} label="Min" />
            <Box number={twoDigits(seconds)} label="Seg" />
          </div>
        </div>
      </div>
    </section>
  );
}
