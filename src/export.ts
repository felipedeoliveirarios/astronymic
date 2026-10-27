import labelFont from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2?url';

/** Rasterize a self-contained copy; the live atlas and its controls stay untouched. */
export async function exportPng(source: SVGSVGElement, title: string) {
  await document.fonts.ready;
  const svg = source.cloneNode(true) as SVGSVGElement;
  const originals = [source, ...source.querySelectorAll('*')];
  const copies = [svg, ...svg.querySelectorAll<SVGElement>('*')];
  originals.forEach((node, index) => {
    const computed = getComputedStyle(node);
    // Keep SVG presentation (including masks and rounded strokes) outside the page CSS.
    for (const property of [
      'fill',
      'fill-opacity',
      'stroke',
      'stroke-width',
      'stroke-opacity',
      'stroke-linecap',
      'stroke-linejoin',
      'stroke-dasharray',
      'opacity',
      'font-family',
      'font-size',
      'font-weight',
      'letter-spacing',
      'text-anchor',
      'dominant-baseline',
      'paint-order',
      'visibility',
    ]) {
      copies[index].style.setProperty(
        property,
        computed.getPropertyValue(property),
      );
    }
    copies[index].style.animation = 'none';
  });
  svg.style.opacity = '1';
  svg.querySelector('.debug-overlay')?.remove();
  const fontResponse = await fetch(labelFont);
  if (!fontResponse.ok) throw new Error('Font download failed');
  const font = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    void fontResponse.blob().then((blob) => reader.readAsDataURL(blob), reject);
  });
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = `@font-face {font-family: 'JetBrains Mono'; src: url("${font}") format('woff2'); font-weight:400;}`;
  svg.prepend(style);
  const width = 2400;
  const height = 3000;
  svg.setAttribute('width', '2160');
  svg.setAttribute('height', '2300');
  svg.style.width = '2160px';
  svg.style.height = '2300px';
  svg.style.overflow = 'visible';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0b1221';
  ctx.fillRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(1200, 1400, 0, 1200, 1400, 1500);
  glow.addColorStop(0, '#17253885');
  glow.addColorStop(1, '#17253800');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  // Fixed decorative sky: exporting never consumes the constellation's random stream.
  ctx.fillStyle = '#b8c9e3';
  ctx.globalAlpha = 0.34;
  for (let i = 0; i < 330; i++) {
    const x = ((i * 1493 + 37) % 2399) + 0.5;
    const y = ((i * 947 + 71) % 2999) + 0.5;
    ctx.beginPath();
    ctx.arc(x, y, i % 5 === 0 ? 1.3 : 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#b8a584';
  ctx.font = '500 24px sans-serif';
  ctx.fillText('A S T R O N Y M I C', 120, 110);
  ctx.fillStyle = '#e0d5bf';
  ctx.textAlign = 'center';
  ctx.font = '800 100px "Playfair Display"';
  const lines: string[] = [];
  let line = '';
  for (const character of title) {
    if (line && ctx.measureText(line + character).width > 2100) {
      lines.push(line);
      line = '';
    }
    line += character;
  }
  if (line) lines.push(line);
  // Long titles shrink to leave the map its full area.
  const titleSize = Math.min(100, 300 / Math.max(1, lines.length));
  ctx.font = `800 ${titleSize}px "Playfair Display"`;
  lines.forEach((value, i) =>
    ctx.fillText(value, 1200, 260 + i * titleSize * 1.25),
  );
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(svg)], {
      type: 'image/svg+xml;charset=utf-8',
    }),
  );
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    ctx.drawImage(image, 120, 530, 2160, 2300);
  } finally {
    URL.revokeObjectURL(url);
  }
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) =>
        value ? resolve(value) : reject(new Error('PNG encoding failed')),
      'image/png',
    ),
  );
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = `astronymic-${
    title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'map'
  }.png`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
}
