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
const urlParams = new URLSearchParams(window.location.search);
function formatTokens(value) { if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`; if (value >= 1000) return `${(value / 1000).toFixed(1)}K`; return String(value); }
function formatCurrency(value) { return `¥ ${value.toLocaleString('zh-CN')}`; }
function renderList(container, items) { container.innerHTML = items.map(([title, desc]) => `<article class="stack-item"><strong>${title}</strong><p>${desc}</p></article>`).join(''); }
function buildSharedItems(snapshot) { return Object.values(snapshot.flows).filter((flow) => flow.status !== 'idle').sort((left, right) => ({ waiting: 0, running: 1, done: 2, idle: 3 }[left.status] - { waiting: 0, running: 1, done: 2, idle: 3 }[right.status])); }
function renderDashboard() {
  const snapshot = flowStore.read();
  const summary = flowStore.summarize(snapshot);
  const activeFlow = summary.activeFlow;
  metricTokens.textContent = formatTokens(baseMetrics.tokens + summary.tokenDelta);
  metricTokensHint.textContent = `共享任务额外带来 ${formatTokens(summary.tokenDelta)} tokens 消耗`;
  metricCost.textContent = formatCurrency(baseMetrics.cost + summary.costDelta);
  metricCostHint.textContent = `共享任务额外带来 ${formatCurrency(summary.costDelta)} 的推理成本`;
  metricUsers.textContent = String(baseMetrics.users + summary.runningCount + summary.waitingCount);
  metricUsersHint.textContent = `当前有 ${summary.runningCount + summary.waitingCount} 个任务处于活跃协作状态`;
  metricApprovals.textContent = String(baseMetrics.approvals + summary.pendingApprovals);
  metricApprovalsHint.textContent = `共享任务中额外有 ${summary.pendingApprovals} 个审批或确认动作`;
  metricAgents.textContent = String(baseMetrics.agents + Math.min(summary.runningCount, 3));
  metricAgentsHint.textContent = `${summary.runningCount} 个共享任务正在调用流程型智能体`;
  metricHitRate.textContent = `${Math.max(82, baseMetrics.hitRate - Math.max(0, summary.waitingCount - 1))}%`;
  metricHitRateHint.textContent = activeFlow ? `${activeFlow.label} 当前为重点关注场景` : '采购、制度场景最佳';
  sharedTaskTitle.textContent = activeFlow ? `${activeFlow.label}正在跨角色联动` : '当前共享任务';
  sharedTaskText.textContent = activeFlow ? `${activeFlow.summary} 最近更新于 ${activeFlow.updatedAt}，来源为 ${activeFlow.channel || '未标记'} / ${activeFlow.role || '未标记'}。` : '用户端发起的任务会同步到管理员视角。';
  sharedTaskBadge.textContent = `${summary.waitingCount} 个待确认 / ${summary.runningCount} 个处理中`;
  sharedTaskMeta.innerHTML = [`<span class="tag-pill">当前状态：${flowStore.statusLabels[activeFlow.status] || activeFlow.status}</span>`,`<span class="tag-pill">共享审批：${summary.pendingApprovals}</span>`,summary.latestAudit ? `<span class="tag-pill">最近动作：${summary.latestAudit.action}</span>` : ''].join('');
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
}
departmentGrid.innerHTML = departments.map(([title, desc]) => `<article class="department-card"><strong>${title}</strong><p>${desc}</p></article>`).join('');
flowStore.recordEvent({ scenarioId: urlParams.get('scenario') || flowStore.read().activeScenario, role: 'admin', channel: 'desktop', action: '打开管理员控制台' });
renderDashboard();
flowStore.subscribe(renderDashboard);
