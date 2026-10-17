/* =========================================================
   CONTROLADOR · Inventario de productos
   Une el modelo (datos) con la vista (DOM).
   ========================================================= */

import * as M from "../models/producto.model.js";
import * as V from "../views/inventario.view.js";
import { normalize } from "../models/utils.js";

let filaPorEliminar = null;

// Buscador (filtro visual) + textos de conteo
function filtrar() {
  const query = normalize(V.leerBusqueda());
  const filas = V.filas();
  let visibles = 0;

  filas.forEach((tr) => {
    const f = V.datosFila(tr);
    const coincide = normalize(f.name + " " + f.category).includes(query);
    V.mostrarFila(tr, coincide);
    if (coincide) visibles++;
  });

  V.actualizarConteos(visibles, filas.length);
}

function prepararFilasBase() {
  const ediciones = M.obtenerEdiciones();
  const eliminados = M.obtenerEliminados();

  V.filas().forEach((tr) => {
    if (!tr.dataset.id) V.asignarId(tr, M.idBase(tr.dataset.name));
    if (eliminados.includes(tr.dataset.id)) { V.quitarFila(tr); return; } // ya eliminado antes
    const e = ediciones[tr.dataset.id];
    if (e) V.aplicarEdicion(tr, e);
    V.enlazarEditar(tr);
  });
}

function init() {
  if (!V.disponible()) return;

  // 1) Filas que venían en el HTML: id, ediciones guardadas y enlace "Editar"
  prepararFilasBase();

  // 2) Filas de los productos creados por el usuario
  M.listarCreados().forEach((p) => V.agregarFila(p));

  // 3) Al pulsar "Editar", se guardan los datos de ESA fila para la otra página
  V.bindEditar((tr) => {
    M.guardarSnapshot(M.snapshotParaEditar(V.datosFila(tr)));
  });

  // 4) Buscador
  V.bindBuscar(filtrar);
  filtrar();

  // 5) Eliminar de forma permanente
  V.activarModal();
  V.bindEliminar((tr) => {
    filaPorEliminar = tr;
    V.abrirModal(V.datosFila(tr));
  });
  V.bindConfirmarEliminar(() => {
    if (filaPorEliminar) {
      M.eliminar(filaPorEliminar.dataset.id);
      V.quitarFila(filaPorEliminar);
      filaPorEliminar = null;
      filtrar();
    }
    V.cerrarModal();
  });
}

init();
