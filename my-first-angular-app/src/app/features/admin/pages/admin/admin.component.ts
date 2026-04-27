import { Component } from '@angular/core';
import { HeaderComponent } from '@core/layout/header/header.component';

interface GlobalMetric {
  label: string;
  value: string;
  trend: string;
  trendType: 'positive' | 'neutral' | 'warning';
}

interface SettingItem {
  title: string;
  description: string;
  enabled: boolean;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [HeaderComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class Admin {
  readonly metrics: GlobalMetric[] = [
    {
      label: 'Usuarios activos',
      value: '1,284',
      trend: '+6.2% ultimo mes',
      trendType: 'positive',
    },
    {
      label: 'Sesiones abiertas',
      value: '312',
      trend: 'Estable en las ultimas 24h',
      trendType: 'neutral',
    },
    {
      label: 'Incidentes criticos',
      value: '5',
      trend: 'Requiere revision prioritaria',
      trendType: 'warning',
    },
    {
      label: 'Tiempo medio de respuesta',
      value: '420 ms',
      trend: '-11% vs semana pasada',
      trendType: 'positive',
    },
  ];

  readonly settings: SettingItem[] = [
    {
      title: 'Mantenimiento programado',
      description: 'Habilita la ventana de mantenimiento para tareas de infraestructura.',
      enabled: false,
    },
    {
      title: 'Notificaciones por email',
      description: 'Envia alertas administrativas a los responsables del sistema.',
      enabled: true,
    },
    {
      title: 'Logs de auditoria extendidos',
      description: 'Registra eventos sensibles para trazabilidad completa.',
      enabled: true,
    },
  ];
}
