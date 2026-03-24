"use client";

import { useEffect, useState } from "react";

interface Servico {
  id: string;
  nome: string;
  preco: number;
  duracaoMinutos: number;
  criadoEm: string;
}

export default function TestServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        console.log("Iniciando fetch de /api/servicos...");
        const res = await fetch("/api/servicos", { 
          cache: "no-store",
          headers: { "Accept": "application/json" }
        });
        
        console.log("Response status:", res.status);
        const dados = await res.json();
        console.log("Dados recebidos:", dados);
        
        setServicos(dados);
        setCarregado(true);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("Erro ao carregar:", msg);
        setErro(msg);
        setCarregado(true);
      }
    };

    carregar();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste de Serviços</h1>
      
      {!carregado && <p>Carregando...</p>}
      
      {erro && (
        <div className="text-red-600 mb-4">
          <strong>Erro:</strong> {erro}
        </div>
      )}
      
      {carregado && (
        <>
          <p className="mb-4"><strong>Total de serviços:</strong> {servicos.length}</p>
          
          {servicos.length > 0 ? (
            <div className="space-y-2">
              {servicos.map((s) => (
                <div key={s.id} className="border p-4 rounded">
                  <p><strong>{s.nome}</strong></p>
                  <p>Preço: R$ {s.preco.toFixed(2)}</p>
                  <p>Duração: {s.duracaoMinutos} min</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-yellow-600">Nenhum serviço encontrado!</p>
          )}
          
          <details className="mt-4 p-4 border">
            <summary>JSON Raw</summary>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(servicos, null, 2)}
            </pre>
          </details>
        </>
      )}
    </div>
  );
}
