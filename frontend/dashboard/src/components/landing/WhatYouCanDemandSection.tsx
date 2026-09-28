import "./WhatYouCanReportSection.css"; // Reuse existing styles

export function WhatYouCanDemandSection() {
  const categories = [
    {
      num: "01",
      title: "Public Transit",
      desc: "Request new bus stops, route expansions, or transit shelters in underserved areas.",
      commonIssues: "New bus routes · Transit shelters · Metro connectivity",
      image: "/images/categories/public_transit.jpg"
    },
    {
      num: "02",
      title: "Community Spaces",
      desc: "Demand public parks, community halls, playgrounds, or local libraries.",
      commonIssues: "Public parks · Libraries · Playground equipment",
      image: "/images/categories/community_spaces.jpg"
    },
    {
      num: "03",
      title: "Road Safety",
      desc: "Propose speed bumps, pedestrian crossings, traffic signals, and street lighting.",
      commonIssues: "Pedestrian crossings · Streetlights · Speed bumps",
      image: "/images/categories/road_safety.jpg"
    },
    {
      num: "04",
      title: "Sanitation Infrastructure",
      desc: "Request public restrooms, recycling centers, or improved drainage systems.",
      commonIssues: "Public toilets · Recycling bins · Drainage expansion",
      image: "/images/categories/sanitation_infrastructure.jpg"
    },
    {
      num: "05",
      title: "Educational Facilities",
      desc: "Demand upgrades to local public schools, public WiFi zones, or skill centers.",
      commonIssues: "School upgrades · Public WiFi · Study centers",
      image: "/images/categories/educational_facilities.jpg"
    },
    {
      num: "06",
      title: "Civic Upgrades",
      desc: "Propose environmental initiatives, noise barriers, or neighborhood beautification.",
      commonIssues: "Tree planting · Noise barriers · Beautification",
      image: "/images/categories/civic_upgrades.jpg"
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
        <div className="photographic-categories-grid">
          {categories.map((cat, i) => (
            <div className="photo-category-card" key={i}>
              <div 
                className="photo-card-bg"
                style={{ backgroundImage: `url(${cat.image})` }}
              />
              <div className="photo-card-overlay" />
              <div className="photo-card-content">
                <div className="photo-card-num">{cat.num}</div>
                <h3 className="photo-cat-title">{cat.title}</h3>
                <p className="photo-cat-desc">{cat.desc}</p>
                <div className="photo-cat-common">
                  <span className="photo-common-label">Common Requests</span>
                  <div style={{ marginTop: "4px", color: "rgba(255, 255, 255, 0.95)" }}>{cat.commonIssues}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
