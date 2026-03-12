const models = [
  ["gpt-4.1", "今日 42% 的调用来自制度问答、周报生成和综合问答场景。"],
  ["internal-rag-agent", "制度库和知识库检索场景占比 31%，知识命中率保持在 87%。"],
  ["workflow-router", "负责流程场景意图识别和工具分流，会议、采购、权限使用最高。"],
  ["budget-agent", "主要支撑采购与差旅场景的预算说明生成和预算校验。"]
];
const approvals = [
  ["采购审批积压", "3 个采购申请仍停留在部门负责人节点，平均等待 5.2 小时。"],
  ["权限工单待确认", "2 个权限开通工单需要人工确认敏感仓库默认关闭策略。"],
  ["差旅审批峰值", "上海差旅类任务在午间集中触发，建议补充移动端审批入口。"]
];
const alerts = [
  ["Token 峰值异常", "14:00-15:00 报告生成类任务的 tokens 消耗比日均高 28%，需要检查批量导出行为。"],
  ["高风险操作确认", "1 个权限开通任务请求了超出岗位模板的访问范围，已触发复核。"],
  ["知识引用缺口", "采购制度问答中仍有 13% 的问题未返回明确原文引用，需补知识库元数据。"]
];
const departments = [
  ["采购中心", "高频场景：采购申请、供应商比选、制度问答"],
  ["PMO", "高频场景：周报生成、会议安排、项目风险总结"],
  ["IT 支持", "高频场景：权限开通、账号恢复、知识问答"],
  ["行政", "高频场景：会议室调度、差旅支持、物资申领"],
  ["研发", "高频场景：权限申请、项目空间检索、周报生成"],
  ["财务", "高频场景：预算说明、审批核对、制度问答"],
  ["人力", "高频场景：入职开通、制度培训、FAQ"],
  ["管理层", "高频场景：经营摘要、风险汇报、跨部门待办追踪"]
];
function renderList(selector, items) {
  const container = document.querySelector(selector);
  container.innerHTML = items.map(([title, desc]) => `
    <article class="stack-item">
      <strong>${title}</strong>
      <p>${desc}</p>
    </article>
  `).join("");
}
renderList("#modelList", models);
renderList("#approvalList", approvals);
renderList("#alertList", alerts);
document.querySelector("#departmentGrid").innerHTML = departments.map(([title, desc]) => `
  <article class="department-card">
    <strong>${title}</strong>
    <p>${desc}</p>
  </article>
`).join("");
