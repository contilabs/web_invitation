import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ADMIN_CONTRACT_VERSION, ADMIN_SERVICE_ERRORS, NO_LIMIT } from "../../constants/contract.js";
import { wedding } from "../../data/wedding.js";
import { listAdminCodes, listAdminResponses, loginAdmin, revealAdminPhone } from "../../services/admin.js";
import { filterAdminResponses, invitationLink, invitationMessage, normalizeAdminCodes, normalizeAdminResponse, sortAdminResponses } from "../../utils/adminResponses.js";

const serviceUrl = (import.meta.env.VITE_SERVICE_URL ?? "").trim();
const weddingSlug = (import.meta.env.VITE_WEDDING_SLUG ?? "").trim();
// Barrera provisional: Vite incluye este valor en el JavaScript del panel.
const adminPassword = import.meta.env.VITE_PASSWORD ?? "";
const isConfigured = Boolean(serviceUrl && weddingSlug && adminPassword.trim());
const errorCopy = new Map(ADMIN_SERVICE_ERRORS.map(({ code, message }) => [code, message]));
const COPY = {
  spanish: { panel: "Panel privado", title: "Respuestas RSVP", refresh: "Actualizar", refreshing: "Actualizando…", search: "Buscar", all: "Todos", status: "Estado", phone: "Teléfono", allergies: "Alergias", allAllergies: "Todas", withAllergies: "Con alergias", withoutAllergies: "Sin alergias", sort: "Orden", recent: "Más recientes", name: "Nombre", clear: "Limpiar", invitations: "Invitaciones", issued: "Boletos emitidos", occupied: "Boletos ocupados", available: "Boletos sin ocupar", accepted: "Aceptadas", declined: "Rechazadas", pending: "Pendientes", responses: "Respuestas", messages: "Mensajes", codes: "Enlaces", code: "Código", spaces: "Lugares permitidos", copyMessage: "Copiar mensaje", messageCopied: "Mensaje copiado", copyLink: "Copiar link", linkCopied: "Link copiado", noCodes: "No hay enlaces disponibles.", codesError: "No pudimos cargar los enlaces.", acceptedState: "Aceptado", declinedState: "Rechazado", viewedState: "Visto", noResponses: "No hay respuestas que coincidan.", noMessages: "No hay mensajes de invitados.", nameMissing: "Sin nombre", assigned: "Boletos asignados", occupiedShort: "Boletos aceptados", message: "Mensaje", updated: "Actualización", detail: "Ver detalle", close: "Cerrar", hide: "Ocultar", reveal: "Mostrar temporalmente", notAvailable: "—", unlimited: "Sin límite", adults: "adultos", children: "niños", noAllergies: "Ninguna", noMessage: "Sin mensaje" },
  english: { panel: "Private panel", title: "RSVP responses", refresh: "Refresh", refreshing: "Refreshing…", search: "Search", all: "All", status: "Status", phone: "Phone", allergies: "Allergies", allAllergies: "All", withAllergies: "With allergies", withoutAllergies: "Without allergies", sort: "Sort", recent: "Most recent", name: "Name", clear: "Clear", invitations: "Invitations", issued: "Seats issued", occupied: "Seats occupied", available: "Seats unoccupied", accepted: "Accepted", declined: "Declined", pending: "Pending", responses: "Responses", messages: "Messages", codes: "Links", code: "Code", spaces: "Allowed seats", copyMessage: "Copy message", messageCopied: "Message copied", copyLink: "Copy link", linkCopied: "Link copied", noCodes: "No links available.", codesError: "We could not load the links.", acceptedState: "Accepted", declinedState: "Declined", viewedState: "Viewed", noResponses: "No responses match.", noMessages: "No guest messages.", nameMissing: "No name", assigned: "Seats assigned", occupiedShort: "Seats accepted", message: "Message", updated: "Updated", detail: "View details", close: "Close", hide: "Hide", reveal: "Show temporarily", notAvailable: "—", unlimited: "No limit", adults: "adults", children: "children", noAllergies: "None", noMessage: "No message" },
};
const ERROR_COPY = { spanish: { OUTDATED_SERVICE: "El servicio está desactualizado. Hay que redesplegar gas/Code.gs." }, english: { NOT_CONFIGURED: "The panel is not configured.", SERVICE_UNAVAILABLE: "We could not connect. Try again.", OUTDATED_SERVICE: "The service is outdated. Redeploy gas/Code.gs." } };

function formatDate(value, language) { return value ? new Intl.DateTimeFormat(language === "english" ? "en-US" : "es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—"; }
function statusLabel(status, copy) { return status === "accepted" ? copy.acceptedState : status === "declined" ? copy.declinedState : copy.viewedState; }
function errorLabel(code, language) { return ERROR_COPY[language]?.[code] ?? errorCopy.get(code) ?? (language === "english" ? "We could not complete the request." : "No pudimos completar la solicitud."); }

export function AdminApp() {
  const [state, setState] = useState({ status: isConfigured ? "login" : "error", data: null, code: isConfigured ? null : "NOT_CONFIGURED" });
  const [codesState, setCodesState] = useState({ status: "idle", codes: [] });
  const [session, setSession] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [filters, setFilters] = useState({ status: "", restrictions: "", query: "" });
  const [sort, setSort] = useState("datetime");
  const [tab, setTab] = useState("responses");
  const [copiedCode, setCopiedCode] = useState(null);
  const [copiedMessageCode, setCopiedMessageCode] = useState(null);
  const [selected, setSelected] = useState(null);
  const [revealedPhone, setRevealedPhone] = useState(null);
  const lastTrigger = useRef(null);
  const loadingRef = useRef(false);
  const language = state.data?.wedding?.language === "english" ? "english" : "spanish";
  const copy = COPY[language];
  const isPersonal = state.data?.wedding?.guestType === "personal";

  const load = useCallback(async () => {
    if (loadingRef.current || !session) return;
    loadingRef.current = true;
    setState((current) => ({ ...current, status: "loading", code: null }));
    const [result, codesResult] = await Promise.all([
      listAdminResponses(serviceUrl, { session }),
      listAdminCodes(serviceUrl, { session }),
    ]);
    loadingRef.current = false;
    if (result.errorCode === "INVALID_TOKEN" || codesResult.errorCode === "INVALID_TOKEN") {
      setSession("");
      setCodesState({ status: "idle", codes: [] });
      setSelected(null);
      setRevealedPhone(null);
      setLoginMessage(errorLabel("INVALID_TOKEN", "spanish"));
      setState({ status: "login", data: null, code: null });
      return;
    }
    const normalizedCodes = normalizeAdminCodes(codesResult.data);
    setCodesState(normalizedCodes.ok ? { status: "ready", codes: normalizedCodes.codes } : { status: "error", codes: [] });
    if (!result.ok) { setState((current) => ({ status: "error", data: current.data, code: result.errorCode })); return; }
    const normalized = normalizeAdminResponse(result.data);
    const errorCode = !normalized.ok && result.data?.contract && result.data.contract !== ADMIN_CONTRACT_VERSION ? "OUTDATED_SERVICE" : normalized.errorCode;
    setState(normalized.ok ? { status: "ready", data: normalized, code: null } : { status: "error", data: null, code: errorCode });
  }, [session]);
  const enterPassword = async (event) => {
    event.preventDefault();
    if (isLoggingIn) return;
    const form = event.currentTarget;
    const password = new FormData(form).get("password");
    if (password !== adminPassword) {
      setLoginMessage(errorLabel("INVALID_PASSWORD", "spanish"));
      return;
    }
    setIsLoggingIn(true);
    setLoginMessage("");
    const result = await loginAdmin(serviceUrl, weddingSlug, password);
    setIsLoggingIn(false);
    form.reset();
    if (result.data?.contract !== ADMIN_CONTRACT_VERSION && result.data) {
      setLoginMessage(errorLabel("OUTDATED_SERVICE", "spanish"));
      return;
    }
    if (!result.ok || typeof result.data?.session !== "string" || !result.data.session) {
      setLoginMessage(errorLabel(result.errorCode ?? "INVALID_RESPONSE", "spanish"));
      return;
    }
    setSession(result.data.session);
    setState({ status: "loading", data: null, code: null });
  };
  useEffect(() => { if (session) load(); }, [session, load]);
  useEffect(() => { if (!selected) return undefined; const onKeyDown = (event) => { if (event.key === "Escape") closeDetail(); }; document.addEventListener("keydown", onKeyDown); return () => document.removeEventListener("keydown", onKeyDown); }, [selected]);

  const rows = useMemo(() => state.data ? sortAdminResponses(filterAdminResponses(state.data.responses, filters), sort) : [], [state.data, filters, sort]);
  const messages = useMemo(() => rows.filter((row) => row.message), [rows]);
  const sortedCodes = useMemo(() => [...codesState.codes].sort((left, right) => (left.limit === "n" ? Number.POSITIVE_INFINITY : Number(left.limit)) - (right.limit === "n" ? Number.POSITIVE_INFINITY : Number(right.limit))), [codesState.codes]);
  const openDetail = (row) => { revealRequestRef.current += 1; setSelected(row); setRevealedPhone(null); lastTrigger.current = document.activeElement; };
  const closeDetail = () => { revealRequestRef.current += 1; setSelected(null); setRevealedPhone(null); lastTrigger.current?.focus?.(); };
  const revealRequestRef = useRef(0);
  const revealPhone = async () => {
    const guestId = selected?.guestId;
    if (!guestId) return;
    const requestId = revealRequestRef.current + 1;
    revealRequestRef.current = requestId;
    const result = await revealAdminPhone(serviceUrl, guestId, { session });
    if (revealRequestRef.current === requestId && selected?.guestId === guestId && result.ok && typeof result.data?.phone === "string") setRevealedPhone(result.data.phone);
  };
  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const resetFilters = () => setFilters({ status: "", restrictions: "", query: "" });
  const copyInvitationLink = async (code) => {
    await navigator.clipboard.writeText(invitationLink(code, window.location.href));
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode((current) => current === code ? null : current), 1800);
  };
  const copyInvitationMessage = async (code, limit) => {
    const link = invitationLink(code, window.location.href);
    const { nombre, mensajeEnlace, mensajeEnlaceSinLimite } = wedding.marca;
    const template = limit === NO_LIMIT && mensajeEnlaceSinLimite ? mensajeEnlaceSinLimite : mensajeEnlace;
    const message = invitationMessage(template, { couple: nombre, limit, link });
    await navigator.clipboard.writeText(message);
    setCopiedMessageCode(code);
    window.setTimeout(() => setCopiedMessageCode((current) => current === code ? null : current), 1800);
  };
  const seats = (value) => value === null || value === undefined ? copy.notAvailable : String(value);
  const assignedText = (row) => isPersonal ? `${row.assignedAdults} ${copy.adults}${row.assignedChildren ? ` · ${row.assignedChildren} ${copy.children}` : ""}` : seats(row.assignedSeats);
  const occupiedText = (row) => isPersonal ? `${row.adultsAttendees} ${copy.adults}${row.childAttendees ? ` · ${row.childAttendees} ${copy.children}` : ""}` : String(row.occupiedSeats);

  if (state.status === "login") return (
    <div className="admin-shell">
      <section className="admin-notice">
        <p className="admin-kicker">{copy.panel}</p>
        <h1>{copy.title}</h1>
        <form method="post" onSubmit={enterPassword}>
          <label>Contraseña<input name="password" type="password" autoComplete="current-password" required /></label>
          <p role="status">{loginMessage}</p>
          <button type="submit" disabled={isLoggingIn}>{isLoggingIn ? "Validando…" : "Entrar"}</button>
        </form>
      </section>
    </div>
  );

  return <div className="admin-shell">
    <header className="admin-header"><div><p className="admin-kicker">{copy.panel}</p><h1>{copy.title}</h1></div>{session && <button type="button" onClick={load} disabled={state.status === "loading"}>{state.status === "loading" ? copy.refreshing : copy.refresh}</button>}</header>
    {state.status === "error" && <section className="admin-notice" role="alert"><h2>{errorLabel(state.code, language)}</h2>{["SERVICE_UNAVAILABLE", "GUEST_SHEET_UNAVAILABLE", "INVALID_RESPONSE", "INVALID_DATA"].includes(state.code) && <button type="button" onClick={load}>{copy.refresh}</button>}</section>}
    {state.status === "loading" && !state.data && <p className="admin-status" role="status">{copy.refreshing}</p>}
    {state.data && <>
      <section className="admin-summary" aria-label={copy.invitations}>{[["total", copy.invitations], ["seatsIssued", copy.issued], ["seatsOccupied", copy.occupied], ["seatsUnoccupied", copy.available], ["accepted", copy.accepted], ["declined", copy.declined], ...(isPersonal ? [["pending", copy.pending]] : [])].map(([key, label]) => <div className={`admin-metric admin-metric-${key}`} key={key}><strong>{seats(state.data.summary[key])}</strong><span>{label}</span></div>)}</section>
      <p className="admin-updated">{copy.updated}: {formatDate(state.data.wedding.updatedAt, language)} · {tab === "messages" ? messages.length : rows.length} {language === "english" ? "matches" : "coincidencias"}</p>
      <nav className="admin-tabs" aria-label={language === "english" ? "Panel sections" : "Secciones del panel"}><button type="button" className={tab === "responses" ? "is-active" : ""} onClick={() => setTab("responses")}>{copy.responses}</button><button type="button" className={tab === "messages" ? "is-active" : ""} onClick={() => setTab("messages")}>{copy.messages}</button>{!isPersonal && <button type="button" className={tab === "codes" ? "is-active" : ""} onClick={() => setTab("codes")}>{copy.codes}</button>}</nav>
      {tab === "codes" && <section className="admin-codes" aria-label={copy.codes}><h2>{copy.codes}</h2>{codesState.status === "error" ? <p className="admin-status" role="alert">{copy.codesError}</p> : sortedCodes.length === 0 ? <p className="admin-status">{copy.noCodes}</p> : <div className="admin-table-wrap"><table><caption className="visually-hidden">{copy.codes}</caption><thead><tr><th>{copy.spaces}</th><th>{language === "english" ? "Actions" : "Acciones"}</th></tr></thead><tbody>{sortedCodes.map((item) => <tr key={item.code}><td data-label={copy.spaces}>{item.limit === "n" ? copy.unlimited : item.limit}</td><td data-label={language === "english" ? "Actions" : "Acciones"}><div className="admin-link-actions"><button type="button" aria-label={`${copy.copyMessage} (${item.limit === "n" ? copy.unlimited : item.limit})`} onClick={() => copyInvitationMessage(item.code, item.limit)}>{copiedMessageCode === item.code ? copy.messageCopied : copy.copyMessage}</button><button type="button" className="admin-button-secondary" aria-label={`${copy.copyLink} (${item.limit === "n" ? copy.unlimited : item.limit})`} onClick={() => copyInvitationLink(item.code)}>{copiedCode === item.code ? copy.linkCopied : copy.copyLink}</button></div></td></tr>)}</tbody></table></div>}</section>}
      <section className="admin-filters" aria-label={language === "english" ? "Filters" : "Filtros"}><label>{copy.search}<input value={filters.query} onChange={(event) => setFilter("query", event.target.value)} /></label><label>{copy.status}<select value={filters.status} onChange={(event) => setFilter("status", event.target.value)}><option value="">{copy.all}</option>{isPersonal && <option value="viewed">{copy.viewedState}</option>}<option value="accepted">{copy.acceptedState}</option><option value="declined">{copy.declinedState}</option></select></label><label>{copy.allergies}<select value={filters.restrictions} onChange={(event) => setFilter("restrictions", event.target.value)}><option value="">{copy.allAllergies}</option><option value="yes">{copy.withAllergies}</option><option value="no">{copy.withoutAllergies}</option></select></label><label>{copy.sort}<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="datetime">{copy.recent}</option><option value="name">{copy.name}</option><option value="status">{copy.status}</option></select></label><button type="button" onClick={resetFilters}>{copy.clear}</button></section>
      {tab === "responses" ? <div className="admin-table-wrap"><table><caption className="visually-hidden">{copy.responses}</caption><thead><tr><th>{copy.status}</th><th>{copy.name}</th><th>{copy.phone}</th><th>{copy.assigned}</th><th>{copy.occupiedShort}</th><th>{copy.allergies}</th><th>{copy.updated}</th><th><span className="visually-hidden">{copy.detail}</span></th></tr></thead><tbody>{rows.map((row) => <tr className={`admin-row admin-row-${row.status}`} key={row.guestId}><td data-label={copy.status}><span className={`admin-status admin-status-${row.status}`}>{statusLabel(row.status, copy)}</span></td><td data-label={copy.name}>{row.guestName ?? copy.nameMissing}</td><td data-label={copy.phone}>{row.phoneMasked}</td><td data-label={copy.assigned}>{assignedText(row)}</td><td data-label={copy.occupiedShort}>{occupiedText(row)}</td><td data-label={copy.allergies}>{row.allergies ?? copy.noAllergies}</td><td data-label={copy.updated}>{formatDate(row.datetime, language)}</td><td data-label={copy.detail}><button type="button" onClick={() => openDetail(row)}>{copy.detail}</button></td></tr>)}</tbody></table>{rows.length === 0 && <p className="admin-status">{copy.noResponses}</p>}</div> : <div className="admin-table-wrap"><table><caption className="visually-hidden">{copy.messages}</caption><thead><tr><th>{copy.status}</th><th>{copy.name}</th><th>{copy.message}</th></tr></thead><tbody>{messages.map((row) => <tr className={`admin-row admin-row-${row.status}`} key={row.guestId}><td data-label={copy.status}><span className={`admin-status admin-status-${row.status}`}>{statusLabel(row.status, copy)}</span></td><td data-label={copy.name}>{row.guestName ?? copy.nameMissing}</td><td data-label={copy.message}>{row.message}</td></tr>)}</tbody></table>{messages.length === 0 && <p className="admin-status">{copy.noMessages}</p>}</div>}
    </>}
    {selected && <div className="admin-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDetail(); }}><section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title"><button className="admin-close" type="button" onClick={closeDetail}>{copy.close}</button><h2 id="detail-title">{copy.detail}</h2><dl><dt>{copy.status}</dt><dd><span className={`admin-status admin-status-${selected.status}`}>{statusLabel(selected.status, copy)}</span></dd><dt>{copy.name}</dt><dd>{selected.guestName ?? copy.nameMissing}</dd><dt>{copy.phone}</dt><dd>{revealedPhone ?? selected.phoneMasked} {revealedPhone ? <button type="button" onClick={() => setRevealedPhone(null)}>{copy.hide}</button> : <button type="button" onClick={revealPhone}>{copy.reveal}</button>}</dd><dt>{copy.assigned}</dt><dd>{assignedText(selected)}</dd><dt>{copy.occupiedShort}</dt><dd>{occupiedText(selected)}</dd><dt>{copy.allergies}</dt><dd>{selected.allergies ?? copy.noAllergies}</dd><dt>{copy.message}</dt><dd>{selected.message ?? copy.noMessage}</dd><dt>{copy.updated}</dt><dd>{formatDate(selected.datetime, language)}</dd></dl></section></div>}
  </div>;
}
