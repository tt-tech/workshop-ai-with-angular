import { TestBed } from '@angular/core/testing';
import { FrameworkMapToggle } from './framework-map-toggle';

const html = () => document.documentElement;

const setup = () => {
  TestBed.configureTestingModule({ imports: [FrameworkMapToggle] });
  const fixture = TestBed.createComponent(FrameworkMapToggle);
  fixture.detectChanges();
  const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  const click = () => {
    button.click();
    fixture.detectChanges();
  };
  return { fixture, button, click };
};

describe('FrameworkMapToggle', () => {
  afterEach(() => {
    localStorage.clear();
    html().classList.remove('framework-map');
    vi.restoreAllMocks();
  });

  it('turns the map on: class on <html>, legend shown, choice remembered', () => {
    const { fixture, button, click } = setup();
    click();
    expect(html().classList.contains('framework-map')).toBe(true);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('AngularJS 1.8');
    expect(localStorage.getItem('atlas.frameworkMap')).toBe('on');
  });

  it('turns the map off again and forgets the choice', () => {
    localStorage.setItem('atlas.frameworkMap', 'on');
    const { click } = setup();
    click();
    expect(html().classList.contains('framework-map')).toBe(false);
    expect(localStorage.getItem('atlas.frameworkMap')).toBeNull();
  });

  it('restores the map on load when it was left on', () => {
    localStorage.setItem('atlas.frameworkMap', 'on');
    setup();
    expect(html().classList.contains('framework-map')).toBe(true);
  });

  it('still toggles when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    const { click } = setup();
    click();
    expect(html().classList.contains('framework-map')).toBe(true);
  });
});
