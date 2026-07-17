"use client";

import RouteProtector from "@/components/RouteProtector";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return children;
  }

  return (
    <RouteProtector
      tokenKey="admin_token"
      requiredRole={["administrador", "admin"]}
      redirectTo="/admin/login"
    >
      {children}
    </RouteProtector>
  );
}
