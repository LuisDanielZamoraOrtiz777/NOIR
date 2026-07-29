"use client";

import { useState, useEffect } from "react";

/**
 * QuantityStepper — Stepper +/- profesional con input centralizado.
 *
 * Props:
 *   value:        número actual
 *   onChange:     (newQuantity: number) => void
 *   min:          mínimo (default 1)
 *   max:          máximo (opcional, ej. stock disponible)
 *   disabled:     si está disabled
 *   ariaLabel:    etiqueta accesible del input
 */
export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  ariaLabel = "Cantidad",
}) {
  const [localValue, setLocalValue] = useState(String(value));

  // Sincronizar cuando cambia el value desde fuera
  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const clamp = (n) => {
    if (Number.isNaN(n)) return min;
    if (n < min) return min;
    if (max !== undefined && n > max) return max;
    return n;
  };

  const handleDecrement = () => {
    if (disabled) return;
    const next = clamp(value - 1);
    onChange(next);
  };

  const handleIncrement = () => {
    if (disabled) return;
    const next = clamp(value + 1);
    onChange(next);
  };

  const handleInputChange = (e) => {
    const raw = e.target.value;
    setLocalValue(raw);
    // Solo commit si es un número válido
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed) && String(parsed) === raw.replace(/^0+/, "") && parsed >= min) {
      const clamped = clamp(parsed);
      onChange(clamped);
    }
  };

  const handleBlur = () => {
    // Reset visual al valor real si quedó un input inválido
    const parsed = parseInt(localValue, 10);
    if (Number.isNaN(parsed) || parsed < min) {
      setLocalValue(String(value));
    } else if (max !== undefined && parsed > max) {
      setLocalValue(String(max));
      onChange(max);
    } else {
      setLocalValue(String(parsed));
    }
  };

  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && (max === undefined || value < max);

  return (
    <div className={`qty-stepper ${disabled ? "is-disabled" : ""}`}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={!canDecrement}
        aria-label="Disminuir cantidad"
        className="qty-stepper-btn qty-stepper-decrement"
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={localValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        disabled={disabled}
        aria-label={ariaLabel}
        className="qty-stepper-input"
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={!canIncrement}
        aria-label="Aumentar cantidad"
        className="qty-stepper-btn qty-stepper-increment"
      >
        +
      </button>
    </div>
  );
}