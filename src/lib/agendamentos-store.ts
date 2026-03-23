import { Agendamento } from "@/types";

const hoje = new Date();
const dataHoje = hoje.toISOString().slice(0, 10);

let agendamentos: Agendamento[] = [
  {
    id: "a1",
    clienteNome: "Joao",
    clienteTelefone: "11999990000",
    plano: "Mensal",
    servicoId: "s3",
    servicoNome: "Corte + Barba",
    barbeiroId: "b1",
    barbeiroNome: "Carlos",
    data: dataHoje,
    horario: "14:00",
    status: "Confirmado",
    pagamentoStatus: "Confirmado",
  },
  {
    id: "a2",
    clienteNome: "Pedro",
    clienteTelefone: "11988887777",
    plano: "Avulso",
    servicoId: "s1",
    servicoNome: "Corte",
    barbeiroId: "b1",
    barbeiroNome: "Carlos",
    data: dataHoje,
    horario: "14:30",
    status: "Confirmado",
    pagamentoStatus: "Confirmado",
  },
];

export function listarAgendamentos() {
  return agendamentos;
}

export function criarAgendamento(agendamento: Agendamento) {
  const conflito = agendamentos.some(
    (item) =>
      item.barbeiroId === agendamento.barbeiroId &&
      item.data === agendamento.data &&
      item.horario === agendamento.horario &&
      item.status === "Confirmado"
  );

  if (conflito) {
    return { ok: false as const, error: "Horario indisponivel para esse barbeiro." };
  }

  agendamentos = [agendamento, ...agendamentos];
  return { ok: true as const, data: agendamento };
}

export function cancelarAgendamento(id: string) {
  const existe = agendamentos.find((a) => a.id === id);
  if (!existe) {
    return { ok: false as const, error: "Agendamento nao encontrado." };
  }

  agendamentos = agendamentos.map((item) =>
    item.id === id
      ? {
          ...item,
          status: "Cancelado",
        }
      : item
  );

  return { ok: true as const };
}

export function horariosOcupados(data: string, barbeiroId: string) {
  return agendamentos
    .filter(
      (item) =>
        item.data === data &&
        item.barbeiroId === barbeiroId &&
        item.status === "Confirmado"
    )
    .map((item) => item.horario);
}
