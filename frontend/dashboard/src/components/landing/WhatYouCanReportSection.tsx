import "./WhatYouCanReportSection.css";

export function WhatYouCanReportSection() {
  const categories = [
    {
      title: "Water Supply & Leaks",
      icon: "💧",
      desc: "Pipe bursts, missing water supply, contamination, or low water pressure.",
      examples: ["Pipeline leaks", "Water shortage", "Quality issues"]
    },
    {
      title: "Roads & Potholes",
      icon: "🛣️",
      desc: "Damaged roads, dangerous potholes, broken footpaths, or missing signs.",
      examples: ["Deep potholes", "Road cave-ins", "Damaged sidewalk"]
    },
    {
      title: "Electricity & Outages",
      icon: "⚡",
      desc: "Power cuts, malfunctioning transformers, sparking wires, or streetlights.",
      examples: ["Transformer faults", "Streetlight outage", "Power surges"]
    },
    {
      title: "Waste & Sanitation",
      icon: "🗑️",
      desc: "Uncollected garbage, open waste dumping, clogged drains, or sewage overflow.",
      examples: ["Overflowing bins", "Drainage blockage", "Sewage leaks"]
    },
    {
      title: "Public Infrastructure",
      icon: "🏗️",
      desc: "Damaged public buildings, parks, public transport shelters, or bridges.",
      examples: ["Bus stop damage", "Park maintenance", "Bridge safety"]
    },
    {
      title: "Other Civic Issues",
      icon: "🏛️",
      desc: "Stray animal hazards, noise pollution, unauthorized construction, or safety concerns.",
      examples: ["Civic hazards", "Stray animal issues", "Noise nuisance"]
    }
  ];

  return (
    <section className="categories-section" id="categories">
      <div className="container">
        <div className="categories-header">
          <span className="label-eyebrow tag-blue">CIVIC CATEGORIES</span>
          <h2 className="editorial-h2">
            What you can <span className="text-highlight">report</span>
          </h2>
          <p className="body-lg categories-subtitle">
            SPIN covers all major municipal and public infrastructure services affecting everyday life.
          </p>
        </div>

        <div className="categories-grid">
          {categories.map((cat) => (
            <div key={cat.title} className="category-card">
              <div className="cat-icon-wrapper">{cat.icon}</div>
              <h3 className="cat-title">{cat.title}</h3>
              <p className="cat-desc">{cat.desc}</p>
              <div className="cat-tags">
                {cat.examples.map((ex) => (
                  <span key={ex} className="cat-tag">• {ex}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
