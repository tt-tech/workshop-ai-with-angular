import type { ServerTraceLine } from '@atlas/domain';
import type { A2uiComponent } from '../a2ui/protocol';
import type { Log } from '../log';
import { blockedNotice } from '../gate/blocked';

export const asked = (model: string, prompt: string) => `-> ${model}: "${prompt}"`;

export const acted = (name: string, accountId: string) => `-> action ${name}(${accountId})`;

export const placed = (components: readonly A2uiComponent[]) =>
  `   model placed: ${components.map((node) => (typeof node['accountId'] === 'string' ? `${node.component}(${node['accountId']})` : node.component)).join(', ')}`;

export const verdict = (components: readonly A2uiComponent[], startedAt: number) => {
  const blocked = components.filter((node) => node.component === blockedNotice).length;
  return `<- ${blocked ? `${blocked} blocked` : 'shown'} in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`;
};

export interface RequestTrace {
  readonly lines: ServerTraceLine[];
  readonly step: Log;
  readonly blocked: Log;
}

export const requestTrace = (trace: Log, log: Log): RequestTrace => {
  const lines: ServerTraceLine[] = [];
  return {
    lines,
    step: (text) => {
      trace(text);
      lines.push({ text, blocked: false });
    },
    blocked: (text) => {
      log(text);
      lines.push({ text, blocked: true });
    },
  };
};
