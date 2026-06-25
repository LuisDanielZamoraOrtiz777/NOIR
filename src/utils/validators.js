export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isNotEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}
