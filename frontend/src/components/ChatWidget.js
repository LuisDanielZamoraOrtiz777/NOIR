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
