import "./WhatYouCanReportSection.css"; // Reuse existing styles

export function WhatYouCanDemandSection() {
  const categories = [
    {
      num: "01",
      title: "Public Transit",
      desc: "Request new bus stops, route expansions, or transit shelters in underserved areas.",
      commonIssues: "New bus routes · Transit shelters · Metro connectivity"
    },
    {
      num: "02",
      title: "Community Spaces",
      desc: "Demand public parks, community halls, playgrounds, or local libraries.",
      commonIssues: "Public parks · Libraries · Playground equipment"
    },
    {
      num: "03",
      title: "Road Safety",
      desc: "Propose speed bumps, pedestrian crossings, traffic signals, and street lighting.",
      commonIssues: "Pedestrian crossings · Streetlights · Speed bumps"
    },
    {
      num: "04",
      title: "Sanitation Infrastructure",
      desc: "Request public restrooms, recycling centers, or improved drainage systems.",
      commonIssues: "Public toilets · Recycling bins · Drainage expansion"
    },
    {
      num: "05",
      title: "Educational Facilities",
      desc: "Demand upgrades to local public schools, public WiFi zones, or skill centers.",
      commonIssues: "School upgrades · Public WiFi · Study centers"
    },
    {
      num: "06",
      title: "Civic Upgrades",
      desc: "Propose environmental initiatives, noise barriers, or neighborhood beautification.",
      commonIssues: "Tree planting · Noise barriers · Beautification"
    }
  ];

  return (
    <section className="categories-section" id="categories">
      <div className="container">
        <div className="categories-header">
          <span className="label-eyebrow tag-blue">INFRASTRUCTURE CATEGORIES</span>
          <h2 className="editorial-h2">
            What you can <span className="text-highlight">demand</span>
          </h2>
          <p className="body-lg categories-subtitle">
            Focus community support on the public infrastructure projects that matter most to your neighborhood.
          </p>
        </div>
        <div className="categories-grid">
          {categories.map((cat, i) => (
            <div className="category-card" key={i}>
              <div className="cat-header">
                <span className="cat-num">{cat.num}</span>
                <h3>{cat.title}</h3>
              </div>
              <p className="cat-desc">{cat.desc}</p>
              <div className="cat-footer">
                <span className="common-issues">{cat.commonIssues}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
