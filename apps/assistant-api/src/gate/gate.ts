import type { A2uiComponent } from '../a2ui/protocol';
import type { Session } from '../bank';
import type { Log } from '../log';
import { blockedAnswer, blockedPart, reason, urlsIn } from './blocked';
import type { MacroOutput } from './macro';
import { isMacro, macros } from './macro-registry';
import { isModelComponent, modelComponents } from './model-components';
import { treeProblem } from './tree';

export interface GatedSurface {
  readonly components: readonly A2uiComponent[];
  readonly data: Record<string, unknown>;
}

const ownKeys = new Set(['id', 'component']);
const paramsOf = (node: A2uiComponent) => Object.fromEntries(Object.entries(node).filter(([key]) => !ownKeys.has(key)));

const checkOrExpand = (node: A2uiComponent, session: Session): MacroOutput => {
  if (isMacro(node.component)) return macros[node.component].run(node.id, paramsOf(node), session);
  if (!isModelComponent(node.component)) throw new Error('not allowed here');
  modelComponents[node.component].parse(paramsOf(node));
  return { components: [node], data: {} };
};

export const passGate = (components: readonly A2uiComponent[], session: Session, log: Log): GatedSurface => {
  const out: A2uiComponent[] = [];
  const data: Record<string, unknown> = {};
  for (const node of components) {
    try {
      const passed = checkOrExpand(node, session);
      out.push(...passed.components);
      if (isMacro(node.component)) data[node.id] = passed.data;
    } catch (error) {
      const urls = urlsIn(node);
      log(`assistant-api: ${node.component} "${node.id}" rejected: ${reason(error)}${urls.length ? `; wanted ${urls.join(', ')}` : ''}`);
      out.push(...blockedPart(node, error));
    }
  }
  const problem = treeProblem(out);
  if (!problem) return { components: out, data };
  log(`assistant-api: answer rejected: ${problem}`);
  return { components: blockedAnswer(), data: {} };
};
