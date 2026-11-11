import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { build } from 'vite';

const scripts = ['ending-content.js','ending.js','audio.js','chapter.js','scene.js'];
const sources = await Promise.all(scripts.map(file => readFile('public/'+file,'utf8')));
await mkdir('.build',{recursive:true});
await writeFile('.build/app.js','if (!Element.prototype.replaceChildren) { Element.prototype.replaceChildren = function (...children) { while (this.firstChild) this.removeChild(this.firstChild); this.append(...children); }; }\n'+sources.join('\n;\n'),'utf8');
await build({build:{target:'es2017'}});
