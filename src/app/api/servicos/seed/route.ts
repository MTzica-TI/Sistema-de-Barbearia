import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const servicos = [
      { id: "s1", nome: "Corte", preco: 45, duracaoMinutos: 30 },
      { id: "s2", nome: "Barba", preco: 35, duracaoMinutos: 30 },
      { id: "s3", nome: "Corte + Barba", preco: 70, duracaoMinutos: 60 },
      { id: "s4", nome: "Pigmentacao", preco: 55, duracaoMinutos: 45 },
      { id: "s5", nome: "Sobrancelha", preco: 20, duracaoMinutos: 15 },
    ];

    // Limpar serviços antigos (opcional)
    // await prisma.servico.deleteMany({});

    // Inserir apenas os que não existem
    for (const servico of servicos) {
      const existe = await prisma.servico.findUnique({
        where: { nome: servico.nome },
      });

      if (!existe) {
        await prisma.servico.create({
          data: servico,
        });
      }
    }

    const total = await prisma.servico.count();
    return NextResponse.json(
      { message: "Serviços carregados com sucesso", total },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao carregar serviços:", error);
    return NextResponse.json(
      { error: "Erro ao carregar serviços" },
      { status: 500 }
    );
  }
}
