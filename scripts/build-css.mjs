import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const twDir = process.env.TW_DIR || path.dirname(require.resolve('tailwindcss/package.json', { paths: [root] }));
const { compile } = await import(path.join(twDir, 'dist', 'lib.mjs'));

const input = fs.readFileSync(path.join(root, 'src', 'input.css'), 'utf8');
const compiler = await compile(input, {
  base: path.join(root, 'src'),
  loadStylesheet: async (id, base) => {
    const file = id === 'tailwindcss' ? path.join(twDir, 'index.css') : id.startsWith('tailwindcss/') ? path.join(twDir, id.slice(12)) : path.resolve(base, id);
    return { path: file, base: path.dirname(file), content: fs.readFileSync(file, 'utf8') };
  }
});

const candidates = new Set();
for (const f of fs.readdirSync(path.join(root, 'src'))) {
  if (!/\.(html|js)$/.test(f)) continue;
  const text = fs.readFileSync(path.join(root, 'src', f), 'utf8');
  for (const tok of text.split(/[\s"'`<>=${}();,]+/)) if (tok && tok.length < 120) candidates.add(tok.replace(/\\/g, ''));
}

let css = compiler.build([...candidates]);
css = css.replace(/\/\*[\s\S]*?\*\//g, '');
fs.writeFileSync(path.join(root, 'src', 'tw.css'), css);
console.log(`tw.css ${(css.length / 1024).toFixed(1)} KB from ${candidates.size} tokens`);
