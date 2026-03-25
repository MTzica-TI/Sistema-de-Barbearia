import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizarTelefone(valor: string) {
  return (valor ?? "").replace(/\D/g, "");
}

const FOTO_CLIENTE_PADRAO = "/images/clientes/default.svg";

export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        fotoUrl: true,
      },
    });

    return NextResponse.json({
      // @ts-ignore - item será tipado corretamente pelo Prisma
      clientes: clientes.map((item) => ({
        ...item,
        fotoUrl: item.fotoUrl?.trim() ? item.fotoUrl : FOTO_CLIENTE_PADRAO,
      })),
    });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha ao buscar clientes.";
    return NextResponse.json({ error: mensagem, clientes: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      nome?: string;
      email?: string;
      telefone?: string;
      senha?: string;
      fotoUrl?: string;
    };

    const nome = body.nome?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const telefoneBruto = body.telefone?.trim() ?? "";
    const telefone = normalizarTelefone(telefoneBruto);
    const senha = body.senha ?? "";
    const fotoUrl = body.fotoUrl?.trim() || undefined;

    if (!nome || !email || !telefone || !senha) {
      return NextResponse.json(
        { error: "Informe nome, email, telefone e senha para cadastrar." },
        { status: 400 }
      );
    }

    if (senha.length < 4) {
      return NextResponse.json(
        { error: "A senha deve ter ao menos 4 caracteres." },
        { status: 400 }
      );
    }

    const emailExiste = await prisma.cliente.findUnique({
      where: { email },
      select: { id: true },
    });

    if (emailExiste) {
      return NextResponse.json({ error: "Este email ja esta cadastrado." }, { status: 409 });
    }

    const telefoneExiste = await prisma.cliente.findUnique({
      where: { telefone },
      select: { id: true },
    });

    if (telefoneExiste) {
      return NextResponse.json({ error: "Este telefone ja esta cadastrado." }, { status: 409 });
    }

    const cliente = await prisma.cliente.create({
      data: { nome, email, telefone, senha, fotoUrl },
      select: { id: true, nome: true, email: true, telefone: true, fotoUrl: true },
    });

    return NextResponse.json(
      {
        cliente: {
          ...cliente,
          fotoUrl: cliente.fotoUrl?.trim() ? cliente.fotoUrl : FOTO_CLIENTE_PADRAO,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha ao cadastrar cliente.";
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      emailOriginal?: string;
      nome?: string;
      email?: string;
      telefone?: string;
      fotoUrl?: string | null;
    };

    const emailOriginal = body.emailOriginal?.trim().toLowerCase() ?? "";
    const nome = body.nome?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const telefoneBruto = body.telefone?.trim() ?? "";
    const telefone = normalizarTelefone(telefoneBruto);
    const fotoUrl = body.fotoUrl?.trim() || undefined;

    if (!emailOriginal || !nome || !email || !telefone) {
      return NextResponse.json(
        { error: "Informe email original, nome, email e telefone para atualizar." },
        { status: 400 }
      );
    }

    const clienteAtual = await prisma.cliente.findUnique({
      where: { email: emailOriginal },
      select: { id: true },
    });

    if (!clienteAtual) {
      return NextResponse.json({ error: "Cliente nao encontrado." }, { status: 404 });
    }

    const emailDuplicado = await prisma.cliente.findFirst({
      where: { email, NOT: { id: clienteAtual.id } },
      select: { id: true },
    });

    if (emailDuplicado) {
      return NextResponse.json({ error: "Ja existe outra conta com esse email." }, { status: 409 });
    }

    const telefoneDuplicado = await prisma.cliente.findFirst({
      where: { telefone, NOT: { id: clienteAtual.id } },
      select: { id: true },
    });

    if (telefoneDuplicado) {
      return NextResponse.json(
        { error: "Ja existe outra conta com esse telefone." },
        { status: 409 }
      );
    }

    const cliente = await prisma.cliente.update({
      where: { id: clienteAtual.id },
      data: { nome, email, telefone, fotoUrl },
      select: { id: true, nome: true, email: true, telefone: true, fotoUrl: true },
    });

    return NextResponse.json({
      cliente: {
        ...cliente,
        fotoUrl: cliente.fotoUrl?.trim() ? cliente.fotoUrl : FOTO_CLIENTE_PADRAO,
      },
    });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha ao atualizar cliente.";
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}

