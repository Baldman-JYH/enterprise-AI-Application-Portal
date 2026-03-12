const flowStore = window.EnterpriseAIDemoFlow;
const chatStore = window.EnterpriseAIDemoChat;
const adminProfile = { ...(flowStore?.profiles?.desktopAdmin || { userId: 'zhoumin', name: '周敏', department: '信息技术部', roles: ['platform-admin'] }), channel: 'desktop' };
const baseMetrics = { tokens: 1820000, cost: 3240, users: 426, approvals: 7 };
const scopeOptions = {
  visibility: ['all', 'department', 'users'],
  download: ['all', 'department', 'users'],
  management: ['platform', 'departmentAdmin', 'owner']
};
const scopeActionLabels = {
  visibility: { all: '全员可见', department: '指定部门', users: '指定个人' },
  download: { all: '全员可下载', department: '指定部门', users: '指定个人' },
  management: { platform: '平台管理员', departmentAdmin: '部门管理员', owner: '工具责任人' }
};
const ruleTitles = { visibility: '可见范围', download: '下载范围', management: '管理权限' };
const userDirectoryBase = [
  { userId: 'lx', name: 'LX', department: '供应链计划部' },
  { userId: 'zhoumin', name: '周敏', department: '信息技术部' },
  { userId: 'lina', name: '李娜', department: '财务部' },
  { userId: 'chenhao', name: '陈灏', department: '供应链计划部' },
  { userId: 'liujia', name: '刘嘉', department: '采购中心' }
];
const trendSeed = [
  { label: '09:00', tokens: 98000, cost: 180 },
  { label: '10:00', tokens: 126000, cost: 240 },
  { label: '11:00', tokens: 118000, cost: 224 },
  { label: '12:00', tokens: 89000, cost: 168 },
  { label: '13:00', tokens: 136000, cost: 256 },
  { label: '14:00', tokens: 172000, cost: 336 },
  { label: '15:00', tokens: 148000, cost: 288 }
];
let selectedToolId = '';
let policyDraft = null;

const metricTokens = document.querySelector('#metricTokens');
const metricTokensHint = document.querySelector('#metricTokensHint');
const metricCost = document.querySelector('#metricCost');
const metricCostHint = document.querySelector('#metricCostHint');
const metricUsers = document.querySelector('#metricUsers');
const metricUsersHint = document.querySelector('#metricUsersHint');
const metricApprovals = document.querySelector('#metricApprovals');
const metricApprovalsHint = document.querySelector('#metricApprovalsHint');
const metricPositive = document.querySelector('#metricPositive');
const metricPositiveHint = document.querySelector('#metricPositiveHint');
const metricMails = document.querySelector('#metricMails');
const metricMailsHint = document.querySelector('#metricMailsHint');
const feedbackMailBadge = document.querySelector('#feedbackMailBadge');
const feedbackOverview = document.querySelector('#feedbackOverview');
const feedbackList = document.querySelector('#feedbackList');
const sharedTaskList = document.querySelector('#sharedTaskList');
const approvalList = document.querySelector('#approvalList');
const alertList = document.querySelector('#alertList');
const toolGovernanceBadge = document.querySelector('#toolGovernanceBadge');
const toolGovernanceList = document.querySelector('#toolGovernanceList');
const toolGovernanceDetail = document.querySelector('#toolGovernanceDetail');
const trendChart = document.querySelector('#trendChart');
const metricTableBody = document.querySelector('#metricTableBody');

function formatTokens(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
}

function formatCurrency(value) {
  return `¥ ${value.toLocaleString('zh-CN')}`;
}

function cloneRule(rule = {}) {
  return { scope: rule.scope || 'all', departments: [...(rule.departments || [])], users: [...(rule.users || [])] };
}

function getDepartments(snapshot) {
  return [...new Set(Object.values(snapshot.tools || {}).map((tool) => tool.department))];
}

function getUserDirectory(snapshot) {
  const directory = new Map(userDirectoryBase.map((item) => [item.userId, item]));
  Object.values(snapshot.tools || {}).forEach((tool) => {
    if (tool.ownerId) directory.set(tool.ownerId, { userId: tool.ownerId, name: tool.owner, department: tool.department });
  });
  return Array.from(directory.values());
}

function formatRule(rule = {}, snapshot = flowStore.read()) {
  const scopeLabel = flowStore.scopeLabels[rule.scope] || '未配置';
  if ((rule.scope === 'department' || rule.scope === 'departmentAdmin') && rule.departments?.length) {
    return `${scopeLabel} · ${rule.departments.join(' / ')}`;
  }
  if ((rule.scope === 'users' || rule.scope === 'owner') && rule.users?.length) {
    const userMap = new Map(getUserDirectory(snapshot).map((item) => [item.userId, item.name]));
    return `${scopeLabel} · ${rule.users.map((userId) => userMap.get(userId) || userId).join(' / ')}`;
  }
  return scopeLabel;
}

function buildSharedItems(snapshot) {
  return Object.values(snapshot.flows || {}).filter((flow) => flow.status !== 'idle');
}

function buildTrendSeries(flowSummary) {
  return trendSeed.map((item, index) => ({
    label: item.label,
    tokens: item.tokens + Math.round(flowSummary.tokenDelta / trendSeed.length) + (index === trendSeed.length - 1 ? flowSummary.runningCount * 12000 : 0),
    cost: item.cost + Math.round(flowSummary.costDelta / trendSeed.length) + (index === trendSeed.length - 1 ? flowSummary.waitingCount * 18 : 0)
  }));
}

function renderTrendChart(flowSummary) {
  const series = buildTrendSeries(flowSummary);
  const width = 720;
  const height = 240;
  const padding = { top: 24, right: 20, bottom: 28, left: 36 };
  const tokenMax = Math.max(...series.map((item) => item.tokens));
  const costMax = Math.max(...series.map((item) => item.cost));
  const stepX = (width - padding.left - padding.right) / (series.length - 1);
  const points = series.map((item, index) => ({
    x: padding.left + stepX * index,
    tokenY: height - padding.bottom - ((item.tokens / tokenMax) * (height - padding.top - padding.bottom)),
    costY: height - padding.bottom - ((item.cost / costMax) * (height - padding.top - padding.bottom))
  }));
  const tokenLine = points.map((point) => `${point.x},${point.tokenY}`).join(' ');
  const costLine = points.map((point) => `${point.x},${point.costY}`).join(' ');
  const xLabels = series.map((item, index) => `<text x="${points[index].x}" y="${height - 8}" text-anchor="middle" fill="#6e6e80" font-size="12">${item.label}</text>`).join('');
  trendChart.innerHTML = `
    <rect x="0" y="0" width="${width}" height="${height}" rx="20" fill="#fbfbf8"></rect>
    <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="rgba(32,33,35,0.08)"></line>
    <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="rgba(32,33,35,0.08)"></line>
    <polyline points="${tokenLine}" fill="none" stroke="#202123" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
    <polyline points="${costLine}" fill="none" stroke="#10a37f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
    ${points.map((point) => `<circle cx="${point.x}" cy="${point.tokenY}" r="4" fill="#202123"></circle>`).join('')}
    ${points.map((point) => `<circle cx="${point.x}" cy="${point.costY}" r="4" fill="#10a37f"></circle>`).join('')}
    ${xLabels}
  `;
}

function renderMetricTable(snapshot, flowSummary) {
  const activeTasks = buildSharedItems(snapshot);
  const rows = [
    {
      module: '对话工作入口',
      calls: activeTasks.length ? `${activeTasks.length} 个任务` : '0 个任务',
      tokens: formatTokens(flowSummary.tokenDelta || 86000),
      cost: formatCurrency(flowSummary.costDelta || 180),
      status: activeTasks.some((item) => item.status === 'running') ? '处理中' : '稳定'
    },
    {
      module: '知识与制度问答',
      calls: '26 次',
      tokens: '124K',
      cost: '¥ 240',
      status: '稳定'
    },
    {
      module: '流程执行智能体',
      calls: `${activeTasks.filter((item) => item.approvalCount > 0).length} 条待确认`,
      tokens: formatTokens(132000 + flowSummary.waitingCount * 12000),
      cost: formatCurrency(286 + flowSummary.waitingCount * 18),
      status: activeTasks.filter((item) => item.approvalCount > 0).length ? '关注' : '正常'
    },
    {
      module: '部门工具专区',
      calls: `${flowSummary.toolCount} 个工具`,
      tokens: '辅助分发',
      cost: '内部分发',
      status: flowSummary.totalToolDownloads > 0 ? '活跃' : '正常'
    }
  ];
  metricTableBody.innerHTML = rows.map((row) => `<tr><td>${row.module}</td><td>${row.calls}</td><td>${row.tokens}</td><td>${row.cost}</td><td>${row.status}</td></tr>`).join('');
}

function ensureSelection(tools) {
  if (!tools.length) {
    selectedToolId = '';
    policyDraft = null;
    return null;
  }
  const tool = tools.find((item) => item.toolId === selectedToolId) || tools[0];
  if (!policyDraft || tool.toolId !== selectedToolId) {
    selectedToolId = tool.toolId;
    policyDraft = {
      visibility: cloneRule(tool.visibility),
      download: cloneRule(tool.download),
      management: cloneRule(tool.management)
    };
  }
  return tool;
}

function setRuleScope(ruleKey, scope, currentTool) {
  const draft = policyDraft[ruleKey];
  draft.scope = scope;
  if (scope === 'department' || scope === 'departmentAdmin') {
    draft.departments = draft.departments.length ? [draft.departments[0]] : [currentTool.department];
    draft.users = [];
    return;
  }
  if (scope === 'users') {
    draft.users = draft.users.length ? draft.users : [adminProfile.userId];
    draft.departments = [];
    return;
  }
  if (scope === 'owner') {
    draft.users = draft.users.length ? [draft.users[0]] : [currentTool.ownerId];
    draft.departments = [];
    return;
  }
  draft.departments = [];
  draft.users = [];
}

function toggleDepartment(ruleKey, department) {
  policyDraft[ruleKey].departments = [department];
}

function toggleUser(ruleKey, userId, single = false) {
  const nextUsers = new Set(policyDraft[ruleKey].users || []);
  if (single) {
    policyDraft[ruleKey].users = [userId];
    return;
  }
  if (nextUsers.has(userId)) nextUsers.delete(userId); else nextUsers.add(userId);
  policyDraft[ruleKey].users = Array.from(nextUsers);
}

function normalizeRule(ruleKey, currentTool) {
  const draft = policyDraft[ruleKey];
  const next = { scope: draft.scope, departments: [], users: [] };
  if (draft.scope === 'department' || draft.scope === 'departmentAdmin') next.departments = draft.departments.length ? [draft.departments[0]] : [currentTool.department];
  if (draft.scope === 'users') next.users = draft.users.length ? draft.users : [adminProfile.userId];
  if (draft.scope === 'owner') next.users = draft.users.length ? [draft.users[0]] : [currentTool.ownerId];
  return next;
}

function renderScopeButtons(ruleKey) {
  return scopeOptions[ruleKey].map((scope) => `<button class="scope-chip ${policyDraft[ruleKey].scope === scope ? 'is-active' : ''}" type="button" data-rule-scope="${ruleKey}" data-scope="${scope}">${scopeActionLabels[ruleKey][scope]}</button>`).join('');
}

function renderTargetSelector(ruleKey, snapshot, currentTool) {
  const draft = policyDraft[ruleKey];
  if (draft.scope === 'department' || draft.scope === 'departmentAdmin') {
    return `<div class="governance-target-block"><span class="governance-target-label">限定部门</span><div class="governance-target-row">${getDepartments(snapshot).map((department) => `<button class="target-chip ${draft.departments.includes(department) ? 'is-active' : ''}" type="button" data-rule-department="${ruleKey}" data-department="${department}">${department}</button>`).join('')}</div></div>`;
  }
  if (draft.scope === 'users' || draft.scope === 'owner') {
    return `<div class="governance-target-block"><span class="governance-target-label">${draft.scope === 'owner' ? '指定责任人' : '限定个人'}</span><div class="governance-target-row">${getUserDirectory(snapshot).map((user) => `<button class="target-chip ${draft.users.includes(user.userId) ? 'is-active' : ''}" type="button" data-rule-user="${ruleKey}" data-user-id="${user.userId}">${user.name} / ${user.department}</button>`).join('')}</div></div>`;
  }
  return '<p class="governance-helper">保存后会立即同步到用户页和手机端。</p>';
}

function bindGovernanceEvents() {
  document.querySelectorAll('[data-tool-select]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedToolId = button.dataset.toolSelect || '';
      policyDraft = null;
      renderToolGovernance();
    });
  });
  document.querySelectorAll('[data-rule-scope]').forEach((button) => {
    button.addEventListener('click', () => {
      const currentTool = flowStore.read().tools[selectedToolId];
      if (!currentTool) return;
      setRuleScope(button.dataset.ruleScope, button.dataset.scope, currentTool);
      renderToolGovernance();
    });
  });
  document.querySelectorAll('[data-rule-department]').forEach((button) => {
    button.addEventListener('click', () => {
      toggleDepartment(button.dataset.ruleDepartment, button.dataset.department);
      renderToolGovernance();
    });
  });
  document.querySelectorAll('[data-rule-user]').forEach((button) => {
    button.addEventListener('click', () => {
      const ruleKey = button.dataset.ruleUser;
      toggleUser(ruleKey, button.dataset.userId, policyDraft[ruleKey].scope === 'owner');
      renderToolGovernance();
    });
  });
  document.querySelector('#resetPolicyBtn')?.addEventListener('click', () => {
    const currentTool = flowStore.read().tools[selectedToolId];
    if (!currentTool) return;
    policyDraft = {
      visibility: cloneRule(currentTool.visibility),
      download: cloneRule(currentTool.download),
      management: cloneRule(currentTool.management)
    };
    renderToolGovernance();
  });
  document.querySelector('#savePolicyBtn')?.addEventListener('click', () => {
    const currentTool = flowStore.read().tools[selectedToolId];
    if (!currentTool) return;
    flowStore.updateTool(selectedToolId, {
      visibility: normalizeRule('visibility', currentTool),
      download: normalizeRule('download', currentTool),
      management: normalizeRule('management', currentTool)
    }, {
      role: 'admin',
      channel: 'desktop',
      action: `更新 ${currentTool.name} 的工具权限`
    });
    policyDraft = null;
  });
}

function renderFeedbackPanel() {
  const feedbacks = chatStore.listFeedback();
  const summary = chatStore.summarize();
  feedbackMailBadge.textContent = summary.mailCount ? '邮件已接收' : '等待反馈';
  feedbackOverview.innerHTML = [
    `<span class="tag-pill">总反馈 ${summary.positiveCount + summary.negativeCount}</span>`,
    `<span class="tag-pill">正向 ${summary.positiveCount}</span>`,
    `<span class="tag-pill">负向 ${summary.negativeCount}</span>`,
    `<span class="tag-pill">邮箱 ${chatStore.mailbox}</span>`
  ].join('');
  if (!feedbacks.length) {
    feedbackList.innerHTML = '<article class="feedback-item"><strong>暂无反馈</strong><p>用户提交点赞或点踩后，会在这里记录并生成邮件接收状态。</p></article>';
    return;
  }
  feedbackList.innerHTML = feedbacks.map((item) => `
    <article class="feedback-item">
      <div class="feedback-item-head">
        <div>
          <strong>${item.threadTitle}</strong>
          <p>${item.excerpt}</p>
        </div>
        <span class="feedback-sentiment ${item.sentiment}">${item.sentiment === 'up' ? '点赞' : '点踩'}</span>
      </div>
      <div class="feedback-meta">
        <span class="tag-pill">用户 ${item.userName}</span>
        <span class="tag-pill">时间 ${item.createdAt}</span>
        <span class="tag-pill">邮件 ${item.mailStatus}</span>
        <span class="tag-pill">${item.mailbox}</span>
      </div>
    </article>
  `).join('');
}

function renderSharedTasks(snapshot, flowSummary) {
  const activeTasks = buildSharedItems(snapshot);
  if (!activeTasks.length) {
    sharedTaskList.innerHTML = '<article class="stack-item"><strong>暂无共享任务</strong><p>当前没有需要跨角色同步的任务。</p></article>';
  } else {
    sharedTaskList.innerHTML = activeTasks.map((task) => `<article class="stack-item"><strong>${task.label}</strong><p>${task.summary}</p></article>`).join('');
  }
  const approvals = activeTasks.filter((task) => task.approvalCount > 0);
  approvalList.innerHTML = approvals.length
    ? approvals.map((task) => `<article class="stack-item"><strong>${task.label}</strong><p>${task.approvalCount} 个确认或审批待处理。</p></article>`).join('')
    : '<article class="stack-item"><strong>暂无积压</strong><p>当前没有新增的人工确认项。</p></article>';
  const feedbackSummary = chatStore.summarize();
  const alerts = [];
  if (flowSummary.tokenDelta > 180000) alerts.push(['调用量升高', '本时段 Tokens 增量偏高，需要继续关注批量生成行为。']);
  if (feedbackSummary.negativeCount > 0) alerts.push(['负向反馈', `${feedbackSummary.negativeCount} 条点踩反馈已进入记录。`]);
  if (approvals.length > 2) alerts.push(['审批积压', `${approvals.length} 个任务需要人工确认。`]);
  alertList.innerHTML = alerts.length
    ? alerts.map(([title, desc]) => `<article class="stack-item"><strong>${title}</strong><p>${desc}</p></article>`).join('')
    : '<article class="stack-item"><strong>运行正常</strong><p>当前未发现新增风险。</p></article>';
}

function renderToolGovernance() {
  const snapshot = flowStore.read();
  const tools = flowStore.listManageableTools(adminProfile, snapshot);
  const currentTool = ensureSelection(tools);
  toolGovernanceBadge.textContent = `${tools.length} 个工具`;
  if (!tools.length || !currentTool || !policyDraft) {
    toolGovernanceList.innerHTML = '<article class="stack-item"><strong>暂无可管理工具</strong><p>当前角色没有可管理的工具资产。</p></article>';
    toolGovernanceDetail.innerHTML = '<article class="tool-detail-card"><strong>等待接入</strong><p>工具上架后，可在这里配置可见、下载和管理权限。</p></article>';
    return;
  }
  toolGovernanceList.innerHTML = tools.map((tool) => `
    <button class="tool-queue-card ${tool.toolId === currentTool.toolId ? 'is-active' : ''}" type="button" data-tool-select="${tool.toolId}">
      <div class="tool-queue-top">
        <strong>${tool.name}</strong>
        <span class="badge">${tool.status}</span>
      </div>
      <p>${tool.department} · ${tool.type} · ${tool.version}</p>
      <div class="tool-queue-meta">
        <span>可见：${formatRule(tool.visibility, snapshot)}</span>
        <span>下载：${formatRule(tool.download, snapshot)}</span>
        <span>累计下载 ${tool.downloads} 次</span>
      </div>
    </button>
  `).join('');
  toolGovernanceDetail.innerHTML = `
    <article class="tool-detail-card">
      <div class="tool-detail-head">
        <div>
          <p class="card-kicker">当前工具</p>
          <h3>${currentTool.name}</h3>
          <p>${currentTool.summary}</p>
        </div>
        <div class="tool-detail-tags">
          <span class="tag-pill">${currentTool.department}</span>
          <span class="tag-pill">${currentTool.type}</span>
          <span class="tag-pill">${currentTool.fileName}</span>
        </div>
      </div>
      <div class="tool-overview-grid">
        <article class="tool-overview-item"><span>版本</span><strong>${currentTool.version}</strong></article>
        <article class="tool-overview-item"><span>责任人</span><strong>${currentTool.owner}</strong></article>
        <article class="tool-overview-item"><span>下载次数</span><strong>${currentTool.downloads}</strong></article>
        <article class="tool-overview-item"><span>最近更新</span><strong>${currentTool.updatedAt}</strong></article>
      </div>
      <div class="policy-grid">
        ${['visibility', 'download', 'management'].map((ruleKey) => `
          <section class="policy-card">
            <div class="policy-card-head">
              <p class="card-kicker">${ruleTitles[ruleKey]}</p>
              <h4>${formatRule(policyDraft[ruleKey], snapshot)}</h4>
            </div>
            <div class="scope-chip-row">${renderScopeButtons(ruleKey)}</div>
            ${renderTargetSelector(ruleKey, snapshot, currentTool)}
          </section>
        `).join('')}
      </div>
      <div class="tool-governance-actions">
        <p class="governance-footnote">保存后，用户页和手机端会同步展示最新权限。</p>
        <div class="top-actions">
          <button class="button secondary" id="resetPolicyBtn" type="button">恢复当前配置</button>
          <button class="button" id="savePolicyBtn" type="button">保存权限</button>
        </div>
      </div>
    </article>
  `;
  bindGovernanceEvents();
}

function renderDashboard() {
  const snapshot = flowStore.read();
  const flowSummary = flowStore.summarize(snapshot);
  const chatSummary = chatStore.summarize();
  metricTokens.textContent = formatTokens(baseMetrics.tokens + flowSummary.tokenDelta);
  metricTokensHint.textContent = `增量 ${formatTokens(flowSummary.tokenDelta)}`;
  metricCost.textContent = formatCurrency(baseMetrics.cost + flowSummary.costDelta);
  metricCostHint.textContent = `增量 ${formatCurrency(flowSummary.costDelta)}`;
  metricUsers.textContent = String(baseMetrics.users + flowSummary.runningCount + flowSummary.waitingCount);
  metricUsersHint.textContent = `当前工具 ${flowSummary.toolCount} 个`;
  metricApprovals.textContent = String(baseMetrics.approvals + flowSummary.pendingApprovals);
  metricApprovalsHint.textContent = `${flowSummary.pendingApprovals} 个来自共享任务`;
  metricPositive.textContent = String(chatSummary.positiveCount);
  metricPositiveHint.textContent = `${chatSummary.negativeCount} 条负向反馈`;
  metricMails.textContent = String(chatSummary.mailCount);
  metricMailsHint.textContent = chatStore.mailbox;
  renderTrendChart(flowSummary);
  renderMetricTable(snapshot, flowSummary);
  renderFeedbackPanel();
  renderSharedTasks(snapshot, flowSummary);
  renderToolGovernance();
}

flowStore.recordEvent({ scenarioId: flowStore.read().activeScenario, role: 'admin', channel: 'desktop', action: '打开运营与治理控制台' });
chatStore.subscribe(renderDashboard);
flowStore.subscribe(renderDashboard);
renderDashboard();
