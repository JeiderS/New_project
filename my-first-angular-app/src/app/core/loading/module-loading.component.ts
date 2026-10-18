import { Component, inject } from '@angular/core';
import { ModuleLoadingService } from './module-loading.service';

@Component({
  selector: 'app-module-loading',
  template: `
    @if (moduleLoadingService.isLoading()) {
      <div class="module-loading" role="status" aria-live="polite">
        <svg
          class="loader-figure module-loading__svg"
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

        <span class="module-loading__sr">Cargando</span>
      </div>
    }
  `,
  styleUrl: './module-loading.component.css',
})
export class ModuleLoadingComponent {
  protected readonly moduleLoadingService = inject(ModuleLoadingService);
}
