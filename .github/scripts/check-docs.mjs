// 最小 CI：文档完整性检查。零依赖，直接跑在 runner 自带的 Node 上。
// 1) markdown 里的相对链接必须解析到真实文件
// 2) AGENTS.md 里的上下文指针必须解析到真实文件
// 3) docs/agents/ 下的文档必须被 AGENTS.md 引用（不留孤儿文档）
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';

const root = process.cwd();
const SKIP_DIRS = new Set(['.git', '.dsh-tmp', '.idea', 'node_modules', 'dist', 'build']);
// docs/agents/domain.md 声明了 CONTEXT.md + docs/adr/，但内容还没写。实现时删掉这一行。
const DECLARED_LATER = new Set(['CONTEXT.md', 'docs/adr/']);
const failures = [];

const toRel = (p) => relative(root, p).split(sep).join('/');

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = resolve(dir, entry.name);
    if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : walk(p);
    return entry.isFile() && entry.name.endsWith('.md') ? [p] : [];
  });

const docs = walk(root).sort();
const agents = readFileSync(resolve(root, 'AGENTS.md'), 'utf8');

// 规则 1：相对链接
const LINK = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
for (const file of docs) {
  for (const [, target] of readFileSync(file, 'utf8').matchAll(LINK)) {
    const isExternal = /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#') || target.startsWith('/');
    if (isExternal) continue;
    const path = decodeURIComponent(target.split('#')[0]);
    if (path && !existsSync(resolve(dirname(file), path))) {
      failures.push(`${toRel(file)} 的链接指向不存在的路径：${target}`);
    }
  }
}

// 规则 2 和 3：上下文指针
const pointers = [...agents.matchAll(/`([^`\n]+)`/g)].map(([, token]) => token);
for (const token of pointers) {
  const isLocalPath = token.endsWith('.md') || token.startsWith('docs/');
  if (!isLocalPath || DECLARED_LATER.has(token)) continue;
  if (!existsSync(resolve(root, token))) {
    failures.push(`AGENTS.md 的指针指向不存在的路径：${token}`);
  }
}

const referenced = new Set(pointers.filter((t) => t.endsWith('.md')));
for (const file of docs.filter((p) => toRel(p).startsWith('docs/agents/'))) {
  if (!referenced.has(toRel(file))) {
    failures.push(`${toRel(file)} 没有被 AGENTS.md 引用（缺上下文指针）`);
  }
}

if (failures.length > 0) {
  console.error(`[FAIL] 文档检查未通过，${failures.length} 个问题：`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`[OK] 文档检查通过：${docs.length} 个 markdown 文件，相对链接与上下文指针均可解析`);
