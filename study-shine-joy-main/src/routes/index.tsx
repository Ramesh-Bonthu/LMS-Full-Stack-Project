import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vignan's LMS — Calm, modern learning platform" },
      {
        name: "description",
        content:
          "A light, friendly LMS for students, faculty and admins — courses, assignments, quizzes and analytics in one place.",
      },
      { property: "og:title", content: "Vignan's LMS — Calm, modern learning platform" },
      {
        property: "og:description",
        content: "A light, friendly LMS for students, faculty and admins.",
      },
    ],
  }),
  component: Landing,
});
