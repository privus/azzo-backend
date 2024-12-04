export class CreateRoleDTO {
  nome: string;
  permissoes: PermissaoDTO[];
}

export interface PermissaoDTO {
  permissao_id: number;
  ler: number;
  editar: number;
  criar: number;
}
