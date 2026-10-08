/**
 * Matt Skills 速查 · 渲染脚本
 *
 * 输入：window.MATT_SKILLS（见 data/skills.js）
 * 输出：主流程时间线、命令卡片网格（可搜索 / 可筛选 / 可复制）、阶段边界、起步命令
 * 依赖：无。所有节点用 DOM API 构建，文本走 textContent。
 */
(function () {
  'use strict';

  var DATA = window.MATT_SKILLS;
  if (!DATA) {
    console.error('[matt-skills] 未找到 window.MATT_SKILLS，请检查 data/skills.js 是否加载。');
    return;
  }

  var CATEGORIES = DATA.CATEGORIES;
  var INVOCATIONS = DATA.INVOCATIONS;
  var SKILLS = DATA.SKILLS;

  var categoryLabel = {};
  CATEGORIES.forEach(function (c) {
    categoryLabel[c.id] = c.label;
  });
  var categoryOf = {};
  SKILLS.forEach(function (s) {
    categoryOf[s.name] = s.kind;
  });

  /* ------------------------------------------------------------ 小工具 */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function cmdCode(command, className) {
    var code = el('code', className || null, command);
    code.dataset.cmd = command;
    code.title = '点击复制：' + command;
    return code;
  }

  function copyText(text, button, doneLabel) {
    var original = button.textContent;
    function flash(ok) {
      button.textContent = ok ? doneLabel : '复制失败';
      button.dataset.copied = String(ok);
      window.setTimeout(function () {
        button.textContent = original;
        delete button.dataset.copied;
      }, 1400);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          flash(true);
        },
        function () {
          flash(false);
        },
      );
      return;
    }

    // file:// 或旧环境下的兜底：临时选中一段文本再用 execCommand
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (error) {
      ok = false;
    }
    document.body.removeChild(area);
    flash(ok);
  }

  /* ---------------------------------------------------------------- 主流程 */

  function renderFlow() {
    var list = document.getElementById('flow-list');
    if (!list) return;

    DATA.FLOW.forEach(function (item) {
      var li = el('li', 'flow-step');

      var num = el('div', 'flow-num', String(item.step));
      num.setAttribute('aria-hidden', 'true');

      var body = el('div', 'flow-body');
      var heading = el('h3');
      heading.appendChild(document.createTextNode(item.title));

      var cmds = el('span', 'flow-cmds');
      item.commands.forEach(function (command) {
        cmds.appendChild(cmdCode(command));
      });
      heading.appendChild(cmds);
      body.appendChild(heading);
      body.appendChild(el('p', null, item.desc));

      li.appendChild(num);
      li.appendChild(body);
      list.appendChild(li);
    });
  }

  /* ------------------------------------------------------------ 阶段边界 */

  function renderBoundaries() {
    var list = document.getElementById('boundary-list');
    if (!list) return;

    DATA.BOUNDARIES.forEach(function (item) {
      var li = el('li');
      li.appendChild(el('strong', null, item.name));
      li.appendChild(document.createTextNode(' — ' + item.desc));
      list.appendChild(li);
    });
  }

  /* ------------------------------------------------------------ 起步命令 */

  function renderStarter() {
    [
      ['install-list', DATA.STARTER.install],
      ['firstrun-list', DATA.STARTER.firstRun],
    ].forEach(function (pair) {
      var list = document.getElementById(pair[0]);
      if (!list) return;
      pair[1].forEach(function (item) {
        var li = el('li');
        li.appendChild(cmdCode(item.cmd));
        li.appendChild(el('span', 'note', item.note));
        list.appendChild(li);
      });
    });
  }

  /* ---------------------------------------------------------------- 卡片 */

  function buildCard(skill) {
    var card = el('article', 'card');
    card.id = 'skill-' + skill.name;
    card.dataset.kind = skill.kind;

    var head = el('div', 'card-head');
    var title = el('h3');
    title.appendChild(el('span', 'slash', '/'));
    title.appendChild(document.createTextNode(skill.name));
    head.appendChild(title);

    head.appendChild(el('span', 'badge', categoryLabel[skill.kind] || skill.kind));

    var invoke = el('span', 'invoke', INVOCATIONS[skill.invocation].label);
    invoke.dataset.invocation = skill.invocation;
    invoke.title = INVOCATIONS[skill.invocation].hint;
    head.appendChild(invoke);
    card.appendChild(head);

    card.appendChild(el('p', 'summary', skill.summary));

    var actions = el('div', 'card-actions');
    var copyBtn = el('button', 'mini-btn', '复制 /' + skill.name);
    copyBtn.type = 'button';
    copyBtn.addEventListener('click', function () {
      copyText('/' + skill.name, copyBtn, '已复制');
    });
    actions.appendChild(copyBtn);

    var detailsId = 'details-' + skill.name;
    var toggle = el('button', 'mini-btn', '展开说明');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', detailsId);
    actions.appendChild(toggle);
    card.appendChild(actions);

    var details = el('div', 'card-details');
    details.id = detailsId;
    details.hidden = true;

    var points = el('ul');
    skill.points.forEach(function (point) {
      points.appendChild(el('li', null, point));
    });
    details.appendChild(points);

    if (skill.example) {
      var example = el('p', 'card-example');
      example.appendChild(document.createTextNode('例：'));
      var code = el('code', null, skill.example);
      example.appendChild(code);
      details.appendChild(example);
    }

    card.appendChild(details);

    toggle.addEventListener('click', function () {
      var open = details.hidden;
      details.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? '收起说明' : '展开说明';
    });

    return card;
  }

  /* -------------------------------------------------- 搜索 + 筛选 + 渲染 */

  var state = {
    query: '',
    kind: 'all',
  };

  var grid = document.getElementById('skill-grid');
  var emptyState = document.getElementById('empty-state');
  var resultLine = document.getElementById('result-line');
  var searchInput = document.getElementById('search');
  var clearButton = document.getElementById('clear-search');
  var chipsBox = document.getElementById('chips');

  function haystack(skill) {
    return [
      skill.name,
      '/' + skill.name,
      skill.summary,
      categoryLabel[skill.kind] || '',
      INVOCATIONS[skill.invocation].label,
      skill.points.join(' '),
    ]
      .join(' ')
      .toLowerCase();
  }

  SKILLS.forEach(function (skill) {
    skill._haystack = haystack(skill);
  });

  function matches(skill) {
    if (state.kind !== 'all' && skill.kind !== state.kind) return false;
    if (!state.query) return true;
    var needle = state.query.replace(/^\//, '').toLowerCase().trim();
    if (!needle) return true;
    return (
      skill._haystack.indexOf(needle) !== -1 ||
      skill.name.toLowerCase().indexOf(needle) !== -1
    );
  }

  function renderGrid() {
    var visible = SKILLS.filter(matches);

    grid.textContent = '';
    visible.forEach(function (skill) {
      grid.appendChild(buildCard(skill));
    });

    emptyState.hidden = visible.length > 0;
    resultLine.textContent =
      visible.length === SKILLS.length
        ? '共 ' + SKILLS.length + ' 个技能'
        : '匹配 ' + visible.length + ' / ' + SKILLS.length + ' 个技能';

    clearButton.hidden = !state.query;
  }

  function buildChips() {
    var entries = [{ id: 'all', label: '全部' }].concat(
      CATEGORIES.map(function (c) {
        var count = SKILLS.filter(function (s) {
          return s.kind === c.id;
        }).length;
        return { id: c.id, label: c.label, note: c.note, count: count };
      }),
    );

    entries.forEach(function (entry) {
      var chip = el('button', 'chip');
      chip.type = 'button';
      chip.dataset.kind = entry.id;
      chip.setAttribute('aria-pressed', String(state.kind === entry.id));
      chip.appendChild(document.createTextNode(entry.label));
      chip.appendChild(
        el('span', 'chip-count', String(entry.count == null ? SKILLS.length : entry.count)),
      );
      if (entry.note) chip.title = entry.note;
      chip.addEventListener('click', function () {
        state.kind = entry.id;
        Array.prototype.forEach.call(chipsBox.children, function (node) {
          node.setAttribute('aria-pressed', String(node.dataset.kind === state.kind));
        });
        renderGrid();
      });
      chipsBox.appendChild(chip);
    });
  }

  function wireSearch() {
    searchInput.addEventListener('input', function () {
      state.query = searchInput.value;
      renderGrid();
    });

    clearButton.addEventListener('click', function () {
      state.query = '';
      searchInput.value = '';
      searchInput.focus();
      renderGrid();
    });

    document.addEventListener('keydown', function (event) {
      var target = event.target;
      var typing =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (event.key === '/' && !typing) {
        event.preventDefault();
        searchInput.focus();
        searchInput.select();
        return;
      }

      if (event.key === 'Escape' && document.activeElement === searchInput && searchInput.value) {
        searchInput.value = '';
        state.query = '';
        renderGrid();
      }
    });
  }

  /* -------------------------------------------------------- 哈希深链接 */

  function openFromHash() {
    var id = window.location.hash.replace(/^#/, '');
    if (!id) return;
    var card = document.getElementById(id);
    if (!card) return;
    var toggle = card.querySelector('.mini-btn[aria-controls]');
    var details = card.querySelector('.card-details');
    if (toggle && details && details.hidden) {
      details.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      toggle.textContent = '收起说明';
    }
    card.scrollIntoView({ block: 'center' });
  }

  /* -------------------------------------------------------------- 主题 */

  function wireTheme() {
    var root = document.documentElement;
    var button = document.getElementById('theme-toggle');
    var icon = document.getElementById('theme-icon');
    var stored = null;
    try {
      stored = window.localStorage.getItem('matt-skills-theme');
    } catch (error) {
      stored = null;
    }

    function apply(theme) {
      if (theme) {
        root.dataset.theme = theme;
      } else {
        delete root.dataset.theme;
      }
      var isDark =
        theme === 'dark' ||
        (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      button.setAttribute('aria-pressed', String(isDark));
      if (icon) icon.textContent = isDark ? '☾' : '☀';
    }

    apply(stored);

    button.addEventListener('click', function () {
      var isDark =
        root.dataset.theme === 'dark' ||
        (!root.dataset.theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      var next = isDark ? 'light' : 'dark';
      try {
        window.localStorage.setItem('matt-skills-theme', next);
      } catch (error) {
        /* 隐私模式下忽略 */
      }
      apply(next);
    });
  }

  /* -------------------------------------------------------------- 统计 */

  function renderStats() {
    var userCount = SKILLS.filter(function (s) {
      return s.invocation === 'user';
    }).length;
    var modelCount = SKILLS.length - userCount;

    var total = document.getElementById('stat-total');
    var userEl = document.getElementById('stat-user');
    var modelEl = document.getElementById('stat-model');
    if (total) total.textContent = String(SKILLS.length);
    if (userEl) userEl.textContent = String(userCount);
    if (modelEl) modelEl.textContent = String(modelCount);
  }

  /* -------------------------------------------------------- 全局可点击命令 */

  function wireCommandClicks() {
    document.addEventListener('click', function (event) {
      var code = event.target instanceof HTMLElement ? event.target.closest('code[data-cmd]') : null;
      if (!code) return;
      copyText(code.dataset.cmd, code, code.textContent);
    });
  }

  /* ---------------------------------------------------------------- 启动 */

  renderFlow();
  renderBoundaries();
  renderStarter();
  buildChips();
  wireSearch();
  wireTheme();
  wireCommandClicks();
  renderStats();
  renderGrid();
  openFromHash();

  window.addEventListener('hashchange', openFromHash);
})();
