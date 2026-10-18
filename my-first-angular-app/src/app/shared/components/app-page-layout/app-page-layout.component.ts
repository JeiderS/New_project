import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-layout',
  standalone: true,
  templateUrl: './app-page-layout.component.html',
  styleUrl: './app-page-layout.component.css',
})
export class AppPageLayoutComponent {
  layout = input<'single' | 'split' | 'left-stacked-right'>('single');

  leftRatio = input(70);
  rightRatio = input(30);
}