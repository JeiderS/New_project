import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AuthService } from '@core/auth/services/auth.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export class LayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly pageTitle = signal('');

  ngOnInit() {
    this.authService.loadUser();
    this.pageTitle.set(this.resolveTitle());

    this.router
      .events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.pageTitle.set(this.resolveTitle()));
  }

  private resolveTitle(): string {
    let current = this.route.firstChild;

    while (current?.firstChild) {
      current = current.firstChild;
    }

    return (current?.snapshot?.data?.['title'] as string | undefined) ?? '';
  }
}
