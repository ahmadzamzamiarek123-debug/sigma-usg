import { cn } from "@/lib/utils";
import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "gradient" | "glass";
}

export function Card({
  children,
  className,
  variant = "default",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        variant === "default" && "card",
        variant === "gradient" && "bg-gradient-to-br from-[var(--usg-primary)] to-[var(--usg-primary-light)] text-[var(--text-inverse)] rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300",
        variant === "glass" && "bg-[var(--bg-primary)]/80 backdrop-blur-lg border border-[var(--border-primary)]/50 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("card-header", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base sm:text-lg font-semibold text-[var(--text-primary)]", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card-body", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-4 py-3 sm:px-6 sm:py-4 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)]/50 rounded-b-xl sm:rounded-b-2xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
