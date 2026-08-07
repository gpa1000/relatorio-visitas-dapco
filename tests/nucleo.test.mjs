import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarNucleo, criarLocalStorageFalso } from './extrair.mjs';

test('slugVendedor normaliza variacoes do mesmo nome', () => {
  const n = carregarNucleo(criarLocalStorageFalso());
  assert.equal(n.slugVendedor('Adriano Fuck'), 'adriano-fuck');
  assert.equal(n.slugVendedor('  ADRIANO   FUCK  '), 'adriano-fuck');
  assert.equal(n.slugVendedor('adriano fuck'), 'adriano-fuck');
});

test('slugVendedor remove acentos e pontuacao', () => {
  const n = carregarNucleo(criarLocalStorageFalso());
  assert.equal(n.slugVendedor('José D\'Ávila'), 'jose-davila');
  assert.equal(n.slugVendedor('Conceição Ramos'), 'conceicao-ramos');
});

test('slugVendedor devolve sem-vendedor quando vazio', () => {
  const n = carregarNucleo(criarLocalStorageFalso());
  assert.equal(n.slugVendedor(''), 'sem-vendedor');
  assert.equal(n.slugVendedor('   '), 'sem-vendedor');
  assert.equal(n.slugVendedor(null), 'sem-vendedor');
});

test('chaveGaveta monta a chave com o prefixo separado por ::', () => {
  const n = carregarNucleo(criarLocalStorageFalso());
  assert.equal(n.chaveGaveta('Adriano Fuck'), 'dapco_visitas_v1::adriano-fuck');
});

test('chaveGaveta nunca colide com a chave antiga', () => {
  const n = carregarNucleo(criarLocalStorageFalso());
  assert.notEqual(n.chaveGaveta('Adriano Fuck'), 'dapco_visitas_v1');
  assert.ok(n.chaveGaveta('qualquer').includes('::'));
});

test('mesclarListasPorId nao duplica ids ja existentes', () => {
  const n = carregarNucleo(criarLocalStorageFalso());
  const atual = [{ id: 'ADR-001', cliente: 'A' }, { id: 2, cliente: 'B' }];
  const novas = [{ id: 'ADR-001', cliente: 'A alterado' }, { id: 'ADR-9', cliente: 'C' }];
  const r = n.mesclarListasPorId(atual, novas);
  assert.equal(r.length, 3);
  assert.equal(r.find(v => v.id === 'ADR-001').cliente, 'A');
});

test('mesclarListasPorId compara id numerico e texto como iguais', () => {
  const n = carregarNucleo(criarLocalStorageFalso());
  const r = n.mesclarListasPorId([{ id: 2 }], [{ id: '2' }]);
  assert.equal(r.length, 1);
});

test('rankPotencial pontua Alto acima de Medio acima de Baixo', () => {
  const n = carregarNucleo(criarLocalStorageFalso());
  assert.ok(n.rankPotencial('Alto') > n.rankPotencial('Médio'));
  assert.ok(n.rankPotencial('Médio') > n.rankPotencial('Baixo'));
  assert.ok(n.rankPotencial('Baixo') > n.rankPotencial(''));
});

test('rankPotencial trata vazio, nulo e desconhecido como zero', () => {
  const n = carregarNucleo(criarLocalStorageFalso());
  assert.equal(n.rankPotencial(''), 0);
  assert.equal(n.rankPotencial(null), 0);
  assert.equal(n.rankPotencial('Qualquer'), 0);
});

test('rankPotencial aceita Medio sem acento e caixa diferente', () => {
  const n = carregarNucleo(criarLocalStorageFalso());
  assert.equal(n.rankPotencial('medio'), n.rankPotencial('Médio'));
  assert.equal(n.rankPotencial('ALTO'), n.rankPotencial('Alto'));
});

test('parseDataVisita devolve nulo para data invalida', () => {
  const n = carregarNucleo(criarLocalStorageFalso());
  assert.equal(n.parseDataVisita('feriado'), null);
  assert.equal(n.parseDataVisita(''), null);
  assert.equal(n.parseDataVisita(null), null);
});

test('parseDataVisita entende o formato do formulario', () => {
  const n = carregarNucleo(criarLocalStorageFalso());
  assert.equal(typeof n.parseDataVisita('2026-07-15T14:30'), 'number');
});

test('ordenar por recentes poe a visita mais nova primeiro', () => {
  const n = carregarNucleo(criarLocalStorageFalso());
  const lista = [
    { id: 1, cliente: 'A', datahora: '2026-01-10T09:00' },
    { id: 2, cliente: 'B', datahora: '2026-07-20T09:00' },
    { id: 3, cliente: 'C', datahora: '2026-03-05T09:00' },
  ];
  assert.deepEqual(n.ordenarVisitas(lista, 'recentes').map(v => v.id), [2, 3, 1]);
});

test('ordenar por recentes joga data invalida para o fim', () => {
  const n = carregarNucleo(criarLocalStorageFalso());
  const lista = [
    { id: 1, datahora: 'feriado' },
    { id: 2, datahora: '2026-07-20T09:00' },
  ];
  assert.deepEqual(n.ordenarVisitas(lista, 'recentes').map(v => v.id), [2, 1]);
});

test('ordenar por cliente respeita acentuacao portuguesa', () => {
  const n = carregarNucleo(criarLocalStorageFalso());
  const lista = [
    { id: 1, cliente: 'Zamboni' },
    { id: 2, cliente: 'Ação Metais' },
    { id: 3, cliente: 'Açúcar Ltda' },
    { id: 4, cliente: 'Barros' },
  ];
  assert.deepEqual(n.ordenarVisitas(lista, 'cliente').map(v => v.cliente),
    ['Ação Metais', 'Açúcar Ltda', 'Barros', 'Zamboni']);
});

test('ordenar por cliente poe nome vazio no fim', () => {
  const n = carregarNucleo(criarLocalStorageFalso());
  const lista = [{ id: 1, cliente: '' }, { id: 2, cliente: 'Barros' }];
  assert.deepEqual(n.ordenarVisitas(lista, 'cliente').map(v => v.id), [2, 1]);
});

test('ordenar por potencial poe Alto no topo e brancos no fim', () => {
  const n = carregarNucleo(criarLocalStorageFalso());
  const lista = [
    { id: 1, potencial: '', datahora: '2026-07-01T09:00' },
    { id: 2, potencial: 'Baixo', datahora: '2026-07-01T09:00' },
    { id: 3, potencial: 'Alto', datahora: '2026-07-01T09:00' },
    { id: 4, potencial: 'Médio', datahora: '2026-07-01T09:00' },
  ];
  assert.deepEqual(n.ordenarVisitas(lista, 'potencial').map(v => v.id), [3, 4, 2, 1]);
});

test('ordenar por potencial desempata pela mais recente', () => {
  const n = carregarNucleo(criarLocalStorageFalso());
  const lista = [
    { id: 1, potencial: 'Alto', datahora: '2026-01-01T09:00' },
    { id: 2, potencial: 'Alto', datahora: '2026-07-01T09:00' },
  ];
  assert.deepEqual(n.ordenarVisitas(lista, 'potencial').map(v => v.id), [2, 1]);
});

test('ordenarVisitas nao altera a lista original', () => {
  const n = carregarNucleo(criarLocalStorageFalso());
  const lista = [{ id: 1, cliente: 'Z' }, { id: 2, cliente: 'A' }];
  n.ordenarVisitas(lista, 'cliente');
  assert.deepEqual(lista.map(v => v.id), [1, 2]);
});

test('ordenarVisitas com modo desconhecido cai em recentes', () => {
  const n = carregarNucleo(criarLocalStorageFalso());
  const lista = [
    { id: 1, datahora: '2026-01-10T09:00' },
    { id: 2, datahora: '2026-07-20T09:00' },
  ];
  assert.deepEqual(n.ordenarVisitas(lista, 'inventado').map(v => v.id), [2, 1]);
});
