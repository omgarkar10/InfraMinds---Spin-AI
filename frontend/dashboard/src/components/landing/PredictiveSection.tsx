import { SectionBase } from "./SectionBase";
import "./PredictiveSection.css";

const TRADITIONAL_PARADIGM = [
  "01. Isolated Complaint Intake",
  "02. Manual Ticket Assignment",
  "03. Individual Issue Resolution",
  "04. Ticket Closure (Root Cause Unknown)",
  "05. Repeat Complaints & Recurring Failures",
];

const SPIN_PREDICTIVE_PARADIGM = [
  "01. Multilingual Signal Intake & GIS Mapping",
  "02. Gemini Semantic Parsing & Severity Scoring",
  "03. Spatial Density Clustering & Asset Correlation",
  "04. Red Zone Identification & Demand Prediction",
  "05. Evidence-Backed Policy & Budget Reallocation",
  "06. Transparent Public Feedback & Long-Term Audit",
];

export function PredictiveSection() {
  return (
    <SectionBase id="predictive" number="08" label="FROM REACTIVE TO PREDICTIVE">
      <div className="predictive-heading">
        <h2 className="editorial-h2">
          From reactive grievance ticketing<br />
          <span className="problem-h2-highlight">to predictive infrastructure governance.</span>
        </h2>
        <p className="body-lg predictive-subtitle">
          Traditional government portals close tickets individually. SPIN transforms isolated complaint data into anticipatory public investment.
        </p>
      </div>

      <div className="predictive-table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th className="col-trad">TRADITIONAL GRIEVANCE REDRESSAL</th>
              <th className="col-spin">SPIN PREDICTIVE INTELLIGENCE ENGINE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="cell-trad">
                <ul className="paradigm-list">
                  {TRADITIONAL_PARADIGM.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <span className="paradigm-tag trad">REACTIVE & ISOLATED</span>
              </td>
              <td className="cell-spin">
                <ul className="paradigm-list spin">
                  {SPIN_PREDICTIVE_PARADIGM.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <span className="paradigm-tag spin">PREDICTIVE & SYSTEMIC</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </SectionBase>
  );
}

