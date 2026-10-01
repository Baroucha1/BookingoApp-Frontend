export const AIRLINE_NAMES: Record<string, string> = {
  AH: 'Air Algérie',
  TU: 'Tunisair',
  TK: 'Turkish Airlines',
  QR: 'Qatar Airways',
  EK: 'Emirates',
  EY: 'Etihad Airways',
  RJ: 'Royal Jordanian',
  MS: 'Egyptair',
  AF: 'Air France',
  LH: 'Lufthansa',
  IB: 'Iberia',
  AZ: 'ITA Airways',
  VY: 'Vueling',
  VF: 'AJet',
  '5O': 'ASL Airlines ',
  PC: 'Pegasus'
};

export function getAirlineName(code: string): string {
  return AIRLINE_NAMES[code] || code;
}

export function getAirlineLogo(code: string): string {
  return `https://www.gstatic.com/flights/airline_logos/70px/${code}.png`;
}
