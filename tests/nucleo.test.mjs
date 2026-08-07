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
