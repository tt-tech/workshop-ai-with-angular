import { z } from 'zod';

export const protocolVersion = '1.0';
export const rootId = 'root';
export const serverIdSeparator = '__';

export const idSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{1,40}$/)
  .refine((id) => !id.includes(serverIdSeparator), `ids containing "${serverIdSeparator}" are reserved for the server`);

export const serverId = (id: string, part: string) => `${id}${serverIdSeparator}${part}`;

export const componentSchema = z.object({ id: idSchema, component: z.string() }).passthrough();
export type A2uiComponent = z.infer<typeof componentSchema>;

export const messageSchema = z.union([
  z.object({ version: z.literal(protocolVersion), createSurface: z.object({ surfaceId: z.string(), components: z.array(componentSchema).optional() }).passthrough() }),
  z.object({ version: z.literal(protocolVersion), updateComponents: z.object({ surfaceId: z.string(), components: z.array(componentSchema) }) }),
  z.object({ version: z.literal(protocolVersion), updateDataModel: z.object({ surfaceId: z.string() }).passthrough() }),
]);
