import { inject, Injector } from '@angular/core';
import type { Route } from '@angular/router';
import { A2uiRendererService, provideA2UI } from '@a2ui/angular';
import { AssistantStore } from '@atlas/data-access-assistant';
import { AssistantPage } from './assistant-page';
import { AtlasCatalog } from './catalog/atlas-catalog';

export const assistantRoutes: Route[] = [
  {
    path: '',
    component: AssistantPage,
    providers: [
      provideA2UI(() => {
        const injector = inject(Injector);
        return { catalogs: [new AtlasCatalog()], actionHandler: (action) => injector.get(AssistantStore).act(action) };
      }),
      A2uiRendererService,
      AssistantStore,
    ],
  },
];
