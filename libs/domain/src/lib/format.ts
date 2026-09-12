const ribBankDigits = 3;
const ribCityDigits = 3;
const ribAccountDigits = 16;

/** `007780000123456789012345` → `007 780 0001234567890123 45` */
export const formatRib = (rib: string): string => {
  const bank = rib.slice(0, ribBankDigits);
  const city = rib.slice(ribBankDigits, ribBankDigits + ribCityDigits);
  const account = rib.slice(ribBankDigits + ribCityDigits, ribBankDigits + ribCityDigits + ribAccountDigits);
  const key = rib.slice(ribBankDigits + ribCityDigits + ribAccountDigits);
  return `${bank} ${city} ${account} ${key}`;
};

/** `007780000123456789012345` → `•••• 2345` */
export const maskRib = (rib: string): string => `•••• ${rib.slice(-4)}`;

const thousandsSeparator = ' ';
const decimalSeparator = ',';

/**
 * `12450.5` → `12 450,50 MAD`. Deliberately not Intl: Moroccan convention (space grouping, comma decimals)
 * rendered identically in every browser and in Node, so tests can assert the exact string.
 */
export const formatMad = (amount: number): string => {
  const sign = amount < 0 ? '-' : '';
  const [integer, fraction] = Math.abs(amount).toFixed(2).split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
  return `${sign}${grouped}${decimalSeparator}${fraction} MAD`;
};
