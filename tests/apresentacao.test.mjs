import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarNucleo, criarLocalStorageFalso } from './extrair.mjs';

function nucleo() {
  return carregarNucleo(criarLocalStorageFalso());
}

// ===== saudacaoPorHora =====

test('saudacaoPorHora usa bom dia da meia-noite ate 11h59', () => {
  const n = nucleo();
  assert.equal(n.saudacaoPorHora(0), 'bom dia');
  assert.equal(n.saudacaoPorHora(7), 'bom dia');
  assert.equal(n.saudacaoPorHora(11), 'bom dia');
});

test('saudacaoPorHora usa boa tarde do meio-dia ate 17h59', () => {
  const n = nucleo();
  assert.equal(n.saudacaoPorHora(12), 'boa tarde');
  assert.equal(n.saudacaoPorHora(17), 'boa tarde');
});

test('saudacaoPorHora usa boa noite das 18h em diante', () => {
  const n = nucleo();
  assert.equal(n.saudacaoPorHora(18), 'boa noite');
  assert.equal(n.saudacaoPorHora(23), 'boa noite');
});

// ===== primeiroNome =====

test('primeiroNome devolve so o primeiro nome', () => {
  const n = nucleo();
  assert.equal(n.primeiroNome('Ricardo Almeida Souza'), 'Ricardo');
});

test('primeiroNome ignora espacos sobrando', () => {
  const n = nucleo();
  assert.equal(n.primeiroNome('   Ricardo   Almeida  '), 'Ricardo');
});

test('primeiroNome devolve vazio quando nao ha nome', () => {
  const n = nucleo();
  assert.equal(n.primeiroNome(''), '');
  assert.equal(n.primeiroNome('   '), '');
  assert.equal(n.primeiroNome(null), '');
  assert.equal(n.primeiroNome(undefined), '');
});

// ===== montarEmailApresentacao =====

const VISITA = {
  id: 'ADR-010',
  cliente: 'Metalurgica Santa Rita',
  contato: 'Ricardo Almeida',
  email: 'ricardo@santarita.com.br',
  vendedor: 'Adriano Fuck',
};

const OPCOES = { hora: 9, linkCatalogo: 'https://exemplo.test/catalogo.pdf' };

test('montarEmailApresentacao poe o e-mail do contato no destinatario', () => {
  const n = nucleo();
  const email = n.montarEmailApresentacao(VISITA, OPCOES);
  assert.equal(email.para, 'ricardo@santarita.com.br');
});

test('montarEmailApresentacao poe o nome do cliente no assunto', () => {
  const n = nucleo();
  const email = n.montarEmailApresentacao(VISITA, OPCOES);
  assert.equal(email.assunto, 'Dapco — fixadores em aço inox para a Metalurgica Santa Rita');
});

test('montarEmailApresentacao usa assunto generico quando nao ha cliente', () => {
  const n = nucleo();
  const email = n.montarEmailApresentacao({ ...VISITA, cliente: '' }, OPCOES);
  assert.equal(email.assunto, 'Dapco — fixadores em aço inox');
});

test('montarEmailApresentacao abre com primeiro nome e saudacao da hora', () => {
  const n = nucleo();
  const manha = n.montarEmailApresentacao(VISITA, { ...OPCOES, hora: 9 });
  assert.ok(manha.corpo.startsWith('Ricardo, bom dia.'), manha.corpo.slice(0, 40));

  const tarde = n.montarEmailApresentacao(VISITA, { ...OPCOES, hora: 15 });
  assert.ok(tarde.corpo.startsWith('Ricardo, boa tarde.'), tarde.corpo.slice(0, 40));
});

test('montarEmailApresentacao usa Prezado Cliente quando nao ha contato', () => {
  const n = nucleo();
  const email = n.montarEmailApresentacao({ ...VISITA, contato: '' }, OPCOES);
  assert.ok(email.corpo.startsWith('Prezado Cliente, bom dia.'), email.corpo.slice(0, 40));
});

test('montarEmailApresentacao inclui o link do catalogo', () => {
  const n = nucleo();
  const email = n.montarEmailApresentacao(VISITA, OPCOES);
  assert.ok(email.corpo.includes('Catálogo completo: https://exemplo.test/catalogo.pdf'));
});

test('montarEmailApresentacao omite a linha do catalogo quando nao ha link', () => {
  const n = nucleo();
  const email = n.montarEmailApresentacao(VISITA, { ...OPCOES, linkCatalogo: '' });
  assert.ok(!email.corpo.includes('Catálogo completo'));
  assert.ok(email.corpo.includes('www.dapco.com.br'));
});

test('montarEmailApresentacao assina com o nome do vendedor', () => {
  const n = nucleo();
  const email = n.montarEmailApresentacao(VISITA, OPCOES);
  assert.ok(email.corpo.includes('Adriano Fuck\nDapco Fixadores Inoxidáveis'));
});

test('montarEmailApresentacao assina so com a empresa quando nao ha vendedor', () => {
  const n = nucleo();
  const email = n.montarEmailApresentacao({ ...VISITA, vendedor: '' }, OPCOES);
  assert.ok(email.corpo.includes('Atenciosamente,\nDapco Fixadores Inoxidáveis'));
  assert.ok(!email.corpo.includes('\n\nDapco Fixadores'));
});

test('montarEmailApresentacao traz o texto institucional da Dapco', () => {
  const n = nucleo();
  const corpo = n.montarEmailApresentacao(VISITA, OPCOES).corpo;
  assert.ok(corpo.includes('fixadores inoxidáveis há mais de 30 anos'));
  assert.ok(corpo.includes('aço inox 304, 316 e 410'));
  assert.ok(corpo.includes('território nacional'));
  assert.ok(corpo.includes('Agradecemos a atenção e ficamos à disposição para melhor atendê-los.'));
});

test('montarEmailApresentacao nunca promete anexo', () => {
  const n = nucleo();
  const corpo = n.montarEmailApresentacao(VISITA, OPCOES).corpo;
  assert.ok(!corpo.toLowerCase().includes('anexo'));
});

// ===== linkMailtoApresentacao =====

test('linkMailtoApresentacao monta o mailto com assunto e corpo codificados', () => {
  const n = nucleo();
  const link = n.linkMailtoApresentacao(VISITA, OPCOES);
  assert.ok(link.startsWith('mailto:ricardo@santarita.com.br?'));
  assert.ok(link.includes('subject='));
  assert.ok(link.includes('body='));
  // espaco e quebra de linha nao podem vazar crus para a URL
  assert.ok(!link.includes(' '));
  assert.ok(!link.includes('\n'));
});

test('linkMailtoApresentacao codifica acento e & sem quebrar a URL', () => {
  const n = nucleo();
  const link = n.linkMailtoApresentacao({ ...VISITA, cliente: 'Aços & Cia' }, OPCOES);
  const assunto = decodeURIComponent(link.match(/subject=([^&]*)/)[1]);
  assert.equal(assunto, 'Dapco — fixadores em aço inox para a Aços & Cia');
});

test('linkMailtoApresentacao devolve null sem e-mail do contato', () => {
  const n = nucleo();
  assert.equal(n.linkMailtoApresentacao({ ...VISITA, email: '' }, OPCOES), null);
  assert.equal(n.linkMailtoApresentacao({ ...VISITA, email: undefined }, OPCOES), null);
});

// ===== emailValido =====

test('emailValido aceita endereco comum', () => {
  const n = nucleo();
  assert.equal(n.emailValido('ricardo@santarita.com.br'), true);
  assert.equal(n.emailValido('  ricardo.almeida@santarita.com  '), true);
});

test('emailValido recusa texto que nao e e-mail', () => {
  const n = nucleo();
  assert.equal(n.emailValido('ricardo'), false);
  assert.equal(n.emailValido('ricardo@'), false);
  assert.equal(n.emailValido('ricardo@empresa'), false);
  assert.equal(n.emailValido('ricardo santarita.com.br'), false);
  assert.equal(n.emailValido(''), false);
  assert.equal(n.emailValido(null), false);
});
