import type { IncomingMessage } from 'node:http';

const maxBodyBytes = 16_384;

export class TooLarge extends Error {}

export const readJson = async (req: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of req as AsyncIterable<Buffer>) {
    bytes += chunk.byteLength;
    if (bytes > maxBodyBytes) throw new TooLarge();
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};
