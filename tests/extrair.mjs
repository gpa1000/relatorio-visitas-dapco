// Lê o index.html e devolve as funções dos blocos marcados, já avaliadas.
// O app continua sendo um arquivo único: aqui a gente só lê o texto dele.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const AQUI = dirname(fileURLToPath(import.meta.url));
const HTML = readFileSync(join(AQUI, '..', 'index.html'), 'utf8');

function recortar(inicio, fim) {
  const i = HTML.indexOf(inicio);
  const f = HTML.indexOf(fim);
  if (i === -1 || f === -1) {
    throw new Error(`Marcadores nao encontrados no index.html: ${inicio}`);
  }
  return HTML.slice(i + inicio.length, f);
}

// localStorage de mentira, para os testes rodarem fora do navegador
export function criarLocalStorageFalso(inicial = {}) {
  const dados = { ...inicial };
  return {
    getItem: (k) => (k in dados ? dados[k] : null),
    setItem: (k, v) => { dados[k] = String(v); },
    removeItem: (k) => { delete dados[k]; },
    key: (i) => Object.keys(dados)[i] ?? null,
    get length() { return Object.keys(dados).length; },
    _dados: dados,
  };
}

const NOMES_NUCLEO = [
  'slugVendedor', 'chaveGaveta', 'mesclarListasPorId',
  'lerGaveta', 'gravarGaveta', 'registrarVendedorLocal',
  'listarVendedoresLocais', 'migrarParaGavetas',
  'parseDataVisita', 'rankPotencial', 'ordenarVisitas',
];

// Exporta so o que ja existe no bloco. Assim, funcao ainda nao escrita vira
// undefined e o teste falha com "nao e uma funcao" — o vermelho correto do
// TDD — em vez de estourar na hora de montar a fabrica.
function montarRetorno(nomes) {
  return 'return {' + nomes
    .map(n => `${n}: (typeof ${n} !== 'undefined' ? ${n} : undefined)`)
    .join(',') + '};';
}

export function carregarNucleo(localStorageFalso) {
  const bloco = recortar('// ===== INICIO NUCLEO TESTAVEL =====',
                         '// ===== FIM NUCLEO TESTAVEL =====');
  const fabrica = new Function('localStorage', bloco + '\n' + montarRetorno(NOMES_NUCLEO));
  return fabrica(localStorageFalso);
}

const NOMES_APPS = [
  'CABECALHO_PADRAO', 'indicesPorCabecalho', 'listarVendedoresDaMatriz',
  'acharLinhaPorId', 'montarLinhaPorCabecalho',
];

export function carregarNucleoAppsScript() {
  const bloco = recortar('// ===== INICIO NUCLEO APPS SCRIPT =====',
                         '// ===== FIM NUCLEO APPS SCRIPT =====');
  const fabrica = new Function(bloco + '\n' + montarRetorno(NOMES_APPS));
  return fabrica();
}
