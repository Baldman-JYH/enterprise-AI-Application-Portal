(function () {
  const STORAGE_KEY = 'enterprise-ai-demo-chat-v1';
  const EVENT_NAME = 'enterprise-ai-demo-chat-updated';
  const memoryFallback = { current: null };
  const defaultMailbox = 'ai-feedback@enterprise.local';

  function formatTime(date) {
    return date.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
  }

  function timeMeta(offsetMinutes = 0) {
    const date = new Date(Date.now() + offsetMinutes * 60 * 1000);
    return { text: formatTime(date), ms: date.getTime() };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function buildDefaultState() {
    const t1 = timeMeta(-180);
    const t2 = timeMeta(-110);
    const t3 = timeMeta(-55);
    const t4 = timeMeta(-40);
    return {
      version: 1,
      currentThreadId: 'thread-procurement',
      threads: [
        {
          threadId: 'thread-procurement',
          scenarioId: 'procurement',
          title: '办公用品采购申请',
          status: 'waiting',
          updatedAt: t4.text,
          updatedAtMs: t4.ms,
          preview: '采购方案已生成，等待确认提交。'
        },
        {
          threadId: 'thread-policy',
          scenarioId: 'policy',
          title: '采购制度变化',
          status: 'done',
          updatedAt: t3.text,
          updatedAtMs: t3.ms,
          preview: '制度变化和下一步建议已整理完成。'
        },
        {
          threadId: 'thread-meeting',
          scenarioId: 'meeting',
          title: '采购评审会议',
          status: 'done',
          updatedAt: t2.text,
          updatedAtMs: t2.ms,
          preview: '会议已创建，邀请已发出。'
        }
      ],
      messages: [
        {
          messageId: 'msg-meeting-user',
          threadId: 'thread-meeting',
          scenarioId: 'meeting',
          role: 'user',
          text: '帮我安排本周采购评审会议，并同步参会人。',
          createdAt: t1.text,
          createdAtMs: t1.ms,
          feedback: null
        },
        {
          messageId: 'msg-meeting-assistant',
          threadId: 'thread-meeting',
          scenarioId: 'meeting',
          role: 'assistant',
          text: '已为你锁定周四 14:00 的会议室，并同步采购、项目和财务三方参会人。会议邀请已发出。',
          createdAt: t2.text,
          createdAtMs: t2.ms,
          feedback: 'up'
        },
        {
          messageId: 'msg-policy-user',
          threadId: 'thread-policy',
          scenarioId: 'policy',
          role: 'user',
          text: '总结一下最新采购制度的变化。',
          createdAt: t2.text,
          createdAtMs: t2.ms,
          feedback: null
        },
        {
          messageId: 'msg-policy-assistant',
          threadId: 'thread-policy',
          scenarioId: 'policy',
          role: 'assistant',
          text: '最新版本新增预算附件要求，并把 5 万以上采购纳入供应商比选说明，建议同步更新采购模板。',
          createdAt: t3.text,
          createdAtMs: t3.ms,
          feedback: 'down'
        },
        {
          messageId: 'msg-procurement-user',
          threadId: 'thread-procurement',
          scenarioId: 'procurement',
          role: 'user',
          text: '帮我发起一笔办公用品采购申请，并补预算说明。',
          createdAt: t3.text,
          createdAtMs: t3.ms,
          feedback: null
        },
        {
          messageId: 'msg-procurement-assistant',
          threadId: 'thread-procurement',
          scenarioId: 'procurement',
          role: 'assistant',
          text: '采购清单和预算说明已生成，当前等待你确认后提交审批。',
          createdAt: t4.text,
          createdAtMs: t4.ms,
          feedback: null
        }
      ],
      feedback: [
        {
          feedbackId: 'feedback-msg-meeting-assistant',
          messageId: 'msg-meeting-assistant',
          threadId: 'thread-meeting',
          threadTitle: '采购评审会议',
          scenarioId: 'meeting',
          sentiment: 'up',
          excerpt: '已为你锁定周四 14:00 的会议室，并同步采购、项目和财务三方参会人。',
          userId: 'lx',
          userName: 'LX',
          mailbox: defaultMailbox,
          mailStatus: '已发送',
          createdAt: t2.text,
          createdAtMs: t2.ms
        },
        {
          feedbackId: 'feedback-msg-policy-assistant',
          messageId: 'msg-policy-assistant',
          threadId: 'thread-policy',
          threadTitle: '采购制度变化',
          scenarioId: 'policy',
          sentiment: 'down',
          excerpt: '最新版本新增预算附件要求，并把 5 万以上采购纳入供应商比选说明。',
          userId: 'lx',
          userName: 'LX',
          mailbox: defaultMailbox,
          mailStatus: '已发送',
          createdAt: t3.text,
          createdAtMs: t3.ms
        }
      ]
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

  function ensureShape(snapshot) {
    const next = snapshot ? clone(snapshot) : buildDefaultState();
    next.version = 1;
    next.threads = Array.isArray(next.threads) ? next.threads : [];
    next.messages = Array.isArray(next.messages) ? next.messages : [];
    next.feedback = Array.isArray(next.feedback) ? next.feedback : [];
    next.threads = next.threads.map((thread) => ({
      status: 'done',
      preview: '',
      ...thread,
      updatedAt: thread.updatedAt || formatTime(new Date(thread.updatedAtMs || Date.now())),
      updatedAtMs: thread.updatedAtMs || Date.now()
    }));
    next.messages = next.messages.map((message) => ({
      feedback: null,
      ...message,
      createdAt: message.createdAt || formatTime(new Date(message.createdAtMs || Date.now())),
      createdAtMs: message.createdAtMs || Date.now()
    }));
    next.feedback = next.feedback.map((item) => ({
      mailbox: defaultMailbox,
      mailStatus: '已发送',
      ...item,
      createdAt: item.createdAt || formatTime(new Date(item.createdAtMs || Date.now())),
      createdAtMs: item.createdAtMs || Date.now()
    }));
    next.currentThreadId = next.currentThreadId && next.threads.some((thread) => thread.threadId === next.currentThreadId)
      ? next.currentThreadId
      : (next.threads[0]?.threadId || '');
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

  function updateThreadRecord(next, threadId, patch) {
    next.threads = next.threads.map((thread) => thread.threadId === threadId ? { ...thread, ...patch } : thread);
  }

  function listThreads(snapshot = read()) {
    return clone(snapshot.threads).sort((left, right) => right.updatedAtMs - left.updatedAtMs);
  }

  function listMessages(threadId, snapshot = read()) {
    return clone(snapshot.messages)
      .filter((message) => message.threadId === threadId)
      .sort((left, right) => left.createdAtMs - right.createdAtMs);
  }

  function listFeedback(snapshot = read()) {
    return clone(snapshot.feedback).sort((left, right) => right.createdAtMs - left.createdAtMs);
  }

  function setCurrentThread(threadId) {
    const next = read();
    if (!next.threads.some((thread) => thread.threadId === threadId)) return next;
    next.currentThreadId = threadId;
    return persist(next);
  }

  function createThreadTitle(title, prompt) {
    if (title) return title;
    if (!prompt) return '新对话';
    return prompt.length > 18 ? `${prompt.slice(0, 18)}...` : prompt;
  }

  function appendExchange(payload) {
    if (!payload || !payload.scenarioId) return { snapshot: read(), threadId: '' };
    const next = read();
    const threadTime = timeMeta();
    const userTime = timeMeta(0);
    const assistantTime = timeMeta(1);
    const threadId = `thread-${payload.scenarioId}-${threadTime.ms}`;
    const thread = {
      threadId,
      scenarioId: payload.scenarioId,
      title: createThreadTitle(payload.title, payload.prompt),
      status: payload.status || 'running',
      updatedAt: assistantTime.text,
      updatedAtMs: assistantTime.ms,
      preview: payload.response || ''
    };
    next.currentThreadId = threadId;
    next.threads.unshift(thread);
    next.messages.push(
      {
        messageId: `msg-${threadTime.ms}-user`,
        threadId,
        scenarioId: payload.scenarioId,
        role: 'user',
        text: payload.prompt || '',
        createdAt: userTime.text,
        createdAtMs: userTime.ms,
        feedback: null
      },
      {
        messageId: `msg-${threadTime.ms}-assistant`,
        threadId,
        scenarioId: payload.scenarioId,
        role: 'assistant',
        text: payload.response || '',
        createdAt: assistantTime.text,
        createdAtMs: assistantTime.ms,
        feedback: null
      }
    );
    return { snapshot: persist(next), threadId };
  }

  function appendAssistantMessage(payload) {
    if (!payload || !payload.threadId || !payload.text) return { snapshot: read(), messageId: '' };
    const next = read();
    const messageTime = timeMeta();
    const messageId = `msg-${messageTime.ms}-assistant`;
    next.messages.push({
      messageId,
      threadId: payload.threadId,
      scenarioId: payload.scenarioId || '',
      role: 'assistant',
      text: payload.text,
      createdAt: messageTime.text,
      createdAtMs: messageTime.ms,
      feedback: null
    });
    updateThreadRecord(next, payload.threadId, {
      updatedAt: messageTime.text,
      updatedAtMs: messageTime.ms,
      preview: payload.text,
      status: payload.status || 'running'
    });
    next.currentThreadId = payload.threadId;
    return { snapshot: persist(next), messageId };
  }

  function updateThread(threadId, patch = {}) {
    const next = read();
    const current = next.threads.find((thread) => thread.threadId === threadId);
    if (!current) return next;
    const updateTime = timeMeta();
    updateThreadRecord(next, threadId, {
      ...patch,
      updatedAt: patch.updatedAt || updateTime.text,
      updatedAtMs: patch.updatedAtMs || updateTime.ms
    });
    return persist(next);
  }

  function setFeedback(messageId, sentiment, meta = {}) {
    const next = read();
    const message = next.messages.find((item) => item.messageId === messageId && item.role === 'assistant');
    if (!message) return next;
    const nextSentiment = message.feedback === sentiment ? null : sentiment;
    message.feedback = nextSentiment;
    next.feedback = next.feedback.filter((item) => item.messageId !== messageId);
    if (nextSentiment) {
      const thread = next.threads.find((item) => item.threadId === message.threadId);
      const feedbackTime = timeMeta();
      next.feedback.unshift({
        feedbackId: `feedback-${messageId}`,
        messageId,
        threadId: message.threadId,
        threadTitle: thread?.title || '对话反馈',
        scenarioId: message.scenarioId,
        sentiment: nextSentiment,
        excerpt: message.text.slice(0, 96),
        userId: meta.userId || '',
        userName: meta.userName || '当前用户',
        mailbox: meta.mailbox || defaultMailbox,
        mailStatus: '已发送',
        createdAt: feedbackTime.text,
        createdAtMs: feedbackTime.ms
      });
    }
    return persist(next);
  }

  function summarize(snapshot = read()) {
    const feedback = listFeedback(snapshot);
    return {
      threadCount: snapshot.threads.length,
      messageCount: snapshot.messages.length,
      positiveCount: feedback.filter((item) => item.sentiment === 'up').length,
      negativeCount: feedback.filter((item) => item.sentiment === 'down').length,
      mailCount: feedback.length,
      latestFeedback: feedback[0] || null
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

  window.EnterpriseAIDemoChat = {
    read,
    persist,
    subscribe,
    listThreads,
    listMessages,
    listFeedback,
    setCurrentThread,
    appendExchange,
    appendAssistantMessage,
    updateThread,
    setFeedback,
    summarize,
    mailbox: defaultMailbox
  };
})();
