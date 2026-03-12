const flowStore = window.EnterpriseAIDemoFlow;
const chatStore = window.EnterpriseAIDemoChat;
const userProfile = { ...(flowStore?.profiles?.desktopUser || { userId: 'lx', name: 'LX', department: '供应链计划部' }), channel: 'desktop' };
const sentimentMailbox = chatStore?.mailbox || 'ai-feedback@enterprise.local';

const scenarioMeta = {
  meeting: {
    label: '预定会议',
    prompt: '帮我预定明天下午的项目评审会议，并生成议程。',
    startReply: '已开始核对参会人时间、会议室资源和会议议程。',
    waitReply: '会议方案已生成，请确认时间、地点和参会人。',
    doneReply: '会议已创建，邀请和议程已同步完成。',
    requiresConfirmation: true,
    summaries: {
      idle: '可从统一入口直接发起会议安排。',
      running: '正在整理会议时间、会议室和议程。',
      waiting: '会议方案已准备完成，等待确认。',
      done: '会议安排已完成。'
    },
    steps: ['识别需求', '生成方案', '关键确认', '执行完成']
  },
  procurement: {
    label: '发起采购',
    prompt: '帮我发起一笔办公用品采购申请，并补预算说明。',
    startReply: '已开始整理采购清单、预算说明和审批链。',
    waitReply: '采购方案已生成，请确认后提交审批。',
    doneReply: '采购申请已提交，预算说明已同步到审批单。',
    requiresConfirmation: true,
    summaries: {
      idle: '可直接发起采购申请。',
      running: '正在整理采购清单和预算说明。',
      waiting: '采购申请已准备完成，等待确认。',
      done: '采购申请已进入审批流。'
    },
    steps: ['识别需求', '生成方案', '关键确认', '执行完成']
  },
  report: {
    label: '生成周报',
    prompt: '帮我生成本周项目周报，并提炼风险和下周计划。',
    startReply: '已开始汇总项目进展、风险和下周计划。',
    waitReply: '周报草稿已生成，请确认后发送。',
    doneReply: '周报草稿已生成，并可继续导出邮件版本。',
    requiresConfirmation: true,
    summaries: {
      idle: '可直接生成周报草稿。',
      running: '正在整理周报正文和风险摘要。',
      waiting: '周报草稿已生成，等待确认。',
      done: '周报内容已生成。'
    },
    steps: ['汇总数据', '生成草稿', '关键确认', '执行完成']
  },
  policy: {
    label: '查制度',
    prompt: '总结一下最新采购制度的变化。',
    startReply: '已开始检索最新版制度并比对历史版本。',
    waitReply: '制度摘要已生成。',
    doneReply: '制度变化和下一步建议已整理完成。',
    requiresConfirmation: false,
    summaries: {
      idle: '可直接检索制度和知识库内容。',
      running: '正在检索制度条款并生成摘要。',
      waiting: '制度摘要已生成。',
      done: '制度摘要已返回。'
    },
    steps: ['检索知识', '生成摘要', '结果整理', '返回结果']
  },
  travel: {
    label: '差旅预定',
    prompt: '帮我安排下周去上海出差的机票和酒店。',
    startReply: '已开始匹配机票、酒店和差旅政策。',
    waitReply: '差旅方案已生成，请确认行程和预算。',
    doneReply: '差旅申请已提交，机酒资源已预占。',
    requiresConfirmation: true,
    summaries: {
      idle: '可直接发起差旅安排。',
      running: '正在匹配合规的机酒组合。',
      waiting: '差旅方案已准备完成，等待确认。',
      done: '差旅申请已进入后续流转。'
    },
    steps: ['识别行程', '匹配方案', '关键确认', '执行完成']
  },
  access: {
    label: '开通权限',
    prompt: '帮新同事申请开通 VPN、GitLab 和项目空间权限。',
    startReply: '已开始匹配权限模板和 IT 工单内容。',
    waitReply: '权限方案已生成，请确认后提交。',
    doneReply: '权限工单已创建，并进入审批处理。',
    requiresConfirmation: true,
    summaries: {
      idle: '可直接发起权限开通。',
      running: '正在匹配岗位模板和系统权限。',
      waiting: '权限方案已准备完成，等待确认。',
      done: '权限工单已提交。'
    },
    steps: ['匹配模板', '生成方案', '关键确认', '执行完成']
  }
};

const statusText = { idle: '可发起', running: '处理中', waiting: '待确认', done: '已完成' };
const promptInput = document.querySelector('#mainPrompt');
const quickActionList = document.querySelector('#quickActionList');
const startTaskBtn = document.querySelector('#startTaskBtn');
const newChatBtn = document.querySelector('#newChatBtn');
const threadList = document.querySelector('#threadList');
const threadCount = document.querySelector('#threadCount');
const messageList = document.querySelector('#messageList');
const messageCount = document.querySelector('#messageCount');
const statusTitle = document.querySelector('#statusTitle');
const statusBadge = document.querySelector('#statusBadge');
const statusSummary = document.querySelector('#statusSummary');
const statusMeta = document.querySelector('#statusMeta');
const statusSteps = document.querySelector('#statusSteps');
const advanceBtn = document.querySelector('#advanceBtn');
const confirmBtn = document.querySelector('#confirmBtn');
const toolCount = document.querySelector('#toolCount');
const toolList = document.querySelector('#toolList');
const toolFeedback = document.querySelector('#toolFeedback');

const state = {
  currentScenario: flowStore?.read()?.activeScenario || 'meeting',
  currentThreadId: chatStore?.read()?.currentThreadId || ''
};

function thumbUpIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 10v10M11 21h6.6a2 2 0 0 0 2-1.67l1.2-7A2 2 0 0 0 18.82 10H14l.62-3.12A2.5 2.5 0 0 0 12.17 4L7 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 10H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function thumbDownIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 14V4M11 3H17.6a2 2 0 0 1 2 1.67l1.2 7A2 2 0 0 1 18.82 14H14l.62 3.12A2.5 2.5 0 0 1 12.17 20L7 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 14H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function getScenarioMeta(scenarioId) {
  return scenarioMeta[scenarioId] || scenarioMeta.meeting;
}

function inferScenario(prompt) {
  const text = prompt.trim();
  if (!text) return state.currentScenario;
  if (/会议|议程|邀请/.test(text)) return 'meeting';
  if (/采购|预算|供应商/.test(text)) return 'procurement';
  if (/周报|汇报|计划/.test(text)) return 'report';
  if (/制度|规则|流程说明/.test(text)) return 'policy';
  if (/差旅|机票|酒店/.test(text)) return 'travel';
  if (/权限|账号|VPN|GitLab/.test(text)) return 'access';
  return state.currentScenario;
}

function getCurrentThread(snapshot = chatStore.read()) {
  return snapshot.threads.find((thread) => thread.threadId === state.currentThreadId) || null;
}

function getCurrentStatus(thread) {
  if (thread?.status) return thread.status;
  const flow = flowStore?.read()?.flows?.[state.currentScenario];
  return flow?.status || 'idle';
}

function getStepState(status, index, requiresConfirmation) {
  if (status === 'done') return 'is-done';
  if (status === 'waiting') {
    if (index < 2) return 'is-done';
    if (index === 2) return 'is-active';
    return '';
  }
  if (status === 'running') {
    if (index === 0) return 'is-done';
    if (index === 1) return 'is-active';
    return '';
  }
  if (!requiresConfirmation && status === 'done' && index === 2) return 'is-done';
  return index === 0 ? 'is-active' : '';
}

function renderQuickActions() {
  quickActionList.innerHTML = Object.entries(scenarioMeta).map(([scenarioId, meta]) => `
    <button class="quick-chip ${state.currentScenario === scenarioId ? 'is-active' : ''}" type="button" data-scenario="${scenarioId}">${meta.label}</button>
  `).join('');
  quickActionList.querySelectorAll('[data-scenario]').forEach((button) => {
    button.addEventListener('click', () => {
      state.currentScenario = button.dataset.scenario;
      if (!state.currentThreadId) {
        promptInput.value = getScenarioMeta(state.currentScenario).prompt;
      }
      renderQuickActions();
      renderStatusCard();
    });
  });
}

function renderThreadList() {
  const threads = chatStore.listThreads();
  threadCount.textContent = `${threads.length} 条`;
  threadList.innerHTML = threads.map((thread) => `
    <button class="thread-item ${thread.threadId === state.currentThreadId ? 'is-active' : ''}" type="button" data-thread-id="${thread.threadId}">
      <div class="thread-head">
        <strong>${thread.title}</strong>
        <span class="thread-status status-${thread.status}">${statusText[thread.status] || thread.status}</span>
      </div>
      <p>${thread.preview}</p>
      <span>${thread.updatedAt}</span>
    </button>
  `).join('');
  threadList.querySelectorAll('[data-thread-id]').forEach((button) => {
    button.addEventListener('click', () => {
      state.currentThreadId = button.dataset.threadId;
      const snapshot = chatStore.setCurrentThread(state.currentThreadId);
      const thread = snapshot.threads.find((item) => item.threadId === state.currentThreadId);
      if (thread) {
        state.currentScenario = thread.scenarioId;
        const firstUserMessage = chatStore.listMessages(thread.threadId, snapshot).find((message) => message.role === 'user');
        promptInput.value = firstUserMessage?.text || getScenarioMeta(thread.scenarioId).prompt;
        flowStore?.setActiveScenario(thread.scenarioId, { role: 'user', channel: 'desktop', action: '查看历史对话' });
      }
      renderAll();
    });
  });
}

function renderMessages() {
  const messages = state.currentThreadId ? chatStore.listMessages(state.currentThreadId) : [];
  messageCount.textContent = messages.length ? `${messages.length} 条` : '无记录';
  if (!messages.length) {
    messageList.innerHTML = '<div class="empty-state">发起新的任务后，会在这里保留历史对话和反馈记录。</div>';
    return;
  }
  messageList.innerHTML = messages.map((message) => {
    const assistantActions = message.role === 'assistant'
      ? `
        <div class="feedback-row">
          <button class="feedback-btn ${message.feedback === 'up' ? 'is-active' : ''}" type="button" data-feedback="up" data-message-id="${message.messageId}" aria-label="点赞">${thumbUpIcon()}</button>
          <button class="feedback-btn is-negative ${message.feedback === 'down' ? 'is-active' : ''}" type="button" data-feedback="down" data-message-id="${message.messageId}" aria-label="点踩">${thumbDownIcon()}</button>
        </div>
      `
      : '';
    return `
      <article class="message-card ${message.role === 'assistant' ? 'assistant' : 'user'}">
        <div class="message-bubble">${message.text}</div>
        <div class="message-actions">
          <span class="message-time">${message.createdAt}</span>
          ${assistantActions}
        </div>
      </article>
    `;
  }).join('');
  messageList.querySelectorAll('[data-feedback]').forEach((button) => {
    button.addEventListener('click', () => {
      chatStore.setFeedback(button.dataset.messageId, button.dataset.feedback, {
        userId: userProfile.userId,
        userName: userProfile.name,
        mailbox: sentimentMailbox
      });
      renderMessages();
    });
  });
}

function renderStatusCard() {
  const snapshot = chatStore.read();
  const thread = getCurrentThread(snapshot);
  const scenarioId = thread?.scenarioId || state.currentScenario;
  const meta = getScenarioMeta(scenarioId);
  const status = getCurrentStatus(thread);
  const flow = flowStore?.read()?.flows?.[scenarioId];
  statusTitle.textContent = meta.label;
  statusSummary.textContent = meta.summaries[status] || flow?.summary || '';
  statusBadge.textContent = statusText[status] || status;
  statusBadge.className = `status-pill status-${status}`;
  statusMeta.innerHTML = [
    `<span>${flowStore?.statusLabels?.[status] || statusText[status] || status}</span>`,
    `<span>${thread?.updatedAt || flow?.updatedAt || '刚刚更新'}</span>`,
    `<span>${meta.label}</span>`
  ].join('');
  statusSteps.innerHTML = meta.steps.map((step, index) => `<div class="step-item ${getStepState(status, index, meta.requiresConfirmation)}"><strong>${step}</strong><span>${status === 'done' ? '已完成' : status === 'waiting' && index === 2 ? '等待确认' : status === 'running' && index === 1 ? '处理中' : index === 0 ? '已识别' : '待执行'}</span></div>`).join('');
  if (status === 'done') {
    advanceBtn.textContent = '继续提问';
    confirmBtn.hidden = true;
  } else if (status === 'waiting') {
    advanceBtn.textContent = '重新生成';
    confirmBtn.hidden = false;
  } else if (status === 'running') {
    advanceBtn.textContent = meta.requiresConfirmation ? '进入确认' : '生成结果';
    confirmBtn.hidden = true;
  } else {
    advanceBtn.textContent = '开始处理';
    confirmBtn.hidden = true;
  }
}

function formatRule(rule = {}) {
  const scopeLabel = flowStore?.scopeLabels?.[rule.scope] || '未配置';
  if (rule.scope === 'department' && rule.departments?.length) return `${scopeLabel} · ${rule.departments.join(' / ')}`;
  if (rule.scope === 'users' && rule.users?.length) return `${scopeLabel} · ${rule.users.join(' / ')}`;
  return scopeLabel;
}

function renderTools() {
  const snapshot = flowStore.read();
  const tools = flowStore.listVisibleTools(userProfile, snapshot);
  toolCount.textContent = `${tools.length} 个`;
  if (!tools.length) {
    toolList.innerHTML = '<div class="empty-state">当前角色暂无可见工具。</div>';
    return;
  }
  toolList.innerHTML = tools.map((tool) => {
    const canDownload = flowStore.canDownloadTool(tool, userProfile);
    return `
      <article class="tool-item">
        <div class="tool-item-head">
          <h3>${tool.name}</h3>
          <span class="thread-status status-${canDownload ? 'done' : 'idle'}">${canDownload ? '可下载' : '仅查看'}</span>
        </div>
        <p>${tool.summary}</p>
        <div class="tool-meta">
          <span>部门：${tool.department}</span>
          <span>版本：${tool.version}</span>
          <span>可见：${formatRule(tool.visibility)}</span>
          <span>下载：${formatRule(tool.download)}</span>
        </div>
        <div class="tool-item-foot">
          <span class="meta-text">累计下载 ${tool.downloads} 次</span>
          <button class="tool-download ${canDownload ? '' : 'secondary'}" type="button" ${canDownload ? `data-download-tool="${tool.toolId}"` : 'disabled'}>${canDownload ? '下载工具' : '仅查看'}</button>
        </div>
      </article>
    `;
  }).join('');
  toolList.querySelectorAll('[data-download-tool]').forEach((button) => {
    button.addEventListener('click', () => {
      const toolId = button.dataset.downloadTool;
      const tool = flowStore.read().tools?.[toolId];
      if (!tool) return;
      flowStore.recordToolDownload(toolId, userProfile);
      toolFeedback.textContent = `${tool.name} 下载已记录。`;
      toolFeedback.classList.remove('is-hidden');
      renderTools();
    });
  });
}

function renderAll() {
  renderQuickActions();
  renderThreadList();
  renderMessages();
  renderStatusCard();
  renderTools();
}

function startTask() {
  const prompt = promptInput.value.trim() || getScenarioMeta(state.currentScenario).prompt;
  if (!prompt) return;
  const scenarioId = inferScenario(prompt);
  const meta = getScenarioMeta(scenarioId);
  state.currentScenario = scenarioId;
  flowStore.upsertTask({
    scenarioId,
    status: 'running',
    prompt,
    summary: meta.summaries.running,
    channel: 'desktop',
    role: 'user',
    action: '用户发起任务'
  });
  const result = chatStore.appendExchange({
    scenarioId,
    title: meta.label,
    prompt,
    response: meta.startReply,
    status: 'running'
  });
  state.currentThreadId = result.threadId;
  renderAll();
}

function advanceTask() {
  const thread = getCurrentThread();
  const scenarioId = thread?.scenarioId || state.currentScenario;
  const meta = getScenarioMeta(scenarioId);
  const status = getCurrentStatus(thread);
  if (status === 'done') {
    promptInput.focus();
    return;
  }
  if (status === 'idle' || !thread) {
    startTask();
    return;
  }
  if (status === 'waiting') {
    flowStore.upsertTask({
      scenarioId,
      status: 'running',
      prompt: promptInput.value.trim() || meta.prompt,
      summary: meta.summaries.running,
      channel: 'desktop',
      role: 'user',
      action: '重新生成方案'
    });
    chatStore.appendAssistantMessage({
      threadId: thread.threadId,
      scenarioId,
      text: meta.startReply,
      status: 'running'
    });
    chatStore.updateThread(thread.threadId, { status: 'running', preview: meta.startReply });
    renderAll();
    return;
  }
  const nextStatus = meta.requiresConfirmation ? 'waiting' : 'done';
  const nextText = nextStatus === 'waiting' ? meta.waitReply : meta.doneReply;
  flowStore.upsertTask({
    scenarioId,
    status: nextStatus,
    prompt: promptInput.value.trim() || meta.prompt,
    summary: meta.summaries[nextStatus],
    channel: 'desktop',
    role: 'user',
    action: nextStatus === 'waiting' ? '进入确认' : '生成结果'
  });
  chatStore.appendAssistantMessage({
    threadId: thread.threadId,
    scenarioId,
    text: nextText,
    status: nextStatus
  });
  chatStore.updateThread(thread.threadId, { status: nextStatus, preview: nextText });
  renderAll();
}

function confirmTask() {
  const thread = getCurrentThread();
  if (!thread) return;
  const scenarioId = thread.scenarioId;
  const meta = getScenarioMeta(scenarioId);
  flowStore.upsertTask({
    scenarioId,
    status: 'done',
    prompt: promptInput.value.trim() || meta.prompt,
    summary: meta.summaries.done,
    channel: 'desktop',
    role: 'user',
    action: '用户确认执行'
  });
  chatStore.appendAssistantMessage({
    threadId: thread.threadId,
    scenarioId,
    text: meta.doneReply,
    status: 'done'
  });
  chatStore.updateThread(thread.threadId, { status: 'done', preview: meta.doneReply });
  renderAll();
}

startTaskBtn?.addEventListener('click', startTask);
advanceBtn?.addEventListener('click', advanceTask);
confirmBtn?.addEventListener('click', confirmTask);
promptInput?.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    startTask();
  }
});
newChatBtn?.addEventListener('click', () => {
  state.currentThreadId = '';
  promptInput.value = '';
  toolFeedback.classList.add('is-hidden');
  state.currentScenario = flowStore?.read()?.activeScenario || 'meeting';
  renderAll();
  promptInput.focus();
});

chatStore?.subscribe(() => renderAll());
flowStore?.subscribe(() => renderAll());
flowStore?.recordEvent({ scenarioId: state.currentScenario, role: 'user', channel: 'desktop', action: '打开统一工作入口' });
renderAll();
if (!promptInput.value) {
  promptInput.value = getScenarioMeta(state.currentScenario).prompt;
}
