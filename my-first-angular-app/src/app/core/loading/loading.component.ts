import { Component, inject } from '@angular/core';
import { LoadingService } from './loading.service';

@Component({
  selector: 'app-loading',
  template: `
    @if (loadingService.isLoading()) {
      <div class="loading-backdrop" role="status" aria-live="polite">
        <div class="loading-panel">
          <svg
            class="loader-figure loading-panel__svg"
            viewBox="0 0 240 240"
            aria-hidden="true"
            focusable="false"
          >
            <circle class="loader-figure__halo" cx="120" cy="120" r="114" />
            <circle class="loader-figure__core" cx="120" cy="120" r="56" />
            <g class="loader-figure__spin">
              <circle class="loader-figure__arc" cx="120" cy="120" r="25" />
            </g>
          </svg>

          @if (loadingService.message(); as message) {
            <p class="loading-message">{{ message }}</p>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './loading.component.css',
})
export class LoadingComponent {
  protected readonly loadingService = inject(LoadingService);
}
