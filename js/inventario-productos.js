/* =========================================================
   ZAGA · Inventario de productos
   Script exclusivo de esta pantalla (buscador y modal)
   Solo comportamiento visual (sin lógica de datos real)
   ========================================================= */

(function () {
  "use strict";

  // ---------- Elementos ----------
  const searchInput = document.getElementById("searchInput");
  const rows = Array.from(document.querySelectorAll("#productsBody .row"));
  const countText = document.getElementById("countText");
  const showingText = document.getElementById("showingText");
  const emptyState = document.getElementById("emptyState");

  const modal = document.getElementById("deleteModal");
  const modalImg = document.getElementById("modalImg");
  const modalName = document.getElementById("modalName");
  const modalInfo = document.getElementById("modalInfo");
  const confirmBtn = document.getElementById("confirmDelete");

  let lastFocused = null;

  // ---------- Buscador (filtro visual) ----------
  function normalize(text) {
    return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function pluralize(n) {
    return n + (n === 1 ? " producto" : " productos");
  }

  function filterRows() {
    const query = normalize(searchInput.value.trim());
    let visible = 0;

    rows.forEach((row) => {
      const haystack = normalize(row.dataset.name + " " + row.dataset.category);
      const match = haystack.includes(query);
      row.hidden = !match;
      if (match) visible++;
    });

    countText.textContent = pluralize(visible);
    showingText.textContent = "Mostrando " + visible + " de " + rows.length + " productos";
    emptyState.hidden = visible !== 0;
  }

  searchInput.addEventListener("input", filterRows);

  // ---------- Modal de eliminar ----------
  function openModal(row) {
    lastFocused = document.activeElement;

    modalImg.src = row.dataset.image;
    modalImg.alt = row.dataset.name;
    modalName.textContent = row.dataset.name;
    modalInfo.textContent = row.dataset.category + " · " + row.dataset.price;

    modal.hidden = false;
    document.body.classList.add("no-scroll");
    confirmBtn.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("no-scroll");
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.closest(".row")));
  });

  modal.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeModal();
  });

  // Por ahora "Eliminar" solo cierra el modal (sin funcionalidad real)
  confirmBtn.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();

    // Mantiene el foco dentro del modal con Tab
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
})();
