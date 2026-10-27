import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, model, signal } from '@angular/core';

/**
 * File picker + local preview. Does not upload anywhere by itself — it just
 * exposes the picked `File` via the two-way `[(file)]` model, the same idiom
 * `app-modal` uses for `[(open)]`. The consumer sends that file to the backend
 * as part of its own create/update request; the backend is what talks to
 * Cloudinary (signed upload, see `ICloudinaryImageUploader`).
 */
@Component({
  selector: 'app-cloudinary-upload',
  standalone: true,
  templateUrl: './cloudinary-upload.component.html',
  styleUrl: './cloudinary-upload.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudinaryUploadComponent {
  /** Existing image URL (edit mode) — shown until a new file is picked. */
  initialUrl = input<string>('');

  /** Two-way bindable picked file: `[(file)]`. Null while none has been picked. */
  file = model<File | null>(null);

  private readonly objectUrl = signal<string | null>(null);

  readonly previewUrl = computed(() => this.objectUrl() ?? (this.initialUrl() || null));

  constructor() {
    inject(DestroyRef).onDestroy(() => this.revokeObjectUrl());
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0];

    if (!selected) {
      return;
    }

    this.revokeObjectUrl();
    this.objectUrl.set(URL.createObjectURL(selected));
    this.file.set(selected);
  }

  private revokeObjectUrl(): void {
    const current = this.objectUrl();
    if (current) {
      URL.revokeObjectURL(current);
    }
  }
}
