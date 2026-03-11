# 企业AI应用门户外部案例对标

## 调研基准

本次对标以 [企业AI门户.png](../企业AI门户.png) 的四个核心方向为基准，不做无关发散：

1. 统一 AI 应用门户
2. 应用商店化资产管理
3. 全链路数据看板
4. 企业级权限控制（统一鉴权）

调研日期：2026-03-11

---

## 一、全球已有类似企业级产品

### 1. Microsoft 365 Copilot + Agent Store + Copilot Control System

对标结论：最接近“企业 AI 门户 + Agent 商店 + 管理控制台”的组合形态。

公开信息显示：

- Microsoft 365 Copilot Chat 已支持在聊天界面中发现和使用 agents，并支持在 Microsoft 365 管理中心中统一管理访问与配置。
- Microsoft 在 2025 年推出 Agent Store，作为集中式、可策展的 agent 市场，支持 Microsoft、合作伙伴和客户自建 agents 的浏览、试用和分享。
- Copilot Control System 强调“安全、治理、管理、度量”，覆盖数据保护、权限、成本、使用情况和业务价值分析。
- Microsoft 官方客户案例显示，EY 已将 Microsoft 365 Copilot 部署到超过 150,000 名员工，并通过 Copilot Studio 让员工自建 agents。

对你项目的参考价值：

- 统一入口不应只是门户首页，而应是员工日常办公入口中的 AI front door。
- 资产管理最好不要局限于 Prompt，而要自然扩展到 Agent、模板、工作流、连接器。
- 企业客户非常重视治理能力是否与门户能力并列，而不是后补。

参考来源：

- https://learn.microsoft.com/en-us/copilot/agents
- https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/whats-new-in-copilot-studio-may-2025/
- https://www.microsoft.com/en-gb/microsoft-365-copilot/copilot-control-system
- https://www.microsoft.com/en/customers/story/25662-ey-microsoft-365-copilot

### 2. Google Gemini Enterprise（原 Agentspace 能力并入）

对标结论：更强调“企业 AI 统一入口 + Agent 画廊 + 数据连接 + 安全治理 + 按职能场景落地”。

公开信息显示：

- Google 当前将 Gemini Enterprise 定位为“every employee, every workflow”的统一 AI 入口。
- 平台支持发现、创建、共享、运行 agents，并通过单一集中视图进行管理。
- 官方产品页直接强调连接 Google Workspace、Microsoft 365、Salesforce、SAP、BigQuery 等业务数据源。
- 产品页按 Marketing、Sales、Engineering、HR、Finance 给出场景化能力，不只是罗列技术功能。
- Google 官方博客提到 FairPrice 正在建设 organization-wide 的研究与助理平台；Wells Fargo 被描述为 Google Agentspace 的早期采用者。

对你项目的参考价值：

- 门户首页应该按部门/角色/场景组织入口，而不只是按应用分类。
- “连接企业数据源”是统一门户是否真正有价值的关键，不然只是聚合链接。
- 场景模板比纯功能列表更能推动企业内部 adoption。

参考来源：

- https://cloud.google.com/gemini-enterprise
- https://cloud.google.com/blog/products/ai-machine-learning/bringing-ai-agents-to-enterprises-with-google-agentspace
- https://cloud.google.com/blog/topics/financial-services/wells-fargo-agentic-ai-agentspace-empowering-workers/
- https://workspace.google.com/blog/customer-stories/zoppas-industries-workspace-with-gemini-global-collaboration-and-efficiency

### 3. Salesforce Agentforce / Agentforce 360 Platform

对标结论：更偏“企业级 agent 平台 + 统一数据底座 + 生命周期管理 + 场景化落地”。

公开信息显示：

- Salesforce 将 Agentforce 定位为可大规模构建、部署、管理 AI agents 的企业平台。
- 产品介绍强调 build, test, deploy, manage, orchestrate 的完整生命周期能力。
- Agentforce 360 Platform 强调把 humans、data、AI agents 连接在一个 trusted platform 上。
- 官方客户页列出了 Siemens、Heathrow、GE Appliances、DeVry、Simplyhealth、Salesforce 自身等多个实际案例。
- Salesforce 公开披露其帮助站点中的 Agentforce 在 2025 年已处理超过 100 万次对话。

对你项目的参考价值：

- “资产上架”只是开始，真正的企业级能力是 agent 生命周期管理。
- 数据打通和统一语义层很重要，否则商店里的资产很难真正跨部门复用。
- 需要把运营、测试、效果反馈纳入资产治理闭环。

参考来源：

- https://www.salesforce.com/agentforce/
- https://www.salesforce.com/platform/
- https://www.salesforce.com/agentforce/customer-stories/
- https://www.salesforce.com/news/stories/agentforce-customer-support-lessons-learned/lessons-from-500000-agentforce-customer-conversations-how-ai-drives-empathy-and-efficiency/

### 4. ServiceNow AI Control Tower

对标结论：最值得参考的是“治理中台”思路，而不是单纯应用门户思路。

公开信息显示：

- ServiceNow 在 2025-05-06 发布 AI Control Tower，定位为统一指挥中心，用来治理、管理、保护并衡量任何 AI agent、模型和 workflow。
- 官方材料强调 enterprise-wide AI visibility、compliance、risk management、performance、ROI、end-to-end lifecycle management。
- ServiceNow 产品页直接把 AI Control Tower 放在 AI Platform 的核心产品之一。

对你项目的参考价值：

- 你图里的“全链路数据看板”在企业真实环境里应升级为“AI 治理控制台”。
- 看板不应只看调用量，更要覆盖风险、资产状态、审批、成本、责任人、生命周期。
- 如果没有治理中台，后续接入的 AI 应用越多，平台越难控。

参考来源：

- https://newsroom.servicenow.com/press-releases/details/2025/ServiceNow-Launches-AI-Control-Tower-a-Centralized-Command-Center-to-Govern-Manage-Secure-and-Realize-Value-From-Any-AI-Agent-Model-and-Workflow/default.aspx
- https://www.servicenow.com/products/ai-control-tower.html

### 5. Atlassian Rovo

对标结论：非常接近“统一搜索 + AI 助手 + Agent + 轻量构建”的工作协同入口。

公开信息显示：

- Rovo 直接把能力拆成 Search、Chat、Studio、Agent 四部分。
- 官方页面强调搜索跨 SaaS 应用的信息、Chat 处理复杂任务、Studio 构建 agent/automation/app、Agent 作为团队伙伴工作。
- Rovo 强调 Teamwork Graph 作为企业上下文底座，以及 data residency、AI access controls 等企业控制能力。
- 官方页面显示其已面向超过 300 万用户开放。

对你项目的参考价值：

- 你的原型图里“统一门户 + 应用商店 + 权限控制”的组合，与 Rovo 的产品结构很接近。
- 值得借鉴的是把搜索、聊天、构建、Agent 浏览整合在同一个入口里，而不是拆成孤立模块。
- 企业入口应围绕“知识和协作流”设计，而不只是系统菜单。

参考来源：

- https://www.atlassian.com/software/rovo
- https://support.atlassian.com/rovo/docs/agents/
- https://support.atlassian.com/studio/docs/what-is-rovo-studio/

### 6. Workday Agent System of Record

对标结论：代表“把 AI agent 当数字员工治理”的企业思路。

公开信息显示：

- Workday 在 2025-02-11 发布 Agent System of Record，目标是统一管理企业内部来自 Workday 和第三方的所有 AI agents。
- 官方强调 onboarding、角色与职责定义、影响追踪、预算与成本预测、合规支持、持续优化、实时运营可视化。
- Workday 还明确提出通过 Marketplace 发现和部署 Workday、客户和合作伙伴的 agents。

对你项目的参考价值：

- 如果后续门户里会有大量 agent，上架和搜索不是终点，必须定义“责任归属、角色、预算、绩效、生命周期”。
- 这和你原型图中的“管理透明度”目标高度一致，值得借鉴为长期演进方向。

参考来源：

- https://newsroom.workday.com/2025-02-11-The-Next-Generation-of-Workforce-Management-is-Here-Workday-Unveils-New-Agent-System-of-Record
- https://www.workday.com/en-be/artificial-intelligence/agentic-ai.html

### 7. SAP Joule Studio

对标结论：代表“业务系统内生 AI + Skill/Agent 双层资产 + 企业数据深度绑定”。

公开信息显示：

- Joule Studio 支持构建、部署、自定义、管理 Joule agents 和 skills。
- SAP 明确区分 skill 与 agent：skill 更适合规则型任务，agent 更适合复杂多步问题。
- 官方页面强调 grounding in business data and processes、built-in security and compliance、可编排多 agent。

对你项目的参考价值：

- 你文档里的 Prompt / Skill / Agent / Workflow 分类方向是正确的，而且符合国际主流产品思路。
- 建议把“资产类型定义”进一步扩展为“轻量资产”和“执行型资产”两层模型。

参考来源：

- https://www.sap.com/products/artificial-intelligence/joule-studio.html

---

## 二、从外部案例反推，本项目方向是否正确

结论：方向是对的，而且和全球主流企业级产品趋势高度一致。

但需要把“企业 AI 门户”从一个页面，提升为一个组合平台：

1. AI Front Door：统一入口、统一搜索、统一推荐。
2. Agent/Asset Marketplace：Prompt、Skill、Agent、Workflow、Template、Connector 的统一商店。
3. Governance Console：权限、审计、审批、成本、风险、效果、生命周期管理。
4. Builder Capability：面向业务人员的低代码/无代码配置与编排能力。
5. Integration Layer：与企业知识库、业务系统、办公平台和模型网关打通。

---

## 三、全球产品的共性能力

### 共性 1：统一入口一定不是“导航页”，而是员工工作的 AI front door

几乎所有主流产品都把搜索、聊天、Agent 发现、任务执行放在一个统一入口里。

### 共性 2：商店化的不只是 Prompt，而是 Agent/模板/连接器/工作流

主流产品都在做 marketplace 或 gallery，而不仅是提示词库。

### 共性 3：治理能力是主能力，不是附属功能

权限、数据范围、审计、风险、成本、ROI、生命周期管理，都是主流产品的标配方向。

### 共性 4：都强调和企业数据、组织结构、现有系统打通

没有连接器和数据底座，企业 AI 门户就只剩下 UI 聚合价值。

### 共性 5：都在降低业务人员构建门槛

No-code / low-code / natural language builder 几乎已经成为共同趋势。

### 共性 6：都按业务场景包装能力，而不是只讲技术架构

Marketing、Sales、HR、Finance、IT、Support 等角色化场景是主流表达方式。

---

## 四、对本项目最关键的收敛建议

### 必须保留并强化的四个主轴

1. 统一入口：保留，并增加“场景入口 + 搜索入口 + 推荐入口”。
2. 资产沉淀：保留，并从 Prompt 扩展到 Agent、Template、Connector、Workflow。
3. 数据看板：保留，但升级为 AI 治理控制台。
4. 统一鉴权：保留，并从 RBAC 升级为“角色 + 组织 + 数据范围 + 资源归属”。

### 建议新增但不能偏题的能力

1. 应用接入标准：外链、嵌入、代理调用、统一网关调用等接入模式定义。
2. 资产准入标准：资产元数据、责任人、适用部门、数据等级、审核规则、失效机制。
3. 业务场景模板：按 HR、财务、IT、法务、销售、采购等提供标准入口。
4. 运营治理机制：应用上架、下架、版本、评分、投诉、告警、成本配额、复盘机制。
5. 轻量构建能力：至少要有模板化配置和参数化发布，为后续低代码编排留口。

### MVP 最合理的样子

MVP 不建议一开始追求“复杂 Agent 编排平台”，而应优先做：

1. 统一登录 + 统一门户首页
2. 应用目录 + 场景化搜索
3. Prompt/Skill/Agent 资产商店
4. 审批、权限、审计、部门隔离
5. Token 成本 + 使用趋势 + 资产复用数据
6. 与 2~3 个核心系统或知识库打通

---

## 五、最终判断

以原型图为基准，你现在这套方向没有偏，反而很接近全球企业软件的主流演进路线。

真正需要补的不是“大改方向”，而是把文档从“平台功能列表”升级成“业务场景驱动 + 资产治理闭环 + 企业运营机制”三层结构。只有这样，这个项目才会从“看起来像企业 AI 门户”，变成“真的能在企业里跑起来的 AI 门户”。
