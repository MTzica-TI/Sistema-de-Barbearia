import { Barbeiro, Servico } from "@/types";

export const barbeiros: Barbeiro[] = [
  {
    id: "b1",
    nome: "Carlos",
    especialidade: "Fade e barba desenhada",
    fotoUrl: "/images/barbeiros/carlos.svg",
    ativo: true,
  },
  {
    id: "b2",
    nome: "Rafael",
    especialidade: "Cortes classicos",
    fotoUrl: "/images/barbeiros/rafael.svg",
    ativo: true,
  },
  {
    id: "b3",
    nome: "Diego",
    especialidade: "Degrade e navalhado",
    fotoUrl: "/images/barbeiros/diego.svg",
    ativo: true,
  },
  {
    id: "b4",
    nome: "Eduardo",
    especialidade: "Corte social e tesoura",
    fotoUrl: "/images/barbeiros/eduardo.svg",
    ativo: true,
  },
  {
    id: "b5",
    nome: "Lucas",
    especialidade: "Barba premium",
    fotoUrl: "/images/barbeiros/lucas.svg",
    ativo: true,
  },
  {
    id: "b6",
    nome: "Matheus",
    especialidade: "Corte infantil e degrade",
    fotoUrl: "/images/barbeiros/matheus.svg",
    ativo: true,
  },
];

export const servicos: Servico[] = [
  { id: "s1", nome: "Corte", preco: 45, duracaoMinutos: 30 },
  { id: "s2", nome: "Barba", preco: 35, duracaoMinutos: 30 },
  { id: "s3", nome: "Corte + Barba", preco: 70, duracaoMinutos: 60 },
  { id: "s4", nome: "Pigmentacao", preco: 55, duracaoMinutos: 45 },
  { id: "s5", nome: "Sobrancelha", preco: 20, duracaoMinutos: 15 },
];

export const horariosPadrao = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
];
