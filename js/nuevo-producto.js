/* =========================================================
   Nuevo producto · ZAGA Administración
   Solo se guarda el producto si TODAS las validaciones pasan.
   ========================================================= */

const STORAGE_KEY = 'zaga_productos';
const INVENTORY_PAGE = 'inventario-productos.html';
const MAX_IMAGE_MB = 5;

const form = document.getElementById('productForm');
const summary = document.getElementById('errorSummary');
const toast = document.getElementById('toast');
const imgInput = document.getElementById('imgInput');
const imgPreview = document.getElementById('imgPreview');
const imgName = document.getElementById('imgName');
const descCount = document.getElementById('description-count');

let saving = false;

/* ---------- Utilidades ---------- */

const cleanPrice = (v) => v.replace(/COP|[\s.$]/gi, '');
const formatPrice = (digits) => '$' + Number(digits).toLocaleString('es-CO') + ' COP';

function showToast(text) {
  toast.textContent = text;
  toast.hidden = false;
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => (toast.hidden = true), 3200);
}

/* ---------- Reglas de validación ----------
   Cada regla devuelve el mensaje de error, o '' si el campo es válido. */

const rules = {
  name(v) {
    const t = v.trim();
    if (!t) return 'Escribe el nombre del producto.';
    if (t.length < 3) return 'El nombre debe tener al menos 3 caracteres.';
    if (t.length > 60) return 'El nombre no puede superar los 60 caracteres.';
    if (!/[a-záéíóúüñ]/i.test(t)) return 'El nombre debe incluir letras, no solo números o símbolos.';
    return '';
  },
  category(v) {
    return v ? '' : 'Selecciona una categoría.';
  },
  description(v) {
    const t = v.trim();
    if (!t) return 'Escribe una descripción del producto.';
    if (t.length < 20) return `La descripción debe tener al menos 20 caracteres (llevas ${t.length}).`;
    if (t.length > 300) return 'La descripción no puede superar los 300 caracteres.';
    return '';
  },
  price(v) {
    const digits = cleanPrice(v);
    if (!digits) return 'Escribe el precio del producto.';
    if (!/^\d+$/.test(digits)) return 'El precio solo puede tener números.';
    const n = Number(digits);
    if (n <= 0) return 'El precio debe ser mayor a 0.';
    if (n < 1000) return 'El precio mínimo es $1.000 COP.';
    if (n > 99999999) return 'El precio es demasiado alto. Revisa el valor.';
    return '';
  },
};

const fieldNames = Object.keys(rules);

function setFieldError(name, message) {
  const field = document.querySelector(`[data-field="${name}"]`);
  field.classList.toggle('has-error', Boolean(message));
  document.getElementById(`${name}-err`).textContent = message;
  form.elements[name].setAttribute('aria-invalid', message ? 'true' : 'false');
}

function validateField(name) {
  const message = rules[name](form.elements[name].value);
  setFieldError(name, message);
  return message;
}

// El anuncio aparece mientras haya al menos un campo con error
function updateSummary() {
  summary.hidden = !document.querySelector('.field.has-error');
}

// Devuelve la lista de campos inválidos (vacía = todo correcto)
function validateAll() {
  const invalid = fieldNames.filter((name) => validateField(name));
  updateSummary();
  return invalid;
}

/* ---------- Validación en vivo ---------- */

fieldNames.forEach((name) => {
  const input = form.elements[name];
  const field = document.querySelector(`[data-field="${name}"]`);

  input.addEventListener('blur', () => { validateField(name); updateSummary(); });

  const evt = input.tagName === 'SELECT' ? 'change' : 'input';
  input.addEventListener(evt, () => {
    // Una vez que hay error, se revisa en cada tecla para que desaparezca al corregir
    if (field.classList.contains('has-error')) { validateField(name); updateSummary(); }
  });
});

// Contador de caracteres de la descripción
form.elements.description.addEventListener('input', (e) => {
  descCount.textContent = `${e.target.value.length} / 300`;
});

// El precio solo admite dígitos y símbolos de formato mientras se escribe
form.elements.price.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/[^\d.$\sCOPcop]/g, '');
});

/* ---------- Imagen ---------- */

document.getElementById('imgBtn').addEventListener('click', () => imgInput.click());

imgInput.addEventListener('change', () => {
  const file = imgInput.files[0];
  if (!file) return;

  if (!/^image\/(png|jpeg)$/.test(file.type)) {
    showToast('Solo se aceptan imágenes JPG o PNG.');
    imgInput.value = '';
    return;
  }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    showToast(`La imagen supera los ${MAX_IMAGE_MB} MB. Elige una más liviana.`);
    imgInput.value = '';
    return;
  }

  // Se reduce a máx. 500 px y se guarda como texto para que sobreviva al cambio de página
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 500 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      imgPreview.src = canvas.toDataURL('image/jpeg', 0.8);
      imgName.textContent = file.name;
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

/* ---------- Guardar (solo si todo es válido) ---------- */

function readProducts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (saving) return;

  const invalid = validateAll();

  // Si hay algún error: se muestra el anuncio y NO se guarda nada
  if (invalid.length) {
    form.elements[invalid[0]].focus();
    summary.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const product = {
    id: Date.now(),
    name: form.elements.name.value.trim(),
    category: form.elements.category.selectedOptions[0].textContent.trim(),
    description: form.elements.description.value.trim(),
    price: formatPrice(cleanPrice(form.elements.price.value)),
    status: form.elements.status.value,
    custom: form.elements.notes.value.trim(),
    image: imgPreview.getAttribute('src'),
  };

  const products = readProducts();
  products.push(product);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch {
    showToast('No se pudo guardar: la imagen es muy pesada. Prueba con otra.');
    return;
  }

  saving = true;
  showToast('Producto guardado correctamente.');
  setTimeout(() => { location.href = INVENTORY_PAGE; }, 900);
});

/* ---------- Cancelar ---------- */

document.getElementById('cancelBtn').addEventListener('click', () => {
  if (confirm('¿Salir sin guardar los cambios?')) location.href = INVENTORY_PAGE;
});