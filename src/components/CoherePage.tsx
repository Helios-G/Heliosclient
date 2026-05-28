import type { ReactNode } from "react";

interface CoherePageProps {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}

interface CoherePageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

interface CohereMetricCardProps {
  label: string;
  value: ReactNode;
  caption?: string;
  tone?: "blue" | "cyan" | "violet" | "green" | "slate";
}

export function CoherePage({ children, className = "", wide = false }: CoherePageProps) {
  return (
    <div className={`cohere-page px-4 py-12 ${className}`}>
      <div className={wide ? "cohere-page-wide" : "cohere-page-narrow"}>
        {children}
      </div>
    </div>
  );
}

export function CoherePageHeader({ eyebrow, title, description, actions }: CoherePageHeaderProps) {
  return (
    <div className="cohere-page-header">
      <div>
        <p className="cohere-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="cohere-page-lead">{description}</p>}
      </div>
      {actions && <div className="cohere-page-actions">{actions}</div>}
    </div>
  );
}

export function CohereMetricCard({
  label,
  value,
  caption,
  tone = "blue",
}: CohereMetricCardProps) {
  return (
    <div className={`cohere-stat-card cohere-stat-${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      {caption && <span>{caption}</span>}
    </div>
  );
}
