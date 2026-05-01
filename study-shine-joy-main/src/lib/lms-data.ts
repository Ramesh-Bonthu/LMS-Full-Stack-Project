export type Role = "student" | "faculty" | "admin";

export const roleMeta: Record<Role, { label: string; tagline: string; emoji: string }> = {
  student: {
    label: "Student",
    tagline: "Learn, submit, and grow",
    emoji: "🎓",
  },
  faculty: {
    label: "Faculty",
    tagline: "Teach, evaluate, inspire",
    emoji: "👩‍🏫",
  },
  admin: {
    label: "Admin",
    tagline: "Oversee and orchestrate",
    emoji: "🛠️",
  },
};
