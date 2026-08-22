import { useEffect, useRef } from "react";
import "./SectionBase.css";

interface SectionBaseProps {
  id: string;
  number: string;
  label: string;
  children: React.ReactNode;
}

export function SectionBase({ id, number, label, children }: SectionBaseProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll(".reveal").forEach((r) => r.classList.add("visible"));
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id={id} ref={ref} className="section">
      <div className="container">
        <header className="section-header">
          <span className="section-number">{number}</span>
          <span className="divider-orange" style={{ display: "inline-block" }} />
          <span className="label-eyebrow">{label}</span>
        </header>
        {children}
      </div>
    </section>
  );
}
