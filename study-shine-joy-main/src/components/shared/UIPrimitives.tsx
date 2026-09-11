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

export function Card({
  children,
  className = "",
  onClick,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; className?: string }) {
  return (
    <div onClick={onClick} {...rest} className={`rounded-2xl border border-border bg-card p-5 shadow-soft ${className}`}>
      {children}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  let style = "bg-sky-50/90 text-slate-900 dark:bg-sky-950/40 dark:text-slate-100 border border-sky-200/80 dark:border-sky-800/60";
  if (s === "PENDING") {
    style = "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30";
  } else if (s === "REJECTED") {
    style = "bg-destructive/15 text-destructive border border-destructive/30";
  } else if (s === "SUBMITTED") {
    style = "bg-blue-50 text-[#2563eb] border border-blue-200/60";
  }

  const formattedStatus = s ? s.charAt(0) + s.slice(1).toLowerCase() : "";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold leading-none shadow-2xs shrink-0 whitespace-nowrap ${style}`}
    >
      {formattedStatus}
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
    primary: "bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-sm font-bold border border-transparent",
    ghost: "border border-border bg-card text-foreground hover:bg-secondary font-medium",
    soft: "bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-sm font-bold border border-transparent",
    destructive: "bg-[#dc2626] text-white hover:bg-[#b91c1c] shadow-sm font-bold",
    dark: "bg-[#0f172a] text-white hover:bg-[#1e293b] shadow-sm font-semibold",
  }[variant as string] || "bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-sm font-bold";

  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4.5 py-2 text-sm font-bold transition ${styles} ${className}`}
    >
      {children}
    </button>
  );
}
