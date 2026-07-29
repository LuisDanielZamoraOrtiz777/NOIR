export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isNotEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Valida los campos del formulario de pedido.
 * Retorna un objeto con los errores por campo.
 */
export function validate(values) {
  const errors = {};

  if (!values.client_name || !isNotEmpty(values.client_name)) {
    errors.client_name = "El nombre es obligatorio";
  }

  if (!values.client_phone || !isNotEmpty(values.client_phone)) {
    errors.client_phone = "El teléfono es obligatorio";
  } else if (!/^[+\d\s-]{7,15}$/.test(values.client_phone.trim())) {
    errors.client_phone = "Formato de teléfono inválido";
  }

  if (values.client_email && !isEmail(values.client_email)) {
    errors.client_email = "Formato de correo inválido";
  }

  return errors;
}