import React from 'react';

interface CabinSection {
    label: string;
    rows: number;
    color: string;
    activeColor: string;
    layout: string;
}

interface AircraftConfig {
    name: string;
    sections: CabinSection[];
}

const AIRCRAFT_CONFIGS: Record<string, AircraftConfig> = {
    A320: { name: 'Airbus A320', sections: [
            { label: 'Business', rows: 3,  layout: '2-2', color: '#bfdbfe', activeColor: '#3b82f6' },
            { label: 'Économie', rows: 27, layout: '3-3', color: '#dcfce7', activeColor: '#22c55e' },
        ]},
    A321: { name: 'Airbus A321', sections: [
            { label: 'Business', rows: 4,  layout: '2-2', color: '#bfdbfe', activeColor: '#3b82f6' },
            { label: 'Économie', rows: 31, layout: '3-3', color: '#dcfce7', activeColor: '#22c55e' },
        ]},
    B737: { name: 'Boeing 737-800', sections: [
            { label: 'Business', rows: 4,  layout: '2-2', color: '#bfdbfe', activeColor: '#3b82f6' },
            { label: 'Économie', rows: 28, layout: '3-3', color: '#dcfce7', activeColor: '#22c55e' },
        ]},
    A330: { name: 'Airbus A330', sections: [
            { label: 'Business',  rows: 5,  layout: '2-2-2', color: '#bfdbfe', activeColor: '#3b82f6' },
            { label: 'Premium',   rows: 4,  layout: '2-3-2', color: '#fde68a', activeColor: '#f59e0b' },
            { label: 'Économie',  rows: 31, layout: '2-4-2', color: '#dcfce7', activeColor: '#22c55e' },
        ]},
    A350: { name: 'Airbus A350', sections: [
            { label: 'Business',  rows: 6,  layout: '2-2-2', color: '#bfdbfe', activeColor: '#3b82f6' },
            { label: 'Premium',   rows: 4,  layout: '2-3-2', color: '#fde68a', activeColor: '#f59e0b' },
            { label: 'Économie',  rows: 32, layout: '3-3-3', color: '#dcfce7', activeColor: '#22c55e' },
        ]},
    B777: { name: 'Boeing 777', sections: [
            { label: 'Première',  rows: 3,  layout: '1-2-1', color: '#e9d5ff', activeColor: '#a855f7' },
            { label: 'Business',  rows: 8,  layout: '2-3-2', color: '#bfdbfe', activeColor: '#3b82f6' },
            { label: 'Économie',  rows: 39, layout: '3-3-3', color: '#dcfce7', activeColor: '#22c55e' },
        ]},
    ATR72: { name: 'ATR 72', sections: [
            { label: 'Économie', rows: 18, layout: '2-2', color: '#dcfce7', activeColor: '#22c55e' },
        ]},
};

const EQUIPMENT_MAP: Record<string, string> = {
    '320': 'A320', '32A': 'A320', '32B': 'A321', '321': 'A321',
    '319': 'A320', '32N': 'A320', '32Q': 'A321',
    '738': 'B737', '73H': 'B737', '737': 'B737', '73W': 'B737',
    '332': 'A330', '333': 'A330', '330': 'A330', '33E': 'A330',
    '359': 'A350', '351': 'A350',
    '77W': 'B777', '77L': 'B777', '772': 'B777', '777': 'B777',
    'AT7': 'ATR72', 'ATR': 'ATR72',
};

function getConfig(equipment: string | null | undefined): AircraftConfig | null {
    if (!equipment) return null;
    const key = EQUIPMENT_MAP[equipment.toUpperCase()] ?? EQUIPMENT_MAP[equipment.slice(0, 3).toUpperCase()];
    return key ? AIRCRAFT_CONFIGS[key] : null;
}

// Match cabin text to section label — handles "Economy Standard", "Économie", "Business" etc.
function matchesCabin(sectionLabel: string, highlight: string): boolean {
    const h = highlight.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const l = sectionLabel.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (h.includes('ECON') || h.includes('ECON')) return l.includes('ECON');
    if (h.includes('BUSI'))    return l.includes('BUSI');
    if (h.includes('PREMI'))   return l.includes('PREMI');
    if (h.includes('PREMIUM')) return l.includes('PREMIUM');
    return l.includes(h) || h.includes(l);
}

const SEAT_W = 14;
const SEAT_H = 10;
const SEAT_GAP = 2;
const AISLE_W = 10;
const ROW_GAP = 3;
const PADDING = 12;
const LABEL_W = 50;

function sectionWidth(layout: string): number {
    const groups = layout.split('-').map(Number);
    return groups.reduce((s, g) => s + g * (SEAT_W + SEAT_GAP), 0)
        + (groups.length - 1) * AISLE_W;
}

export function CabinLayout({ equipment, highlightCabin }: {
    equipment?: string | null;
    highlightCabin?: string | null;
}) {
    const cfg = getConfig(equipment);

    if (!cfg) return (
        <div className="text-xs text-slate-400 text-center py-3">
            Schéma cabine non disponible
            {equipment && <span className="ml-1 font-mono text-slate-300">({equipment})</span>}
        </div>
    );

    const maxW = Math.max(...cfg.sections.map(s => sectionWidth(s.layout)));
    const svgW = LABEL_W + maxW + PADDING * 2;
    const totalH = cfg.sections.reduce((h, s) => h + s.rows * (SEAT_H + ROW_GAP), 0)
        + (cfg.sections.length - 1) * 8; // section gaps

    const svgH = totalH + PADDING * 2 + 30; // nose + tail
    let currentY = PADDING + 20;

    const elements: React.ReactNode[] = [];

    // Nose
    elements.push(
        <ellipse key="nose" cx={LABEL_W + maxW / 2 + PADDING} cy={PADDING + 8}
                 rx={maxW / 2 + 12} ry={10}
                 fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />,
        <text key="nose-txt" x={LABEL_W + maxW / 2 + PADDING} y={PADDING + 10}
              textAnchor="middle" fontSize="7" fill="#94a3b8">▲ AVANT</text>
    );

    cfg.sections.forEach((section, si) => {
        const isActive = !highlightCabin || matchesCabin(section.label, highlightCabin);
        const seatFill   = isActive ? section.activeColor : '#f1f5f9';
        const seatStroke = isActive ? section.activeColor : '#e2e8f0';
        const opacity    = isActive ? 1 : 0.5;

        const groups = section.layout.split('-').map(Number);
        const rw = sectionWidth(section.layout);
        const startX = LABEL_W + (maxW - rw) / 2 + PADDING;

        // Section label
        elements.push(
            <text key={`lbl-${si}`}
                  x={LABEL_W - 4} y={currentY + 8}
                  textAnchor="end" fontSize="7" fontWeight="600"
                  fill={isActive ? section.activeColor : '#94a3b8'}
                  opacity={opacity}
            >
                {section.label}
            </text>
        );

        // Seats
        for (let row = 0; row < section.rows; row++) {
            const y = currentY + row * (SEAT_H + ROW_GAP);
            let x = startX;
            let colIndex = 0;

            groups.forEach((groupSize, gi) => {
                for (let seat = 0; seat < groupSize; seat++) {
                    const letter = String.fromCharCode(65 + colIndex);
                    elements.push(
                        <g key={`${si}-${row}-${gi}-${seat}`}>
                            <rect x={x} y={y} width={SEAT_W} height={SEAT_H}
                                  rx={2}
                                  fill={seatFill}
                                  stroke={seatStroke}
                                  strokeWidth="0.5"
                                  opacity={opacity}
                            />
                            {isActive && row === 0 && (
                                <text x={x + SEAT_W / 2} y={y - 2}
                                      textAnchor="middle" fontSize="5.5"
                                      fill={section.activeColor} fontWeight="600">
                                    {letter}
                                </text>
                            )}
                        </g>
                    );
                    x += SEAT_W + SEAT_GAP;
                    colIndex++;
                }
                if (gi < groups.length - 1) x += AISLE_W;
            });

            // Row number every 5 rows
            if (row % 5 === 0) {
                const absRow = row + 1 + cfg.sections.slice(0, si).reduce((s, sec) => s + sec.rows, 0);
                elements.push(
                    <text key={`rn-${si}-${row}`}
                          x={startX + rw + 5} y={y + 8}
                          fontSize="6" fill="#94a3b8">
                        {absRow}
                    </text>
                );
            }
        }

        const sectionH = section.rows * (SEAT_H + ROW_GAP);
        currentY += sectionH + 4;

        // Section divider
        if (si < cfg.sections.length - 1) {
            elements.push(
                <line key={`div-${si}`}
                      x1={startX - 6} y1={currentY}
                      x2={startX + rw + 6} y2={currentY}
                      stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 2"
                />,
                <text key={`div-lbl-${si}`}
                      x={startX + rw / 2} y={currentY + 6}
                      textAnchor="middle" fontSize="6" fill="#94a3b8">
                    ✂ séparation cabine
                </text>
            );
            currentY += 10;
        }
    });

    // Tail
    elements.push(
        <ellipse key="tail" cx={LABEL_W + maxW / 2 + PADDING} cy={svgH - PADDING + 2}
                 rx={maxW / 2 + 12} ry={10}
                 fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />,
        <text key="tail-txt" x={LABEL_W + maxW / 2 + PADDING} y={svgH - PADDING + 4}
              textAnchor="middle" fontSize="7" fill="#94a3b8">▼ ARRIÈRE</text>
    );

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{cfg.name}</span>
                <span className="font-mono text-slate-400">{equipment}</span>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-xs">
                {cfg.sections.map((s, i) => {
                    const active = !highlightCabin || matchesCabin(s.label, highlightCabin);
                    return (
                        <span key={i} className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm inline-block border"
                                  style={{
                                      background: active ? s.activeColor : '#f1f5f9',
                                      borderColor: active ? s.activeColor : '#e2e8f0',
                                      opacity: active ? 1 : 0.5,
                                  }} />
                            <span style={{ opacity: active ? 1 : 0.5, color: active ? s.activeColor : '#94a3b8' }}
                                  className="font-medium">
                                {s.label}
                            </span>
                            {active && highlightCabin && (
                                <span className="text-[10px] px-1 rounded"
                                      style={{ background: s.activeColor + '20', color: s.activeColor }}>
                                    votre siège
                                </span>
                            )}
                        </span>
                    );
                })}
            </div>

            <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH}
                     className="mx-auto" style={{ maxWidth: '100%' }}>
                    {elements}
                </svg>
            </div>

            <p className="text-[10px] text-slate-400 text-center">
                ⚠️ Configuration approximative — non contractuelle
            </p>
        </div>
    );
}