import { Component, signal } from '@angular/core';
import { HeaderComponent } from '@core/layout/header/header.component';
import { Modal } from '@shared/components/modal/modal';

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
  imports: [HeaderComponent, Modal],
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

  readonly settings = signal<SettingItem[]>([
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
  ]);

  /** Confirmation modal state for disabling a setting — [(open)] target for <app-modal>. */
  readonly showConfirm = signal(false);
  private readonly pendingSetting = signal<SettingItem | null>(null);

  /** Title of the setting pending confirmation, for the modal body copy. */
  readonly pendingSettingTitle = () => this.pendingSetting()?.title ?? '';

  /**
   * Disabling a setting requires confirmation; re-enabling does not.
   * Prevents a checkbox click from mutating state directly.
   */
  onToggleClick(event: Event, setting: SettingItem): void {
    event.preventDefault();

    if (setting.enabled) {
      this.pendingSetting.set(setting);
      this.showConfirm.set(true);
      return;
    }

    this.applyToggle(setting);
  }

  confirmDisable(): void {
    const setting = this.pendingSetting();

    if (setting) {
      this.applyToggle(setting);
    }

    this.pendingSetting.set(null);
    this.showConfirm.set(false);
  }

  cancelDisable(): void {
    this.pendingSetting.set(null);
    this.showConfirm.set(false);
  }

  private applyToggle(setting: SettingItem): void {
    this.settings.update((list) =>
      list.map((item) => (item.title === setting.title ? { ...item, enabled: !item.enabled } : item)),
    );
  }
}
