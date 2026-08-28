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

// ===== LINK_CATALOGO =====

test('LINK_CATALOGO aponta para a pagina de catalogo do site da Dapco', () => {
  const n = nucleo();
  assert.equal(n.LINK_CATALOGO, 'https://www.dapco.com.br/catalogo');
});

// ===== registrarApresentacaoEnviada =====

test('registrarApresentacaoEnviada carimba a data do envio', () => {
  const n = nucleo();
  const r = n.registrarApresentacaoEnviada({ id: 'X-1' }, '2026-08-27T14:30:00.000Z');
  assert.equal(r.apresentacaoEnviadaEm, '2026-08-27T14:30:00.000Z');
});

test('registrarApresentacaoEnviada marca a visita para ressincronizar', () => {
  const n = nucleo();
  const r = n.registrarApresentacaoEnviada({ id: 'X-1', sincronizado: true }, '2026-08-27T14:30:00.000Z');
  assert.equal(r.sincronizado, false);
});

test('registrarApresentacaoEnviada preserva o resto da visita', () => {
  const n = nucleo();
  const v = { id: 'X-1', cliente: 'ACME', email: 'a@b.com.br', obs: 'levar amostra' };
  const r = n.registrarApresentacaoEnviada(v, '2026-08-27T14:30:00.000Z');
  assert.equal(r.cliente, 'ACME');
  assert.equal(r.email, 'a@b.com.br');
  assert.equal(r.obs, 'levar amostra');
});

test('registrarApresentacaoEnviada nao altera o objeto original', () => {
  const n = nucleo();
  const v = { id: 'X-1', sincronizado: true };
  n.registrarApresentacaoEnviada(v, '2026-08-27T14:30:00.000Z');
  assert.equal(v.apresentacaoEnviadaEm, undefined);
  assert.equal(v.sincronizado, true);
});

test('reenvio sobrescreve com a data mais recente', () => {
  const n = nucleo();
  const primeiro = n.registrarApresentacaoEnviada({ id: 'X-1' }, '2026-08-01T10:00:00.000Z');
  const segundo = n.registrarApresentacaoEnviada(primeiro, '2026-08-27T14:30:00.000Z');
  assert.equal(segundo.apresentacaoEnviadaEm, '2026-08-27T14:30:00.000Z');
});

// ===== formatarMoedaCurta (caixa de resumo) =====

test('formatarMoedaCurta mostra valor pequeno por extenso', () => {
  const n = nucleo();
  assert.equal(n.formatarMoedaCurta(0), 'R$ 0');
  assert.equal(n.formatarMoedaCurta(850), 'R$ 850');
});

test('formatarMoedaCurta abrevia milhar', () => {
  const n = nucleo();
  assert.equal(n.formatarMoedaCurta(48500), 'R$ 48,5 mil');
  assert.equal(n.formatarMoedaCurta(9000), 'R$ 9 mil');
  assert.equal(n.formatarMoedaCurta(120000), 'R$ 120 mil');
});

test('formatarMoedaCurta abrevia milhao', () => {
  const n = nucleo();
  assert.equal(n.formatarMoedaCurta(1250000), 'R$ 1,3 mi');
  assert.equal(n.formatarMoedaCurta(2000000), 'R$ 2 mi');
});

test('formatarMoedaCurta trata entrada invalida como zero', () => {
  const n = nucleo();
  assert.equal(n.formatarMoedaCurta(null), 'R$ 0');
  assert.equal(n.formatarMoedaCurta(undefined), 'R$ 0');
  assert.equal(n.formatarMoedaCurta('abc'), 'R$ 0');
});
