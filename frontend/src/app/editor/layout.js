"use client";

import RouteProtector from "@/components/RouteProtector";

export default function EditorLayout({ children }) {
  return (
    <RouteProtector
      tokenKey="user_token"
      requiredRole="editor"
      redirectTo="/acceso"
    >
      {children}
    </RouteProtector>
  );
}
