/* =========================================================
   Productos guardados y editados · ZAGA Administración
   Incluir en inventario-productos.html ANTES de inventario-productos.js
   - Pinta las filas de los productos creados en "Nuevo producto"
   - Aplica las ediciones hechas a los productos que ya venían en el HTML
   - Hace que "Editar" abra el producto seleccionado
   - Si se elimina una fila creada por el usuario, la borra de localStorage
   ========================================================= */
(function () {
  const KEY = 'zaga_productos';        // productos creados por el usuario
  const EDITS = 'zaga_ediciones';      // ediciones de los productos que venían en el HTML
  const SNAP = 'zaga_producto_editar'; // producto seleccionado para editar
  const DELETED = 'zaga_eliminados';   // ids de productos del HTML que se eliminaron
  const tbody = document.getElementById('productsBody');
  if (!tbody) return;

  const read = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
    catch { return fallback; }
  };
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const slug = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const ICON_EDIT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>';
  const ICON_DELETE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>';

  console.log('[ZAGA] productos-guardados.js cargado. Productos guardados:', read(KEY, []).length);

  // 1) Filas que ya venían en el HTML: darles id, aplicar ediciones y enlazar "Editar"
  const edits = read(EDITS, {});
  const deleted = read(DELETED, []);
  tbody.querySelectorAll('tr.row').forEach((tr) => {
    if (!tr.dataset.id) tr.dataset.id = 'base-' + slug(tr.dataset.name || '');
    if (deleted.includes(tr.dataset.id)) { tr.remove(); return; } // ya fue eliminado antes
    const e = edits[tr.dataset.id];
    if (e) {
      tr.dataset.name = e.name; tr.dataset.category = e.category;
      tr.dataset.price = e.price; tr.dataset.image = e.image;
      tr.querySelector('.cell--name').textContent = e.name;
      tr.querySelector('.cell--category').textContent = e.category;
      tr.querySelector('.cell--price').textContent = e.price;
      tr.querySelector('.badge').textContent = e.status;
      const img = tr.querySelector('.thumb');
      img.src = e.image; img.alt = e.name;
    }
    const link = tr.querySelector('.action--edit');
    if (link) link.href = 'editar-producto.html?id=' + encodeURIComponent(tr.dataset.id);
  });

  // 2) Filas de los productos creados por el usuario
  read(KEY, []).forEach((p) => {
    const tr = document.createElement('tr');
    tr.className = 'row';
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
  });

  // 3) Al hacer clic en "Editar", guardar los datos de ESA fila para la página de editar
  tbody.addEventListener('click', (ev) => {
    const link = ev.target.closest('.action--edit');
    if (!link) return;
    const tr = link.closest('tr');
    const saved = read(KEY, []).find((p) => String(p.id) === tr.dataset.id);
    const e = edits[tr.dataset.id] || {};
    const snapshot = saved || {
      id: tr.dataset.id,
      name: tr.dataset.name,
      category: tr.dataset.category,
      price: tr.dataset.price,
      image: tr.dataset.image,
      status: tr.querySelector('.badge').textContent.trim(),
      description: e.description || 'Producto personalizado con diseño a elección.',
      custom: e.custom || 'Texto, imagen y diseño',
    };
    localStorage.setItem(SNAP, JSON.stringify(snapshot));
  });

  // 4) Textos de conteo (tu script puede recalcularlos después)
  const total = tbody.querySelectorAll('tr').length;
  const countText = document.getElementById('countText');
  const showingText = document.getElementById('showingText');
  if (countText) countText.textContent = total === 1 ? '1 producto' : `${total} productos`;
  if (showingText) showingText.textContent = `Mostrando ${total} de ${total} productos`;

  // 5) Eliminar de forma permanente
  const emptyState = document.getElementById('emptyState');
  function refreshCounts() {
    const n = tbody.querySelectorAll('tr').length;
    if (countText) countText.textContent = n === 1 ? '1 producto' : `${n} productos`;
    if (showingText) showingText.textContent = `Mostrando ${n} de ${n} productos`;
    if (emptyState) emptyState.hidden = n > 0;
  }

  // Cada vez que una fila desaparece de la tabla, se recuerda que fue eliminada
  new MutationObserver((mutations) => {
    mutations.forEach((m) => m.removedNodes.forEach((node) => {
      if (node.nodeType !== 1 || !node.dataset || !node.dataset.id) return;
      const id = node.dataset.id;
      // producto creado por el usuario -> se borra de la lista guardada
      localStorage.setItem(KEY, JSON.stringify(read(KEY, []).filter((p) => String(p.id) !== id)));
      // producto que venía en el HTML -> se anota para no mostrarlo más
      const list = read(DELETED, []);
      if (id.startsWith('base-') && !list.includes(id)) {
        list.push(id);
        localStorage.setItem(DELETED, JSON.stringify(list));
      }
    }));
    refreshCounts();
  }).observe(tbody, { childList: true });

  // Respaldo: si el botón "Eliminar" del modal no quita la fila, la quitamos aquí
  let rowToDelete = null;
  tbody.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-delete]');
    if (btn) rowToDelete = btn.closest('tr');
  }, true);

  const confirmBtn = document.getElementById('confirmDelete');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const row = rowToDelete;
      setTimeout(() => {
        if (row && row.isConnected) {
          row.remove();
          const modal = document.getElementById('deleteModal');
          if (modal) modal.hidden = true;
        }
      }, 0);
    });
  }
})();