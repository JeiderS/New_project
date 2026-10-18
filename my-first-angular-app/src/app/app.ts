import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingComponent } from './core/loading/loading.component';
import { ModuleLoadingComponent } from './core/loading/module-loading.component';
import { AlertContainerComponent } from './core/alerts/alert-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoadingComponent, ModuleLoadingComponent, AlertContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('my-first-angular-app');
}
