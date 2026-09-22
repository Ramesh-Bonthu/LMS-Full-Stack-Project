import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [{ title: "Redirecting - ANITS LMS" }],
  }),
  component: () => <Navigate to="/auth/login" replace />,
});
