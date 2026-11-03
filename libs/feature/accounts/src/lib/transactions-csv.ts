import { categoryLabel, formatMad, type Transaction } from '@atlas/domain';

const csvHeader = ['Date', 'Label', 'Category', 'Amount'];
const csvSeparator = ',';
const csvLineBreak = '\r\n';
const csvQuote = '"';
const needsQuoting = /[",\r\n]/;

const csvField = (value: string): string =>
  needsQuoting.test(value)
    ? `${csvQuote}${value.replaceAll(csvQuote, csvQuote + csvQuote)}${csvQuote}`
    : value;

const csvLine = (fields: string[]): string =>
  fields.map(csvField).join(csvSeparator);

export const toCsv = (transactions: readonly Transaction[]): string =>
  [
    csvHeader,
    ...transactions.map((t) => [
      t.date,
      t.label,
      categoryLabel[t.category],
      formatMad(t.amountMad),
    ]),
  ]
    .map(csvLine)
    .join(csvLineBreak);
