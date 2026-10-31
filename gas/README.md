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
   | `public_json_cache` | **No se rellena a mano**: es la caché de la hoja `public` y la escribe el servicio. |

3. Reglas que el maestro debe cumplir (el servicio falla de forma visible si no):
   - **Obligatorias:** `slug`, `is_active`, `guests_sheet_id` y `guest_type`. `deadline`,
     `generic_json_cache` y `public_json_cache` pueden faltar o estar vacías.
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

## Paso 2 — Crear el libro de invitados de cada boda (hojas `guests`, `generic` y `public`)

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
- **Las celdas de asistentes pueden quedar vacías** (`adults_attendees`, `child_attendees`): el
  servicio las lee como **cero**, así que **no hay que rellenar nada**. Solo es un dato
  incoherente una celda **con** un valor que no sea un entero ≥ 0 (`"x"`, `-1`, `1,5`): eso sí
  falla de forma visible (`INVALID_DATA`).
- Formatear la columna `phone` como **texto** (Formato → Número → Texto) **antes** de rellenarla
  en el libro de una boda genérica o pública: el teléfono es la **llave** y un número guardado
  como número perdería sus ceros a la izquierda.

### Hoja `generic` (obligatoria en `generic`; no hace falta en `personal` ni en `public`)

Renombrar otra hoja a **`generic`** con estas cabeceras en la fila 1: `generic_id`, `limit`.

- Cada fila es un **código de enlace** (el valor del parámetro `guest`): `generic_id` con el
  código y `limit` con el **entero mayor que cero** de adultos que ese código permite **en cada
  respuesta** (el cupo no se agota: sirve para muchos invitados).
- Los códigos corrientes deben ser **opacos** (RNF-2): sin nombres, sin correos ni teléfonos,
  porque quien comparte el enlace comparte el código.
- Los códigos se comparan **normalizados** (sin distinguir mayúsculas), así que `public` en
  minúsculas también resuelve.
- En una boda **personalizada** —y en una boda **pública**, que resuelve en `public`— esta hoja
  **no** hace falta.
- **El código público sale de `generic`.** El código reservado **`PUBLIC`** (y cualquier otro
  código sin tope o el público de la boda) va en la hoja `public` (ver abajo). **No** se debe añadir
  ni mantener la fila `PUBLIC` en `generic`: si se queda ahí, el servicio la trata con la regla de
  **su** hoja y responde `MALFORMED_GUEST` (véase el punto 8).

### Hoja `public` (obligatoria en `public`; opcional en `generic` si se usa algún código público/compartido)

Renombrar otra hoja a **`public`** con estas **dos cabeceras exactas** en la fila 1: **`public_id`** y **`limit`**.

- Cada fila es un **código de enlace** (el valor del parámetro `guest`): `public_id` con el
  código y `limit` con el **entero mayor que cero** de adultos que ese código permite **en cada
  respuesta**, o con el texto **`n`** (**sin tope**).
- El código reservado **`PUBLIC`** (con `limit` = el texto **`n`**, sin tope) es la invitación
  pública de la boda, la que se comparte con todos; vive **aquí**, no en `generic`.
- Los códigos corrientes deben ser **opacos** (RNF-2): sin nombres, sin correos ni teléfonos,
  porque quien comparte el enlace comparte el código.
- Los códigos se comparan **normalizados** (sin distinguir mayúsculas).
- En una boda **personalizada** esta hoja **no** hace falta.
- Si la hoja existe pero le falta una de sus dos cabeceras (`public_id` o `limit`), el servicio
  falla de forma visible (`INVALID_DATA`): las dos cabeceras son **exactas**.

### Columna del maestro: `public_json_cache`

En la hoja **`files`** del maestro hay también la columna **`public_json_cache`** (junto a
`generic_json_cache`). **No se rellena a mano**: es una **segunda caché** que escribe el servicio
para resolver códigos de la hoja `public` sin abrir el libro de invitados. Funciona con la misma
regla que `generic_json_cache` (se refresca sola cuando no trae el código que se pide). El hecho
de que esté vacía o que el maestro **no la declare** **no** es un fallo por sí mismo.

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
7. `public_json_cache`: vacío (la llena el servicio).

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

Para los lanzadores Docker locales, exportarlas en el entorno del proceso (ejemplo bash/zsh):

```bash
export VITE_SERVICE_URL="https://script.google.com/macros/s/<id de la implementación>/exec"
export VITE_WEDDING_SLUG="<slug de la boda>"
npm run dev
```

Los lanzadores solo transmiten esas dos variables públicas: no leen ni copian `.env.local`
ni otros archivos `.env`. Reiniciar para aplicar cambios. `npm run preview` compila y sirve
con ellas; `npm run build` solo valida y descarta el build dentro del contenedor.
Para publicar y conservar `dist/`, configurar esos valores en el entorno aislado de CI/hosting
antes del build (ver [seguridad local](../docs/local-security.md)). Nunca versionarlos.
Cada boda se publica con **su** `slug`: cambiar de boda es cambiar esta variable (y el contenido
del registro), tocar los libros o el script.

## Paso 7 — Comprobaciones de la puesta en marcha

La verificación automática del repositorio (`npm test`) **no** toca el servicio en vivo: va
contra el módulo del contrato (RNF-10). Estas comprobaciones se hacen **a mano** contra el
despliegue nuevo:

> **Diagnóstico rápido.** Con un maestro bien formado, si **todas** las peticiones responden
> `INVALID_DATA`, comprueba que la propiedad del script se llame exactamente
> `MASTER_SHEET_ID` y que el script la lea **por su nombre** (`getProperty('MASTER_SHEET_ID')`):
> pasar el **valor** de la propiedad a `getProperty` devuelve `null` y hace fallar
> `readMaster_` con cualquier maestro. Y recuerda que todo cambio en `Code.gs` exige una
> **nueva versión** de la implementación (paso 5).

1. **Salud.** Abrir la URL `…/exec` en el navegador (o con un `GET`): debe responder el JSON
   `{"ok":true,"code":"OK","contract":"1.3.0"}`. Si responde una página de error, el script no
   está publicado o falla al arrancar: revisar la implementación y la propiedad
   `MASTER_SHEET_ID`. Si la respuesta trae **`contract: "1.2.0"`** (o anterior), el despliegue es
   **viejo**: no reconoce la hoja `public` y hay que **redesplegar** (aviso de redespliegue).
2. **Los tres tipos.** Abrir la invitación con un enlace `…?guest=<código>` de cada tipo
   (`<guest_id>` de una fila precargada, un `generic_id` y un `public_id` —el reservado `PUBLIC`—)
   y comprobar que la personalización aparece con el nombre, el cupo y el plazo del libro.
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

7. **Cabeceras que la consulta no necesita (spec 005, RF-15, R13).** La consulta exige **solo**
   la cabecera **`phone`** en la hoja `guests`; las demás que lee son opcionales y **no** deben
   hacerla fallar. Se comprueba con `POST` sobre un **libro de prueba** (no el real) y cuerpo
   `{"action":"lookup","slug":"<slug>","code":"<código>","phone":"<10 dígitos>"}`:
   - **Libro sin `guest_name` y/o sin `status`** → la consulta **funciona**: `ok: true` y la fila
     de ese teléfono. Sin `guest_name`, `response.name` viene vacío (`null`); sin `status`,
     `response` es `null` (primera respuesta). **No** responde `INVALID_DATA`.
   - **Libro sin `phone`** → **sí** falla, con `INVALID_DATA`: sin esa columna no hay fila que
     localizar. Este `INVALID_DATA` **sí** es el fallo real y no se confunde con el anterior.
   - **Maestro sin `generic_json_cache` (ni `public_json_cache`)** → **no** es el motivo de un
     `INVALID_DATA`: la caché es una **copia** y la columna es opcional; el código se resuelve
     leyendo la hoja `generic` o `public` (avisos finales, «La caché es una copia»). Un
     `INVALID_DATA` con una **cabecera ausente** solo corresponde a una columna que **de verdad** se
     necesita: `phone` en la consulta, o las columnas obligatorias de la **escritura** (paso 7.3).

   > **Aviso de redespliegue (obligatorio).** La tolerancia de la consulta vive en el **script**,
   > así que **hasta que no se cree una nueva versión de la implementación** (paso 5) la URL
   > publicada sigue sirviendo el `Code.gs` anterior y la consulta **sigue exigiendo las tres
   > cabeceras** (`phone`, `guest_name` y `status`): el punto 7.1 daría `INVALID_DATA` otra vez.
   > Ahora, además, la **versión del contrato sube** (`1.3.0`), así que un despliegue viejo **se
   > delata** en la salud: un `GET` a la URL responde `contract: "1.2.0"` en vez de `"1.3.0"`.
   > La comprobación manual del punto 7 es, aun así, el control de que el redespliegue se hizo;
   > hacerlo antes de dar el cambio por publicado.

8. **Un código mal formado = dato del libro, no de la app (diagnóstico).** Cuando el código **existe**
   en la hoja que le toca pero su `limit` **no cumple la regla de esa hoja**, el servicio responde
   **`MALFORMED_GUEST`** («El código de esta invitación no es válido.»), **no** `INVALID_DATA`. Sale
   de la función `resolveCode_` (`gas/Code.gs`), que aplica la regla del **tipo de boda**:

   - Hoja **`generic`**: el `limit` de ese código tiene que ser un **entero mayor que cero**;
   - Hoja **`public`**: el `limit` tiene que ser un **entero mayor que cero** **o** el texto
     **`"n"`** (sin tope);
   - **Cualquier otro valor** → **`MALFORMED_GUEST`**.

   **Qué hoja se mira, según el tipo** (D29): primero la hoja **de su tipo** y solo después la otra.

   | Tipo (`guest_type`) | Hoja que se mira | Cuándo se mira la otra |
   | --- | --- | --- |
   | `personal` | `guests` (obligatoria) | Ni `generic` ni `public` hacen falta (RF-5). |
   | `generic` | `generic` (obligatoria) | `public`, **solo** si el libro la tiene y el código pedido **no está** en `generic`. |
   | `public` | `public` (obligatoria) | `generic` ya no hace falta para servirla; su ausencia **no** es un fallo. |

   Por eso **un código de `public` en una boda `generic` sí resuelve**: si el libro tiene la hoja
   `public` y el código pedido **no está** en `generic`, el servicio lo busca allí. Y por eso **la fila
   `PUBLIC` que se queda en `generic` no resuelve**: como esa boda es de tipo genérico, un código
   `PUBLIC` con `limit = "n"` **no** cumple la regla de **esa** hoja y responde **`MALFORMED_GUEST`**
   **con o sin teléfono**, en `resolve` y en `lookup` (el fallo ocurre al **resolver el código**,
   antes de mirar el teléfono: no es la caché —coincide con la hoja— ni el `lookup`). La app **no**
   inventa `PUBLIC`: solo lo usa si el enlace lo trae.

   Para **distinguirlo** de los otros fallos:

   | Síntoma | Causa |
   | --- | --- |
   | `MALFORMED_GUEST` al primer contacto, con o sin teléfono | El código **existe** en su hoja pero su `limit` no cumple la regla de **esa** hoja (p. ej. la fila `PUBLIC` que se quedó en `generic`). |
   | `MISSING_FIELDS` | A la consulta le falta el teléfono. |
   | `UNKNOWN_GUEST` | El código no está en la hoja que se mira (`generic`, `public` o `guests`) de esa boda. |
   | `INVALID_DATA` **después** de resolver el código | Falta una cabecera que de verdad se necesita: `phone` en la consulta, o las obligatorias de la escritura (punto 7). |
   | `INVALID_DATA` con el maestro sin `generic_json_cache` ni `public_json_cache` | **No** es el fallo: la caché es una copia (avisos finales). |

   **El arreglo es de datos, no de código:** **borrar** la fila `PUBLIC` de la hoja `generic` de esa
   boda y **llevar el código público a la hoja `public`** (con su `limit`); **no** se rellena ni se
   inventa ningún valor y **no** se toca el servicio ni el contrato. Los códigos corrientes (p. ej.
   `4236_GEN`) llevan su `limit` numérico y resuelven bien. Para las pruebas de una boda
   `generic`/`public` usa un **código real** de su hoja (`4236_GEN`), nunca `PUBLIC` en una boda
   `generic`. Ejemplo de cuerpo (teléfono ficticio): `{"action":"lookup","slug":"<slug>","code":"4236_GEN","phone":"5512345678"}`.

## Avisos finales

- **Los libros no se versionan.** Todo lo que se rellene en los libros (ids, nombres,
  teléfonos) se queda fuera del repositorio y fuera de git.
- **Las cachés son copias.** `generic_json_cache` (hoja `generic`) y `public_json_cache` (hoja
  `public`) las escribe el servicio al leer su hoja, para resolver códigos sin abrir el libro. Si
  se **borra o cambia** un código en una de esas hojas, borra a mano la celda de caché
  correspondiente de esa fila del maestro: la caché solo se refresca sola cuando no trae el código
  que se pide. Que el maestro **no declare** esas columnas (o estén vacías) **no** es un fallo: el
  código se resuelve leyendo la hoja, así que tampoco es el motivo de un `INVALID_DATA` en la
  consulta `lookup` (punto 7).
- **El contrato se versiona en dos sitios.** `src/constants/contract.js` (que consume la app) y
  la constante `CONTRACT_VERSION` de `gas/Code.gs` deben llevar la **misma versión** (`1.3.0`); si
  se publica un script con otra versión del contrato, conviene desplegar el par completo.
- **Todo cambio en `Code.gs` exige una versión nueva de la implementación** (paso 5). Como la
  versión del contrato **sube** a `1.3.0` (hoja `public` y `public_json_cache`), un despliegue
  viejo **se delata** en la salud: un `GET` a la URL responde `contract: "1.2.0"` (o anterior) en
  vez de `"1.3.0"`. Hasta que no se redespliegue, la URL publicada sigue sirviendo el script
  anterior: no reconoce la hoja `public` y un código de `public` no resuelve.
- **Redesplegar también cuando cambia el comportamiento sin cambiar la forma.** Un cambio que no
  altera la **forma** del intercambio puede dejar la versión del contrato igual; en ese caso nada
  en la respuesta lo delata y la única comprobación es manual (punto 7).
- **Zona horaria.** El `deadline` y los `datetime` se interpretan en la zona de la hoja de
  cálculo correspondiente: fija la zona del maestro (y la de cada libro) en la zona de la boda
  antes de repartir códigos.

## Paso 8 — Panel privado de respuestas (spec 006)

Este panel es **independiente** del contrato público 1.4.0. Usa el contrato administrativo `1.1.0` (`src/constants/contract.js`).

### Permisos y autorización (server-side)
- **Autenticación:** token de 5 dígitos enviado por `MailApp` a `admin_email`.
- **Control:** cada solicitud de correo genera y guarda un token nuevo; `counter` cuenta intentos
  fallidos del token vigente y al cuarto se genera y envía otro token.
- **Boda:** el panel resuelve la fila por `admin_email`; no recibe ni acepta un `slug`.
- **Sesión:** el token permanece solo en memoria de `admin.html` y se pierde al cerrar la página.
- **Errores claros:** correo no configurado → `INVALID_ADMIN_EMAIL`, token incorrecto → `INVALID_TOKEN`, cuatro intentos → `TOKEN_RESET`, columnas ausentes → `NOT_CONFIGURED`.
- **Autorización inicial:** ejecutar una vez `authorizeAdminMail` desde el editor de Apps Script
  con la cuenta propietaria del deployment y aceptar el permiso de envío. Si el envío falla,
  el servicio devuelve `EMAIL_UNAVAILABLE`.

### Privacidad
- **Teléfono enmascarado:** siempre se devuelve `phoneMasked` (`****1234`). No se expone el teléfono completo por defecto (D3).
- **Sin PII en logs:** los `console.info/error` del panel no incluyen nombres, teléfonos, mensajes ni restricciones.
- **Sin datos sensibles en cliente:** el frontend no envía secretos, no usa `localStorage` para credenciales ni persiste el teléfono revelado.

### Despliegue del panel

El panel es una entrada React estática (`admin.html`) y usa `VITE_SERVICE_URL` para llamar el
Web App mediante `fetch` sin credenciales. El acceso se controla con token y no
depende de sesión Google ni de cookies CORS.

1. Añadir el correo autorizado en `admin_email` de la fila correspondiente de `files` y
   dejar `token` vacío y `counter` en `0`.
2. Configurar `VITE_SERVICE_URL`; el panel y la invitación usan el mismo deployment. La
   autorización se hace con `admin_email` + token.
3. Al cambiar `Code.gs`, crear una nueva versión del deployment.

### Revocación de acceso
- **Revocar acceso:** borrar `admin_email` o `token` de la fila y crear una **nueva versión** de la implementación.
- **Desactivar boda:** poner `is_active` en `FALSE` en el maestro → `INACTIVE_WEDDING`.
- **Quitar permisos del libro/maestro:** si el script pierde acceso, responde `GUEST_SHEET_UNAVAILABLE`/errores de configuración.

### Redespliegue
- Cualquier cambio en la lógica del panel exige **nueva versión** de la implementación web. La misma URL sirve la nueva versión.
- Mantener sincronía con `src/constants/contract.js` (contrato administrativo `1.1.0`).

### Libro de prueba sintético (sin datos personales)
Ver `docs/panel-respuestas-pruebas.md`. Usar ese libro sintético para verificar:
- Autorización válida / no autorizada / sin sesión
- Estados `viewed`/`accepted`/`declined`, totales (adultos/niños excluyen `declined`), `pending` = `viewed`
- Celdas vacías de asistentes como 0, filas con datos ausentes
- Servicio caído / errores claros
- Sin exposición de PII

### Casos límite
- **Sin `admin_email`, `token` o `counter`:** `NOT_CONFIGURED`.
- **Fila incompleta / sin cabeceras mínimas:** `INVALID_DATA` sin colapsar con error de auth.
- **Filas vacías:** se omiten sin romper el listado.
- **Estado inválido:** se ignora esa fila de forma segura (sin romper auth/listado).
- **Consulta única sin paginación:** se devuelve todo el listado de la hoja `guests` (D4).
