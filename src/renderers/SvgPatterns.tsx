export const SvgPatterns = () => (
  <defs>
    <pattern id="pattern-rubber" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(22)">
      <rect width="10" height="10" fill="#2f343a" />
      <line x1="0" y1="0" x2="0" y2="10" stroke="#4b5056" strokeWidth="2" />
    </pattern>
    <pattern id="pattern-pile" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="#4c5968" />
      <circle cx="2" cy="2" r="0.7" fill="#6f7d8c" />
      <circle cx="6" cy="4" r="0.7" fill="#5f6e7d" />
      <circle cx="4" cy="7" r="0.8" fill="#758595" />
    </pattern>
    <pattern id="pattern-brush" width="12" height="12" patternUnits="userSpaceOnUse">
      <rect width="12" height="12" fill="#365662" />
      <line x1="2" y1="2" x2="5" y2="5" stroke="#87a9b5" strokeWidth="1" />
      <line x1="8" y1="3" x2="10" y2="7" stroke="#8fb4bf" strokeWidth="1" />
      <line x1="3" y1="8" x2="6" y2="10" stroke="#95bac4" strokeWidth="1" />
      <circle cx="9" cy="9" r="1" fill="#aac9d0" />
    </pattern>
    <linearGradient id="pattern-scraper" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#cfd5db" />
      <stop offset="50%" stopColor="#f2f4f6" />
      <stop offset="100%" stopColor="#b4bcc5" />
    </linearGradient>
    <pattern id="pattern-scraper-rib" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="url(#pattern-scraper)" />
      <line x1="0" y1="0" x2="0" y2="8" stroke="#9ea6af" strokeWidth="1.2" />
    </pattern>
  </defs>
);

