import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { DashboardSection } from "@/components/dashboard-sections";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { Role } from "@/lib/lms-data";

const validRoles: Role[] = ["student", "faculty", "admin"];

export const Route = createFileRoute("/dashboard/$role/$section")({
  beforeLoad: ({ params }) => {
    if (!validRoles.includes(params.role as Role)) {
      throw notFound();
    }
  },
  head: ({ params }) => ({
    meta: [
      {
        title: `${params.role[0].toUpperCase()}${params.role.slice(1)} dashboard — Lumen LMS`,
      },
      {
        name: "description",
        content: `Lumen LMS ${params.role} workspace.`,
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { role, section } = Route.useParams();
  return (
    <ProtectedRoute requiredRole={role}>
      <DashboardShell>
        <DashboardSection role={role as Role} section={section} />
      </DashboardShell>
    </ProtectedRoute>
  );
}
