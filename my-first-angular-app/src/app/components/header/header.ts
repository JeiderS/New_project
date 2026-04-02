import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly title = input.required<string>();
  readonly kicker = input<string>('');
  readonly description = input<string>('');
}
