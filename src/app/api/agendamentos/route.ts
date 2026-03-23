import { NextRequest, NextResponse } from "next/server";
import {
  criarAgendamento,
  listarAgendamentos,
  horariosOcupados,
} from "@/lib/agendamentos-store";
import { Agendamento } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get("data");
  const barbeiroId = searchParams.get("barbeiroId");

  if (data && barbeiroId) {
    return NextResponse.json({
      horariosOcupados: horariosOcupados(data, barbeiroId),
    });
  }

  return NextResponse.json({ agendamentos: listarAgendamentos() });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Agendamento;
  const resultado = criarAgendamento(body);

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 409 });
  }

  return NextResponse.json({ agendamento: resultado.data }, { status: 201 });
}
