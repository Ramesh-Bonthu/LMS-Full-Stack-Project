import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/$role/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/dashboard/$role/$section",
      params: { role: params.role, section: "home" },
    });
  },
});
