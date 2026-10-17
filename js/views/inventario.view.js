/* =========================================================
   VISTA · Inventario de productos
   Solo toca el DOM: no lee ni guarda datos.
   ========================================================= */

const $ = (id) => document.getElementById(id);

const tbody = $("productsBody");
const searchInput = $("searchInput");
const countText = $("countText");
const showingText = $("showingText");
const emptyState = $("emptyState");

const modal = $("deleteModal");
const modalImg = $("modalImg");
const modalName = $("modalName");
const modalInfo = $("modalInfo");
const confirmBtn = $("confirmDelete");

let lastFocused = null;

const ICON_EDIT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>';
const ICON_DELETE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>';

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

const pluralize = (n) => n + (n === 1 ? " producto" : " productos");

// ---------- Tabla ----------
export const disponible = () => Boolean(tbody);

export const filas = () => Array.from(tbody.querySelectorAll("tr.row"));

export function datosFila(tr) {
  return {
    id: tr.dataset.id,
    name: tr.dataset.name,
    category: tr.dataset.category,
    price: tr.dataset.price,
    image: tr.dataset.image,
    status: tr.querySelector(".badge").textContent.trim()
  };
}

export function asignarId(tr, id) { tr.dataset.id = id; }

export function enlazarEditar(tr) {
  const link = tr.querySelector(".action--edit");
  if (link) link.href = "editar-producto.html?id=" + encodeURIComponent(tr.dataset.id);
}

// Aplica a una fila del HTML los cambios guardados
export function aplicarEdicion(tr, e) {
  tr.dataset.name = e.name; tr.dataset.category = e.category;
  tr.dataset.price = e.price; tr.dataset.image = e.image;
  tr.querySelector(".cell--name").textContent = e.name;
  tr.querySelector(".cell--category").textContent = e.category;
  tr.querySelector(".cell--price").textContent = e.price;
  tr.querySelector(".badge").textContent = e.status;
  const img = tr.querySelector(".thumb");
  img.src = e.image; img.alt = e.name;
}

// Fila de un producto creado por el usuario
export function agregarFila(p) {
  const tr = document.createElement("tr");
  tr.className = "row";
  tr.dataset.id = p.id;
  tr.dataset.name = p.name;
  tr.dataset.category = p.category;
  tr.dataset.price = p.price;
  tr.dataset.image = p.image;
  tr.innerHTML = `
    <td class="cell cell--img"><img class="thumb" src="${esc(p.image)}" alt="${esc(p.name)}"></td>
    <td class="cell cell--name">${esc(p.name)}</td>
    <td class="cell cell--category">${esc(p.category)}</td>
    <td class="cell cell--price">${esc(p.price)}</td>
    <td class="cell cell--status"><span class="badge">${esc(p.status)}</span></td>
    <td class="cell cell--action">
      <a href="editar-producto.html?id=${encodeURIComponent(p.id)}" class="action action--edit">${ICON_EDIT}<span>Editar</span></a>
    </td>
    <td class="cell cell--action">
      <button class="action action--delete" type="button" data-delete>${ICON_DELETE}<span>Eliminar</span></button>
    </td>`;
  tbody.appendChild(tr);
}

export const quitarFila = (tr) => tr.remove();
export const mostrarFila = (tr, visible) => { tr.hidden = !visible; };

// ---------- Buscador y conteos ----------
export const leerBusqueda = () => searchInput.value.trim();

export function actualizarConteos(visibles, total) {
  countText.textContent = pluralize(visibles);
  showingText.textContent = "Mostrando " + visibles + " de " + total + " productos";
  emptyState.hidden = visibles !== 0;
}

// ---------- Modal de eliminar ----------
export function abrirModal(fila) {
  lastFocused = document.activeElement;

  modalImg.src = fila.image;
  modalImg.alt = fila.name;
  modalName.textContent = fila.name;
  modalInfo.textContent = fila.category + " · " + fila.price;

  modal.hidden = false;
  document.body.classList.add("no-scroll");
  confirmBtn.focus();
}

export function cerrarModal() {
  modal.hidden = true;
  document.body.classList.remove("no-scroll");
  if (lastFocused) lastFocused.focus();
}

// ---------- Eventos (los atiende el controlador) ----------
export function bindBuscar(handler) {
  searchInput.addEventListener("input", handler);
}

export function bindEditar(handler) {
  tbody.addEventListener("click", (ev) => {
    const link = ev.target.closest(".action--edit");
    if (link) handler(link.closest("tr"));
  });
}

export function bindEliminar(handler) {
  tbody.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-delete]");
    if (btn) handler(btn.closest("tr"));
  });
}

export function bindConfirmarEliminar(handler) {
  confirmBtn.addEventListener("click", handler);
}

// Comportamiento propio del modal: cerrar y mantener el foco con Tab
export function activarModal() {
  modal.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) cerrarModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) cerrarModal();

    if (e.key === "Tab" && !modal.hidden) {
      const focusables = modal.querySelectorAll("button");
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}
