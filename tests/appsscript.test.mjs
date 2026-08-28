import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarNucleoAppsScript } from './extrair.mjs';

const CAB19 = ['ID','Vendedor','Cliente','Cidade','UF','Contato','Cargo',
  'Telefone','E-mail','Data/Hora','Status','Produtos','Potencial','Valor',
  'Objeções','Próxima Ação','Prazo','Observações','Recebido em'];

test('CABECALHO_PADRAO tem 19 colunas, inclui E-mail e nao tem Horario', () => {
  const a = carregarNucleoAppsScript();
  assert.equal(a.CABECALHO_PADRAO.length, 19);
  assert.equal(a.CABECALHO_PADRAO.includes('E-mail'), true);
  assert.equal(a.CABECALHO_PADRAO.includes('Horário'), false);
  assert.deepEqual(a.CABECALHO_PADRAO, CAB19);
});

test('MAPA_COLUNAS liga a coluna E-mail ao campo email do app', () => {
  const a = carregarNucleoAppsScript();
  assert.equal(a.MAPA_COLUNAS['E-mail'], 'email');
});

test('montarLinhaPorCabecalho grava o e-mail na coluna certa', () => {
  const a = carregarNucleoAppsScript();
  const linha = a.montarLinhaPorCabecalho(CAB19, { id: 'X-1', email: 'comprador@empresa.com.br' }, null);
  assert.equal(linha[CAB19.indexOf('E-mail')], 'comprador@empresa.com.br');
});

test('planilha antiga sem a coluna E-mail continua funcionando', () => {
  const a = carregarNucleoAppsScript();
  const antigo = CAB19.filter(c => c !== 'E-mail');
  const linha = a.montarLinhaPorCabecalho(antigo, { id: 'X-1', email: 'comprador@empresa.com.br', cliente: 'ACME' }, null);
  assert.equal(linha.length, antigo.length);
  assert.equal(linha[antigo.indexOf('Cliente')], 'ACME');
});

test('indicesPorCabecalho mapeia nome para posicao', () => {
  const a = carregarNucleoAppsScript();
  const i = a.indicesPorCabecalho(CAB19);
  assert.equal(i['ID'], 0);
  assert.equal(i['Observações'], CAB19.indexOf('Observações'));
  assert.equal(i['Recebido em'], CAB19.indexOf('Recebido em'));
});

test('indicesPorCabecalho ignora espacos sobrando no cabecalho', () => {
  const a = carregarNucleoAppsScript();
  const i = a.indicesPorCabecalho([' ID ', 'Vendedor ']);
  assert.equal(i['ID'], 0);
  assert.equal(i['Vendedor'], 1);
});

test('montarLinhaPorCabecalho poe cada valor na coluna certa', () => {
  const a = carregarNucleoAppsScript();
  const linha = a.montarLinhaPorCabecalho(CAB19, {
    id: 'ADR-001', vendedor: 'Adriano Fuck', cliente: 'Metalurgica X',
    obs: 'cliente pediu catalogo',
  }, null);
  assert.equal(linha.length, 19);
  assert.equal(linha[0], 'ADR-001');
  assert.equal(linha[1], 'Adriano Fuck');
  assert.equal(linha[2], 'Metalurgica X');
  assert.equal(linha[CAB19.indexOf('Observações')], 'cliente pediu catalogo');
});

test('sem coluna Horario o horario vai para o fim de Observacoes', () => {
  const a = carregarNucleoAppsScript();
  const linha = a.montarLinhaPorCabecalho(CAB19, {
    id: 1, obs: 'levar amostra', prazoHora: '14:30',
  }, null);
  assert.equal(linha[CAB19.indexOf('Observações')], 'levar amostra · Horário: 14:30');
});

test('sem coluna Horario e sem observacoes o horario fica sozinho', () => {
  const a = carregarNucleoAppsScript();
  const linha = a.montarLinhaPorCabecalho(CAB19, { id: 1, prazoHora: '14:30' }, null);
  assert.equal(linha[CAB19.indexOf('Observações')], 'Horário: 14:30');
});

test('com coluna Horario o horario fica na coluna propria', () => {
  const a = carregarNucleoAppsScript();
  const comHorario = CAB19.slice(0, CAB19.indexOf('Observações'))
    .concat(['Horário', 'Observações', 'Recebido em']);
  const linha = a.montarLinhaPorCabecalho(comHorario, {
    id: 1, obs: 'levar amostra', prazoHora: '14:30',
  }, null);
  assert.equal(linha[comHorario.indexOf('Horário')], '14:30');
  assert.equal(linha[comHorario.indexOf('Observações')], 'levar amostra');
});

test('coluna desconhecida no cabecalho fica em branco, sem deslocar o resto', () => {
  const a = carregarNucleoAppsScript();
  const cab = ['ID', 'Coluna Nova Do Gerente', 'Cliente'];
  const linha = a.montarLinhaPorCabecalho(cab, { id: 7, cliente: 'ACME' }, null);
  assert.deepEqual(linha, [7, '', 'ACME']);
});

test('Recebido em e preenchido na insercao', () => {
  const a = carregarNucleoAppsScript();
  const linha = a.montarLinhaPorCabecalho(CAB19, { id: 1 }, null);
  assert.ok(linha[CAB19.indexOf('Recebido em')] instanceof Date);
});

test('Recebido em original e preservado na atualizacao', () => {
  const a = carregarNucleoAppsScript();
  const original = new Date('2026-02-01T10:00:00Z');
  const linha = a.montarLinhaPorCabecalho(CAB19, { id: 1 }, original);
  assert.equal(linha[CAB19.indexOf('Recebido em')], original);
});

test('acharLinhaPorId encontra id em texto', () => {
  const a = carregarNucleoAppsScript();
  const valores = [CAB19, ['ADR-001'], ['ADR-002']];
  assert.equal(a.acharLinhaPorId(valores, 0, 'ADR-002'), 2);
});

test('acharLinhaPorId compara numero e texto como iguais', () => {
  const a = carregarNucleoAppsScript();
  const valores = [CAB19, [1754000000000]];
  assert.equal(a.acharLinhaPorId(valores, 0, '1754000000000'), 1);
});

test('acharLinhaPorId devolve -1 quando nao existe', () => {
  const a = carregarNucleoAppsScript();
  assert.equal(a.acharLinhaPorId([CAB19, ['ADR-001']], 0, 'ADR-999'), -1);
});

test('acharLinhaPorId devolve a primeira quando ha duplicatas', () => {
  const a = carregarNucleoAppsScript();
  const valores = [CAB19, ['ADR-001'], ['ADR-001']];
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
