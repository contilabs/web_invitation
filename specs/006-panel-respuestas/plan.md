# Plan técnico — Panel privado de respuestas RSVP

## Fase 0 — Decisiones y contrato

- T1. Resolver D1–D4 con la pareja y registrar la decisión en `spec.md`.
- T2. Diseñar el sobre administrativo, la acción, permisos, paginación (si aplica) y
  errores; actualizar `src/constants/contract.js` y `docs/servicio-invitados.md` sin
  romper el contrato público 1.4.0.
- T3. Definir un libro de prueba sintético y documentar el acceso de prueba.

## Fase 1 — Servicio de lectura

- T4. Implementar el endpoint administrativo en `gas/Code.gs` con autorización de servidor,
  selección segura de boda y columnas mínimas.
- T5. Añadir normalización y validación pura de la respuesta administrativa.
- T6. Añadir pruebas de contrato, errores, estados, ceros y filas incompletas.
- T7. Documentar despliegue, permisos, revocación de acceso y redespliegue en `gas/README.md`.

## Fase 2 — Panel web

- T8. Añadir una entrada independiente del panel sin cargar la invitación pública, fotos ni
  audio.
- T9. Implementar autorización, carga, actualización manual, errores y estados vacíos.
- T10. Implementar resumen, filtros, orden y tabla accesible.
- T11. Implementar detalle accesible con foco, teléfono enmascarado y cierre por teclado.

## Fase 3 — Verificación y entrega

- T12. Ejecutar `npm test` y `npm run build`.
- T13. Probar autorización válida, no autorizada y sesión expirada con el libro sintético.
- T14. Probar filtros, totales, filas `viewed`/`accepted`/`declined`, ceros y campos ausentes.
- T15. Probar servicio caído, doble clic en actualizar y privacidad en escritorio y móvil.
- T16. Anotar veredictos en `spec.md`, actualizar `MEMORY.md` y depurar `PENDING_TASKS.md`.

## Límites de implementación

- No modificar el comportamiento del RSVP público salvo los cambios de contrato que T2
  demuestre necesarios.
- No añadir librerías de tablas, gráficos, autenticación o UI.
- No versionar libros, tokens, cuentas ni respuestas reales.
- No crear un endpoint administrativo hasta cerrar D1.
