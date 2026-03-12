const traces = {
  procurement: {
    label: '采购审批链',
    prompt: '帮我发起办公用品采购申请，并自动准备预算说明和审批链。',
    title: 'Planner 已拆解为采购申请流程',
    summary: '这个版本强调“可解释执行”：不是只告诉用户结果，而是展示路由、工具调用、审批节点和参与智能体。',
    metrics: ['4', '6', '1'],
    steps: [
      ['done', 'Planner 解析任务', '识别为“采购申请 + 预算说明 + OA 审批”复合流程。'],
      ['done', 'Router 分配智能体', '将任务拆给采购 Agent、预算 Agent 和审批 Agent。'],
      ['active', 'Tool 调用', '正在调用预算台账、采购模板库和 OA/BPM。'],
      ['wait', '关键确认', '等待用户确认预算说明与审批链。']
    ],
    agents: [
      ['Planner', '负责拆解任务与确定执行顺序。'],
      ['Procurement Agent', '生成采购清单与申请表。'],
      ['Budget Agent', '整理预算说明与金额合理性。'],
      ['Approval Agent', '组装审批链与抄送关系。']
    ],
    approval: ['确认节点', '预算金额 8,600 元，审批链为“部门负责人 → 财务 → 采购中心”。确认后自动提交。']
  },
  report: {
    label: '周报汇总链路',
    prompt: '帮我生成本周项目周报，并提炼风险和待决策事项。',
    title: 'Planner 已拆解为内容生成流程',
    summary: '内容场景更关注来源汇总、版本对比和输出格式，而不是复杂审批。',
    metrics: ['3', '4', '0'],
    steps: [
      ['done', 'Planner 解析任务', '识别为“项目周报 + 风险提炼 + 输出结构化摘要”。'],
      ['done', 'Tool 调用', '正在拉取项目空间、任务系统和上周周报版本。'],
      ['active', 'Draft 生成', '已进入管理层汇报版周报生成阶段。'],
      ['done', '结果输出', '该类场景无强制确认节点，可直接给出结果。']
    ],
    agents: [
      ['Planner', '确定数据来源和输出结构。'],
      ['Summary Agent', '生成周报正文与摘要。'],
      ['Risk Agent', '提炼风险、阻塞与待决策事项。']
    ],
    approval: ['确认节点', '无。系统会直接输出周报草稿，并保留后续编辑入口。']
  },
  access: {
    label: '权限开通链路',
    prompt: '帮新同事申请开通 VPN、GitLab 和项目空间权限。',
    title: 'Planner 已拆解为权限开通流程',
    summary: '权限类任务适合展示“最小权限集 + 审批链 + IT 工单”这一类企业治理感。',
    metrics: ['4', '5', '1'],
    steps: [
      ['done', 'Planner 解析任务', '识别开通对象、系统范围和岗位模板。'],
      ['done', '模板匹配', '匹配研发工程师标准权限包。'],
      ['active', '工单生成', '正在生成 IAM / ITSM 工单和审批内容。'],
      ['wait', '关键确认', '等待确认最小权限集与敏感仓库默认关闭。']
    ],
    agents: [
      ['Planner', '确定流程和风控策略。'],
      ['IAM Agent', '生成权限清单与最小权限集。'],
      ['ITSM Agent', '组装工单与执行说明。'],
      ['Approval Agent', '准备直属主管与 IT 审批链。']
    ],
    approval: ['确认节点', '默认不开放敏感仓库访问；确认后自动提交权限开通工单。']
  }
};

const tracePrompt = document.querySelector('#tracePrompt');
const startTraceBtn = document.querySelector('#startTraceBtn');
const presetRow = document.querySelector('#presetRow');
const traceTitle = document.querySelector('#traceTitle');
const traceSummary = document.querySelector('#traceSummary');
const metricAgents = document.querySelector('#metricAgents');
const metricTools = document.querySelector('#metricTools');
const metricApprovals = document.querySelector('#metricApprovals');
const traceTimeline = document.querySelector('#traceTimeline');
const agentCards = document.querySelector('#agentCards');
const approvalCard = document.querySelector('#approvalCard');

function renderTrace(key) {
  const item = traces[key];
  tracePrompt.value = item.prompt;
  traceTitle.textContent = item.title;
  traceSummary.textContent = item.summary;
  [metricAgents.textContent, metricTools.textContent, metricApprovals.textContent] = item.metrics;
  traceTimeline.innerHTML = item.steps.map(([state, title, desc], index) => `
    <article class="trace-step ${state === 'wait' ? '' : state}" data-index="${String(index + 1).padStart(2, '0')}">
      <strong>${title}</strong>
      <p>${desc}</p>
    </article>
  `).join('');
  agentCards.innerHTML = item.agents.map(([title, desc]) => `
    <article class="agent-card">
      <strong>${title}</strong>
      <p>${desc}</p>
    </article>
  `).join('');
  approvalCard.innerHTML = `
    <strong>${item.approval[0]}</strong>
    <p>${item.approval[1]}</p>
  `;
}

presetRow.innerHTML = Object.entries(traces).map(([key, item]) => `
  <button class="preset-btn" data-trace="${key}">${item.label}</button>
`).join('');

document.querySelectorAll('[data-trace]').forEach((button) => {
  button.addEventListener('click', () => renderTrace(button.dataset.trace));
});

startTraceBtn.addEventListener('click', () => {
  const text = tracePrompt.value;
  if (text.includes('周报')) return renderTrace('report');
  if (text.includes('权限') || text.includes('VPN')) return renderTrace('access');
  renderTrace('procurement');
});

renderTrace('procurement');
