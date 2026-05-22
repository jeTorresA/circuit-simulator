import { useState } from "react";
import { useCircuitStore } from "../hooks/useCircuitStore";

interface ToolbarProps {
  width: number;
  onToggle: () => void;
  onOpenDocs: () => void;
}

const COMPONENT_DEFS = [
  {
    type: "resistor" as const,
    label: "Resistencia",
    color: "#f39c12",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22">
        <polyline points="1,12 4,6 8,18 12,6 16,18 20,6 23,12" stroke="#fff" strokeWidth="2" fill="none" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    type: "capacitor" as const,
    label: "Capacitor",
    color: "#3498db",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22">
        <line x1="1" y1="12" x2="8" y2="12" stroke="#fff" strokeWidth="2" />
        <line x1="8" y1="4" x2="8" y2="20" stroke="#fff" strokeWidth="2.5" />
        <line x1="16" y1="4" x2="16" y2="20" stroke="#fff" strokeWidth="2.5" />
        <line x1="16" y1="12" x2="23" y2="12" stroke="#fff" strokeWidth="2" />
      </svg>
    ),
  },
  {
    type: "inductor" as const,
    label: "Inductor",
    color: "#9b59b6",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22">
        <path d="M2 12 Q4 2 7 12 Q10 2 13 12 Q16 2 19 12 L22 12" stroke="#fff" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
  {
    type: "battery" as const,
    label: "Batería",
    color: "#e67e22",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22">
        <line x1="1" y1="12" x2="6" y2="12" stroke="#fff" strokeWidth="2" />
        <line x1="8" y1="5" x2="8" y2="19" stroke="#fff" strokeWidth="2.5" />
        <line x1="8" y1="9" x2="14" y2="9" stroke="#fff" strokeWidth="2" />
        <line x1="16" y1="5" x2="16" y2="19" stroke="#fff" strokeWidth="2.5" />
        <line x1="16" y1="12" x2="23" y2="12" stroke="#fff" strokeWidth="2" />
      </svg>
    ),
  },
];

const Toolbar = ({ width, onToggle, onOpenDocs }: ToolbarProps) => {
  const { components, wires, addComponent } = useCircuitStore();
  const [filter, setFilter] = useState("");
  const [isFilterFocused, setIsFilterFocused] = useState(false);

  const filtered = COMPONENT_DEFS.filter((c) =>
    c.label.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div
      style={{
        width,
        backgroundColor: "#2c3e50",
        padding: "20px 20px 20px 16px",
        color: "white",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        zIndex: 10,
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", flex: 1 }}>Componentes</h3>
        <button
          onClick={onOpenDocs}
          style={{
            cursor: "pointer",
            fontSize: "12px",
            color: "#ecf0f1",
            backgroundColor: "#34495e",
            border: "1px solid #4f6881",
            borderRadius: "4px",
            padding: "4px 7px",
            marginRight: "6px",
          }}
          title="Ver documentacion de componentes"
        >
          Docs
        </button>
        <span
          onClick={onToggle}
          style={{
            cursor: "pointer",
            fontSize: "14px",
            color: "#95a5a6",
            padding: "4px",
            lineHeight: 1,
          }}
          title="Ocultar panel"
        >
          ◀
        </span>
      </div>

      <input
        type="text"
        placeholder="Filtrar..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{
          padding: "6px 2px",
          border: "none",
          borderBottom: isFilterFocused ? "1px solid #7fb3d5" : "1px solid #4f6881",
          backgroundColor: "transparent",
          color: "#ecf0f1",
          fontSize: "12px",
          outline: "none",
          transition: "border-bottom-color 140ms ease",
          marginBottom: "8px",
        }}
        onFocus={() => setIsFilterFocused(true)}
        onBlur={() => setIsFilterFocused(false)}
      />

      {filtered.map((c) => (
        <button
          key={c.type}
          onClick={() => addComponent(c.type)}
          style={{
            padding: "7px 10px",
            cursor: "pointer",
            backgroundColor: c.color,
            border: "none",
            color: "white",
            fontWeight: "bold",
            borderRadius: "4px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textAlign: "left",
          }}
        >
          {c.icon}
          <span>{c.label}</span>
        </button>
      ))}

      <div style={{ marginTop: "auto", fontSize: "11px", color: "#bdc3c7" }}>
        Componentes: {components.length}
        <br />
        Cables: {wires.length}
      </div>
    </div>
  );
};

export default Toolbar;
