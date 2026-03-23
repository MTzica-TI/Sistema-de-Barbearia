export type StatusAgendamento = "Confirmado" | "Cancelado";

export type Plano = "Avulso" | "Mensal" | "Premium";

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
}

export interface Servico {
  id: string;
  nome: string;
  preco: number;
  duracaoMinutos: number;
}

export interface Barbeiro {
  id: string;
  nome: string;
  especialidade: string;
  fotoUrl: string;
}

export interface Agendamento {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  plano: Plano;
  servicoId: string;
  servicoNome: string;
  barbeiroId: string;
  barbeiroNome: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  status: StatusAgendamento;
  pagamentoStatus: "Pendente" | "Confirmado";
}
