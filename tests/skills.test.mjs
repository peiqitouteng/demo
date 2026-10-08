/**
 * 内容与结构自检（node --test，零依赖）。
 *
 *   npm test
 *
 * 覆盖两件事：
 *   1. data/skills.js 的内容完整性（25 个技能、分类、调用方式、不重名）
 *   2. index.html 与资源文件的对应关系（引用的文件存在、锚点存在、关键标签在）
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const data = require('../data/skills.js');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');

const KIND_IDS = data.CATEGORIES.map((c) => c.id);

test('技能清单为 25 条且名字唯一', () => {
  assert.equal(data.SKILLS.length, 25, '技能数量应为 25');
  const names = data.SKILLS.map((s) => s.name);
  assert.equal(new Set(names).size, names.length, '技能名不能重复');
  for (const name of names) {
    assert.match(name, /^[a-z][a-z0-9-]*$/, `技能名格式不对：${name}`);
  }
});

test('每个技能字段完整且取值合法', () => {
  for (const skill of data.SKILLS) {
    assert.ok(KIND_IDS.includes(skill.kind), `${skill.name} 的分类非法：${skill.kind}`);
    assert.ok(
      Object.hasOwn(data.INVOCATIONS, skill.invocation),
      `${skill.name} 的调用方式非法：${skill.invocation}`,
    );
    assert.ok(skill.summary && skill.summary.length >= 10, `${skill.name} 缺少 summary`);
    assert.ok(Array.isArray(skill.points) && skill.points.length > 0, `${skill.name} 缺少 points`);
    for (const point of skill.points) {
      assert.ok(point.trim().length > 0, `${skill.name} 有空要点`);
    }
  }
});

test('分类数量与文档一致：14 个用户调用 + 11 个模型调用', () => {
  const user = data.SKILLS.filter((s) => s.invocation === 'user');
  const model = data.SKILLS.filter((s) => s.invocation === 'model');
  assert.equal(user.length, 14);
  assert.equal(model.length, 11);
  assert.equal(user.length + model.length, data.SKILLS.length);
});

test('每个分类都有技能，且五个分类都出现在页面上', () => {
  for (const id of KIND_IDS) {
    const count = data.SKILLS.filter((s) => s.kind === id).length;
    assert.ok(count > 0, `分类 ${id} 没有技能`);
  }
  assert.equal(KIND_IDS.length, 5);
});

test('主流程引用到的技能都在清单里', () => {
  const known = new Set(data.SKILLS.map((s) => '/' + s.name));
  for (const step of data.FLOW) {
    for (const cmd of step.commands) {
      assert.ok(known.has(cmd), `主流程引用了不存在的技能：${cmd}`);
    }
  }
});

test('页面上写死的 /命令 都能在数据里找到', () => {
  const known = new Set(data.SKILLS.map((s) => '/' + s.name));
  // 只取「独立成词」的 /命令：排除 </tag>、data/skills.js、https://… 这类片段
  const referenced = new Set(
    [...html.matchAll(/(?<![\w/.\-<])\/([a-z][a-z0-9-]+)(?![\w./-])/g)].map((m) => '/' + m[1]),
  );
  assert.ok(referenced.size >= 6, '页面上应引用多处技能命令');
  for (const token of referenced) {
    assert.ok(known.has(token), `index.html 引用了数据里没有的技能：${token}`);
  }
});

test('index.html 引用的本地资源都存在', async () => {
  const refs = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map((m) => m[1]);
  assert.ok(refs.length >= 2, '应至少引用样式与脚本');
  for (const ref of refs) {
    const info = await stat(new URL('../' + ref, import.meta.url));
    assert.ok(info.isFile(), `引用的文件不存在：${ref}`);
  }
});

test('index.html 具备基本可访问性骨架', () => {
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<main id="main">/);
  assert.match(html, /<title>[^<]+<\/title>/);
  assert.match(html, /<meta\s+name="description"/);
  assert.match(html, /name="viewport"/);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'id 不能重复');
  for (const anchor of [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1])) {
    assert.ok(ids.includes(anchor), `锚点没有对应的 id：#${anchor}`);
  }
});

test('app.js 依赖的 DOM id 都在 index.html 里', () => {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const used = new Set([
    ...[...app.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]),
  ]);
  assert.ok(used.size >= 6, '脚本应渲染多个区块');
  for (const id of used) {
    assert.ok(ids.has(id), `app.js 引用了页面上不存在的 id：${id}`);
  }
});

test('起步命令覆盖安装与每仓库初始化两步', () => {
  assert.ok(data.STARTER.install.length >= 2);
  assert.equal(data.STARTER.firstRun[0].cmd, '/setup-matt-pocock-skills');
  assert.equal(data.STARTER.firstRun[1].cmd, '/ask-matt');
});

test('阶段边界的五种选择齐全', () => {
  assert.equal(data.BOUNDARIES.length, 5);
  const names = data.BOUNDARIES.map((b) => b.name);
  for (const expected of ['继续', '新会话', '/handoff', '子代理', '/compact']) {
    assert.ok(names.includes(expected), `缺少阶段边界选项：${expected}`);
  }
});
