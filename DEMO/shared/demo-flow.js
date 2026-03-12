(function () {
  const STORAGE_KEY = 'enterprise-ai-demo-flow-v1';
  const EVENT_NAME = 'enterprise-ai-demo-flow-updated';
  const memoryFallback = { current: null };
  const catalog = {
    meeting: {
      label: '预定会议',
      prompt: '帮我预定明天下午和采购部的项目评审会议，并生成议程。',
      initialStatus: 'waiting',
      requiresConfirmation: true,
      downstreamApproval: false,
      tokens: 42000,
      cost: 86,
      summaries: {
        idle: '会议安排尚未发起。',
        running: '会议方案正在由内部智能体整理中。',
        waiting: '会议方案已生成，等待用户确认发送邀请。',
        done: '会议邀请已发出，可继续跟踪会后动作。'
      }
    },
    procurement: {
      label: '发起采购',
      prompt: '帮我发起一笔办公用品采购申请，并整理预算说明。',
      initialStatus: 'running',
      requiresConfirmation: true,
      downstreamApproval: true,
      tokens: 58000,
      cost: 132,
      summaries: {
        idle: '采购申请尚未发起。',
        running: '采购清单和预算说明正在生成。',
        waiting: '采购申请方案已生成，等待用户确认提交。',
        done: '采购申请已进入审批流，管理员可继续跟踪积压。'
      }
    },
    report: {
      label: '生成周报',
      prompt: '帮我生成本周项目周报初稿，并提炼风险和下周计划。',
      initialStatus: 'done',
      requiresConfirmation: true,
      downstreamApproval: false,
      tokens: 36000,
      cost: 74,
      summaries: {
        idle: '周报任务尚未发起。',
        running: '周报草稿正在整理中。',
        waiting: '周报发送版本已生成，等待用户确认。',
        done: '周报草稿已生成，可直接查看或继续加工。'
      }
    },
    policy: {
      label: '查制度',
      prompt: '帮我总结最新采购制度的关键变化，并告诉我下一步怎么做。',
      initialStatus: 'done',
      requiresConfirmation: false,
      downstreamApproval: false,
      tokens: 24000,
      cost: 42,
      summaries: {
        idle: '制度问答尚未发起。',
        running: '制度差异分析正在生成中。',
        waiting: '制度摘要已生成，等待进一步确认。',
        done: '制度变化摘要已生成，并附带下一步建议。'
      }
    },
    travel: {
      label: '差旅预定',
      prompt: '帮我安排下周去上海出差的机票和酒店，并准备差旅申请。',
      initialStatus: 'idle',
      requiresConfirmation: true,
      downstreamApproval: true,
      tokens: 47000,
      cost: 118,
      summaries: {
        idle: '差旅任务尚未发起。',
        running: '差旅方案正在组合与校验中。',
        waiting: '差旅方案已生成，等待用户确认提交。',
        done: '差旅申请已生成，管理员可继续查看审批压力。'
      }
    },
    access: {
      label: '开通权限',
      prompt: '帮新同事申请开通 VPN、GitLab 和项目空间权限。',
      initialStatus: 'idle',
      requiresConfirmation: true,
      downstreamApproval: true,
      tokens: 28000,
      cost: 56,
      summaries: {
        idle: '权限开通任务尚未发起。',
        running: '权限模板和工单内容正在整理中。',
        waiting: '权限开通方案已生成，等待用户确认提交。',
        done: '权限工单已创建，管理员可继续跟踪风险复核。'
      }
    }
  };
  const statusLabels = { idle: '可发起', running: '处理中', waiting: '待确认', done: '已完成' };
  const scopeLabels = {
    all: '全员',
    department: '指定部门',
    users: '指定个人',
    platform: '平台管理员',
    departmentAdmin: '部门管理员',
    owner: '责任人'
  };
  const profiles = {
    desktopUser: { userId: 'lx', name: 'LX', department: '供应链计划部', roles: ['user'] },
    mobileUser: { userId: 'lx', name: 'LX', department: '供应链计划部', roles: ['user'] },
    desktopAdmin: { userId: 'zhoumin', name: '周敏', department: '信息技术部', roles: ['platform-admin', 'department-admin'] },
    mobileAdmin: { userId: 'zhoumin', name: '周敏', department: '信息技术部', roles: ['platform-admin', 'department-admin'] }
  };

  function nowString() {
    return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function resolveApprovalCount(scenarioId, status) {
    const meta = catalog[scenarioId] || {};
    if (status === 'waiting' && meta.requiresConfirmation) return 1;
    if (status === 'done' && meta.downstreamApproval) return 1;
    return 0;
  }

  function defaultFlow(scenarioId, timestamp) {
    const meta = catalog[scenarioId];
    const status = meta.initialStatus;
    return {
      scenarioId,
      label: meta.label,
      prompt: meta.prompt,
      status,
      summary: meta.summaries[status],
      channel: status === 'idle' ? '' : 'desktop',
      role: status === 'idle' ? '' : 'user',
      approvalCount: resolveApprovalCount(scenarioId, status),
      tokensDelta: status === 'idle' ? 0 : meta.tokens,
      costDelta: status === 'idle' ? 0 : meta.cost,
      updatedAt: timestamp,
      lastAction: '系统预置'
    };
  }

  function buildDefaultTools(timestamp) {
    return {
      supply_forecast: {
        toolId: 'supply_forecast',
        name: '供应链到货预测助手',
        department: '供应链计划部',
        owner: '陈灏',
        ownerId: 'chenhao',
        type: 'Python 程序',
        deliverable: 'zip',
        fileName: 'supply-forecast-assistant.zip',
        version: 'v1.6.2',
        summary: '基于库存、到货计划和需求波动，自动生成补货窗口与预警建议。',
        status: '已发布',
        downloads: 26,
        visibility: { scope: 'department', departments: ['供应链计划部'], users: [] },
        download: { scope: 'department', departments: ['供应链计划部'], users: [] },
        management: { scope: 'departmentAdmin', departments: ['供应链计划部'], users: [] },
        updatedAt: timestamp
      },
      supplier_compare: {
        toolId: 'supplier_compare',
        name: '供应商比选脚本包',
        department: '采购中心',
        owner: '刘嘉',
        ownerId: 'liujia',
        type: 'Python 脚本包',
        deliverable: 'tar.gz',
        fileName: 'supplier-compare.tar.gz',
        version: 'v0.9.4',
        summary: '自动比对报价、交付周期与历史履约表现，生成供应商比选摘要。',
        status: '试运行',
        downloads: 8,
        visibility: { scope: 'users', departments: [], users: ['lx', 'zhoumin'] },
        download: { scope: 'users', departments: [], users: ['lx'] },
        management: { scope: 'departmentAdmin', departments: ['采购中心'], users: [] },
        updatedAt: timestamp
      },
      meeting_cleaner: {
        toolId: 'meeting_cleaner',
        name: '会议纪要清洗器',
        department: '信息技术部',
        owner: '周敏',
        ownerId: 'zhoumin',
        type: '桌面工具',
        deliverable: 'exe',
        fileName: 'meeting-cleaner.exe',
        version: 'v2.1.0',
        summary: '统一清洗会议纪要格式、自动打标签，并生成归档包。',
        status: '已发布',
        downloads: 83,
        visibility: { scope: 'all', departments: [], users: [] },
        download: { scope: 'all', departments: [], users: [] },
        management: { scope: 'platform', departments: [], users: ['zhoumin'] },
        updatedAt: timestamp
      },
      finance_brief: {
        toolId: 'finance_brief',
        name: '财务摘要生成器',
        department: '财务部',
        owner: '李娜',
        ownerId: 'lina',
        type: 'Agent 工具包',
        deliverable: 'workspace',
        fileName: 'finance-brief-workspace',
        version: 'v1.2.3',
        summary: '从月度数据中生成经营摘要，并输出对外汇报版文字初稿。',
        status: '已发布',
        downloads: 14,
        visibility: { scope: 'all', departments: [], users: [] },
        download: { scope: 'department', departments: ['财务部'], users: [] },
        management: { scope: 'owner', departments: [], users: ['lina'] },
        updatedAt: timestamp
      }
    };
  }

  function buildDefaultState() {
    const timestamp = nowString();
    const flows = {};
    Object.keys(catalog).forEach((scenarioId) => {
      flows[scenarioId] = defaultFlow(scenarioId, timestamp);
    });
    return {
      version: 2,
      activeScenario: 'meeting',
      flows,
      tools: buildDefaultTools(timestamp),
      audit: []
    };
  }

  function readStorage() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return memoryFallback.current;
    }
  }

  function pushAudit(state, entry) {
    state.audit = Array.isArray(state.audit) ? state.audit : [];
    state.audit.unshift({ updatedAt: nowString(), ...entry });
    state.audit = state.audit.slice(0, 24);
  }

  function normalizeTool(toolId, current, timestamp) {
    const base = buildDefaultTools(timestamp)[toolId];
    if (!base) return null;
    return {
      ...base,
      ...current,
      toolId,
      visibility: { ...base.visibility, ...(current.visibility || {}) },
      download: { ...base.download, ...(current.download || {}) },
      management: { ...base.management, ...(current.management || {}) },
      updatedAt: current.updatedAt || timestamp
    };
  }

  function ensureShape(snapshot) {
    const next = snapshot ? clone(snapshot) : buildDefaultState();
    next.version = 2;
    next.flows = next.flows || {};
    next.tools = next.tools || {};
    const timestamp = nowString();
    Object.keys(catalog).forEach((scenarioId) => {
      if (!next.flows[scenarioId]) {
        next.flows[scenarioId] = defaultFlow(scenarioId, timestamp);
        return;
      }
      const current = next.flows[scenarioId];
      const meta = catalog[scenarioId];
      const status = current.status && statusLabels[current.status] ? current.status : meta.initialStatus;
      next.flows[scenarioId] = {
        ...defaultFlow(scenarioId, timestamp),
        ...current,
        scenarioId,
        label: current.label || meta.label,
        prompt: current.prompt || meta.prompt,
        status,
        summary: current.summary || meta.summaries[status],
        approvalCount: typeof current.approvalCount === 'number' ? current.approvalCount : resolveApprovalCount(scenarioId, status),
        tokensDelta: typeof current.tokensDelta === 'number' ? current.tokensDelta : (status === 'idle' ? 0 : meta.tokens),
        costDelta: typeof current.costDelta === 'number' ? current.costDelta : (status === 'idle' ? 0 : meta.cost),
        updatedAt: current.updatedAt || timestamp,
        lastAction: current.lastAction || '同步状态'
      };
    });
    const defaultTools = buildDefaultTools(timestamp);
    Object.keys(defaultTools).forEach((toolId) => {
      next.tools[toolId] = normalizeTool(toolId, next.tools[toolId] || {}, timestamp);
    });
    next.activeScenario = next.activeScenario && next.flows[next.activeScenario] ? next.activeScenario : 'meeting';
    next.audit = Array.isArray(next.audit) ? next.audit : [];
    return next;
  }

  function persist(snapshot) {
    const next = ensureShape(snapshot);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      memoryFallback.current = next;
    }
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: clone(next) }));
    return next;
  }

  function read() {
    const current = readStorage();
    const snapshot = ensureShape(current);
    if (!current) persist(snapshot);
    return snapshot;
  }

  function upsertTask(payload) {
    if (!payload || !payload.scenarioId || !catalog[payload.scenarioId]) return read();
    const next = read();
    const meta = catalog[payload.scenarioId];
    const current = next.flows[payload.scenarioId] || defaultFlow(payload.scenarioId, nowString());
    const status = payload.status && statusLabels[payload.status] ? payload.status : current.status;
    const updatedFlow = {
      ...current,
      scenarioId: payload.scenarioId,
      label: payload.label || current.label || meta.label,
      prompt: payload.prompt || current.prompt || meta.prompt,
      status,
      summary: payload.summary || meta.summaries[status] || current.summary,
      channel: payload.channel !== undefined ? payload.channel : current.channel,
      role: payload.role !== undefined ? payload.role : current.role,
      approvalCount: typeof payload.approvalCount === 'number' ? payload.approvalCount : resolveApprovalCount(payload.scenarioId, status),
      tokensDelta: typeof payload.tokensDelta === 'number' ? payload.tokensDelta : (status === 'idle' ? 0 : meta.tokens),
      costDelta: typeof payload.costDelta === 'number' ? payload.costDelta : (status === 'idle' ? 0 : meta.cost),
      updatedAt: nowString(),
      lastAction: payload.action || '更新任务状态'
    };
    next.activeScenario = payload.scenarioId;
    next.flows[payload.scenarioId] = updatedFlow;
    pushAudit(next, {
      scenarioId: payload.scenarioId,
      label: updatedFlow.label,
      status: updatedFlow.status,
      role: updatedFlow.role,
      channel: updatedFlow.channel,
      action: updatedFlow.lastAction
    });
    return persist(next);
  }

  function setActiveScenario(scenarioId, meta = {}) {
    if (!catalog[scenarioId]) return read();
    const next = read();
    next.activeScenario = scenarioId;
    if (meta.prompt) {
      next.flows[scenarioId].prompt = meta.prompt;
      next.flows[scenarioId].updatedAt = nowString();
    }
    if (meta.action) {
      pushAudit(next, {
        scenarioId,
        label: next.flows[scenarioId].label,
        status: next.flows[scenarioId].status,
        role: meta.role || next.flows[scenarioId].role || '',
        channel: meta.channel || next.flows[scenarioId].channel || '',
        action: meta.action
      });
    }
    return persist(next);
  }

  function recordEvent(meta = {}) {
    const next = read();
    const scenarioId = meta.scenarioId && catalog[meta.scenarioId] ? meta.scenarioId : next.activeScenario;
    pushAudit(next, {
      scenarioId,
      label: next.flows[scenarioId].label,
      status: next.flows[scenarioId].status,
      role: meta.role || '',
      channel: meta.channel || '',
      action: meta.action || '查看页面'
    });
    return persist(next);
  }

  function matchesScope(policy, profile, tool) {
    const currentPolicy = policy || { scope: 'all' };
    const roles = profile.roles || [];
    switch (currentPolicy.scope) {
      case 'all':
        return true;
      case 'department':
        return (currentPolicy.departments || []).includes(profile.department);
      case 'users':
        return (currentPolicy.users || []).includes(profile.userId) || (currentPolicy.users || []).includes(profile.name);
      case 'platform':
        return roles.includes('platform-admin');
      case 'departmentAdmin':
        return roles.includes('platform-admin') || (roles.includes('department-admin') && (currentPolicy.departments || []).includes(profile.department));
      case 'owner':
        return roles.includes('platform-admin') || tool.ownerId === profile.userId || (currentPolicy.users || []).includes(profile.userId);
      default:
        return false;
    }
  }

  function isToolVisible(tool, profile) {
    return matchesScope(tool.visibility, profile, tool);
  }

  function canDownloadTool(tool, profile) {
    return matchesScope(tool.download, profile, tool);
  }

  function canManageTool(tool, profile) {
    return matchesScope(tool.management, profile, tool);
  }

  function listVisibleTools(profile, snapshot = read()) {
    return Object.values(snapshot.tools || {}).filter((tool) => isToolVisible(tool, profile));
  }

  function listManageableTools(profile, snapshot = read()) {
    return Object.values(snapshot.tools || {}).filter((tool) => canManageTool(tool, profile));
  }

  function updateTool(toolId, patch, meta = {}) {
    const next = read();
    const current = next.tools[toolId];
    if (!current) return next;
    next.tools[toolId] = normalizeTool(toolId, {
      ...current,
      ...patch,
      visibility: { ...current.visibility, ...((patch && patch.visibility) || {}) },
      download: { ...current.download, ...((patch && patch.download) || {}) },
      management: { ...current.management, ...((patch && patch.management) || {}) },
      updatedAt: nowString()
    }, nowString());
    pushAudit(next, {
      toolId,
      label: next.tools[toolId].name,
      status: next.tools[toolId].status,
      role: meta.role || '',
      channel: meta.channel || '',
      action: meta.action || '更新工具策略'
    });
    return persist(next);
  }

  function recordToolDownload(toolId, profile) {
    const next = read();
    const current = next.tools[toolId];
    if (!current || !canDownloadTool(current, profile)) return next;
    next.tools[toolId] = normalizeTool(toolId, {
      ...current,
      downloads: (current.downloads || 0) + 1,
      updatedAt: nowString()
    }, nowString());
    pushAudit(next, {
      toolId,
      label: current.name,
      status: current.status,
      role: profile.roles && profile.roles.includes('platform-admin') ? 'admin' : 'user',
      channel: profile.channel || '',
      action: '下载部门工具'
    });
    return persist(next);
  }

  function summarize(snapshot = read()) {
    const flows = Object.values(snapshot.flows || {});
    const tools = Object.values(snapshot.tools || {});
    const activeFlow = snapshot.flows[snapshot.activeScenario] || flows[0] || null;
    const counts = flows.reduce((accumulator, flow) => {
      accumulator[flow.status] = (accumulator[flow.status] || 0) + 1;
      return accumulator;
    }, { idle: 0, running: 0, waiting: 0, done: 0 });
    return {
      activeScenario: snapshot.activeScenario,
      activeFlow,
      waitingCount: counts.waiting || 0,
      runningCount: counts.running || 0,
      doneCount: counts.done || 0,
      idleCount: counts.idle || 0,
      pendingApprovals: flows.reduce((total, flow) => total + (flow.approvalCount || 0), 0),
      tokenDelta: flows.reduce((total, flow) => total + (flow.tokensDelta || 0), 0),
      costDelta: flows.reduce((total, flow) => total + (flow.costDelta || 0), 0),
      toolCount: tools.length,
      totalToolDownloads: tools.reduce((total, tool) => total + (tool.downloads || 0), 0),
      latestAudit: snapshot.audit && snapshot.audit.length ? snapshot.audit[0] : null
    };
  }

  function subscribe(callback) {
    if (typeof callback !== 'function') return function noop() {};
    const onStorage = (event) => {
      if (event.key && event.key !== STORAGE_KEY) return;
      callback(read());
    };
    const onCustom = () => callback(read());
    window.addEventListener('storage', onStorage);
    window.addEventListener(EVENT_NAME, onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(EVENT_NAME, onCustom);
    };
  }

  window.EnterpriseAIDemoFlow = {
    catalog,
    profiles,
    scopeLabels,
    statusLabels,
    read,
    persist,
    upsertTask,
    setActiveScenario,
    recordEvent,
    summarize,
    subscribe,
    listVisibleTools,
    listManageableTools,
    isToolVisible,
    canDownloadTool,
    canManageTool,
    updateTool,
    recordToolDownload
  };
})();
