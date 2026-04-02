export interface SubmoduloPermiso {
  submoduloId: number;
  submoduloCodigo: string;
  submoduloNombre: string;
  activo: boolean;
}

export interface ModuloPermiso {
  moduloId: number;
  moduloCodigo: string;
  moduloNombre: string;
  activo: boolean;
  submodulos: SubmoduloPermiso[];
}

export interface EmpresaPermisos {
  empresaId: number;
  empresaNombre: string;
  empresaNit: string;
  modulos: ModuloPermiso[];
}

export interface UpdatePermisoDto {
  modulos: ModuloPermisoUpdate[];
}

export interface ModuloPermisoUpdate {
  moduloId: number;
  activo: boolean;
  submodulos: SubmoduloPermisoUpdate[];
}

export interface SubmoduloPermisoUpdate {
  submoduloId: number;
  activo: boolean;
}
