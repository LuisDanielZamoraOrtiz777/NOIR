"use client";
import { useState, useRef, useEffect } from "react";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "¡Hola! Soy el asistente de Noir Atelier. ¿En qué puedo ayudarte?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const enviar = async () => {
    const texto = input.trim();
    if (!texto || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: texto }]);
    setInput("");
    setLoading(true);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: texto }),
      });
      const j = await r.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: j.reply || "No pude procesar tu mensaje." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Error de conexión. Intenta de nuevo." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        className="chat-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Ventana del chat */}
      {open && (
        <div className="chat-window-float" role="dialog" aria-label="Chat de Noir Atelier">
          <div className="chat-header">
            <span>Noir Atelier · Asistente</span>
            <button onClick={() => setOpen(false)} aria-label="Cerrar">✕</button>
          </div>

          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble chat-bubble--${m.role}`}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="chat-bubble chat-bubble--assistant chat-bubble--typing">
                <span />
                <span />
                <span />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <textarea
              className="chat-input"
              placeholder="Escribe tu mensaje…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              disabled={loading}
            />
            <button
              className="chat-send"
              onClick={enviar}
              disabled={loading || !input.trim()}
              aria-label="Enviar"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}
"use client";
import { useState } from "react";

export default function ChatWidget() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "system",
      text: "Bienvenido al chat de Noir Atelier. Escribe tu mensaje para recibir una respuesta.",
    },
  ]);
  const [status, setStatus] = useState("Chat listo para enviar mensajes.");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSendMessage() {
    const trimmed = input.trim();
    if (!trimmed) return;

    setIsSending(true);
    setErrorMessage("");
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", text: trimmed },
    ]);
    setInput("");
    setStatus("Enviando mensaje...");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al enviar el mensaje.");
      }
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: "assistant", text: data.reply },
      ]);
      setStatus("Respuesta recibida.");
    } catch (error) {
      setErrorMessage(error.message || "Error al enviar. Intenta de nuevo.");
      setStatus("Error al enviar. Intenta de nuevo.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section id="chat-widget" className="chat-widget" data-element="chat-widget">
      <h2>Chat asíncrono</h2>
      <p>Comunícate con Noir Atelier de forma inmediata. Este chat usa una llamada asíncrona para simular atención al usuario.</p>
      <div className="chat-window">
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.role}`}>
            <span>{message.text}</span>
          </div>
        ))}
      </div>
      <div className="chat-controls">
        <textarea
          id="chat-input"
          rows="3"
          placeholder="Escribe tu mensaje aquí..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button type="button" className="button" onClick={handleSendMessage} disabled={isSending}>
          {isSending ? "Enviando..." : "Enviar mensaje"}
        </button>
      </div>
      <p className="chat-status">{status}</p>
      {errorMessage && <p className="error">{errorMessage}</p>}
    </section>
  );
}
