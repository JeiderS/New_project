import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { AppModule } from '@core/interfaces/module.interface';

export interface ModuleTreeItem {
  module: AppModule;
  children: ModuleTreeItem[];
}

/**
 * Recursive tree row for the Roles permissions picker's "Modulos" column.
 * Parent modules (with children) act as expand/collapse toggles; leaf
 * modules are directly selectable and emit `select` with their module id.
 * If a module with children also has actions assigned to it directly, its
 * row still emits `select` on click alongside toggling expansion.
 */
@Component({
  selector: 'app-module-tree-node',
  standalone: true,
  imports: [ModuleTreeNode],
  templateUrl: './module-tree-node.html',
  styleUrl: './module-tree-node.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleTreeNode {
  @Input({ required: true }) node!: ModuleTreeItem;
  @Input() depth = 0;
  @Input() selectedModuleId: number | null = null;
  @Output() select = new EventEmitter<number>();

  readonly expanded = signal(false);

  get hasChildren(): boolean {
    return this.node.children.length > 0;
  }

  toggleExpand(): void {
    this.expanded.update((value) => !value);
  }

  onRowClick(): void {
    if (this.hasChildren) {
      this.toggleExpand();
    }
    this.select.emit(this.node.module.id);
  }

  onChildSelect(moduleId: number): void {
    this.select.emit(moduleId);
  }
}
