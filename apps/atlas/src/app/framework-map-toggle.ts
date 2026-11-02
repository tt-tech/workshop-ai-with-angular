import { Component, DOCUMENT, inject, signal } from '@angular/core';

export const frameworkMapKey = 'atlas.frameworkMap';
export const frameworkMapClass = 'framework-map';
const storedOn = 'on';

const readStored = (storage: Storage | undefined): boolean => {
  try {
    return storage?.getItem(frameworkMapKey) === storedOn;
  } catch {
    return false;
  }
};

const writeStored = (storage: Storage | undefined, on: boolean): void => {
  try {
    if (on) storage?.setItem(frameworkMapKey, storedOn);
    else storage?.removeItem(frameworkMapKey);
  } catch {
    // storage unavailable: the map toggles for this page view only
  }
};

const localStorageOf = (document: Document): Storage | undefined => {
  try {
    return document.defaultView?.localStorage;
  } catch {
    return undefined;
  }
};

@Component({
  selector: 'atlas-framework-map-toggle',
  template: `
    <button type="button" class="toggle" [attr.aria-pressed]="on()" (click)="toggle()">Framework map</button>
    @if (on()) {
      <ul class="legend" aria-label="Framework map legend">
        <li><span class="swatch swatch--angular"></span>Angular standalone</li>
        <li><span class="swatch swatch--legacy"></span>Angular NgModule (legacy)</li>
        <li><span class="swatch swatch--angularjs"></span>AngularJS 1.8</li>
      </ul>
    }
  `,
  styles: `
    :host { position: fixed; right: 1rem; bottom: 1rem; z-index: 1000; display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; font-size: 0.75rem; }
    .toggle { padding: 0.3rem 0.65rem; border: 1px dashed var(--line-strong); border-radius: 999px; background: var(--paper); color: var(--ink-2); font: inherit; cursor: pointer; opacity: 0.75; }
    .toggle:hover, .toggle[aria-pressed='true'] { opacity: 1; color: var(--ink); }
    .legend { margin: 0; padding: 0.5rem 0.65rem; list-style: none; background: var(--paper); border: 1px solid var(--line); border-radius: 6px; display: grid; gap: 0.25rem; }
    .swatch { display: inline-block; width: 0.8rem; height: 0.8rem; margin-right: 0.4rem; vertical-align: -0.1rem; border: 2px dashed; border-radius: 2px; }
    .swatch--angular { border-color: var(--fw-angular); }
    .swatch--legacy { border-color: var(--fw-legacy); }
    .swatch--angularjs { border-color: var(--fw-angularjs); }
  `,
})
export class FrameworkMapToggle {
  private readonly document = inject(DOCUMENT);
  private readonly storage = localStorageOf(this.document);
  protected readonly on = signal(readStored(this.storage));

  constructor() {
    this.apply();
  }

  protected toggle(): void {
    this.on.update((on) => !on);
    writeStored(this.storage, this.on());
    this.apply();
  }

  private apply(): void {
    this.document.documentElement.classList.toggle(frameworkMapClass, this.on());
  }
}
