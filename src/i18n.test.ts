import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTranslator, LOCALES, MESSAGES, resolveLocale } from './i18n.ts';

const placeholders = (value: string) =>
  [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
test('all languages have the same complete messages and interpolation parameters', () => {
  const keys = Object.keys(MESSAGES.pt).sort();
  for (const locale of LOCALES) {
    assert.deepEqual(Object.keys(MESSAGES[locale]).sort(), keys, locale);
    for (const key of keys as (keyof typeof MESSAGES.pt)[]) {
      const message = MESSAGES[locale][key];
      assert.ok(message.trim(), `${locale}.${key}`);
      assert.deepEqual(
        placeholders(message),
        placeholders(MESSAGES.pt[key]),
        `${locale}.${key}`,
      );
      const values = Object.fromEntries(
        placeholders(message).map((name) => [name, 'sample']),
      );
      assert.ok(!/\{\w+\}/.test(createTranslator(locale).text(key, values)));
    }
  }
});

test('browser language variants and ordered preferences select the supported base language', () => {
  for (const [variant, expected] of [
    ['pt-BR', 'pt'],
    ['pt-PT', 'pt'],
    ['en-US', 'en'],
    ['en-GB', 'en'],
    ['es-AR', 'es'],
    ['es-MX', 'es'],
    ['fr-CA', 'fr'],
    ['FR-fr', 'fr'],
  ] as const) {
    assert.equal(resolveLocale([variant]), expected);
  }
  assert.equal(resolveLocale(['de-DE', 'fr-CA', 'en-US']), 'fr');
  assert.equal(resolveLocale(['ja-JP']), 'pt');
  assert.equal(resolveLocale([]), 'pt');
});

test('a valid manual choice overrides browser language; invalid saved values are ignored', () => {
  assert.equal(resolveLocale(['en-US'], 'fr'), 'fr');
  assert.equal(resolveLocale(['fr-CA'], 'pt'), 'pt');
  assert.equal(resolveLocale(['es-AR'], 'invalid'), 'es');
  assert.equal(resolveLocale(['en-US'], '<script>'), 'en');
});

test('counts, percentages and decimal angles use locale-aware formatting', () => {
  assert.equal(
    createTranslator('pt').plural('letterOne', 'letterMany', 1),
    'letra',
  );
  assert.equal(
    createTranslator('en').plural('letterOne', 'letterMany', 2),
    'letters',
  );
  assert.equal(
    createTranslator('es').plural('letterOne', 'letterMany', 1),
    'letra',
  );
  assert.equal(
    createTranslator('fr').plural('letterOne', 'letterMany', 2),
    'lettres',
  );
  assert.equal(createTranslator('en').decimal(12.5), '12.5');
  assert.equal(createTranslator('fr').decimal(12.5), '12,5');
  assert.match(createTranslator('es').percent(0.125), /12,5/);
  assert.match(createTranslator('en').percent(0.125), /12\.5/);
  assert.throws(
    () => createTranslator('fr').text('glyphName'),
    /Missing translation value/,
  );
});
