import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarNucleoAppsScript } from './extrair.mjs';

const CAB18 = ['ID','Vendedor','Cliente','Cidade','UF','Contato','Cargo',
  'Telefone','Data/Hora','Status','Produtos','Potencial','Valor',
  'Objeções','Próxima Ação','Prazo','Observações','Recebido em'];

test('CABECALHO_PADRAO tem 18 colunas e nao tem Horario', () => {
  const a = carregarNucleoAppsScript();
  assert.equal(a.CABECALHO_PADRAO.length, 18);
  assert.equal(a.CABECALHO_PADRAO.includes('Horário'), false);
  assert.deepEqual(a.CABECALHO_PADRAO, CAB18);
});

test('indicesPorCabecalho mapeia nome para posicao', () => {
  const a = carregarNucleoAppsScript();
  const i = a.indicesPorCabecalho(CAB18);
  assert.equal(i['ID'], 0);
  assert.equal(i['Observações'], 16);
  assert.equal(i['Recebido em'], 17);
});

test('indicesPorCabecalho ignora espacos sobrando no cabecalho', () => {
  const a = carregarNucleoAppsScript();
  const i = a.indicesPorCabecalho([' ID ', 'Vendedor ']);
  assert.equal(i['ID'], 0);
  assert.equal(i['Vendedor'], 1);
});

test('montarLinhaPorCabecalho poe cada valor na coluna certa', () => {
  const a = carregarNucleoAppsScript();
  const linha = a.montarLinhaPorCabecalho(CAB18, {
    id: 'ADR-001', vendedor: 'Adriano Fuck', cliente: 'Metalurgica X',
    obs: 'cliente pediu catalogo',
  }, null);
  assert.equal(linha.length, 18);
  assert.equal(linha[0], 'ADR-001');
  assert.equal(linha[1], 'Adriano Fuck');
  assert.equal(linha[2], 'Metalurgica X');
  assert.equal(linha[16], 'cliente pediu catalogo');
});

test('sem coluna Horario o horario vai para o fim de Observacoes', () => {
  const a = carregarNucleoAppsScript();
  const linha = a.montarLinhaPorCabecalho(CAB18, {
    id: 1, obs: 'levar amostra', prazoHora: '14:30',
  }, null);
  assert.equal(linha[16], 'levar amostra · Horário: 14:30');
});

test('sem coluna Horario e sem observacoes o horario fica sozinho', () => {
  const a = carregarNucleoAppsScript();
  const linha = a.montarLinhaPorCabecalho(CAB18, { id: 1, prazoHora: '14:30' }, null);
  assert.equal(linha[16], 'Horário: 14:30');
});

test('com coluna Horario o horario fica na coluna propria', () => {
  const a = carregarNucleoAppsScript();
  const cab19 = CAB18.slice(0, 16).concat(['Horário', 'Observações', 'Recebido em']);
  const linha = a.montarLinhaPorCabecalho(cab19, {
    id: 1, obs: 'levar amostra', prazoHora: '14:30',
  }, null);
  assert.equal(linha[16], '14:30');
  assert.equal(linha[17], 'levar amostra');
});

test('coluna desconhecida no cabecalho fica em branco, sem deslocar o resto', () => {
  const a = carregarNucleoAppsScript();
  const cab = ['ID', 'Coluna Nova Do Gerente', 'Cliente'];
  const linha = a.montarLinhaPorCabecalho(cab, { id: 7, cliente: 'ACME' }, null);
  assert.deepEqual(linha, [7, '', 'ACME']);
});

test('Recebido em e preenchido na insercao', () => {
  const a = carregarNucleoAppsScript();
  const linha = a.montarLinhaPorCabecalho(CAB18, { id: 1 }, null);
  assert.ok(linha[17] instanceof Date);
});

test('Recebido em original e preservado na atualizacao', () => {
  const a = carregarNucleoAppsScript();
  const original = new Date('2026-02-01T10:00:00Z');
  const linha = a.montarLinhaPorCabecalho(CAB18, { id: 1 }, original);
  assert.equal(linha[17], original);
});

test('acharLinhaPorId encontra id em texto', () => {
  const a = carregarNucleoAppsScript();
  const valores = [CAB18, ['ADR-001'], ['ADR-002']];
  assert.equal(a.acharLinhaPorId(valores, 0, 'ADR-002'), 2);
});

test('acharLinhaPorId compara numero e texto como iguais', () => {
  const a = carregarNucleoAppsScript();
  const valores = [CAB18, [1754000000000]];
  assert.equal(a.acharLinhaPorId(valores, 0, '1754000000000'), 1);
});

test('acharLinhaPorId devolve -1 quando nao existe', () => {
  const a = carregarNucleoAppsScript();
  assert.equal(a.acharLinhaPorId([CAB18, ['ADR-001']], 0, 'ADR-999'), -1);
});

test('acharLinhaPorId devolve a primeira quando ha duplicatas', () => {
  const a = carregarNucleoAppsScript();
  const valores = [CAB18, ['ADR-001'], ['ADR-001']];
  assert.equal(a.acharLinhaPorId(valores, 0, 'ADR-001'), 1);
});

test('listarVendedoresDaMatriz devolve nomes distintos e ordenados', () => {
  const a = carregarNucleoAppsScript();
  const valores = [
    ['ID', 'Vendedor'],
    [1, 'Samuel'], [2, 'Adriano Fuck'], [3, 'Samuel'],
    [4, '  Adriano Fuck  '], [5, ''],
  ];
  assert.deepEqual(a.listarVendedoresDaMatriz(valores), ['Adriano Fuck', 'Samuel']);
});

test('listarVendedoresDaMatriz devolve vazio sem coluna Vendedor', () => {
  const a = carregarNucleoAppsScript();
  assert.deepEqual(a.listarVendedoresDaMatriz([['ID', 'Cliente'], [1, 'ACME']]), []);
});
