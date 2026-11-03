import { formatLabel } from './label-format';

describe('formatLabel', () => {
  it('splits bold markers into segments and keeps the rest as text', () => {
    expect(formatLabel('Loyer **septembre** 2026')).toEqual([
      { text: 'Loyer ', bold: false },
      { text: 'septembre', bold: true },
      { text: ' 2026', bold: false },
    ]);
  });

  it('never produces markup from the label itself', () => {
    expect(formatLabel('<img src=x onerror=alert(1)>')).toEqual([{ text: '<img src=x onerror=alert(1)>', bold: false }]);
  });
});
