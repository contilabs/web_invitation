# Puesta en marcha del servicio de invitados y confirmación

Este directorio reúne el **servicio de registro** de la spec 004: `Code.gs` es el script de
**Google Apps Script** (V8, sin librerías) que lee el **maestro** y el **libro de invitados** de
cada boda, y `README.md` (este archivo) explica cómo montarlo y publicarlo paso a paso.

- El **contrato** que implementa el script vive en `src/constants/contract.js` (la fuente única
  que consume la app) y su explicación humana en `docs/servicio-invitados.md`. Si cambia la
  forma de una llamada o de una respuesta, la versión (`CONTRACT_VERSION`) se sube **a la vez**
  en los dos archivos.
- La app que lo consume no necesita nada de este directorio: solo la **URL del despliegue** y el
  **`slug`** de la boda, como se explica en el paso 6.

> **Aviso de privacidad (RNF-2, D19).** Los **libros reales** (el maestro y los de invitados)
> contienen **datos personales** (nombres y teléfonos): **no se versionan**. Este repositorio
> los excluye por `.gitignore` (`gas/*.xlsx`), se conservan en el disco de quien publica y
> **nada** de lo que se rellene (ids de libros, teléfonos, nombres) se escribe en ningún archivo
> del repositorio. Los ejemplos de este documento usan marcadores opacos (`<slug>`,
> `<id del libro>`).

## Qué se necesita

- Una cuenta de Google con acceso a Google Drive, a las Hojas de cálculo y a Apps Script.
- El repositorio compilado con la configuración del despliegue (paso 6).

## Paso 1 — Crear el maestro (un libro, una hoja `files`)

1. Crear un **libro de cálculo nuevo** (el maestro) con **una sola hoja**, renombrada
   **`files`**.
2. En la **fila 1**, escribir estas cabeceras (el servicio las lee **por nombre**, nunca por
   posición; el orden puede variar pero los literales **no**):

   | Columna | Contenido |
   | --- | --- |
   | `slug` | Identificador de la boda (único). |
   | `is_active` | `TRUE` si la boda se sirve, `FALSE` si ya no es accesible. |
   | `guests_sheet_id` | Id del **libro de invitados** de esa boda (ver paso 2). |
   | `deadline` | Plazo de confirmación. **Puede quedar vacío** (sin plazo). |
   | `guest_type` | Tipo de invitación de la boda: `personal`, `generic` o `public`. |
   | `generic_json_cache` | **No se rellena a mano**: es una caché que escribe el servicio. |

3. Reglas que el maestro debe cumplir (el servicio falla de forma visible si no):
   - **Obligatorias:** `slug`, `is_active`, `guests_sheet_id` y `guest_type`. `deadline` y
     `generic_json_cache` pueden faltar o estar vacías.
   - **`slug` único:** dos filas no pueden compartir `slug`.
   - **`guests_sheet_id` único entre filas activas:** el modelo es **un libro de invitados por
     boda**; dos bodas activas apuntando al mismo libro es un error.
   - `deadline` es un **valor fijo** (una fecha y hora escritas en la celda), **nunca** una
     fórmula como `NOW()`: con `NOW()` el plazo se recalcula al guardar y **nunca vencería**.
     Se interpreta en la **zona de la hoja de cálculo** del maestro, así que conviene fijar
     esa zona (Configuración de la hoja de cálculo) en la zona de la boda.

> **Corregir los errores del ejemplo.** El libro de ejemplo que acompaña el desarrollo trae dos
> defectos que hay que corregir antes de usar el maestro de verdad: las celdas de `deadline`
> rellenas con la fórmula `NOW()` (sustituirlas por fechas fijas) y **dos bodas apuntando al
> mismo** `guests_sheet_id` (cada boda necesita su **propio** libro).

## Paso 2 — Crear el libro de invitados de cada boda (hojas `guests` y `generic`)

**Un libro por boda.** Crear un libro de cálculo nuevo para cada boda y copiar su **id** en la
columna `guests_sheet_id` del maestro: el id es lo que está en la URL del libro entre `/d/` y
`/edit` (`https://docs.google.com/spreadsheets/d/<id del libro>/edit`).

### Hoja `guests` (obligatoria en los tres tipos)

Renombrar una hoja a **`guests`** y escribir en la fila 1 estas cabeceras (las 12 son
obligatorias; el servicio falla de forma visible si falta una que necesita):

`guest_id`, `phone`, `guest_name`, `partner_name`, `adults_guests`, `adults_attendees`,
`child_guests`, `child_attendees`, `message`, `dietary_restrictions`, `status`, `datetime`.

- **Invitación personalizada:** precargar una fila por invitado con su `guest_id` (suele ser
  texto, p. ej. con un sufijo), su `guest_name`, su `partner_name` (si tiene acompañante), su
  cupo `adults_guests` y, si aplica, `child_guests`. `phone` **no** hace falta en este tipo.
- **`status` y `datetime` se dejan vacíos** al precargar: el servicio pone `viewed` al abrir la
  invitación y sella `datetime` con cada respuesta. `datetime` es **valor fijo** escrito por el
  servicio, nunca una fórmula como `NOW()`.
- Formatear la columna `phone` como **texto** (Formato → Número → Texto) **antes** de rellenarla
  en el libro de una boda genérica o pública: el teléfono es la **llave** y un número guardado
  como número perdería sus ceros a la izquierda.

### Hoja `generic` (obligatoria solo en `generic` y `public`)

Renombrar otra hoja a **`generic`** con estas cabeceras en la fila 1: `generic_id`, `limit`.

- Cada fila es un **código de enlace** (el valor del parámetro `guest`): `generic_id` con el
  código y `limit` con el **entero mayor que cero** de adultos que ese código permite **en cada
  respuesta** (el cupo no se agota: sirve para muchos invitados).
- Añadir siempre la fila del código reservado **`PUBLIC`**, con `limit` = el texto **`n`**
  (sin tope): es la invitación pública de la boda, la que se comparte con todos.
- Los códigos corrientes deben ser **opacos** (RNF-2): sin nombres, sin correos ni teléfonos,
  porque quien comparte el enlace comparte el código.
- Los códigos se comparan **normalizados** (sin distinguir mayúsculas), así que `public` en
  minúsculas también resuelve.
- En una boda **personalizada** esta hoja **no** hace falta.

## Paso 3 — Dar de alta cada boda en el maestro

Añadir **una fila por boda** en la hoja `files` del maestro:

1. `slug`: el identificador que se configurará en la app (paso 6). Es único.
2. `is_active`: `TRUE`. Para **apagar** una boda sin borrarla, cambiarla a `FALSE`: el servicio
   deniega el acceso y la app lo muestra como «boda ya no disponible».
3. `guests_sheet_id`: el id del libro creado en el paso 2 (uno por boda; nunca compartido entre
   filas activas).
4. `guest_type`: `personal`, `generic` o `public`. **Una boda, un tipo**: no se mezclan.
5. `deadline`: la fecha y hora límite como **valor fijo**, o vacío si no hay plazo.
6. `generic_json_cache`: vacío (la llena el servicio).

## Paso 4 — Montar el script (`Code.gs`)

1. Abrir el editor de Apps Script (script.google.com) y crear un proyecto nuevo (o usar el
   vinculado al maestro). **Pegar el contenido de `gas/Code.gs`** en el archivo `Code.gs` del
   proyecto (no hace falta nada más: el script es autónomo, sin librerías).
2. El script no lleva ningún id dentro: el del maestro se guarda en una **propiedad del
   script**. En el editor: **Configuración del proyecto → Propiedades del script → Agregar
   propiedad** con el nombre **`MASTER_SHEET_ID`** y el valor: el **id** del libro maestro del
   paso 1 (la parte de la URL entre `/d/` y `/edit`).
3. Guardar.

## Paso 5 — Publicar la aplicación web

1. En el editor: **Implementar → Nueva implementación → Aplicación web**.
2. **Ejecutar como:** **Yo** (así el script puede abrir los libros que están en mi Drive).
3. **Con acceso:** **Cualquiera** (el invitado no envía credenciales; el contrato no las
   necesita: la app solo manda `POST` con cuerpo JSON y el servicio responde JSON).
4. **Implementar** y copiar la **URL de ejecución** (`…/exec`): esa es la **ubicación del
   servicio** del paso 6.
5. **Al cambiar `Code.gs`** hay que crear una **nueva versión** de la implementación (Implementar
   → Administrar implementaciones → editar → Nueva versión) para que la misma URL sirva el código
   nuevo; si se crea una implementación nueva, la URL cambia y hay que actualizar el paso 6.

## Paso 6 — Consumir el despliegue desde la app

La **URL del despliegue** y el **`slug`** son **configuración del despliegue** (RF-15, D17):
**no** se escriben en el código ni en el registro de la boda (`src/data/wedding.js`). La app los
lee de **variables de entorno** de Vite, cuyos nombres fija `src/constants/service.js` y que
recoge `src/services/config.js`:

| Variable | Contenido |
| --- | --- |
| `VITE_SERVICE_URL` | La URL `…/exec` del paso 5. **Sin ella** la app entra en **modo demo**: no llama a nadie y la confirmación queda deshabilitada. |
| `VITE_WEDDING_SLUG` | El `slug` de esta boda (paso 3). **Con URL y sin `slug`**, la app muestra «esta invitación no está configurada» y no reintenta. |

Cómo fijarlas (en el equipo de quien publica, nunca versionadas — `.env.local` está en
`.gitignore`):

```bash
# en la raíz del proyecto, en un archivo .env.local
VITE_SERVICE_URL=https://script.google.com/macros/s/<id de la implementación>/exec
VITE_WEDDING_SLUG=<slug de la boda>
```

Y reconstruir el sitio (`npm run build`) para que el build las incorpore. Cada boda se publica
con **su** `slug`: cambiar de boda es cambiar esta variable (y el contenido del registro), tocar
los libros o el script.

## Paso 7 — Comprobaciones de la puesta en marcha

La verificación automática del repositorio (`npm test`) **no** toca el servicio en vivo: va
contra el módulo del contrato (RNF-10). Estas comprobaciones se hacen **a mano** contra el
despliegue nuevo:

1. **Salud.** Abrir la URL `…/exec` en el navegador (o con un `GET`): debe responder el JSON
   `{"ok":true,"code":"OK","contract":"1.1.0"}`. Si responde una página de error, el script no
   está publicado o falla al arrancar: revisar la implementación y la propiedad
   `MASTER_SHEET_ID`.
2. **Los tres tipos.** Abrir la invitación con un enlace `…?guest=<código>` de cada tipo
   (`<guest_id>` de una fila precargada, un `generic_id` y `PUBLIC`) y comprobar que la
   personalización aparece con el nombre, el cupo y el plazo del libro.
3. **La escritura.** Enviar una respuesta de prueba de cada tipo y comprobar que aparece en la
   hoja `guests` del **libro de esa boda** con su estado (`confirmed`), su `datetime` y, en la
   genérica y la pública, el teléfono como texto; volver a contestar con el **mismo teléfono** y
   comprobar que la fila se **actualiza** (`updated`) en vez de duplicarse.
4. **El `viewed`.** Al abrir una personalizada sin respuesta, la celda `status` de su fila pasa
   a `viewed`; al abrirla de nuevo tras contestar, la respuesta **no** se sobrescribe.
5. **Casos de fallo.** Un código desconocido, una boda con `is_active` en `FALSE`, un `slug`
   inexistente y un `deadline` vencido deben producir cada uno su aviso propio en la app.
6. **La consulta por teléfono (`lookup`, spec 005).** Solo aplica a las bodas genérica y
   pública. Enviar a mano un `POST` con el cuerpo
   `{"action":"lookup","slug":"<slug>","code":"<código>","phone":"<10 dígitos>"}` (el mismo tipo
   de contenido `text/plain` del contrato) y comprobar los dos casos:
   - **Teléfono con fila** (una respuesta ya registrada en `guests` de ese libro): la respuesta
     trae `type`, `limit`, `deadline` y, dentro de `response`, el **nombre registrado**
     (`guest_name`) con el `state` y los asistentes de esa fila; **no** trae objeto `guest` ni el
     teléfono.
   - **Teléfono sin fila** (o con la fila en `viewed`/`status` vacío): `response` es `null` y
     **no** es un error (es la primera respuesta del invitado).

   En los dos casos, la fila de `guests` **no** cambia: ni su `status` (el `viewed` se escribe
   solo al abrir una personalizada) ni su `datetime`. Un teléfono de menos de 10 dígitos responde
   `INVALID_PHONE`, sin teléfono `MISSING_FIELDS` y una boda `personal` `INVALID_RESPONSE`.

## Avisos finales

- **Los libros no se versionan.** Todo lo que se rellene en los libros (ids, nombres,
  teléfonos) se queda fuera del repositorio y fuera de git.
- **La caché es una copia.** `generic_json_cache` la escribe el servicio al leer la hoja
  `generic`, para resolver códigos sin abrir el libro. Si se **borra o cambia** un código en la
  hoja `generic`, borra a mano la celda `generic_json_cache` de esa fila del maestro: la
  caché solo se refresca sola cuando no trae el código que se pide.
- **El contrato se versiona en dos sitios.** `src/constants/contract.js` (que consume la app) y
  la constante `CONTRACT_VERSION` de `gas/Code.gs` deben llevar la **misma versión**; si se
  publica un script con otra versión del contrato, conviene desplegar el par completo.
- **Redesplegar cuando cambia el contrato.** La `1.1.0` añade la consulta `lookup`: hasta que no
  se cree una **nueva versión** de la implementación (paso 5), la URL publicada sigue sirviendo
  el script anterior y responde `INVALID_RESPONSE` a esa acción.
- **Zona horaria.** El `deadline` y los `datetime` se interpretan en la zona de la hoja de
  cálculo correspondiente: fija la zona del maestro (y la de cada libro) en la zona de la boda
  antes de repartir códigos.
