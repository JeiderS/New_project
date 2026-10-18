export interface RoleGrant {
  moduleId: number;
  actionId: number;
}

export interface Role {
  id: number;
  name: string;
  grants: RoleGrant[];
}
