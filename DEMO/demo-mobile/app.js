const mobilePresets = {
  meeting: {
    label: "预定会议",
    prompt: "帮我安排明天下午和采购部的项目评审会议，并生成议程。",
    title: "AI 已识别为会议安排任务",
    text: "系统将自动查询参会人空闲时间、会议室资源，并在关键节点前提示用户确认。"
  },
  policy: {
    label: "查制度",
    prompt: "帮我总结最新采购制度的关键变化，并告诉我下一步怎么做。",
    title: "AI 已识别为制度问答任务",
    text: "系统将从制度知识库检索最新版条款、生成差异摘要，并输出给业务侧可执行的建议。"
  },
  travel: {
    label: "差旅预定",
    prompt: "帮我安排下周去上海出差的机票和酒店，并准备差旅申请。",
    title: "AI 已识别为差旅执行任务",
    text: "系统将结合差旅制度、协议酒店和审批链，自动生成差旅申请与行程建议。"
  },
  report: {
    label: "生成周报",
    prompt: "帮我生成本周项目周报，并提炼风险和下周计划。",
    title: "AI 已识别为周报生成任务",
    text: "系统将汇总项目空间、任务系统和历史周报，自动输出适合管理层查看的简版结果。"
  }
};
const userTasks = [
  ["会议预定", "下午 14:00 与采购部评审会已进入待确认阶段。"],
  ["制度问答", "采购制度变化摘要已生成，已关联 2026 版制度原文。"],
  ["差旅申请", "上海出差方案已生成，待直属主管审批。"]
];
const userPending = [
  ["采购审批", "预算说明已生成，等待你确认后提交 OA。"],
  ["权限开通", "VPN、GitLab 和项目空间权限清单已准备完成。"]
];
const adminModels = [
  ["gpt-4.1", "今日 42% 调用占比，主要用于制度问答和周报生成。"],
  ["internal-rag-agent", "今日 31% 调用占比，主要用于知识库检索和引用定位。"],
  ["workflow-router", "负责会议、采购、权限等流程分发与工具选择。"]
];
const adminAlerts = [
  ["Token 异常增长", "采购与报告场景在 14:00-15:00 出现峰值，需要关注批量调用。"],
  ["审批积压", "当前有 7 个高优先级待审批任务，其中 3 个与采购相关。"],
  ["权限风险提醒", "2 个开通工单触发敏感仓库访问规则，需管理员复核。"]
];
const roleButtons = document.querySelectorAll("[data-role]");
const heroTitle = document.querySelector("#heroTitle");
const heroText = document.querySelector("#heroText");
const mobilePrompt = document.querySelector("#mobilePrompt");
const runActionBtn = document.querySelector("#runActionBtn");
const quickChips = document.querySelector("#quickChips");
const userView = document.querySelector("#userView");
const adminView = document.querySelector("#adminView");
const userResultTitle = document.querySelector("#userResultTitle");
const userResultText = document.querySelector("#userResultText");
const userTaskList = document.querySelector("#userTaskList");
const userPendingList = document.querySelector("#userPendingList");
const adminModelList = document.querySelector("#adminModelList");
const adminAlertList = document.querySelector("#adminAlertList");
const urlParams = new URLSearchParams(window.location.search);
let currentRole = urlParams.get("role") === "admin" ? "admin" : "user";
let currentPreset = "meeting";
function renderList(container, items) {
  container.innerHTML = items.map(([title, desc]) => `
    <article class="list-item">
      <strong>${title}</strong>
      <span>${desc}</span>
    </article>
  `).join("");
}
function syncRole() {
  roleButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.role === currentRole);
  });
  userView.classList.toggle("is-hidden", currentRole !== "user");
  adminView.classList.toggle("is-hidden", currentRole !== "admin");
  if (currentRole === "admin") {
    heroTitle.textContent = "管理员可在手机端快速查看 AI 平台运行状态。";
    heroText.textContent = "包括 tokens、模型调用、审批积压、活跃智能体和风险告警。";
  } else {
    heroTitle.textContent = "在手机上也能直接发起企业工作请求。";
    heroText.textContent = "统一入口承接会议、制度、差旅、权限、采购等工作场景，再由内部智能体分流执行。";
  }
  urlParams.set("role", currentRole);
  window.history.replaceState({}, "", `${window.location.pathname}?${urlParams.toString()}`);
}
function renderPreset(key) {
  currentPreset = key;
  const preset = mobilePresets[key];
  mobilePrompt.value = preset.prompt;
  userResultTitle.textContent = preset.title;
  userResultText.textContent = preset.text;
}
roleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentRole = button.dataset.role;
    syncRole();
  });
});
quickChips.innerHTML = Object.entries(mobilePresets).map(([key, item]) => `
  <button class="quick-chip" data-preset="${key}">${item.label}</button>
`).join("");
document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => renderPreset(button.dataset.preset));
});
runActionBtn.addEventListener("click", () => {
  const text = mobilePrompt.value;
  if (text.includes("制度")) return renderPreset("policy");
  if (text.includes("差旅") || text.includes("酒店") || text.includes("机票")) return renderPreset("travel");
  if (text.includes("周报") || text.includes("风险")) return renderPreset("report");
  return renderPreset("meeting");
});
renderList(userTaskList, userTasks);
renderList(userPendingList, userPending);
renderList(adminModelList, adminModels);
renderList(adminAlertList, adminAlerts);
renderPreset(currentPreset);
syncRole();
