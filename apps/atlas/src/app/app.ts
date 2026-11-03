import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FrameworkMapToggle } from './framework-map-toggle';
import { ThemeToggle } from './theme-toggle';

@Component({
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FrameworkMapToggle,
    ThemeToggle,
  ],
  selector: 'atlas-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
