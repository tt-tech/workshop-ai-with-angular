import { Component, computed, DOCUMENT, inject, signal } from '@angular/core';
import { localStorageOf, readSetting, writeSetting } from './stored-setting';

export const themeKey = 'atlas.theme';
export type Theme = 'system' | 'light' | 'dark';

const themes: readonly Theme[] = ['system', 'light', 'dark'];
const themeLabel: Record<Theme, string> = {
  system: 'Theme: system',
  light: 'Theme: light',
  dark: 'Theme: dark',
};

const isTheme = (value: string | undefined): value is Theme =>
  themes.includes(value as Theme);

/** System follows the device; light and dark are remembered in this browser and set html[data-theme]. */
@Component({
  selector: 'atlas-theme-toggle',
  template: `
    <button type="button" class="toggle" (click)="next()">
      <span class="icon" aria-hidden="true">{{ icon() }}</span>
      {{ label() }}
    </button>
  `,
  styles: `
    .toggle {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      width: 100%;
      padding: var(--space-2) var(--space-3);
      border: 0;
      border-radius: var(--radius-m);
      background: transparent;
      color: inherit;
      font-size: var(--text-s);
      opacity: 0.78;
      cursor: pointer;
    }
    .toggle:hover {
      opacity: 1;
      background: color-mix(in srgb, currentColor 10%, transparent);
    }
    .icon {
      width: 1.25rem;
      text-align: center;
    }
  `,
})
export class ThemeToggle {
  private readonly document = inject(DOCUMENT);
  private readonly storage = localStorageOf(this.document);
  private readonly stored = readSetting(this.storage, themeKey);
  protected readonly theme = signal<Theme>(
    isTheme(this.stored) ? this.stored : 'system',
  );
  protected readonly label = computed(() => themeLabel[this.theme()]);
  protected readonly icon = computed(() =>
    this.theme() === 'dark' ? '☾' : this.theme() === 'light' ? '☀' : '◐',
  );

  constructor() {
    this.apply();
  }

  protected next(): void {
    this.theme.update((t) => themes[(themes.indexOf(t) + 1) % themes.length]);
    writeSetting(
      this.storage,
      themeKey,
      this.theme() === 'system' ? undefined : this.theme(),
    );
    this.apply();
  }

  private apply(): void {
    const root = this.document.documentElement;
    if (this.theme() === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', this.theme());
  }
}
