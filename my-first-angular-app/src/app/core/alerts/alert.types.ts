export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'session';

export type AlertResult = 'primary' | 'secondary' | 'dismiss' | 'timeout';

export interface AlertOptions {
  type?: AlertType;
  title: string;
  message: string;
  /** false removes the buttons; true forces them. Defaults to the type's own level. */
  buttons?: boolean;
  primaryText?: string;
  secondaryText?: string;
  /** Destructive action: red primary button (and trash icon on 'confirm'). */
  danger?: boolean;
  /** Esc / backdrop-click (when buttonless) dismiss. Defaults to true, except 'session'. */
  dismissible?: boolean;
  /** ms before auto-close. Buttonless alerts always get one (2500 by default). */
  autoClose?: number;
}

export interface ResolvedAlertOptions {
  type: AlertType;
  title: string;
  message: string;
  buttons: boolean;
  primaryText: string;
  secondaryText: string | null;
  danger: boolean;
  dismissible: boolean;
  autoClose: number;
}

export interface ActiveAlert {
  id: number;
  opts: ResolvedAlertOptions;
  resolve: (result: AlertResult) => void;
}
