import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { provideGlobalGridOptions } from 'ag-grid-community';
import { appGridTheme } from './app/core/ag-grid-utils/ag-grid-theme';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);


provideGlobalGridOptions({
  theme: appGridTheme,
  defaultColDef: {
    sortable: true,
    filter: true,
    resizable: true,
    enableRowGroup: true
  }
});

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
