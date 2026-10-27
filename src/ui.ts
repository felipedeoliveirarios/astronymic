import { DOCUMENT_LANG, type MessageKey, type Translator } from './i18n.ts';

export function mountAtlas(text: Translator) {
  const app = document.querySelector<HTMLDivElement>('#app')!;
  app.innerHTML = `
  <main class="poster" aria-label="" data-i18n-aria-label="atlas">
    <header class="poster-top">
      <a class="brand" href="./">ASTRONYMIC</a>
      <nav class="atlas-menus" aria-label="" data-i18n-aria-label="menus">
      <details id="controls-menu" class="controls-menu" name="atlas-menu">
        <summary aria-label="" data-i18n-aria-label="settings" title="" data-i18n-title="settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/></svg>
        </summary>
        <div class="controls">
          <label for="language" data-i18n="language"></label><select id="language" class="language-select"><option value="pt" lang="pt-BR">Português</option><option value="en" lang="en">English</option><option value="es" lang="es">Español</option><option value="fr" lang="fr">Français</option></select>
          <label for="seed" data-i18n="seed"></label>
          <input id="seed" placeholder="" data-i18n-placeholder="seedPlaceholder" maxlength="100" autocomplete="off" aria-describedby="seed-help" />
          <p id="seed-help" class="help" data-i18n="seedHelp"></p>
          <button id="random" class="primary" type="button"><span data-i18n="randomSky"></span> <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13L13 3M4 3h9v9" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button>
          <button id="reset" class="secondary" type="button" data-i18n="resetSeed"></button>
          <button id="export-png" class="secondary" type="button" data-i18n="exportPng"></button>
          <p id="export-status" class="help" role="status" aria-live="polite" hidden></p>
          <div class="rule"></div>
          <label class="check"><input id="labels" type="checkbox" checked /><span data-i18n="showLabels"></span></label>
          <label class="check"><input id="debug" type="checkbox" aria-describedby="debug-help" /><span data-i18n="showDebug"></span></label>
          <p id="debug-help" class="help" hidden data-i18n="debugHelp"></p>
        </div>
      </details>
      <details id="info-menu" class="controls-menu" name="atlas-menu">
        <summary aria-label="" data-i18n-aria-label="info" title="" data-i18n-title="info">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1" stroke-linecap="round"/></svg>
        </summary>
        <div class="controls info-panel">
          <h2 class="panel-title" data-i18n="infoHeading"></h2>
          <details class="reading-help"><summary data-i18n="readHeading"></summary><p data-i18n="readHelp"></p></details>
          <details class="reading-help alphabet-help"><summary data-i18n="alphabetHeading"></summary><div id="glyph-reference"></div><p data-i18n="alphabetHelp"></p><p data-i18n="alphabetDirections"></p></details>
          <p class="credits help"><span data-i18n="credits"></span> <a href="https://www.instagram.com/the_alchemy_book/" target="_blank" rel="noopener noreferrer">@the_alchemy_book</a>.</p>
          <div class="metadata"><span id="count"></span><span id="version"></span><span id="seed-caption"></span></div>
        </div>
      </details>
      </nav>
    </header>
    <div class="title-area">
      <h1 id="title" contenteditable="plaintext-only" role="textbox" aria-label="" data-i18n-aria-label="titleLabel" aria-multiline="false" aria-describedby="text-help input-feedback" spellcheck="false" data-placeholder="" data-i18n-data-placeholder="titlePlaceholder">Astronymic</h1>
      <p id="text-help" class="title-help" data-i18n="titleHelp"></p>
    </div>
    <div id="drawing"></div>
    <p id="input-feedback" class="feedback" role="status" aria-live="polite" hidden></p>
    <p id="status" class="sr-only" role="status" aria-live="polite"></p>
  </main>`;
  applyLanguage(text);
  const language = document.querySelector<HTMLSelectElement>('#language')!;
  const title = document.querySelector<HTMLHeadingElement>('#title')!;
  const feedback =
    document.querySelector<HTMLParagraphElement>('#input-feedback')!;
  const menus = [
    ...document.querySelectorAll<HTMLDetailsElement>('.controls-menu'),
  ];
  const seed = document.querySelector<HTMLInputElement>('#seed')!;
  const labels = document.querySelector<HTMLInputElement>('#labels')!;
  const debug = document.querySelector<HTMLInputElement>('#debug')!;
  const drawing = document.querySelector<HTMLDivElement>('#drawing')!;
  const status = document.querySelector<HTMLParagraphElement>('#status')!;
  const count = document.querySelector<HTMLElement>('#count')!;
  const seedCaption = document.querySelector<HTMLElement>('#seed-caption')!;
  const version = document.querySelector<HTMLElement>('#version')!;
  const debugHelp = document.querySelector<HTMLElement>('#debug-help')!;
  const alphabet =
    document.querySelector<HTMLDetailsElement>('.alphabet-help')!;
  const reference = document.querySelector<HTMLDivElement>('#glyph-reference')!;
  return {
    language,
    title,
    feedback,
    menus,
    seed,
    labels,
    debug,
    drawing,
    status,
    count,
    seedCaption,
    version,
    debugHelp,
    alphabet,
    reference,
  };
}

/** Translate UI strings only, preserving user input, focus and control state. */
export function applyLanguage(text: Translator): void {
  const root = document.querySelector('#app')!;
  for (const node of root.querySelectorAll<HTMLElement>('[data-i18n]'))
    node.textContent = text.text(node.dataset.i18n as MessageKey);
  for (const attribute of [
    'aria-label',
    'title',
    'placeholder',
    'data-placeholder',
  ]) {
    const source = `data-i18n-${attribute}`;
    for (const node of root.querySelectorAll(`[${source}]`))
      node.setAttribute(
        attribute,
        text.text(node.getAttribute(source) as MessageKey),
      );
  }
  document.documentElement.lang = DOCUMENT_LANG[text.locale];
  document.title = text.text('pageTitle');
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', text.text('pageDescription'));
  document.querySelector<HTMLSelectElement>('#language')!.value = text.locale;
}
