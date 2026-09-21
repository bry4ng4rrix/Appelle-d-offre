import { Sparkles } from "lucide-react";

export function Logo() {
  return (
    <div className="logo">
      <span className="logo-mark">
        <Sparkles size={16} />
      </span>
      Appel<span className="accent">Pro</span>
    </div>
  );
}
