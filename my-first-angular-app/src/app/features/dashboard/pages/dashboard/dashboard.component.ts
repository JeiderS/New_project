import { Component } from '@angular/core';
import { HeaderComponent } from '@core/layout/header/header.component';
import { AppGridComponent} from '@shared/components/app-grid/app-grid.component';
 import { AppPageLayoutComponent } from '@shared/components/app-page-layout/app-page-layout.component';
 import { Modal } from '@shared/components/modal/modal';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AppGridComponent, AppPageLayoutComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class Dashboard {}
