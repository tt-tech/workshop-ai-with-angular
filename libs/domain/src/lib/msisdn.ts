const moroccoCountryCode = '212';

/** Formats a stored MSISDN (`212612345678`) for display: `+212 6 12 34 56 78`. */
export const formatMsisdn = (msisdn: string): string => {
  const national = msisdn.startsWith(moroccoCountryCode) ? msisdn.slice(moroccoCountryCode.length) : msisdn;
  const pairs = national.slice(1).match(/.{1,2}/g) ?? [];
  return `+${moroccoCountryCode} ${national.charAt(0)} ${pairs.join(' ')}`;
};
