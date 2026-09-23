import "./WhatYouCanReportSection.css";

export function WhatYouCanReportSection() {
  const categories = [
    {
      num: "01",
      title: "Water Supply & Leaks",
      imgUrl: "/images/water_supply_1790169674627.jpg",
      altText: "Municipal water pipeline leaking beside an urban road",
      desc: "Pipe bursts, missing water supply, contamination, or low water pressure.",
      commonIssues: "Pipeline leaks · Water shortage · Quality issues"
    },
    {
      num: "02",
      title: "Roads & Potholes",
      imgUrl: "/images/road_potholes_1790169689735.jpg",
      altText: "Pothole and damaged road surface in an urban neighbourhood",
      desc: "Damaged roads, dangerous potholes, broken footpaths, or missing signs.",
      commonIssues: "Deep potholes · Road cave-ins · Damaged sidewalk"
    },
    {
      num: "03",
      title: "Electricity & Outages",
      imgUrl: "/images/electricity_outages_1790169708785.jpg",
      altText: "Street-level electrical poles and wiring infrastructure",
      desc: "Power cuts, malfunctioning transformers, sparking wires, or streetlights.",
      commonIssues: "Transformer faults · Streetlight outage · Power surges"
    },
    {
      num: "04",
      title: "Waste & Sanitation",
      imgUrl: "/images/waste_sanitation_1790169727762.jpg",
      altText: "Urban municipal waste collection and drainage infrastructure",
      desc: "Uncollected garbage, open waste dumping, clogged drains, or sewage overflow.",
      commonIssues: "Overflowing bins · Drainage blockage · Sewage leaks"
    },
    {
      num: "05",
      title: "Public Infrastructure",
      imgUrl: "/images/public_infrastructure_1790169741277.jpg",
      altText: "Public bus shelter and street-level municipal infrastructure",
      desc: "Damaged public buildings, parks, public transport shelters, or bridges.",
      commonIssues: "Bus stop damage · Park maintenance · Bridge safety"
    },
    {
      num: "06",
      title: "Other Civic Issues",
      imgUrl: "/images/other_civic_1790169754635.jpg",
      altText: "Representative urban street space showing subtle civic infrastructure",
      desc: "Stray animal hazards, noise pollution, unauthorized construction, or safety concerns.",
      commonIssues: "Civic hazards · Stray animal issues · Noise nuisance"
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

        <div className="photographic-categories-grid">
          {categories.map((cat) => (
            <div key={cat.title} className="photo-category-card">
              <div 
                className="photo-card-bg"
                style={{ backgroundImage: `url(${cat.imgUrl})` }}
                role="img"
                aria-label={cat.altText}
              ></div>
              <div className="photo-card-overlay"></div>
              
              <div className="photo-card-content">
                <div className="photo-card-num">{cat.num}</div>
                <h3 className="photo-cat-title">{cat.title}</h3>
                <p className="photo-cat-desc">{cat.desc}</p>
                <div className="photo-cat-common">
                  <span className="photo-common-label">Common issues:</span><br/>
                  {cat.commonIssues}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
