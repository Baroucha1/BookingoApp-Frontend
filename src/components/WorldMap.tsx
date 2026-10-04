import { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { motion, AnimatePresence } from 'framer-motion';
import type { CountryGroup } from '@/pages/visa';
import { useLanguage } from '@/i18n/LanguageContext';

// Lightweight TopoJSON of world countries (~100KB, single fetch, browser-cached)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// ISO-2 → [longitude, latitude] for capital / representative city
// Only the ones we have visas for (extend as needed)
const COUNTRY_COORDS: Record<string, [number, number]> = {
  tr: [35.2433, 38.9637],   // Turkey
  eg: [30.8025, 26.8206],   // Egypt
  jo: [36.2384, 30.5852],   // Jordan
  az: [47.5769, 40.1431],   // Azerbaijan
  et: [40.4897, 9.145],     // Ethiopia
  vn: [108.2772, 14.0583],  // Vietnam
  om: [55.9233, 21.4735],   // Oman
  id: [113.9213, -0.7893],  // Indonesia
  ci: [-5.547, 7.54],       // Côte d'Ivoire
  am: [45.0382, 40.0691],   // Armenia
  uz: [64.5853, 41.3775],   // Uzbekistan
  qa: [51.1839, 25.3548],   // Qatar
  th: [100.9925, 15.87],    // Thailand
  ke: [37.9062, -0.0236],   // Kenya
  tn: [9.5375, 33.8869],    // Tunisia
  ma: [-7.0926, 31.7917],   // Morocco
  ae: [53.8478, 23.4241],   // UAE
  sa: [45.0792, 23.8859],   // Saudi Arabia
  my: [101.9758, 4.2105],   // Malaysia
  sg: [103.8198, 1.3521],   // Singapore
  lk: [80.7718, 7.8731],    // Sri Lanka
  np: [84.124, 28.3949],    // Nepal
  in: [78.9629, 20.5937],   // India
  ph: [121.774, 12.8797],   // Philippines
  kh: [104.9909, 12.5657],  // Cambodia
  la: [102.4955, 19.8563],  // Laos
  mm: [95.956, 21.9162],    // Myanmar
  ge: [43.3569, 42.3154],   // Georgia
  ru: [105.3188, 61.524],   // Russia
  bh: [50.5577, 25.9304],   // Bahrain
  kw: [47.4818, 29.3117],   // Kuwait
  za: [22.9375, -30.5595],  // South Africa
  tz: [34.8888, -6.369],    // Tanzania
  rw: [29.8739, -1.9403],   // Rwanda
  sn: [-14.4524, 14.4974],  // Senegal
};

interface Props {
  countries: CountryGroup[];
  onSelect: (group: CountryGroup) => void;
}

const WorldMap = ({ countries, onSelect }: Props) => {
  const { language } = useLanguage();
  const [hovered, setHovered] = useState<{ group: CountryGroup; x: number; y: number } | null>(null);

  const localizedName = (g: CountryGroup) =>
    language === 'ar' ? g.country_name_ar : language === 'fr' ? g.country_name_fr : g.country_name_en;
  const localizedDesc = (g: CountryGroup) =>
    language === 'ar' ? g.description_ar : language === 'fr' ? g.description_fr : g.description_en;

  const markers = useMemo(
    () =>
      countries
        .map(c => {
          const coords = COUNTRY_COORDS[c.country_code.toLowerCase()];
          if (!coords) return null;
          return { group: c, coords };
        })
        .filter(Boolean) as { group: CountryGroup; coords: [number, number] }[],
    [countries],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative w-full h-full select-none"
    >
      <ComposableMap
        projectionConfig={{ scale: 155 }}
        width={980}
        height={500}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: {
                    fill: 'hsl(var(--primary) / 0.18)',
                    stroke: 'hsl(var(--primary) / 0.35)',
                    strokeWidth: 0.4,
                    outline: 'none',
                  },
                  hover: {
                    fill: 'hsl(var(--primary) / 0.28)',
                    stroke: 'hsl(var(--primary) / 0.5)',
                    strokeWidth: 0.5,
                    outline: 'none',
                  },
                  pressed: { fill: 'hsl(var(--primary) / 0.3)', outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {markers.map(({ group, coords }, i) => (
          <Marker
            key={group.country_code}
            coordinates={coords}
            onMouseEnter={(e: React.MouseEvent) => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              const parentRect =
                (e.currentTarget.closest('.relative') as HTMLElement)?.getBoundingClientRect() ??
                rect;
              setHovered({
                group,
                x: rect.left + rect.width / 2 - parentRect.left,
                y: rect.top - parentRect.top,
              });
            }}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelect(group)}
          >
            {/* Pulse */}
            <circle
              r={9}
              fill="hsl(var(--accent))"
              opacity={0.35}
              style={{
                animation: `pulse-pin 2s ease-out infinite`,
                animationDelay: `${(i % 8) * 0.2}s`,
                transformOrigin: 'center',
              }}
            />
            {/* Pin */}
            <circle
              r={4.5}
              fill="hsl(var(--accent))"
              stroke="white"
              strokeWidth={1.5}
              className="transition-transform duration-200 hover:scale-150"
            />
          </Marker>
        ))}
      </ComposableMap>

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full"
            style={{ left: hovered.x, top: hovered.y - 8 }}
          >
            <div className="bg-card border shadow-xl rounded-xl px-3.5 py-2.5 min-w-[180px] max-w-[240px]">
              <div className="flex items-center gap-2 mb-1">
                <img
                  src={`https://flagcdn.com/w40/${hovered.group.country_code.toLowerCase()}.png`}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover border"
                />
                <span className="font-semibold text-sm">{localizedName(hovered.group)}</span>
              </div>
              {localizedDesc(hovered.group) && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
                  {localizedDesc(hovered.group)}
                </p>
              )}
              <div className="text-[11px] font-medium text-primary">
                {language === 'ar' ? 'انقر لبدء الطلب' : language === 'fr' ? 'Cliquez pour démarrer' : 'Click to start'}
              </div>
              {/* arrow */}
              <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-card border-r border-b rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse-pin {
          0% { transform: scale(0.6); opacity: 0.6; }
          70% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </motion.div>
  );
};

export default WorldMap;
