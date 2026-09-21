import React from "react";

type GlassProps = {
  children: React.ReactNode;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
  ref?: React.Ref<HTMLDivElement>;
};

/** Surface de base du système : bordure fine, reflet, élévation. */
export function Glass({ children, className = "", ref, ...rest }: GlassProps) {
  return (
    <div ref={ref} className={`glass ${className}`} {...rest}>
      {children}
    </div>
  );
}
