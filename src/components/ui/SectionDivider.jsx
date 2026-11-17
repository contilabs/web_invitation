// Filete ornamental simétrico compartido; no añade contenido a lectores de pantalla.
export function SectionDivider({ className = "" }) {
  return (
    <span className={`section-divider ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 400 10" fill="currentColor" focusable="false">
        <path d="M11 5H190M210 5H389" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <path d="M2 5 10 1.8 9 4 15 5 9 6 10 8.2Z" />
        <path d="M2 5 10 1.8 9 4 15 5 9 6 10 8.2Z" transform="translate(400 0) scale(-1 1)" />
        <circle cx="194" cy="5" r="1.8" />
        <circle cx="200" cy="5" r="2.3" />
        <circle cx="206" cy="5" r="1.8" />
      </svg>
    </span>
  );
}
