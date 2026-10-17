/* =========================================================
   VISTA · Editar producto
   Solo toca el DOM: no valida ni guarda datos.
   ========================================================= */

import { normalize } from "../models/utils.js";

const $ = (id) => document.getElementById(id);

const form = $("productForm");
const alertBox = $("formAlert");
const toast = $("toast");
const previewImg = $("previewImg");
const fileName = $("fileName");
const imageInput = $("imageInput");
const changeBtn = $("changeImageBtn");
const imageError = $("imageError");

export const valor = (key) => $(key).value;
export const setValor = (key, v) => { $(key).value = v; };

// ---------- Carga de datos en el formulario ----------
function seleccionarOpcion(select, wanted) {
  const target = normalize(wanted);
  if (!target) return;

  let option = Array.from(select.options).find(
    (o) => normalize(o.textContent) === target || normalize(o.value) === target
  );
  if (!option) {
    option = new Option(wanted, target);
    select.add(option);
  }
  select.value = option.value;
}

export function cargarProducto(product) {
  $("name").value = product.name || "";
  $("price").value = product.price || "";
  $("description").value = product.description || "";
  $("custom").value = product.custom || "";
  seleccionarOpcion($("category"), product.category || "");
  seleccionarOpcion($("status"), product.status || "");

  // Migas de pan y título de la pestaña
  const name = (product.name || "").trim();
  const crumb = $("crumbName");
  if (name && crumb) crumb.textContent = name;
  if (name) document.title = "Editar " + name + " · ZAGA Administración";
}

export function mostrarImagen(src, alt, nombre) {
  previewImg.src = src;
  if (alt !== undefined) previewImg.alt = alt;
  fileName.textContent = nombre;
}

export function textoSelect(id) {
  const select = $(id);
  return select.options[select.selectedIndex].textContent.trim();
}

// ---------- Errores ----------
export const esInvalido = (key) => $(key).classList.contains("is-invalid");

export function aplicarError(key, message) {
  const control = $(key);
  const error = $(key + "Error");
  const invalid = message !== "";

  control.classList.toggle("is-invalid", invalid);
  control.setAttribute("aria-invalid", String(invalid));
  error.textContent = message;
  error.hidden = !invalid;

  if (invalid) control.setAttribute("aria-describedby", error.id);
  else control.removeAttribute("aria-describedby");

  // Si ya no queda ningún error, se oculta el aviso general
  if (!alertBox.hidden && !form.querySelector(".is-invalid")) {
    alertBox.hidden = true;
  }
}

export function mostrarAlerta() {
  alertBox.hidden = false;
  alertBox.scrollIntoView({ behavior: "smooth", block: "center" });
}
export const ocultarAlerta = () => { alertBox.hidden = true; };
export const enfocar = (key) => $(key).focus({ preventScroll: true });

export function errorImagen(message) {
  if (message) {
    imageError.textContent = message;
    imageError.hidden = false;
  } else {
    imageError.hidden = true;
  }
}
export const limpiarArchivo = () => { imageInput.value = ""; };

// ---------- Toast ----------
let toastTimer = null;
export function mostrarToast(message, ms) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), ms || 2500);
}
export const ocultarToast = () => toast.classList.remove("is-visible");

// ---------- Eventos ----------
export function bindCampo(key, onBlur, onInput) {
  const control = $(key);
  control.addEventListener("blur", onBlur);
  control.addEventListener(control.tagName === "SELECT" ? "change" : "input", onInput);
}

export const bindPrecioBlur = (handler) => $("price").addEventListener("blur", handler);

export function bindImagen(handler) {
  changeBtn.addEventListener("click", () => imageInput.click());
  imageInput.addEventListener("change", () => handler(imageInput.files[0]));
}

export const bindSubmit = (handler) => form.addEventListener("submit", handler);
