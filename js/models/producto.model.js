/* =========================================================
   MODELO · Productos
   Toda la lectura/escritura de datos de productos vive aquí.
   ========================================================= */

import { KEYS, leer, escribir, borrar } from "./storage.js";
import { slug } from "./utils.js";

const DESCRIPCION_BASE = "Producto personalizado con diseño a elección.";
const PERSONALIZACION_BASE = "Texto, imagen y diseño";

export const listarCreados = () => leer(KEYS.PRODUCTOS, []);
export const obtenerEdiciones = () => leer(KEYS.EDICIONES, {});
export const obtenerEliminados = () => leer(KEYS.ELIMINADOS, []);

// Los productos que venían escritos en el HTML se identifican por su nombre
export const idBase = (nombre) => "base-" + slug(nombre || "");
export const esBase = (id) => String(id).startsWith("base-");

/* Nuevo producto. Devuelve true si se guardó. */
export function crear(datos) {
  const lista = listarCreados();
  lista.push({ id: Date.now(), ...datos });
  return escribir(KEYS.PRODUCTOS, lista);
}

/* Eliminar de forma permanente */
export function eliminar(id) {
  id = String(id);
  // producto creado por el usuario -> se borra de la lista guardada
  escribir(KEYS.PRODUCTOS, listarCreados().filter((p) => String(p.id) !== id));
  // producto que venía en el HTML -> se anota para no mostrarlo más
  if (esBase(id)) {
    const lista = obtenerEliminados();
    if (!lista.includes(id)) {
      lista.push(id);
      escribir(KEYS.ELIMINADOS, lista);
    }
  }
}

/* Guardar cambios de la pantalla "Editar". Devuelve true si se guardó. */
export function guardarEdicion(id, datos) {
  if (!id) return true; // pantalla abierta sin producto: solo demostración

  const lista = listarCreados();
  const index = lista.findIndex((p) => String(p.id) === id);

  if (index >= 0) {
    // Producto creado en "Nuevo producto": se actualiza conservando sus demás datos
    lista[index] = { ...lista[index], ...datos };
    return escribir(KEYS.PRODUCTOS, lista);
  }

  // Producto que viene escrito en el HTML: se guarda como edición
  const ediciones = obtenerEdiciones();
  ediciones[id] = { ...ediciones[id], ...datos };
  return escribir(KEYS.EDICIONES, ediciones);
}

/* Datos de ESA fila para la página de editar.
   fila = { id, name, category, price, image, status } */
export function snapshotParaEditar(fila) {
  const creado = listarCreados().find((p) => String(p.id) === fila.id);
  const e = obtenerEdiciones()[fila.id] || {};
  return creado || {
    id: fila.id,
    name: fila.name,
    category: fila.category,
    price: fila.price,
    image: fila.image,
    status: fila.status,
    description: e.description || DESCRIPCION_BASE,
    custom: e.custom || PERSONALIZACION_BASE
  };
}

export const guardarSnapshot = (snap) => escribir(KEYS.SNAPSHOT, snap);
export const limpiarSnapshot = () => borrar(KEYS.SNAPSHOT);

/* Producto que se va a editar (o null) */
export function resolverParaEditar(id, params) {
  // 1) El producto que la lista dejó guardado al pulsar "Editar"
  const snap = leer(KEYS.SNAPSHOT, null);
  if (snap && snap.name && (!id || String(snap.id) === id)) return snap;

  // 2) Un producto creado en "Nuevo producto"
  if (id) {
    const mine = listarCreados().find((p) => String(p.id) === id);
    if (mine) return mine;
  }

  // 3) Datos enviados por la URL (?name=...&price=...)
  if (params.has("name")) return Object.fromEntries(params.entries());

  return null;
}
