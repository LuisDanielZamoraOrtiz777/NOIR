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
      <button
        className="chat-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
      >
        {open ? "✕" : "💬"}
      </button>

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
