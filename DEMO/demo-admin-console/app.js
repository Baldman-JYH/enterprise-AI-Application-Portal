const flowStore = window.EnterpriseAIDemoFlow;
const baseMetrics = { tokens: 1820000, cost: 3240, users: 426, approvals: 7, agents: 14, hitRate: 87 };
const staticModels = [
  ['gpt-4.1', '今日 42% 的调用来自制度问答、周报生成和综合问答场景。'],
  ['internal-rag-agent', '制度库和知识库检索场景占比 31%，知识命中率保持在 87%。'],
  ['workflow-router', '负责流程场景意图识别和工具分流，会议、采购、权限使用最高。'],
  ['budget-agent', '主要支撑采购与差旅场景的预算说明生成和预算校验。']
];
const staticApprovals = [
  ['采购审批积压', '3 个采购申请仍停留在部门负责人节点，平均等待 5.2 小时。'],
  ['权限工单待确认', '2 个权限开通工单需要人工确认敏感仓库默认关闭策略。'],
  ['差旅审批峰值', '上海差旅类任务在午间集中触发，建议补充移动端审批入口。']
];
const staticAlerts = [
  ['Token 峰值异常', '14:00-15:00 报告生成类任务的 tokens 消耗比日均高 28%，需要检查批量导出行为。'],
  ['高风险操作确认', '1 个权限开通任务请求了超出岗位模板的访问范围，已触发复核。'],
  ['知识引用缺口', '采购制度问答中仍有 13% 的问题未返回明确原文引用，需补知识库元数据。']
];
const departments = [
  ['采购中心', '高频场景：采购申请、供应商比选、制度问答'],
  ['PMO', '高频场景：周报生成、会议安排、项目风险总结'],
  ['IT 支持', '高频场景：权限开通、账号恢复、知识问答'],
  ['行政', '高频场景：会议室调度、差旅支持、物资申领'],
  ['研发', '高频场景：权限申请、项目空间检索、周报生成'],
  ['财务', '高频场景：预算说明、审批核对、制度问答'],
  ['人力', '高频场景：入职开通、制度培训、FAQ'],
  ['管理层', '高频场景：经营摘要、风险汇报、跨部门待办追踪']
];
const userDirectoryBase = [
  { userId: 'lx', name: 'LX', department: '供应链计划部' },
  { userId: 'zhoumin', name: '周敏', department: '信息技术部' },
  { userId: 'lina', name: '李娜', department: '财务部' },
  { userId: 'chenhao', name: '陈灏', department: '供应链计划部' },
  { userId: 'liujia', name: '刘嘉', department: '采购中心' }
];
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
const adminProfile = { ...flowStore.profiles.desktopAdmin, channel: 'desktop' };
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
const metricAgents = document.querySelector('#metricAgents');
const metricAgentsHint = document.querySelector('#metricAgentsHint');
const metricHitRate = document.querySelector('#metricHitRate');
const metricHitRateHint = document.querySelector('#metricHitRateHint');
const sharedTaskTitle = document.querySelector('#sharedTaskTitle');
const sharedTaskText = document.querySelector('#sharedTaskText');
const sharedTaskMeta = document.querySelector('#sharedTaskMeta');
const sharedTaskList = document.querySelector('#sharedTaskList');
const sharedTaskBadge = document.querySelector('#sharedTaskBadge');
const modelList = document.querySelector('#modelList');
const approvalList = document.querySelector('#approvalList');
const alertList = document.querySelector('#alertList');
const departmentGrid = document.querySelector('#departmentGrid');
const adminUserLink = document.querySelector('#adminUserLink');
const adminMobileUserLink = document.querySelector('#adminMobileUserLink');
const adminMobileAdminLink = document.querySelector('#adminMobileAdminLink');
const linkedPanel = document.querySelector('.linked-panel');
const dashboardGrid = document.querySelector('.dashboard-grid');
const urlParams = new URLSearchParams(window.location.search);
function formatTokens(value) { if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`; if (value >= 1000) return `${(value / 1000).toFixed(1)}K`; return String(value); }
function formatCurrency(value) { return `¥ ${value.toLocaleString('zh-CN')}`; }
function renderList(container, items) { container.innerHTML = items.map(([title, desc]) => `<article class="stack-item"><strong>${title}</strong><p>${desc}</p></article>`).join(''); }
function buildSharedItems(snapshot) { return Object.values(snapshot.flows).filter((flow) => flow.status !== 'idle').sort((left, right) => ({ waiting: 0, running: 1, done: 2, idle: 3 }[left.status] - { waiting: 0, running: 1, done: 2, idle: 3 }[right.status])); }
function getDepartments(snapshot) { return [...new Set(Object.values(snapshot.tools || {}).map((tool) => tool.department))]; }
function getUserDirectory(snapshot) {
  const directory = new Map(userDirectoryBase.map((item) => [item.userId, item]));
  Object.values(snapshot.tools || {}).forEach((tool) => {
    if (tool.ownerId) directory.set(tool.ownerId, { userId: tool.ownerId, name: tool.owner, department: tool.department });
  });
  return Array.from(directory.values());
}
function formatRule(rule = {}, snapshot = flowStore.read()) {
  const scopeLabel = flowStore.scopeLabels[rule.scope] || '未配置';
  if ((rule.scope === 'department' || rule.scope === 'departmentAdmin') && rule.departments?.length) return `${scopeLabel} · ${rule.departments.join(' / ')}`;
  if ((rule.scope === 'users' || rule.scope === 'owner') && rule.users?.length) {
    const userMap = new Map(getUserDirectory(snapshot).map((item) => [item.userId, item.name]));
    return `${scopeLabel} · ${rule.users.map((userId) => userMap.get(userId) || userId).join(' / ')}`;
  }
  return scopeLabel;
}
function cloneRule(rule = {}) { return { scope: rule.scope || 'all', departments: [...(rule.departments || [])], users: [...(rule.users || [])] }; }
function ensureGovernancePanel() {
  let panel = document.querySelector('#toolGovernancePanel');
  if (!panel) {
    panel = document.createElement('article');
    panel.id = 'toolGovernancePanel';
    panel.className = 'panel wide tool-governance-panel';
    panel.innerHTML = `<div class="panel-head"><div><p class="card-kicker">部门工具治理</p><h3>控制哪些人可见、可下载、可管理各部门自研工具</h3></div><span class="badge" id="toolGovernanceBadge">工具策略</span></div><div class="tool-governance-grid"><div class="tool-governance-list" id="toolGovernanceList"></div><div class="tool-governance-detail" id="toolGovernanceDetail"></div></div>`;
    if (linkedPanel) linkedPanel.insertAdjacentElement('afterend', panel);
    else dashboardGrid?.prepend(panel);
  }
  return panel;
}
function ensureSelection(tools) {
  if (!tools.length) { selectedToolId = ''; policyDraft = null; return null; }
  const tool = tools.find((item) => item.toolId === selectedToolId) || tools[0];
  if (tool.toolId !== selectedToolId || !policyDraft) {
    selectedToolId = tool.toolId;
    policyDraft = { visibility: cloneRule(tool.visibility), download: cloneRule(tool.download), management: cloneRule(tool.management) };
  }
  return tool;
}
function setRuleScope(ruleKey, scope, currentTool) {
  const draft = policyDraft[ruleKey];
  draft.scope = scope;
  if (scope === 'department' || scope === 'departmentAdmin') { draft.departments = draft.departments.length ? [draft.departments[0]] : [currentTool.department]; draft.users = []; return; }
  if (scope === 'users') { draft.users = draft.users.length ? draft.users : [adminProfile.userId]; draft.departments = []; return; }
  if (scope === 'owner') { draft.users = draft.users.length ? [draft.users[0]] : [currentTool.ownerId]; draft.departments = []; return; }
  draft.departments = [];
  draft.users = [];
}
function toggleDepartment(ruleKey, department) { policyDraft[ruleKey].departments = [department]; }
function toggleUser(ruleKey, userId, single = false) {
  const nextUsers = new Set(policyDraft[ruleKey].users || []);
  if (single) { policyDraft[ruleKey].users = [userId]; return; }
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
function renderScopeButtons(ruleKey) { return scopeOptions[ruleKey].map((scope) => `<button class="scope-chip ${policyDraft[ruleKey].scope === scope ? 'is-active' : ''}" type="button" data-rule-scope="${ruleKey}" data-scope="${scope}">${scopeActionLabels[ruleKey][scope]}</button>`).join(''); }
function renderTargetSelector(ruleKey, snapshot, currentTool) {
  const draft = policyDraft[ruleKey];
  if (draft.scope === 'department' || draft.scope === 'departmentAdmin') {
    return `<div class="governance-target-block"><span class="governance-target-label">限定部门</span><div class="governance-target-row">${getDepartments(snapshot).map((department) => `<button class="target-chip ${draft.departments.includes(department) ? 'is-active' : ''}" type="button" data-rule-department="${ruleKey}" data-department="${department}">${department}</button>`).join('')}</div></div>`;
  }
  if (draft.scope === 'users' || draft.scope === 'owner') {
    return `<div class="governance-target-block"><span class="governance-target-label">${draft.scope === 'owner' ? '指定责任人' : '限定个人'}</span><div class="governance-target-row">${getUserDirectory(snapshot).map((user) => `<button class="target-chip ${draft.users.includes(user.userId) ? 'is-active' : ''}" type="button" data-rule-user="${ruleKey}" data-user-id="${user.userId}">${user.name} / ${user.department}</button>`).join('')}</div></div>`;
  }
  return '<p class="governance-helper">当前范围无需额外指定对象，保存后会立即同步到用户端和移动端。</p>';
}
function bindGovernanceEvents() {
  document.querySelectorAll('[data-tool-select]').forEach((button) => button.addEventListener('click', () => { selectedToolId = button.dataset.toolSelect || ''; policyDraft = null; renderToolGovernance(); }));
  document.querySelectorAll('[data-rule-scope]').forEach((button) => button.addEventListener('click', () => { const currentTool = flowStore.read().tools[selectedToolId]; if (!currentTool) return; setRuleScope(button.dataset.ruleScope, button.dataset.scope, currentTool); renderToolGovernance(); }));
  document.querySelectorAll('[data-rule-department]').forEach((button) => button.addEventListener('click', () => { toggleDepartment(button.dataset.ruleDepartment, button.dataset.department); renderToolGovernance(); }));
  document.querySelectorAll('[data-rule-user]').forEach((button) => button.addEventListener('click', () => { const ruleKey = button.dataset.ruleUser; toggleUser(ruleKey, button.dataset.userId, policyDraft[ruleKey].scope === 'owner'); renderToolGovernance(); }));
  document.querySelector('#resetPolicyBtn')?.addEventListener('click', () => { const currentTool = flowStore.read().tools[selectedToolId]; if (!currentTool) return; policyDraft = { visibility: cloneRule(currentTool.visibility), download: cloneRule(currentTool.download), management: cloneRule(currentTool.management) }; renderToolGovernance(); });
  document.querySelector('#savePolicyBtn')?.addEventListener('click', () => { const currentTool = flowStore.read().tools[selectedToolId]; if (!currentTool) return; flowStore.updateTool(selectedToolId, { visibility: normalizeRule('visibility', currentTool), download: normalizeRule('download', currentTool), management: normalizeRule('management', currentTool) }, { role: 'admin', channel: 'desktop', action: `更新 ${currentTool.name} 的工具权限策略` }); policyDraft = null; });
}
function renderToolGovernance() {
  const panel = ensureGovernancePanel();
  const snapshot = flowStore.read();
  const tools = flowStore.listManageableTools(adminProfile, snapshot);
  const summary = flowStore.summarize(snapshot);
  const currentTool = ensureSelection(tools);
  panel.querySelector('#toolGovernanceBadge').textContent = `${tools.length} 个可管理工具`;
  const listContainer = panel.querySelector('#toolGovernanceList');
  const detailContainer = panel.querySelector('#toolGovernanceDetail');
  if (!tools.length || !currentTool || !policyDraft) {
    listContainer.innerHTML = '<article class="tool-queue-card"><strong>暂无可管理工具</strong><p>当前角色没有可管理的部门工具，或还未接入工具资产。</p></article>';
    detailContainer.innerHTML = '<article class="tool-detail-card"><strong>等待接入</strong><p>工具上架后，可在此控制可见、下载和管理权限。</p></article>';
    return;
  }
  listContainer.innerHTML = `<div class="tool-governance-summary"><span class="tag-pill">已上架工具 ${summary.toolCount}</span><span class="tag-pill">累计下载 ${summary.totalToolDownloads}</span><span class="tag-pill">当前管理员 ${adminProfile.name}</span></div><div class="tool-queue-list">${tools.map((tool) => `<button class="tool-queue-card ${tool.toolId === currentTool.toolId ? 'is-active' : ''}" type="button" data-tool-select="${tool.toolId}"><div class="tool-queue-top"><strong>${tool.name}</strong><span class="badge ${tool.toolId === currentTool.toolId ? '' : 'warning'}">${tool.status}</span></div><p>${tool.department} · ${tool.type} · ${tool.version}</p><div class="tool-queue-meta"><span>可见：${formatRule(tool.visibility, snapshot)}</span><span>下载：${formatRule(tool.download, snapshot)}</span><span>累计下载 ${tool.downloads} 次</span></div></button>`).join('')}</div>`;
  detailContainer.innerHTML = `<article class="tool-detail-card"><div class="tool-detail-head"><div><p class="card-kicker">当前选中工具</p><h3>${currentTool.name}</h3><p>${currentTool.summary}</p></div><div class="tool-detail-tags"><span class="tag-pill">${currentTool.department}</span><span class="tag-pill">${currentTool.type}</span><span class="tag-pill">${currentTool.fileName}</span></div></div><div class="tool-overview-grid"><article class="tool-overview-item"><span>版本</span><strong>${currentTool.version}</strong></article><article class="tool-overview-item"><span>工具负责人</span><strong>${currentTool.owner}</strong></article><article class="tool-overview-item"><span>下载次数</span><strong>${currentTool.downloads}</strong></article><article class="tool-overview-item"><span>最近更新</span><strong>${currentTool.updatedAt}</strong></article></div><div class="policy-grid">${['visibility', 'download', 'management'].map((ruleKey) => `<section class="policy-card"><div class="policy-card-head"><div><p class="card-kicker">${ruleTitles[ruleKey]}</p><h4>${formatRule(policyDraft[ruleKey], snapshot)}</h4></div></div><div class="scope-chip-row">${renderScopeButtons(ruleKey)}</div>${renderTargetSelector(ruleKey, snapshot, currentTool)}</section>`).join('')}</div><div class="tool-governance-actions"><p class="governance-footnote">保存后，用户桌面端和移动端会立即同步展示新的可见与下载权限；管理员端将保留审计动作。</p><div class="hero-actions"><button class="button secondary" id="resetPolicyBtn" type="button">恢复当前配置</button><button class="button" id="savePolicyBtn" type="button">保存权限策略</button></div></div></article>`;
  bindGovernanceEvents();
}
function renderDashboard() {
  const snapshot = flowStore.read();
  const summary = flowStore.summarize(snapshot);
  const activeFlow = summary.activeFlow;
  metricTokens.textContent = formatTokens(baseMetrics.tokens + summary.tokenDelta);
  metricTokensHint.textContent = `共享任务额外带来 ${formatTokens(summary.tokenDelta)} tokens 消耗`;
  metricCost.textContent = formatCurrency(baseMetrics.cost + summary.costDelta);
  metricCostHint.textContent = `共享任务额外带来 ${formatCurrency(summary.costDelta)} 的推理成本`;
  metricUsers.textContent = String(baseMetrics.users + summary.runningCount + summary.waitingCount);
  metricUsersHint.textContent = `覆盖 9 个部门，当前已上架 ${summary.toolCount} 个部门工具`;
  metricApprovals.textContent = String(baseMetrics.approvals + summary.pendingApprovals);
  metricApprovalsHint.textContent = `共享任务中额外有 ${summary.pendingApprovals} 个审批或确认动作`;
  metricAgents.textContent = String(baseMetrics.agents + Math.min(summary.runningCount, 3));
  metricAgentsHint.textContent = `${summary.runningCount} 个共享任务正在调用流程型智能体`;
  metricHitRate.textContent = `${Math.max(82, baseMetrics.hitRate - Math.max(0, summary.waitingCount - 1))}%`;
  metricHitRateHint.textContent = activeFlow ? `${activeFlow.label} 当前为重点关注场景` : '采购、制度场景最佳';
  sharedTaskTitle.textContent = activeFlow ? `${activeFlow.label}正在跨角色联动` : '当前共享任务';
  sharedTaskText.textContent = activeFlow ? `${activeFlow.summary} 最近更新于 ${activeFlow.updatedAt}，来源为 ${activeFlow.channel || '未标记'} / ${activeFlow.role || '未标记'}。` : '用户端发起的任务会同步到管理员视角。';
  sharedTaskBadge.textContent = `${summary.waitingCount} 个待确认 / ${summary.runningCount} 个处理中`;
  sharedTaskMeta.innerHTML = [`<span class="tag-pill">当前状态：${flowStore.statusLabels[activeFlow.status] || activeFlow.status}</span>`, `<span class="tag-pill">共享审批：${summary.pendingApprovals}</span>`, `<span class="tag-pill">工具下载：${summary.totalToolDownloads}</span>`, summary.latestAudit ? `<span class="tag-pill">最近动作：${summary.latestAudit.action}</span>` : ''].join('');
  sharedTaskList.innerHTML = buildSharedItems(snapshot).map((flow) => `<article class="stack-item"><strong>${flow.label}</strong><p>${flow.summary}</p></article>`).join('');
  adminUserLink.href = `../demo-a-c/?scenario=${snapshot.activeScenario}&scene=landing`;
  adminMobileUserLink.href = `../demo-mobile/?role=user&scenario=${snapshot.activeScenario}`;
  adminMobileAdminLink.href = `../demo-mobile/?role=admin&scenario=${snapshot.activeScenario}`;
  const modelItems = [[`${activeFlow.label} / workflow-router`, `当前共享任务已同步到 ${activeFlow.channel || '桌面'} 端，由 ${activeFlow.role || '用户'} 角色触发。`], ...staticModels].slice(0, 4);
  const approvalItems = buildSharedItems(snapshot).filter((flow) => flow.approvalCount > 0).map((flow) => [`${flow.label}待跟进`, `${flow.summary} 当前共有 ${flow.approvalCount} 个需要管理员关注的审批或确认动作。`]).concat(staticApprovals).slice(0, 4);
  const alertItems = [];
  if (summary.tokenDelta > 180000) alertItems.push(['共享流量升高', '跨端联动任务累计 tokens 增量较高，建议关注批量生成与重复执行。']);
  if (buildSharedItems(snapshot).some((flow) => flow.scenarioId === 'access' && flow.status !== 'idle')) alertItems.push(['权限类任务触发', '当前存在权限开通相关任务，需继续关注最小权限与敏感仓库策略。']);
  if (buildSharedItems(snapshot).some((flow) => flow.scenarioId === 'procurement' && flow.status !== 'idle')) alertItems.push(['采购链路活跃', '采购任务已进入共享流转，建议同步关注预算说明和审批积压。']);
  renderList(modelList, modelItems);
  renderList(approvalList, approvalItems);
  renderList(alertList, alertItems.concat(staticAlerts).slice(0, 4));
  renderToolGovernance();
}
departmentGrid.innerHTML = departments.map(([title, desc]) => `<article class="department-card"><strong>${title}</strong><p>${desc}</p></article>`).join('');
flowStore.recordEvent({ scenarioId: urlParams.get('scenario') || flowStore.read().activeScenario, role: 'admin', channel: 'desktop', action: '打开管理员控制台' });
renderDashboard();
flowStore.subscribe(renderDashboard);
