import { Plano } from "@/types";

export type PlanoAssinatura = {
  tipo: Plano;
  nome: string;
  preco: string;
  ciclo: string;
  destaque: boolean;
  beneficios: string[];
};

export type AssinaturaConfig = {
  planos: PlanoAssinatura[];
  formasPagamento: string[];
};

export const DEFAULT_ASSINATURA_CONFIG: AssinaturaConfig = {
  planos: [
    {
      tipo: "Mensal",
      nome: "Plano Mensal Essencial",
      preco: "R$ 159,90",
      ciclo: "/mes",
      destaque: false,
      beneficios: ["4 cortes por mes", "Agendamento prioritario", "Suporte via WhatsApp"],
    },
    {
      tipo: "Premium",
      nome: "Plano Mensal Premium",
      preco: "R$ 249,90",
      ciclo: "/mes",
      destaque: true,
      beneficios: [
        "8 atendimentos por mes",
        "Corte + barba inclusos",
        "Prioridade maxima de agenda",
        "1 tratamento capilar/mensal",
      ],
    },
  ],
  formasPagamento: [
    "Cartao de credito (recorrencia mensal)",
    "PIX recorrente",
    "Debito em conta (consultar disponibilidade)",
  ],
};
