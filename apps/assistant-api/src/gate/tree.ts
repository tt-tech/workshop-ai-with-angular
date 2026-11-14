import { type A2uiComponent, rootId } from '../a2ui/protocol';

const maxNodes = 200;

const refsOf = (node: A2uiComponent): string[] =>
  [...(Array.isArray(node['children']) ? node['children'] : []), node['child']].filter((ref): ref is string => typeof ref === 'string');

export const treeProblem = (components: readonly A2uiComponent[]): string | undefined => {
  if (components.length > maxNodes) return `more than ${maxNodes} nodes`;
  const byId = new Map(components.map((node) => [node.id, node]));
  if (byId.size !== components.length) return 'duplicate id';
  if (!byId.has(rootId)) return 'no root';
  const refs = components.flatMap(refsOf);
  if (refs.some((ref) => !byId.has(ref))) return 'a child id does not exist';
  if (refs.includes(rootId)) return 'root is referenced as a child';
  if (new Set(refs).size !== refs.length) return 'an id is referenced more than once';
  const reached = new Set<string>();
  const stack = [rootId];
  for (let id = stack.pop(); id !== undefined; id = stack.pop()) {
    reached.add(id);
    stack.push(...refsOf(byId.get(id) as A2uiComponent));
  }
  return reached.size === byId.size ? undefined : 'unreachable nodes or a cycle';
};
