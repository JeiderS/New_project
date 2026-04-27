export interface MenuItem {
  nombre: string;
  icon?: string;
  route?: string;
  children?: MenuItem[];
}