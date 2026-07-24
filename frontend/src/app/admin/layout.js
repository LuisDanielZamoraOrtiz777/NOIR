"use client";

import RouteProtector from "@/components/RouteProtector";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  // Redirect /admin/login to unified access page to keep single login
  if (typeof window !== "undefined" && pathname === "/admin/login") {
    if (typeof window !== "undefined") window.location.replace("/acceso");
    return null;
  }
    // /admin/os-accounts is a full-page module — don't double-wrap with RouteProtector
    if (pathname?.startsWith("/admin/os-accounts")) {
      return <>{children}</>;
    }

  return (
    <RouteProtector
      tokenKey="user_token"
      requiredRole={["administrador", "admin"]}
      redirectTo="/acceso"
    >
      {children}
    </RouteProtector>
  );
}
