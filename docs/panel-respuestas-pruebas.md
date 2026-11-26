# Panel de respuestas — libro de prueba sintético (sin datos personales)

Este documento define los datos sintéticos para verificar el panel privado (spec 006, T3). 
**No contiene datos reales**. Los archivos con libros reales se excluyen por `.gitignore` (`gas/*.xlsx`).

## 1. Contraseña de prueba

Usar una contraseña ficticia para `VITE_PASSWORD` y para la propiedad de Apps Script
`ADMIN_PASSWORD_boda-pruebas`. Configurar `VITE_WEDDING_SLUG=boda-pruebas`.
La contraseña queda en el JavaScript del panel de prueba.

## 2. Boda de prueba (maestro sintético)

Fila en hoja `files` (maestro):

| slug | is_active | guests_sheet_id | deadline | guest_type | generic_json_cache | public_json_cache |
| --- | --- | --- | --- | --- | --- | --- |
| `boda-pruebas` | `TRUE` | `<ID_LIBRO_SINTETICO>` | `2099-12-31T23:59:59-06:00` | `generic` | (opcional) | (opcional) |

## 3. Libro de invitados sintético (`guests`)

Hoja `guests` con filas ficticias para cubrir los casos requeridos (T14):

| guest_id | phone | guest_name | partner_name | adults_guests | adults_attendees | child_guests | child_attendees | message | dietary_restrictions | status | datetime |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1001 | 5550001111 | Test Uno |  | 2 | 2 |  | 0 | Mensaje de prueba | Sin gluten | accepted | 2026-10-01T10:00:00-06:00 |
| 1002 | 5550002222 | Test Dos |  | 2 | 0 |  | 0 |  |  | declined | 2026-10-02T11:00:00-06:00 |
| 1003 | 5550003333 | Test Tres |  | 1 |  |  |  |  |  | viewed |  |
| 1004 | 5550004444 |  |  | 2 | 1 |  | 0 |  |  | accepted | 2026-10-03T12:00:00-06:00 |
| 1005 | 5550005555 | Test Cinco |  | 3 | 2 |  | 1 | Mensaje con restricción | Vegetariano | accepted | 2026-10-04T13:00:00-06:00 |

Notas:
- `guest_id` numérico (genérico/público) para simular alta por teléfono.
- Fila 1004 sin `guest_name` para cubrir cabeceras tolerantes (spec 005 RF-15).
- Fila 1003 con `status` `viewed` y sin asistentes/respuesta para distinguir pendientes.
- `adults_attendees`/`child_attendees` vacíos se interpretan como **cero** (contrato 1.4.0).
- Sin datos personales reales.

## 4. Códigos sintéticos (`generic`)

Hoja `generic`:

| generic_id | limit |
| --- | --- |
| `TEST01` | 2 |
| `TEST02` | 1 |

## 5. Uso para verificación manual

- **T13:** comprobar contraseña incorrecta, correcta y configuración ausente. Tras caducar
  la sesión, pulsar «Actualizar» y verificar que reaparece el formulario.
- **T14:** filtros, totales, filas `viewed`/`accepted`/`declined`, ceros y campos ausentes.
- **T15:** servicio caído, doble clic en actualizar, privacidad en escritorio y móvil.

Los totales deben excluir `declined` para adultos/niños; `pending` corresponde a `viewed` sin confirmación.
