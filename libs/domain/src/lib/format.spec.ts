import { formatMad, formatRib, maskRib } from './format';

describe('formatMad', () => {
  it('groups thousands with a space and uses a comma for decimals', () => {
    expect(formatMad(12450.5)).toBe('12 450,50 MAD');
    expect(formatMad(0)).toBe('0,00 MAD');
    expect(formatMad(-642.5)).toBe('-642,50 MAD');
    expect(formatMad(1234567.891)).toBe('1 234 567,89 MAD');
  });
});

describe('formatRib', () => {
  it('splits a 24-digit RIB into bank, city, account and key', () => {
    expect(formatRib('007780000123456789012345')).toBe('007 780 0001234567890123 45');
  });
  it('masks everything but the last four digits', () => {
    expect(maskRib('007780000123456789012345')).toBe('•••• 2345');
  });
});
