import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AlertHelper } from './helper/alert.helper';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('my-first-angular-app');

  constructor(readonly alertHelper: AlertHelper) {}

  closeAlert(): void {
    this.alertHelper.close();
  }
}
