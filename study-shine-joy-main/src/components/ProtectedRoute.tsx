import { ReactNode } from "react";
import { redirect } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    throw redirect({ to: "/auth/login" });
  }

  if (requiredRole && user?.role !== requiredRole) {
    throw redirect({ to: "/" });
  }

  return <>{children}</>;
}

export function beforeLoadAuthenticated() {
  return {
    auth: {
      isAuthenticated: true,
    },
  };
}
