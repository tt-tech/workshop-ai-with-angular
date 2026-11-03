import {
  afterNextRender,
  Component,
  createNgModule,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  EnvironmentInjector,
  inject,
  NgModule,
  type NgModuleRef,
  provideZonelessChangeDetection,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { UpgradeModule } from '@angular/upgrade/static';
import {
  beneficiariesModule,
  beneficiariesScreenTag,
} from './beneficiaries.module';

@NgModule({
  imports: [UpgradeModule],
  providers: [provideZonelessChangeDetection()],
})
export class BeneficiariesUpgradeModule {}

@Component({
  selector: 'atlas-beneficiaries-host',
  template: `<div class="lb-root" data-framework="angularjs" #root></div>`,
  encapsulation: ViewEncapsulation.None,
  // Legacy screen: reads the new tokens but keeps its flat, card-less layout, so old and new stay easy to tell apart.
  styles: `
    .lb-header {
      padding-bottom: 1.25rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--color-border);
    }
    .lb-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .lb-subtitle {
      margin: 2rem 0 0.75rem;
      font-size: 1.05rem;
      font-weight: 600;
    }
    .lb-muted {
      margin: 0.25rem 0 0;
      color: var(--color-text-muted);
    }
    .lb-strong {
      font-weight: 500;
    }
    .lb-mono {
      font-family: var(--font-mono);
      font-size: 0.8125rem;
    }
    .lb-error {
      color: var(--color-danger);
      margin: 0.5rem 0;
    }
    .lb-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .lb-toolbar input {
      flex: 1 1 14rem;
    }
    .lb-root .table td.num {
      text-align: right;
    }
    .lb-pending {
      margin: 0;
      padding-left: 1.1rem;
    }
    .lb-form {
      display: grid;
      gap: 0.4rem;
      max-width: 26rem;
    }
    .lb-form .button {
      justify-self: start;
      margin-top: 0.5rem;
    }
    .lb-root .is-new td,
    .lb-root li.is-new {
      background: var(--color-brand-soft);
    }
    @media (max-width: 800px) {
      .lb-root .table {
        display: block;
        overflow-x: auto;
      }
    }
  `,
})
export class BeneficiariesHost {
  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');

  constructor() {
    const environment = inject(EnvironmentInjector);
    const document = inject(DOCUMENT);
    let hybrid: NgModuleRef<BeneficiariesUpgradeModule> | undefined;

    afterNextRender(() => {
      hybrid = createNgModule(BeneficiariesUpgradeModule, environment);
      const element = this.root().nativeElement;
      element.appendChild(document.createElement(beneficiariesScreenTag));
      hybrid.injector
        .get(UpgradeModule)
        .bootstrap(element, [beneficiariesModule.name], { strictDi: true });
    });

    inject(DestroyRef).onDestroy(() => {
      hybrid?.injector
        .get(UpgradeModule)
        .$injector.get('$rootScope')
        .$destroy();
      hybrid?.destroy();
    });
  }
}
