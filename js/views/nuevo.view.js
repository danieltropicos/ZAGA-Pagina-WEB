/* =========================================================
   VISTA · Nuevo producto
   Solo toca el DOM: no valida ni guarda datos.
   ========================================================= */

const $ = (id) => document.getElementById(id);

const form = $("productForm");
const summary = $("errorSummary");
const toast = $("toast");
const imgInput = $("imgInput");
const imgPreview = $("imgPreview");
const imgName = $("imgName");
const descCount = $("description-count");

const campo = (name) => document.querySelector(`[data-field="${name}"]`);

// ---------- Lectura del formulario ----------
export const valor = (name) => form.elements[name].value;

export function leerFormulario() {
  return {
    name: form.elements.name.value,
    category: form.elements.category.selectedOptions[0].textContent.trim(),
    description: form.elements.description.value,
    price: form.elements.price.value,
    status: form.elements.status.value,
    custom: form.elements.notes.value,
    image: imgPreview.getAttribute("src")
  };
}

// ---------- Errores ----------
export function setError(name, message) {
  campo(name).classList.toggle("has-error", Boolean(message));
  $(`${name}-err`).textContent = message;
  form.elements[name].setAttribute("aria-invalid", message ? "true" : "false");
}

export const tieneError = (name) => campo(name).classList.contains("has-error");

// El anuncio aparece mientras haya al menos un campo con error
export function actualizarResumen() {
  summary.hidden = !document.querySelector(".field.has-error");
}

export function irAlResumen() {
  summary.scrollIntoView({ behavior: "smooth", block: "center" });
}

export const enfocar = (name) => form.elements[name].focus();

// ---------- Toast ----------
let toastTimer;
export function mostrarToast(text) {
  toast.textContent = text;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 3200);
}

// ---------- Imagen ----------
export function mostrarImagen(src, nombre) {
  imgPreview.src = src;
  imgName.textContent = nombre;
}

export const limpiarArchivo = () => { imgInput.value = ""; };

// ---------- Eventos ----------
export function bindCampo(name, onBlur, onInput) {
  const input = form.elements[name];
  input.addEventListener("blur", onBlur);
  input.addEventListener(input.tagName === "SELECT" ? "change" : "input", onInput);
}

// Contador de la descripción y filtro de caracteres del precio
export function activarMascaras() {
  form.elements.description.addEventListener("input", (e) => {
    descCount.textContent = `${e.target.value.length} / 300`;
  });

  // El precio solo admite dígitos y símbolos de formato mientras se escribe
  form.elements.price.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^\d.$\sCOPcop]/g, "");
  });
}

export function bindImagen(handler) {
  $("imgBtn").addEventListener("click", () => imgInput.click());
  imgInput.addEventListener("change", () => handler(imgInput.files[0]));
}

export const bindSubmit = (handler) => form.addEventListener("submit", handler);
export const bindCancelar = (handler) => $("cancelBtn").addEventListener("click", handler);
export const confirmarSalida = () => confirm("¿Salir sin guardar los cambios?");
