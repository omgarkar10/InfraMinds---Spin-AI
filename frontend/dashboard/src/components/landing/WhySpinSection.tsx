import { useEffect, useRef } from "react";
import "./WhySpinSection.css";

export function WhySpinSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          } else {
            entry.target.classList.remove('active');
          }
        });
      },
      { 
        rootMargin: "-20% 0px -20% 0px",
        threshold: 0 
      }
    );

    const steps = document.querySelectorAll('.timeline-step');
    steps.forEach(step => observer.observe(step));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="workflow-section" id="workflow" ref={sectionRef}>
      <div className="container">
        <div className="workflow-grid">
          
          {/* LEFT COLUMN - NARRATIVE */}
          <div className="workflow-left">
            <div className="workflow-sticky">
              <span className="label-eyebrow tag-navy">HOW YOUR DEMAND IS HANDLED</span>
              <h2 className="editorial-h2 workflow-h2">
                From submission<br />to government action.
              </h2>
              <p className="body-lg workflow-lead">
                Once a demand is submitted, SPIN organizes the information, identifies the relevant authority and keeps the citizen informed as the demand moves through review and action.
              </p>
              

            </div>
          </div>

          {/* RIGHT COLUMN - TIMELINE & CASE */}
          <div className="workflow-right">
            
            {/* Vertical Timeline */}
            <div className="workflow-timeline">
              <div className="timeline-line"></div>
              
              <div className="timeline-step">
                <div className="timeline-marker">01</div>
                <div className="timeline-content">
                  <h3 className="timeline-title">DEMAND RECEIVED</h3>
                  <p className="timeline-desc">Your demand is recorded with the information you provide.</p>
                </div>
              </div>
              
              <div className="timeline-step">
                <div className="timeline-marker">02</div>
                <div className="timeline-content">
                  <h3 className="timeline-title">DEMAND CLASSIFIED</h3>
                  <p className="timeline-desc">SPIN classifies the demand and identifies the appropriate department.</p>
                  <span className="ai-assisted-tag">AI-assisted processing</span>
                </div>
              </div>
              
              <div className="timeline-step">
                <div className="timeline-marker">03</div>
                <div className="timeline-content">
                  <h3 className="timeline-title">ROUTED FOR REVIEW</h3>
                  <p className="timeline-desc">The demand is matched to the appropriate department and geographic jurisdiction.</p>
                </div>
              </div>
              
              <div className="timeline-step">
                <div className="timeline-marker">04</div>
                <div className="timeline-content">
                  <h3 className="timeline-title">ACTION / REVIEW</h3>
                  <p className="timeline-desc">The concerned authority reviews the demand and records the appropriate action.</p>
                </div>
              </div>
              
              <div className="timeline-step">
                <div className="timeline-marker">05</div>
                <div className="timeline-content">
                  <h3 className="timeline-title">STATUS UPDATED</h3>
                  <p className="timeline-desc">The citizen can follow the latest status and receive updates.</p>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>
    </section>
  );
}
