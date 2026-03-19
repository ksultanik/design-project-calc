const { useState, useCallback } = React;

const MULTIPLIER_CONFIG = [
  {
    id: "stakeholderComplexity",
    label: "Stakeholder Complexity",
    shortLabel: "Stakeholders",
    description: "Number of approvers, alignment difficulty, and decision-making layers",
    icon: "\u25C6",
    weight: "CRITICAL",
    levels: [
      { score: 1, label: "1\u20132 aligned stakeholders, single approval gate", multiplier: 1.0 },
      { score: 2, label: "3\u20134 stakeholders, mostly aligned, 1\u20132 review rounds", multiplier: 1.25 },
      { score: 3, label: "5\u20137 stakeholders, some misalignment, committee reviews", multiplier: 1.55 },
      { score: 4, label: "8+ stakeholders, conflicting interests, multi-layer approvals", multiplier: 1.9 },
      { score: 5, label: "C-suite + cross-org, political dynamics, no clear RACI", multiplier: 2.4 },
    ],
  },
  {
    id: "requirementsStability",
    label: "Requirements Stability",
    shortLabel: "Req. Stability",
    description: "How well-defined the scope is at kickoff and likelihood of change",
    icon: "\u25C7",
    weight: "CRITICAL",
    levels: [
      { score: 1, label: "Locked requirements, signed-off brief, no expected changes", multiplier: 0.85 },
      { score: 2, label: "Well-defined with minor flexibility, <10% scope change likely", multiplier: 1.0 },
      { score: 3, label: "Partially defined, moderate scope evolution expected", multiplier: 1.3 },
      { score: 4, label: "Loosely defined, significant pivots likely mid-project", multiplier: 1.65 },
      { score: 5, label: "Undefined/exploratory, scope will be discovered through design", multiplier: 2.0 },
    ],
  },
  {
    id: "conceptMaturity",
    label: "Concept Definition",
    shortLabel: "Concept",
    description: "How much design direction, prior art, or validated concepts exist",
    icon: "\u25CB",
    weight: "HIGH",
    levels: [
      { score: 1, label: "Validated concept with tested prototypes, clear direction", multiplier: 0.7 },
      { score: 2, label: "Strong concept with wireframes/sketches, general alignment", multiplier: 0.85 },
      { score: 3, label: "High-level direction exists, details TBD", multiplier: 1.0 },
      { score: 4, label: "Vague vision, multiple possible directions to explore", multiplier: 1.3 },
      { score: 5, label: "Blank slate \u2014 no prior concept work, direction unknown", multiplier: 1.6 },
    ],
  },
  {
    id: "userTypeComplexity",
    label: "User Type Complexity",
    shortLabel: "User Types",
    description: "Number of distinct user personas with different workflows and needs",
    icon: "\u25A1",
    weight: "HIGH",
    levels: [
      { score: 1, label: "Single user type, one workflow", multiplier: 0.9 },
      { score: 2, label: "2 user types with overlapping workflows", multiplier: 1.0 },
      { score: 3, label: "3\u20134 user types with distinct workflows (your typical)", multiplier: 1.2 },
      { score: 4, label: "5+ user types, role-based access, conflicting needs", multiplier: 1.45 },
      { score: 5, label: "Complex ecosystem \u2014 patients, providers, payers, admins, etc.", multiplier: 1.7 },
    ],
  },
  {
    id: "designerExperience",
    label: "Designer Experience",
    shortLabel: "Experience",
    description: "Seniority and domain expertise of the assigned designer(s)",
    icon: "\u25B3",
    weight: "MODERATE",
    levels: [
      { score: 1, label: "Senior/staff+ with deep healthcare domain expertise", multiplier: 0.8 },
      { score: 2, label: "Mid-senior with some healthcare experience", multiplier: 0.95 },
      { score: 3, label: "Mid-level, competent but limited domain knowledge", multiplier: 1.1 },
      { score: 4, label: "Junior designer, will need significant mentorship", multiplier: 1.35 },
      { score: 5, label: "New hire or contractor, no healthcare/enterprise experience", multiplier: 1.6 },
    ],
  },
  {
    id: "researchScope",
    label: "Research Requirements",
    shortLabel: "Research",
    description: "Amount of user research, testing, and discovery needed",
    icon: "\u2B21",
    weight: "MODERATE",
    levels: [
      { score: 1, label: "No research needed \u2014 leveraging existing insights", multiplier: 1.0 },
      { score: 2, label: "Light validation \u2014 1\u20132 usability tests or stakeholder interviews", multiplier: 1.15 },
      { score: 3, label: "Moderate \u2014 discovery interviews + usability testing round", multiplier: 1.35 },
      { score: 4, label: "Significant \u2014 multi-method research, synthesis, readouts", multiplier: 1.6 },
      { score: 5, label: "Heavy \u2014 longitudinal study, diary studies, field research", multiplier: 1.9 },
    ],
  },
  {
    id: "regulatoryBurden",
    label: "Regulatory & Compliance",
    shortLabel: "Compliance",
    description: "HIPAA, accessibility (WCAG), FDA, clinical safety review requirements",
    icon: "\u2B22",
    weight: "MODERATE",
    levels: [
      { score: 1, label: "Standard patterns, no special compliance work", multiplier: 1.0 },
      { score: 2, label: "Standard HIPAA + WCAG AA \u2014 handled by existing patterns", multiplier: 1.1 },
      { score: 3, label: "New PHI handling flows, accessibility audit, compliance review", multiplier: 1.25 },
      { score: 4, label: "FDA-adjacent, clinical safety considerations, legal review", multiplier: 1.45 },
      { score: 5, label: "Novel regulatory territory, multi-agency review required", multiplier: 1.7 },
    ],
  },
  {
    id: "crossFunctionalDeps",
    label: "Cross-functional Dependencies",
    shortLabel: "Dependencies",
    description: "Engineering constraints, content needs, legal review, third-party integrations",
    icon: "\u25BD",
    weight: "MODERATE",
    levels: [
      { score: 1, label: "Self-contained \u2014 design team can execute independently", multiplier: 1.0 },
      { score: 2, label: "Light engineering sync, existing APIs and components", multiplier: 1.1 },
      { score: 3, label: "Regular eng collaboration, some API/data dependencies", multiplier: 1.2 },
      { score: 4, label: "Heavy cross-team coordination, new integrations, content strategy", multiplier: 1.35 },
      { score: 5, label: "Multi-vendor, legacy system constraints, external dependencies", multiplier: 1.55 },
    ],
  },
];

const PROJECT_TYPES = [
  { id: "net_new", label: "Net-New Product / Feature", baseHoursPerUnit: 8, unit: "key screen or flow", color: "#2563EB" },
  { id: "redesign", label: "Redesign of Existing Experience", baseHoursPerUnit: 5, unit: "key screen or flow", color: "#7C3AED" },
  { id: "design_system", label: "Design System Work", baseHoursPerUnit: 12, unit: "component or pattern", color: "#0891B2" },
  { id: "research", label: "Research-Heavy Discovery", baseHoursPerUnit: 16, unit: "research initiative", color: "#059669" },
];

function MultiplierSlider({ config, value, onChange }) {
  const level = config.levels[value - 1];
  const pct = ((value - 1) / 4) * 100;
  const weightColors = { CRITICAL: "#EF4444", HIGH: "#F59E0B", MODERATE: "#6B7280" };

  return (
    <div style={{
      padding: "20px 24px",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      transition: "background 0.2s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{config.icon}</span>
            <span style={{
              fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.92)",
              letterSpacing: "-0.01em", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
            }}>{config.label}</span>
            <span style={{
              fontSize: 9, fontWeight: 700, color: weightColors[config.weight],
              background: weightColors[config.weight] + "18",
              padding: "2px 7px", borderRadius: 3, letterSpacing: "0.06em", fontFamily: "monospace",
            }}>{config.weight}</span>
          </div>
          <div style={{
            fontSize: 11.5, color: "rgba(255,255,255,0.38)", lineHeight: 1.3,
            fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
          }}>{config.description}</div>
        </div>
        <div style={{ textAlign: "right", minWidth: 52, marginLeft: 16 }}>
          <div style={{
            fontSize: 22, fontWeight: 700,
            color: level.multiplier > 1.5 ? "#F87171" : level.multiplier > 1.2 ? "#FBBF24" : level.multiplier <= 1.0 ? "#34D399" : "rgba(255,255,255,0.8)",
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.03em", lineHeight: 1,
          }}>{level.multiplier.toFixed(2)}&times;</div>
        </div>
      </div>

      <div style={{ marginTop: 14, marginBottom: 8 }}>
        <div style={{ position: "relative", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
          <div style={{
            position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 3,
            width: pct + "%",
            background: pct > 75 ? "linear-gradient(90deg, #F59E0B, #EF4444)" :
                       pct > 50 ? "linear-gradient(90deg, #FBBF24, #F59E0B)" :
                       pct > 25 ? "linear-gradient(90deg, #34D399, #FBBF24)" :
                       "linear-gradient(90deg, #34D399, #6EE7B7)",
            transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
          }} />
        </div>
        <input
          type="range" min={1} max={5} step={1} value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          style={{ width: "100%", marginTop: -6, position: "relative", zIndex: 2 }}
        />
      </div>

      <div style={{
        fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.45,
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", fontStyle: "italic", minHeight: 16,
      }}>
        Level {value}: {level.label}
      </div>
    </div>
  );
}

function FormulaBreakdown({ projectType, unitCount, multipliers, contingency }) {
  const type = PROJECT_TYPES.find(t => t.id === projectType);
  const baseEffort = type.baseHoursPerUnit * unitCount;

  let runningTotal = baseEffort;
  const steps = MULTIPLIER_CONFIG.map((config) => {
    const level = config.levels[multipliers[config.id] - 1];
    const before = runningTotal;
    runningTotal *= level.multiplier;
    return { label: config.shortLabel, multiplier: level.multiplier, after: runningTotal, added: runningTotal - before };
  });

  const preContingency = runningTotal;
  const finalTotal = runningTotal * (1 + contingency / 100);

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.06)", padding: "20px 24px", marginTop: 16,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)",
        letterSpacing: "0.08em", marginBottom: 16, fontFamily: "monospace",
      }}>FORMULA BREAKDOWN</div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{
          background: type.color + "20", color: type.color, padding: "4px 10px",
          borderRadius: 5, fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
        }}>{unitCount} &times; {type.baseHoursPerUnit}h = {baseEffort}h base</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {steps.map((step, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "4px 0",
            borderBottom: i < steps.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: 11, color: "rgba(255,255,255,0.4)",
                fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", minWidth: 95,
              }}>{step.label}</span>
              <span style={{
                fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                color: step.multiplier > 1.5 ? "#F87171" : step.multiplier > 1.2 ? "#FBBF24" : step.multiplier <= 1.0 ? "#34D399" : "rgba(255,255,255,0.55)",
              }}>&times;{step.multiplier.toFixed(2)}</span>
            </div>
            <span style={{
              fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.5)",
            }}>{step.added > 0 ? "+" : ""}{step.added.toFixed(1)}h &rarr; {step.after.toFixed(1)}h</span>
          </div>
        ))}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 0 0", marginTop: 4, borderTop: "1px solid rgba(255,255,255,0.08)",
        }}>
          <span style={{
            fontSize: 11, color: "rgba(255,255,255,0.4)",
            fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
          }}>+{contingency}% contingency buffer</span>
          <span style={{
            fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#34D399",
          }}>{preContingency.toFixed(1)}h &rarr; {finalTotal.toFixed(1)}h</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [projectType, setProjectType] = useState("net_new");
  const [unitCount, setUnitCount] = useState(8);
  const [contingency, setContingency] = useState(20);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [multipliers, setMultipliers] = useState({
    stakeholderComplexity: 3,
    requirementsStability: 3,
    conceptMaturity: 3,
    userTypeComplexity: 3,
    designerExperience: 2,
    researchScope: 2,
    regulatoryBurden: 2,
    crossFunctionalDeps: 2,
  });

  const setMultiplier = useCallback((id, val) => {
    setMultipliers(prev => ({ ...prev, [id]: val }));
  }, []);

  const type = PROJECT_TYPES.find(t => t.id === projectType);
  const baseEffort = type.baseHoursPerUnit * unitCount;
  const totalMultiplier = MULTIPLIER_CONFIG.reduce((acc, config) => {
    return acc * config.levels[multipliers[config.id] - 1].multiplier;
  }, 1);
  const adjustedEffort = baseEffort * totalMultiplier;
  const finalEffort = adjustedEffort * (1 + contingency / 100);
  const days = finalEffort / 8;
  const weeks = days / 5;
  const lowRange = finalEffort * 0.8;
  const highRange = finalEffort * 1.2;

  const riskScore = Object.entries(multipliers).reduce((acc, [key, val]) => {
    const config = MULTIPLIER_CONFIG.find(c => c.id === key);
    const weight = config.weight === "CRITICAL" ? 3 : config.weight === "HIGH" ? 2 : 1;
    return acc + val * weight;
  }, 0);
  const maxRisk = (5 * 3 * 2) + (5 * 2 * 2) + (5 * 1 * 4);
  const riskPct = (riskScore / maxRisk) * 100;
  const riskLabel = riskPct > 70 ? "HIGH RISK" : riskPct > 45 ? "MODERATE" : "LOW RISK";
  const riskColor = riskPct > 70 ? "#EF4444" : riskPct > 45 ? "#F59E0B" : "#34D399";

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "32px 20px 60px" }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)",
          letterSpacing: "0.12em", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace",
        }}>DESIGN EFFORT ESTIMATION ENGINE</div>
        <h1 style={{
          fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em",
          lineHeight: 1.15, margin: 0, color: "rgba(255,255,255,0.95)",
        }}>Project Effort Calculator</h1>
        <p style={{
          fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 8,
          lineHeight: 1.5, maxWidth: 600,
        }}>
          Parametric model calibrated for enterprise healthcare design teams.
          Base scope &times; 8 weighted multipliers &times; contingency buffer.
        </p>
      </div>

      {/* Result Card */}
      <div style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
        borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)",
        padding: "28px 32px", marginBottom: 28, position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, right: 0, width: 200, height: 200,
          background: "radial-gradient(circle at top right, " + type.color + "10, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)",
              letterSpacing: "0.1em", fontFamily: "monospace", marginBottom: 8,
            }}>ESTIMATED EFFORT</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{
                fontSize: 52, fontWeight: 700, letterSpacing: "-0.04em",
                fontFamily: "'JetBrains Mono', monospace",
                color: "rgba(255,255,255,0.95)", lineHeight: 1,
              }}>{Math.round(finalEffort)}</span>
              <span style={{
                fontSize: 18, fontWeight: 500, color: "rgba(255,255,255,0.4)",
                fontFamily: "'DM Sans', sans-serif",
              }}>hours</span>
            </div>
            <div style={{
              fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 6,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {days.toFixed(1)} days &middot; {weeks.toFixed(1)} weeks &middot; range {Math.round(lowRange)}&ndash;{Math.round(highRange)}h
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)",
                letterSpacing: "0.08em", fontFamily: "monospace", marginBottom: 4,
              }}>MULTIPLIER</div>
              <div style={{
                fontSize: 26, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                color: totalMultiplier > 4 ? "#EF4444" : totalMultiplier > 2.5 ? "#F59E0B" : "#34D399",
              }}>{totalMultiplier.toFixed(2)}&times;</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)",
                letterSpacing: "0.08em", fontFamily: "monospace", marginBottom: 4,
              }}>RISK PROFILE</div>
              <div style={{
                fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                color: riskColor, padding: "4px 12px", borderRadius: 6,
                background: riskColor + "15", border: "1px solid " + riskColor + "30",
              }}>{riskLabel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Type + Scope */}
      <div style={{
        background: "rgba(255,255,255,0.02)", borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.06)", padding: 24, marginBottom: 20,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.1em", fontFamily: "monospace", marginBottom: 16,
        }}>BASE SCOPE</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {PROJECT_TYPES.map(pt => (
            <button key={pt.id} onClick={() => setProjectType(pt.id)} style={{
              padding: "8px 16px", borderRadius: 8,
              border: "1px solid " + (projectType === pt.id ? pt.color + "60" : "rgba(255,255,255,0.08)"),
              background: projectType === pt.id ? pt.color + "18" : "transparent",
              color: projectType === pt.id ? pt.color : "rgba(255,255,255,0.5)",
              fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
              fontFamily: "'DM Sans', sans-serif",
            }}>{pt.label}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 24, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{
              fontSize: 11.5, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 8,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Number of <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{type.unit}s</span>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input type="range" min={1} max={40} value={unitCount}
                onChange={e => setUnitCount(parseInt(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{
                fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                color: "rgba(255,255,255,0.9)", minWidth: 36, textAlign: "right",
              }}>{unitCount}</span>
            </div>
            <div style={{
              fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              Base: {unitCount} &times; {type.baseHoursPerUnit}h = {baseEffort} hours
            </div>
          </div>

          <div style={{ minWidth: 160 }}>
            <label style={{
              fontSize: 11.5, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 8,
              fontFamily: "'DM Sans', sans-serif",
            }}>Contingency buffer</label>
            <div style={{ display: "flex", gap: 6 }}>
              {[10, 15, 20, 25, 30].map(v => (
                <button key={v} onClick={() => setContingency(v)} style={{
                  padding: "6px 10px", borderRadius: 6, fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                  border: "1px solid " + (contingency === v ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)"),
                  background: contingency === v ? "rgba(255,255,255,0.08)" : "transparent",
                  color: contingency === v ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
                  cursor: "pointer", transition: "all 0.15s",
                }}>{v}%</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Multiplier Sliders */}
      <div style={{
        background: "rgba(255,255,255,0.02)", borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 20,
      }}>
        <div style={{
          padding: "20px 24px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.1em", fontFamily: "monospace",
          }}>EFFORT MULTIPLIERS</div>
          <div style={{
            fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Adjust each factor on a 1&ndash;5 scale. CRITICAL factors have the highest impact on accuracy.
          </div>
        </div>
        {MULTIPLIER_CONFIG.map(config => (
          <MultiplierSlider
            key={config.id} config={config} value={multipliers[config.id]}
            onChange={(val) => setMultiplier(config.id, val)}
          />
        ))}
      </div>

      {/* Formula Breakdown Toggle */}
      <button onClick={() => setShowBreakdown(!showBreakdown)} style={{
        width: "100%", padding: "14px 24px",
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10, color: "rgba(255,255,255,0.6)",
        fontSize: 13, fontWeight: 600, cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 12,
      }}>
        <span>{showBreakdown ? "Hide" : "Show"} Step-by-Step Formula Breakdown</span>
        <span style={{ fontSize: 18, transform: showBreakdown ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>{"\u25BE"}</span>
      </button>
      {showBreakdown && (
        <FormulaBreakdown
          projectType={projectType} unitCount={unitCount}
          multipliers={multipliers} contingency={contingency}
        />
      )}

      {/* Methodology Toggle */}
      <button onClick={() => setShowMethodology(!showMethodology)} style={{
        width: "100%", padding: "14px 24px",
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10, color: "rgba(255,255,255,0.6)",
        fontSize: 13, fontWeight: 600, cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: 12,
      }}>
        <span>{showMethodology ? "Hide" : "Show"} Methodology &amp; Calibration Guide</span>
        <span style={{ fontSize: 18, transform: showMethodology ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>{"\u25BE"}</span>
      </button>
      {showMethodology && (
        <div style={{
          background: "rgba(255,255,255,0.02)", borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.06)", padding: 24,
          marginTop: 12, fontSize: 13, lineHeight: 1.7,
          color: "rgba(255,255,255,0.55)", fontFamily: "'DM Sans', sans-serif",
        }}>
          <h3 style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, marginTop: 0, letterSpacing: "-0.01em" }}>How This Model Works</h3>
          <p>This calculator adapts the parametric estimation approach used in COCOMO (Constructive Cost Model) &mdash; the gold standard for software effort estimation &mdash; for design work in enterprise healthcare environments. The core formula is:</p>
          <div style={{
            background: "rgba(255,255,255,0.04)", padding: "12px 16px", borderRadius: 8,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, margin: "12px 0",
            color: "rgba(255,255,255,0.7)",
          }}>
            Effort = (Units &times; Base Hours) &times; &Pi;(Multipliers) &times; (1 + Contingency%)
          </div>
          <p>The multipliers are ordered by <strong style={{ color: "rgba(255,255,255,0.75)" }}>predictive weight</strong> based on research into where enterprise design estimates fail most:</p>
          <p><span style={{ color: "#EF4444", fontWeight: 700, fontFamily: "monospace", fontSize: 11 }}>CRITICAL</span> &mdash; Stakeholder Complexity and Requirements Stability account for the largest variance in actual vs. estimated effort. Research from PMI and IIL confirms that stakeholder dynamics are consistently a top-10 complexity dimension.</p>
          <p><span style={{ color: "#F59E0B", fontWeight: 700, fontFamily: "monospace", fontSize: 11 }}>HIGH</span> &mdash; Concept Maturity and User Type Complexity set the structural difficulty of the design problem itself.</p>
          <p><span style={{ color: "#6B7280", fontWeight: 700, fontFamily: "monospace", fontSize: 11 }}>MODERATE</span> &mdash; Experience, Research, Compliance, and Dependencies adjust for team and environmental factors.</p>

          <h3 style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, marginTop: 24, letterSpacing: "-0.01em" }}>Calibrating With Your Data</h3>
          <p>To improve accuracy over time, compare predicted vs. actual hours for completed projects. Adjust the base hours per unit up or down based on your team's velocity. The 20% contingency buffer is standard practice &mdash; increase it for novel work, decrease it for well-understood patterns.</p>
          <p>Track the <strong style={{ color: "rgba(255,255,255,0.75)" }}>multiplier accuracy</strong> of each factor: which ones consistently over- or under-predict? After 5&ndash;10 calibrated projects, you'll have a model tuned specifically to your team.</p>

          <h3 style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, marginTop: 24, letterSpacing: "-0.01em" }}>What This Model Intentionally Excludes</h3>
          <p>&ldquo;Weekly meetings&rdquo; and &ldquo;project timeframe&rdquo; were considered but excluded as independent variables. Meetings are a symptom of stakeholder complexity (already captured), and compressed timelines don't create more work &mdash; they create more <em>concurrent</em> work and rework, which is better modeled through the requirements stability and contingency factors.</p>
        </div>
      )}

      {/* Footer */}
      <div style={{
        textAlign: "center", marginTop: 40, padding: "20px 0",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        fontSize: 11, color: "rgba(255,255,255,0.2)",
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        &plusmn;20% confidence range &middot; Calibrate with 5&ndash;10 completed projects for best accuracy
        <p>Designed by Keenan in Virginia. All rights reserved.</p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
