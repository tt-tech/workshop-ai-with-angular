import { assistantCatalogId } from '@atlas/domain';
import { type A2uiComponent, protocolVersion } from './protocol';

export const surfaceMessages = (surfaceId: string, components: readonly A2uiComponent[], dataModel: Record<string, unknown>) => [
  { version: protocolVersion, createSurface: { surfaceId, catalogId: assistantCatalogId, components, dataModel } },
];
