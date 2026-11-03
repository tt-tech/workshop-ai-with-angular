export interface LabelSegment {
  readonly text: string;
  readonly bold: boolean;
}

/** `Loyer **septembre**` → [{Loyer }, {septembre, bold}]. Text stays text; the template decides the markup. No HTML is ever built from user input. */
export const formatLabel = (label: string): LabelSegment[] =>
  label
    .split(/(\*\*[^*]+\*\*)/)
    .filter((part) => part !== '')
    .map((part) =>
      part.startsWith('**') && part.endsWith('**')
        ? { text: part.slice(2, -2), bold: true }
        : { text: part, bold: false },
    );
