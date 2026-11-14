import type { z } from 'zod';
import type { A2uiComponent } from '../a2ui/protocol';
import type { Session } from '../bank';

export interface MacroOutput {
  readonly components: A2uiComponent[];
  readonly data: Record<string, unknown>;
}

interface Macro<Args extends z.ZodTypeAny> {
  readonly args: Args;
  readonly description: string;
  readonly expand: (id: string, args: z.infer<Args>, session: Session) => MacroOutput;
}

export const defineMacro = <Args extends z.ZodTypeAny>({ args, description, expand }: Macro<Args>) => ({
  description,
  run: (id: string, params: unknown, session: Session): MacroOutput => expand(id, args.parse(params), session),
});

export const bind = (id: string, field: string) => ({ '@path': `/${id}/${field}` });
