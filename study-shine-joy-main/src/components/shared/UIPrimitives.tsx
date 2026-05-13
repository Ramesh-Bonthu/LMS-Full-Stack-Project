import { motion } from "framer-motion";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-soft ${className}`}>
      {children}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pending: "bg-warn/20 text-warn-foreground",
    Submitted: "bg-primary-soft text-primary",
    Evaluated: "bg-success/20 text-success-foreground",
    Approved: "bg-success/20 text-success-foreground",
    Active: "bg-success/20 text-success-foreground",
    Rejected: "bg-destructive/15 text-destructive",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        map[status] ?? "bg-secondary text-secondary-foreground"
      }`}
    >
      {status}
    </span>
  );
}

export function Btn({
  children,
  variant = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "soft";
}) {
  const styles = {
    primary: "bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95",
    ghost: "border border-border bg-card hover:bg-secondary",
    soft: "bg-primary-soft text-primary hover:bg-primary-soft/70",
  }[variant as string] || "bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95";

  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${styles} ${className}`}
    >
      {children}
    </button>
  );
}
