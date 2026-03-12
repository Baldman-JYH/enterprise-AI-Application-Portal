const flowStore = window.EnterpriseAIDemoFlow;
const mobilePresets = {
  meeting: { label: '预定会议', status: 'waiting', prompt: '帮我安排明天下午和采购部的项目评审会议，并生成议程。', title: 'AI 已识别为会议安排任务', text: '系统将自动查询参会人空闲时间、会议室资源，并在关键节点前提示用户确认。' },
  policy: { label: '查制度', status: 'done', prompt: '帮我总结最新采购制度的关键变化，并告诉我下一步怎么做。', title: 'AI 已识别为制度问答任务', text: '系统将从制度知识库检索最新版条款、生成差异摘要，并输出给业务侧可执行的建议。' },
  travel: { label: '差旅预定', status: 'waiting', prompt: '帮我安排下周去上海出差的机票和酒店，并准备差旅申请。', title: 'AI 已识别为差旅执行任务', text: '系统将结合差旅制度、协议酒店和审批链，自动生成差旅申请与行程建议。' },
  report: { label: '生成周报', status: 'done', prompt: '帮我生成本周项目周报，并提炼风险和下周计划。', title: 'AI 已识别为周报生成任务', text: '系统将汇总项目空间、任务系统和历史周报，自动输出适合管理层查看的简版结果。' }
};
const adminModelBase = [['gpt-4.1', '今日 42% 调用占比，主要用于制度问答和周报生成。'], ['internal-rag-agent', '今日 31% 调用占比，主要用于知识库检索和引用定位。'], ['workflow-router', '负责会议、采购、权限等流程分发与工具选择。']];
const adminAlertBase = [['Token 异常增长', '采购与报告场景在 14:00-15:00 出现峰值，需要关注批量调用。'], ['审批积压', '当前有 7 个高优先级待审批任务，其中 3 个与采购相关。'], ['权限风险提醒', '2 个开通工单触发敏感仓库访问规则，需管理员复核。']];
const scenarioMetrics = { meeting: { tokens: 42000, cost: 86 }, policy: { tokens: 24000, cost: 42 }, travel: { tokens: 47000, cost: 118 }, report: { tokens: 36000, cost: 74 } };
const toolUserMap = { lx: 'LX', zhoumin: '周敏', lina: '李娜', chenhao: '陈灏', liujia: '刘嘉' };
const mobileUserProfile = { ...flowStore.profiles.mobileUser, channel: 'mobile' };
const mobileAdminProfile = { ...flowStore.profiles.mobileAdmin, channel: 'mobile' };
const roleButtons = document.querySelectorAll('[data-role]');
const heroTitle = document.querySelector('#heroTitle');
const heroText = document.querySelector('#heroText');
const mobilePromptLabel = document.querySelector('#mobilePromptLabel');
const mobilePrompt = document.querySelector('#mobilePrompt');
const runActionBtn = document.querySelector('#runActionBtn');
const quickChips = document.querySelector('#quickChips');
const userView = document.querySelector('#userView');
const adminView = document.querySelector('#adminView');
const userResultTitle = document.querySelector('#userResultTitle');
const userResultText = document.querySelector('#userResultText');
const userTaskList = document.querySelector('#userTaskList');
const userPendingList = document.querySelector('#userPendingList');
const adminModelList = document.querySelector('#adminModelList');
const adminAlertList = document.querySelector('#adminAlertList');
const sharedFlowTitle = document.querySelector('#sharedFlowTitle');
const sharedFlowText = document.querySelector('#sharedFlowText');
const sharedFlowMeta = document.querySelector('#sharedFlowMeta');
const continueDesktopLink = document.querySelector('#continueDesktopLink');
const continueAdminLink = document.querySelector('#continueAdminLink');
const mobileMetricTokens = document.querySelector('#mobileMetricTokens');
const mobileMetricCost = document.querySelector('#mobileMetricCost');
const mobileMetricApprovals = document.querySelector('#mobileMetricApprovals');
const mobileMetricAgents = document.querySelector('#mobileMetricAgents');
const urlParams = new URLSearchParams(window.location.search);
let currentRole = urlParams.get('role') === 'admin' ? 'admin' : 'user';
let currentPreset = urlParams.get('scenario') && mobilePresets[urlParams.get('scenario')] ? urlParams.get('scenario') : 'meeting';
function formatTokens(value) { if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`; if (value >= 1000) return `${(value / 1000).toFixed(1)}K`; return String(value); }
function formatCurrency(value) { return `¥ ${value.toLocaleString('zh-CN')}`; }
function renderList(container, items) { container.innerHTML = items.map(([title, desc]) => `<article class="list-item"><strong>${title}</strong><span>${desc}</span></article>`).join(''); }
function inferPreset(text) { const content = text || ''; if (content.includes('制度')) return 'policy'; if (content.includes('差旅') || content.includes('酒店') || content.includes('机票')) return 'travel'; if (content.includes('周报') || content.includes('风险')) return 'report'; return 'meeting'; }
function formatRule(rule = {}) {
  const scopeLabel = flowStore.scopeLabels[rule.scope] || '未配置';
  if ((rule.scope === 'department' || rule.scope === 'departmentAdmin') && rule.departments?.length) return `${scopeLabel} · ${rule.departments.join(' / ')}`;
  if ((rule.scope === 'users' || rule.scope === 'owner') && rule.users?.length) return `${scopeLabel} · ${rule.users.map((userId) => toolUserMap[userId] || userId).join(' / ')}`;
  return scopeLabel;
}
function ensureMobileToolCards() {
  let userCard = document.querySelector('#mobileToolUserCard');
  if (!userCard) { userCard = document.createElement('article'); userCard.id = 'mobileToolUserCard'; userCard.className = 'glass-card'; userView.appendChild(userCard); }
  let adminCard = document.querySelector('#mobileToolAdminCard');
  if (!adminCard) { adminCard = document.createElement('article'); adminCard.id = 'mobileToolAdminCard'; adminCard.className = 'glass-card'; adminView.appendChild(adminCard); }
  return { userCard, adminCard };
}
function renderMobileToolCards(snapshot) {
  const { userCard, adminCard } = ensureMobileToolCards();
  const visibleTools = flowStore.listVisibleTools(mobileUserProfile, snapshot);
  const manageableTools = flowStore.listManageableTools(mobileAdminProfile, snapshot);
  const summary = flowStore.summarize(snapshot);
  userCard.innerHTML = `<p class="card-kicker">我的部门工具</p><h3>手机上也能查看自己有权限使用的小工具</h3><div class="tool-mobile-list">${visibleTools.map((tool) => { const canDownload = flowStore.canDownloadTool(tool, mobileUserProfile); return `<article class="tool-mobile-item"><div class="tool-mobile-top"><strong>${tool.name}</strong><span class="tool-mobile-pill ${canDownload ? 'is-allowed' : ''}">${canDownload ? '可下载' : '仅查看'}</span></div><p>${tool.summary}</p><div class="tool-mobile-meta"><span>${tool.department}</span><span>${tool.type}</span><span>${tool.version}</span></div><div class="tool-mobile-action-row"><span class="tool-mobile-caption">可见：${formatRule(tool.visibility)} · 下载：${formatRule(tool.download)}</span>${canDownload ? `<button class="mini-btn" type="button" data-mobile-download="${tool.toolId}">记录下载</button>` : '<span class="tool-mobile-note">仅可查看</span>'}</div></article>`; }).join('')}</div>`;
  adminCard.innerHTML = `<p class="card-kicker">工具权限摘要</p><h3>移动端可快速查看工具上架与授权状态</h3><div class="tool-mobile-summary"><span class="meta-pill">可管理工具 ${manageableTools.length}</span><span class="meta-pill">已上架 ${summary.toolCount}</span><span class="meta-pill">下载总量 ${summary.totalToolDownloads}</span></div><div class="tool-mobile-list admin-list">${manageableTools.map((tool) => `<article class="tool-mobile-item compact"><div class="tool-mobile-top"><strong>${tool.name}</strong><span class="tool-mobile-pill is-admin">${tool.status}</span></div><div class="tool-mobile-meta"><span>${tool.department}</span><span>${tool.type}</span></div><div class="tool-mobile-rules"><span>可见：${formatRule(tool.visibility)}</span><span>下载：${formatRule(tool.download)}</span><span>管理：${formatRule(tool.management)}</span></div></article>`).join('')}</div><p class="tool-mobile-footnote">需要修改工具权限时，请切到桌面端管理员控制台保存策略。</p>`;
  userCard.querySelectorAll('[data-mobile-download]').forEach((button) => button.addEventListener('click', () => flowStore.recordToolDownload(button.dataset.mobileDownload, mobileUserProfile)));
}
function renderPreset(key) {
  currentPreset = key;
  const preset = mobilePresets[key];
  mobilePrompt.value = preset.prompt;
  userResultTitle.textContent = preset.title;
  userResultText.textContent = preset.text;
  urlParams.set('scenario', currentPreset);
  window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
  renderSharedFlow();
}
function syncRole() {
  roleButtons.forEach((button) => { button.classList.toggle('is-active', button.dataset.role === currentRole); });
  userView.classList.toggle('is-hidden', currentRole !== 'user');
  adminView.classList.toggle('is-hidden', currentRole !== 'admin');
  if (currentRole === 'admin') {
    heroTitle.textContent = '管理员可在手机端快速查看 AI 平台运行状态。';
    heroText.textContent = '包括 tokens、模型调用、审批积压、活跃智能体，以及部门工具的授权与下载摘要。';
    mobilePromptLabel.textContent = '移动端联动查询';
    runActionBtn.textContent = '查看联动状态';
  } else {
    heroTitle.textContent = '在手机上也能直接发起企业工作请求。';
    heroText.textContent = '统一入口承接会议、制度、差旅、权限、采购等工作场景，再由内部智能体分流执行。';
    mobilePromptLabel.textContent = '移动端工作请求';
    runActionBtn.textContent = '开始处理';
  }
  urlParams.set('role', currentRole);
  window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
}
function renderSharedFlow() {
  const snapshot = flowStore.read();
  const summary = flowStore.summarize(snapshot);
  const activeFlow = snapshot.flows[currentPreset] || summary.activeFlow;
  sharedFlowTitle.textContent = `${activeFlow.label}已同步到移动端`;
  sharedFlowText.textContent = `${activeFlow.summary} 最近更新于 ${activeFlow.updatedAt}，可以在手机端继续查看状态，或切到管理员视角查看治理信息。`;
  sharedFlowMeta.innerHTML = [`<span class="meta-pill">当前状态：${flowStore.statusLabels[activeFlow.status] || activeFlow.status}</span>`, `<span class="meta-pill">待审批：${summary.pendingApprovals}</span>`, `<span class="meta-pill">工具下载：${summary.totalToolDownloads}</span>`].join('');
  continueDesktopLink.href = `../demo-balanced-workspace/?scenario=${activeFlow.scenarioId}&scene=landing`;
  continueAdminLink.href = `../demo-admin-console/?scenario=${activeFlow.scenarioId}&scene=landing`;
  const sharedTasks = Object.values(snapshot.flows).filter((flow) => flow.status !== 'idle').slice(0, 3).map((flow) => [flow.label, flow.summary]);
  const sharedPending = Object.values(snapshot.flows).filter((flow) => flow.approvalCount > 0).map((flow) => [flow.label, `${flow.summary} 当前有 ${flow.approvalCount} 个待确认或待审批动作。`]);
  renderList(userTaskList, sharedTasks.length ? sharedTasks : [['暂无共享任务', '当前没有跨端同步的任务。']]);
  renderList(userPendingList, sharedPending.length ? sharedPending : [['暂无待确认', '当前没有额外待确认或审批动作。']]);
  mobileMetricTokens.textContent = formatTokens(1820000 + summary.tokenDelta);
  mobileMetricCost.textContent = formatCurrency(3240 + summary.costDelta);
  mobileMetricApprovals.textContent = String(7 + summary.pendingApprovals);
  mobileMetricAgents.textContent = String(14 + Math.min(summary.runningCount, 3));
  const adminModels = [[`${activeFlow.label} / workflow-router`, `当前共享任务由 ${activeFlow.channel || 'desktop'} 端 / ${activeFlow.role || 'user'} 角色触发。`], ...adminModelBase].slice(0, 3);
  const adminAlerts = [];
  if (summary.pendingApprovals > 0) adminAlerts.push(['共享审批任务', `当前共有 ${summary.pendingApprovals} 个共享审批或确认动作需要关注。`]);
  if (summary.tokenDelta > 160000) adminAlerts.push(['共享流量升高', '跨端联动任务的累计 tokens 增量偏高，建议关注批量生成行为。']);
  renderList(adminModelList, adminModels);
  renderList(adminAlertList, adminAlerts.concat(adminAlertBase).slice(0, 3));
  renderMobileToolCards(snapshot);
}
roleButtons.forEach((button) => button.addEventListener('click', () => { currentRole = button.dataset.role; syncRole(); flowStore.recordEvent({ scenarioId: currentPreset, role: currentRole, channel: 'mobile', action: currentRole === 'admin' ? '切换到移动端管理员视角' : '切换到移动端用户视角' }); renderSharedFlow(); }));
quickChips.innerHTML = Object.entries(mobilePresets).map(([key, item]) => `<button class="quick-chip" data-preset="${key}">${item.label}</button>`).join('');
document.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click', () => renderPreset(button.dataset.preset)));
runActionBtn.addEventListener('click', () => {
  const presetKey = inferPreset(mobilePrompt.value);
  renderPreset(presetKey);
  const preset = mobilePresets[presetKey];
  if (currentRole === 'admin') {
    flowStore.recordEvent({ scenarioId: presetKey, role: 'admin', channel: 'mobile', action: '在移动端查看联动状态' });
    renderSharedFlow();
    return;
  }
  const metric = scenarioMetrics[presetKey] || { tokens: 26000, cost: 50 };
  flowStore.upsertTask({ scenarioId: presetKey, status: preset.status, prompt: mobilePrompt.value, summary: preset.status === 'done' ? `${preset.label}结果已同步到移动端。` : `${preset.label}方案已同步到移动端，等待继续处理。`, channel: 'mobile', role: 'user', approvalCount: preset.status === 'waiting' ? 1 : 0, tokensDelta: metric.tokens, costDelta: metric.cost, action: '移动端发起或继续任务' });
  renderSharedFlow();
});
flowStore.subscribe(renderSharedFlow);
flowStore.recordEvent({ scenarioId: currentPreset, role: currentRole, channel: 'mobile', action: '打开移动端' });
renderPreset(currentPreset);
syncRole();
renderSharedFlow();

