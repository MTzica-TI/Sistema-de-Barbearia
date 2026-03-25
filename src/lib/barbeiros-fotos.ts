/**
 * Mapeamento de fotos de barbeiros
 * Usa default.svg como fallback para fotos que não existem em /public/images/barbeiros/
 */

const FOTO_PADRAO = "/images/barbeiros/default.svg";

// Imagens que realmente existem em /public/images/barbeiros/
const FOTOS_DISPONIVEIS: Record<string, string> = {
  matheus: "/images/barbeiros/matheus.svg",
};

/**
 * Retorna o caminho correto da foto do barbeiro
 * Se a foto específica não existe, retorna a foto padrão
 */
export function obterFotoBarbeiro(nomeOuUrl: string | undefined | null): string {
  if (!nomeOuUrl || typeof nomeOuUrl !== "string") {
    return FOTO_PADRAO;
  }

  // Se já é um caminho completo para default, retorna como está
  if (nomeOuUrl.includes("default.svg")) {
    return FOTO_PADRAO;
  }

  // Extrai o nome do arquivo do caminho
  const nomeArquivo = nomeOuUrl
    .split("/")
    .pop()
    ?.toLowerCase()
    .replace(".svg", "") || "";

  // Verifica se a foto está disponível
  if (FOTOS_DISPONIVEIS[nomeArquivo]) {
    return FOTOS_DISPONIVEIS[nomeArquivo];
  }

  // Fallback para padrão
  return FOTO_PADRAO;
}
