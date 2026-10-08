/**
 * Matt Skills 速查数据。
 *
 * 单一数据源：页面（app.js）与测试（tests/skills.test.mjs）都读这里。
 * 技能清单来自 dsh-mattpocock-skills 包（25 个技能），改动时同步更新。
 * 同时兼容浏览器（window.MATT_SKILLS）与 Node require。
 */
(function (root, factory) {
  var data = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = data;
  } else {
    root.MATT_SKILLS = data;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** 分类：与 /ask-matt 的地图一一对应 */
  var CATEGORIES = [
    {
      id: 'flow',
      label: '主流程',
      note: '从想法到交付的一条主线：打磨 → 拆分 → 实现。',
    },
    {
      id: 'onramp',
      label: '入口',
      note: '先有活冒出来，再汇入主流程。',
    },
    {
      id: 'health',
      label: '代码库健康',
      note: '不是做功能，是保养：让代码库对 agent 更好用。',
    },
    {
      id: 'vocab',
      label: '词汇层',
      note: '垫在所有技能下面的两份参考，管的是「词」而不是「流程」。',
    },
    {
      id: 'standalone',
      label: '独立技能',
      note: '不在主线上，需要时单独取用。',
    },
  ];

  /** 调用方式：user = 只能由你输入 /名称 触发；model = agent 可自行取用，也可点名 */
  var INVOCATIONS = {
    user: { label: '你调用', hint: '输入 /名称 触发（disable-model-invocation）' },
    model: { label: '模型调用', hint: 'agent 会自行取用，也可以直接点名' },
  };

  var SKILLS = [
    /* ---------------------------------------------------------------- 主流程 */
    {
      name: 'grill-with-docs',
      kind: 'flow',
      invocation: 'user',
      summary: '拷问式访谈打磨计划或设计，边聊边落文档（CONTEXT.md 术语表 + ADR）。',
      points: [
        '事实由 agent 去查，决策由你拍板；一轮轮追问，直到没有含糊的地方。',
        '产出留在仓库里，换会话也能接上——只要在仓库里工作，就用它而不是 /grill-me。',
        '主流程的第 1 步，也是绝大多数工作的起点。',
      ],
      example: '/grill-with-docs 我想做一个团队记账工具',
    },
    {
      name: 'grill-me',
      kind: 'flow',
      invocation: 'user',
      summary: '同一套拷问访谈，但不落盘：不写 CONTEXT.md，也不留任何本地状态。',
      points: [
        '用在「没有工作目录」的时候：打磨一个计划、一份设计、一篇文章。',
        '手上有仓库时就别用它——/grill-with-docs 跑同一场访谈，还多留一份档案。',
      ],
    },
    {
      name: 'handoff',
      kind: 'flow',
      invocation: 'user',
      summary: '把当前会话压缩成一份交接文档，让新 agent 接着做。',
      points: [
        '写到操作系统临时目录，不落到工作区里。',
        '文档里含「建议加载的技能」，指出下一个 agent 该取用哪些技能。',
        '只在需要「可携带」时用：换 harness、换目录、交给同事，或在阶段中途分叉一个支线。',
      ],
      example: '/handoff 下一步做计费模块',
    },
    {
      name: 'prototype',
      kind: 'flow',
      invocation: 'model',
      summary: '写一个用完即弃的小程序，回答一个设计问题。',
      points: [
        '用在纸上谈不拢的地方：这个状态模型顺不顺、这个界面该长什么样。',
        '「用完即弃」是对写法的约束，不是承诺销毁：答案是留下的，代码本身存到 prototype/<名称> 分支当一手来源。',
        '主流程第 2 步的绕行路线，由 /handoff 来回衔接。',
      ],
    },
    {
      name: 'to-spec',
      kind: 'flow',
      invocation: 'user',
      summary: '把当前对话综合成一份 spec，发布到项目 issue tracker——不再访谈。',
      points: [
        '把已经聊清楚的东西整理成文：问题、方案、一长串用户故事。',
        '开始写之前先跟你确认测试的 seam（接缝），并在 spec 里写明。',
        '发布后自动打 ready-for-agent 标签，省掉一轮 triage。',
      ],
    },
    {
      name: 'to-tickets',
      kind: 'flow',
      invocation: 'user',
      summary: '把计划、spec 或当前对话拆成 tracer-bullet 工单，每个都声明阻塞边。',
      points: [
        '每张工单是一个窄但打穿所有层的垂直切片，自己能演示、能验证，且装得进一个干净上下文。',
        '阻塞边决定开工顺序：没有阻塞的工单可以立刻开始。',
        '宽重构（改名、改共享类型）是例外，按 expand → migrate → contract 排序，而不是硬切垂直片。',
      ],
      example: '/to-tickets docs/specs/checkout.md',
    },
    {
      name: 'implement',
      kind: 'flow',
      invocation: 'user',
      summary: '按 spec 或工单把活做出来：内部驱动 TDD，收尾跑代码评审，然后提交。',
      points: [
        '每张工单开一个干净会话，上一张的上下文可以直接丢掉。',
        '内部调用 /tdd 走红-绿循环；定期跑类型检查和单测，最后跑一次全量测试。',
        '做完调用 /code-review 评审自己的改动，然后提交到当前分支。',
      ],
      example: '/implement #12',
    },
    {
      name: 'tdd',
      kind: 'flow',
      invocation: 'model',
      summary: '红-绿循环的参考手册：什么算好测试、测试写在哪个 seam、有哪些反模式。',
      points: [
        '测试只写在事先约定好的 seam（公共边界）上，不去碰内部实现。',
        '三种反模式：耦合实现、同义反复（断言按实现方式重算期望值）、横向切片（先写完全部测试）。',
        '红先于绿；一次一个切片；重构不属于这个循环，它归评审阶段。',
      ],
    },
    {
      name: 'code-review',
      kind: 'flow',
      invocation: 'model',
      summary: '对固定点以来的 diff 做双轴评审：Standards（规范）+ Spec（是否忠实实现需求）。',
      points: [
        '两个轴各起一个并行子代理，互不污染上下文，最后汇总成一份并排报告。',
        'Standards 轴：仓库自己写下的规范优先，此外始终带上 Fowler 坏味道基线。',
        '需要你给出固定点（commit、分支、tag 或 merge-base）；先验证 ref 有效、diff 非空再往下走。',
      ],
      example: '/code-review main',
    },

    /* ------------------------------------------------------------------ 入口 */
    {
      name: 'triage',
      kind: 'onramp',
      invocation: 'user',
      summary: '把 issue 和外部 PR 推过一个状态机：归类、核实、必要时拷问，写出 agent 可执行的简报。',
      points: [
        '两类别：bug、enhancement；五状态：needs-triage、needs-info、ready-for-agent、ready-for-human、wontfix。',
        '只处理「不是你创建」的原始输入——/to-tickets 产出的工单已经是 agent-ready，不要再 triage。',
        '外部 PR 也走同一台机器：PR 就是「带代码的 issue」。',
      ],
      example: '/triage #42',
    },
    {
      name: 'diagnosing-bugs',
      kind: 'onramp',
      invocation: 'model',
      summary: '硬 bug、间歇性 flake、悄悄溜进来的回归——先建反馈回路，再谈理论。',
      points: [
        '拒绝在没有「一条已经为这个 bug 变红的命令」之前开始猜测。',
        '修完补一个回归测试，把 bug 钉死在 seam 上。',
        '如果复盘发现根本没有可用的 seam，转去 /improve-codebase-architecture。',
      ],
    },
    {
      name: 'wayfinder',
      kind: 'onramp',
      invocation: 'user',
      summary: '把大到单个会话装不下、路线还看不清的工程，画成 tracker 上的决策工单地图。',
      points: [
        '产出决策，不是交付物：一张 wayfinder:map 主图 + 一批决策子工单，一次解决一个。',
        '比 /grill-with-docs 更慢更重，只留给真正「雾大到看不清路」的工程。',
        '路清之后交回 /to-spec（而不是直接 /implement），把地图里的决策收拢成可建的计划。',
      ],
    },

    /* ------------------------------------------------------------ 代码库健康 */
    {
      name: 'improve-codebase-architecture',
      kind: 'health',
      invocation: 'user',
      summary: '扫描代码库里的「深化机会」，出一份可视化 HTML 报告，再拷问你挑中的那个。',
      points: [
        '用删除测试判断浅模块：删掉它是让复杂度集中，还是只是挪个地方？「集中」才是要找的信号。',
        '报告写进系统临时目录并自动打开，仓库里不留东西。',
        '选中的机会就是下一个想法，带回 /grill-with-docs 进入主流程。',
      ],
    },

    /* -------------------------------------------------------------- 词汇层 */
    {
      name: 'domain-modeling',
      kind: 'vocab',
      invocation: 'model',
      summary: '磨快项目的领域语言：挑战含糊术语、拆掉一词多义、把难回滚的决定记成 ADR。',
      points: [
        '维护 CONTEXT.md，让它保持一份干净的术语表。',
        '「account 同时干三件事」这类重载词，就是要在这里拆开的对象。',
        '/grill-with-docs 在访谈中持续驱动这门纪律。',
      ],
    },
    {
      name: 'codebase-design',
      kind: 'vocab',
      invocation: 'model',
      summary: '深模块的共用词汇：module、interface、depth、seam、adapter、leverage、locality。',
      points: [
        '用来设计一个模块的「形状」：大量行为藏在一个小接口后面，切在干净的 seam 上。',
        '它是参考，不是要跑一场会话；/tdd 与 /improve-codebase-architecture 都会引用它。',
      ],
    },

    /* ------------------------------------------------------------ 独立技能 */
    {
      name: 'ask-matt',
      kind: 'standalone',
      invocation: 'user',
      summary: '路由器：说不清该用哪个技能/流程时，问它。',
      points: [
        '把 25 个技能组织成一条主流程、两个入口、一层词汇。',
        '本页就是它的文字版。',
      ],
      example: '/ask-matt 我要给老项目加支付',
    },
    {
      name: 'setup-matt-pocock-skills',
      kind: 'standalone',
      invocation: 'user',
      summary: '每个仓库跑一次的初始化：issue tracker 放哪、triage 标签词汇、领域文档布局。',
      points: [
        '第一次用其它工程技能之前先跑这个——/to-spec、/to-tickets、/triage 都依赖它写下的配置。',
        'prompt 驱动而非脚本：先探查仓库现状，请你确认，再落盘。',
        '默认 GitHub issue；本地 Markdown tracker 也能开箱即用。',
      ],
    },
    {
      name: 'grilling',
      kind: 'standalone',
      invocation: 'model',
      summary: '访谈原语本身：轮次、前沿，事实是 agent 的活，决策是你的。',
      points: [
        '/grill-me 与 /grill-with-docs 是它的两个入口。',
        '/triage、/wayfinder、/improve-codebase-architecture 内部也跑它。',
        '只有在想要「不带壳的访谈」时才直接取用。',
      ],
    },
    {
      name: 'resolving-merge-conflicts',
      kind: 'standalone',
      invocation: 'model',
      summary: '处理进行中的 merge / rebase 冲突：逐个 hunk 按意图解决，而不是挑几行留下。',
      points: [
        '每一侧的取舍都追溯到它的一手来源（issue、spec、提交信息）。',
        '解决完继续完成这次操作；它永远不会替你执行 --abort。',
      ],
    },
    {
      name: 'research',
      kind: 'standalone',
      invocation: 'model',
      summary: '把查资料这段腿活交给后台 agent，产出一份带引用的 Markdown 放进仓库。',
      points: [
        '只查高可信的一手来源；引用是要留下的。',
        '它喂给 /grill-with-docs 的思考，不替代思考。',
        '后台跑着的时候你可以继续做别的。',
      ],
      example: '/research dsh 的 skill 加载优先级',
    },
    {
      name: 'to-questionnaire',
      kind: 'standalone',
      invocation: 'user',
      summary: '卡点不在你脑子里、而在别人那儿时，写一份问卷让对方填。',
      points: [
        '是 /grill-me 的反面：不访谈你关于主题的看法，而访谈你关于「这次发送」——发给谁、要回什么。',
        '问题瞄准这个缺口；收回来的东西就是 /grill-with-docs 或 /to-spec 的素材。',
      ],
    },
    {
      name: 'wizard',
      kind: 'standalone',
      invocation: 'model',
      summary: '生成一个交互式 bash 向导，带你走完只有人类能做的步骤。',
      points: [
        '适用场景：开通基础设施、配置凭据或 CI secret、点第三方后台、跑一次性迁移或切换。',
        '逐个打开页面、收集每个值、写进 .env 与 GitHub secrets——过程不用每次重新讲一遍。',
        'agent 自己能做的事就别用；这是给「人真的在环里」的步骤准备的。',
      ],
    },
    {
      name: 'wait-what',
      kind: 'standalone',
      invocation: 'user',
      summary: '上一条消息没听懂？让它用平实语言、按 CONTEXT.md 的词汇重讲一遍。',
      points: [
        '事中事后都能用，也可以在任何技能内部使用。',
        '/grill-with-docs 是事先的解法：早点约定共同语言，术语压根不会冒出来。',
      ],
    },
    {
      name: 'teach',
      kind: 'standalone',
      invocation: 'user',
      summary: '用当前目录当有状态工作区，跨多个会话学会一个概念或技能。',
      points: ['进度落在目录里，每节课接着上。'],
    },
    {
      name: 'writing-for-agents',
      kind: 'standalone',
      invocation: 'model',
      summary: '写「给 agent 读」的文档：技能、AGENTS.md、CLAUDE.md。',
      points: [
        '读你文档的是 agent，不是人——写法要跟着换。',
        '新建或修改技能文件时先看它。',
      ],
    },
  ];

  /** 主流程：四步，两个分支 */
  var FLOW = [
    {
      step: 1,
      title: '拷问打磨',
      commands: ['/grill-with-docs'],
      desc: '把想法摊开追问：事实我查，决策你定。边聊边沉淀 CONTEXT.md 与 ADR。没有工作目录时改用 /grill-me。',
    },
    {
      step: 2,
      title: '问题在纸上谈不拢？',
      commands: ['/handoff', '/prototype'],
      desc: '需要「跑起来才知道」的答案（状态模型、业务逻辑、界面长相）时绕行：/handoff 交接到新会话，在独立目录跑 /prototype，再把结论 handoff 回来。',
    },
    {
      step: 3,
      title: '这是多会话工程吗？',
      commands: ['/to-spec', '/to-tickets'],
      desc: '是 → /to-spec 把对话综合成 spec，/to-tickets 拆成带阻塞边的 tracer-bullet 工单，逐票开工。否 → 跳过，直接下一步。',
    },
    {
      step: 4,
      title: '实现',
      commands: ['/implement'],
      desc: '每张工单一个干净会话：内部驱动 /tdd 红-绿循环，收尾跑 /code-review 双轴评审，然后提交。',
    },
  ];

  /** 阶段边界：一个阶段结束、下一个开始时的五种选择 */
  var BOUNDARIES = [
    { name: '继续', desc: '待在原地。不花成本，也不丢东西——先排除它。' },
    { name: '新会话', desc: '当下面做什么都不依赖这里时，从空窗口开始。' },
    { name: '/handoff', desc: '要的是「可携带」：换 harness、换目录、交给同事，或阶段中途分叉支线。' },
    { name: '子代理', desc: '把一件范围很窄的任务发到它自己的窗口，只收一份报告回来。' },
    { name: '/compact', desc: '压缩当前上下文并用它开一个新会话——默认选项，排在最底下而不是第一个。' },
  ];

  var STARTER = {
    install: [
      { cmd: 'npm install -g @deepseek-ai/dsh', note: '前置条件：dsh CLI（也可给每条命令加 npx -y @deepseek-ai/dsh 前缀）' },
      { cmd: 'dsh plugin --profile web add dsh-mattpocock-skills', note: '推荐：装进 profile 并激活配置层' },
      { cmd: 'bash scripts/install.sh', note: '备选：直接投递到 $DSH_HOME/skills（Windows 用 scripts\\install.ps1）' },
    ],
    firstRun: [
      { cmd: '/setup-matt-pocock-skills', note: '每个仓库一次：配置 issue tracker、triage 标签、文档布局' },
      { cmd: '/ask-matt', note: '之后每次都从这里开始，让它指路' },
    ],
  };

  return {
    CATEGORIES: CATEGORIES,
    INVOCATIONS: INVOCATIONS,
    SKILLS: SKILLS,
    FLOW: FLOW,
    BOUNDARIES: BOUNDARIES,
    STARTER: STARTER,
    META: {
      title: 'Matt Skills 速查',
      subtitle: '25 个技能，一次安装，所有 dsh 会话可用',
      source: 'dsh-mattpocock-skills',
      doc: 'https://github.com/mattpocock/skills',
    },
  };
});
