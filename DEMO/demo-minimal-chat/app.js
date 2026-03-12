const presets = {
  meeting: {
    label: '会议安排',
    prompt: '帮我安排明天下午和采购部的项目评审会议，并生成议程。',
    title: '系统已识别为“会议安排 + 议程生成”',
    intro: '这个版本强调最少界面干扰，只展示 AI 对需求的理解、执行路径和内部系统动作。',
    steps: [
      ['理解意图', '识别会议主题、参会部门与时间约束。'],
      ['查询资源', '检索参会人空闲时间和会议室资源。'],
      ['生成方案', '自动生成议程、邀请文案和会后任务建议。']
    ],
    tools: [
      ['企业日历', '空闲时间比对完成'],
      ['会议室系统', '已找到候选会议室'],
      ['邮件通知', '邀请草稿已准备']
    ]
  },
  policy: {
    label: '制度问答',
    prompt: '帮我总结最新采购制度的关键变化，并告诉我下一步怎么做。',
    title: '系统已识别为“知识问答 + 行动建议”',
    intro: '知识问答场景不一定进入审批链，而是更快给出摘要、引用依据和下一步动作。',
    steps: [
      ['检索制度', '定位最新版制度原文与历史版本。'],
      ['比较差异', '提炼关键变化点和受影响流程。'],
      ['生成建议', '转换成业务人员能直接执行的行动建议。']
    ],
    tools: [
      ['制度知识库', '版本与原文定位完成'],
      ['差异引擎', '条款差异已提炼'],
      ['问答生成器', '结果摘要已生成']
    ]
  },
  access: {
    label: '权限开通',
    prompt: '帮新同事申请开通 VPN、GitLab 和项目空间权限。',
    title: '系统已识别为“权限开通流程”',
    intro: '流程类请求会被自动拆解成模板匹配、审批链生成和工单准备三部分。',
    steps: [
      ['匹配岗位模板', '识别新同事角色并推荐最小权限集。'],
      ['准备申请单', '生成 IT 工单、权限清单和审批链。'],
      ['等待确认', '关键动作保留人工确认，其余步骤自动处理。']
    ],
    tools: [
      ['IAM', '权限模板已匹配'],
      ['组织通讯录', '汇报关系已校验'],
      ['ITSM', '工单草稿已生成']
    ]
  }
};

const promptInput = document.querySelector('#promptInput');
const runBtn = document.querySelector('#runBtn');
const quickRow = document.querySelector('#quickRow');
const resultTitle = document.querySelector('#resultTitle');
const resultIntro = document.querySelector('#resultIntro');
const stepList = document.querySelector('#stepList');
const toolList = document.querySelector('#toolList');

function renderPreset(key) {
  const current = presets[key];
  promptInput.value = current.prompt;
  resultTitle.textContent = current.title;
  resultIntro.textContent = current.intro;
  stepList.innerHTML = current.steps.map(([title, desc]) => `
    <article class="step-item">
      <strong>${title}</strong>
      <p>${desc}</p>
    </article>
  `).join('');
  toolList.innerHTML = current.tools.map(([title, desc]) => `
    <article class="mini-card">
      <strong>${title}</strong>
      <p>${desc}</p>
    </article>
  `).join('');
}

quickRow.innerHTML = Object.entries(presets).map(([key, item]) => `
  <button class="quick-btn" data-preset="${key}">${item.label}</button>
`).join('');

document.querySelectorAll('[data-preset]').forEach((button) => {
  button.addEventListener('click', () => renderPreset(button.dataset.preset));
});

runBtn.addEventListener('click', () => {
  const text = promptInput.value;
  if (text.includes('制度')) return renderPreset('policy');
  if (text.includes('权限') || text.includes('VPN')) return renderPreset('access');
  renderPreset('meeting');
});

renderPreset('meeting');
