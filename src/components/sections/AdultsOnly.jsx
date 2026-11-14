// Postal informativa: el contenido procede del registro; el ornamento es decorativo.
function BotanicalSprig({ className }) {
  return (
    <svg className={className} viewBox="0 0 140 180" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M28 170C70 140 49 89 101 29M55 138C38 123 26 105 21 84M67 104C89 95 110 76 119 58M82 62C66 49 62 34 65 17" />
      <path d="M51 137C28 138 21 121 23 110C39 112 49 121 51 137ZM60 121C75 105 91 108 96 115C85 130 72 132 60 121ZM39 111C20 111 12 97 15 86C30 88 37 96 39 111ZM72 88C66 68 73 56 83 55C89 69 84 81 72 88ZM91 81C104 65 119 69 124 76C113 89 102 91 91 81ZM78 55C58 52 54 39 58 29C71 34 78 41 78 55Z" />
      <g transform="translate(103 28)">
        <path d="M0-5C-18-30-25-7-7 1C-34-1-23 20-5 8C-17 33 8 31 3 11C17 34 32 13 10 5C37 9 31-17 10-3C22-27 0-34 0-5Z" />
        <path d="M0-5-4-18M-7 1-20 0M-5 8-10 20M3 11 9 22M10 5 23 9M10-3 18-14" />
        <circle r="5" /><circle r="2" />
      </g>
      <path d="M23 85C8 73 17 56 26 65C38 50 47 68 30 83M24 81 26 68M97 48C104 36 117 40 113 49C126 52 118 64 107 57" />
    </svg>
  );
}

function OrnamentalFrame({ className }) {
  return (
    <div className={className} aria-hidden="true">
      {["top-left", "top-right", "bottom-left", "bottom-right"].map((corner) => (
        <svg className={`adults-corner adults-corner-${corner}`} key={corner} viewBox="0 0 50 50" fill="none" focusable="false">
          <path d="M0 49A49 49 0 0 0 49 0" stroke="currentColor" strokeWidth="1" />
        </svg>
      ))}
    </div>
  );
}

export function AdultsOnly({ notice }) {
  return (
    <section className="adults-only reveal" id="solo-adultos" aria-labelledby="adults-only-title">
      <div className="adults-postcard">
        <OrnamentalFrame className="adults-frame adults-frame-outer" />
        <OrnamentalFrame className="adults-frame adults-frame-inner" />
        <BotanicalSprig className="adults-botanical adults-botanical-left" />
        <BotanicalSprig className="adults-botanical adults-botanical-right" />
        <div className="adults-copy">
          <p className="adults-greeting">{notice.saludo}</p>
          <h2 id="adults-only-title">{notice.titulo}</h2>
          <svg className="adults-flourish" viewBox="0 0 120 30" fill="none" stroke="currentColor" strokeWidth="0.8" aria-hidden="true" focusable="false">
            <path d="M8 22Q38 25 60 9Q82 25 112 22M60 9C43 8 36 1 35 1C49 0 57 4 60 9ZM60 9C77 8 84 1 85 1C71 0 63 4 60 9ZM43 18C31 17 25 10 25 8C38 8 42 13 43 18ZM77 18C89 17 95 10 95 8C82 8 78 13 77 18Z" />
          </svg>
          <div className="adults-message">
            {(notice.parrafos ?? []).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </div>
      </div>
    </section>
  );
}
