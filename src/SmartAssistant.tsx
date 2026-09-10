import React, { useEffect, useRef, useState } from 'react';

type AssistantRole = 'user' | 'assistant';

type AssistantMessage = {
  id: string;
  role: AssistantRole;
  content: string;
  createdAt: number;
  stats?: { label: string; value: string; tone?: 'red' | 'yellow' | 'blue' | 'green' }[];
  chart?: number[];
};

type Point = { x: number; y: number };

const MAX_INPUT_LENGTH = 2000;
const VIEWPORT_GAP = 20;
const WELCOME_MESSAGE = '您好，我是并表AI助手。可按当前权限和驾驶舱筛选口径，查询预警、重大风险事件、机构指标与经营趋势。';
const GROUP_WORKBENCH_QUESTIONS = ['本月哪些机构新增红灯预警？', '国际AMC目前有多少项黄灯指标？', '浦发银行流动性覆盖率是多少？'];
const INSTITUTION_WORKBENCH_QUESTIONS = ['本机构当前有哪些红灯预警？', '本月还有哪些数据未报送？', '当前处置中的预警有多少项？'];
const DEFAULT_QUESTIONS = ['本月集团有多少红灯预警？', '国际AMC有哪些集中度风险指标预警？', '国泰海通流动性覆盖率近6期趋势如何？'];

const createMessage = (role: AssistantRole, content: string, extra?: Pick<AssistantMessage, 'stats' | 'chart'>): AssistantMessage => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role,
  content,
  createdAt: Date.now(),
  ...extra,
});

const answerFor = (question: string, institutionWorkbench = false): AssistantMessage => {
  let activeInstitution = '全部机构';
  try { activeInstitution = JSON.parse(sessionStorage.getItem('dashboard-v14-active-context') || '{}').institution || '全部机构'; } catch { /* use group scope */ }
  if (/哪些机构.*红灯|新增红灯/.test(question)) return createMessage('assistant', '本月新增红灯预警涉及浦发银行、国际AMC、上农商和国泰海通，主要分布在流动性、信用、资本和市场风险领域。', {
    stats: [{ label: '涉及机构', value: '4家', tone: 'blue' }, { label: '新增红灯', value: '6项', tone: 'red' }, { label: '较上月', value: '+2项', tone: 'red' }],
    chart: [3, 4, 4, 5, 4, 6],
  });
  if (/国际AMC.*黄灯/.test(question)) return createMessage('assistant', '国际AMC当前有15项黄灯指标，重点关注资产拨备率、单一集团客户投融资集中度和现金流覆盖率。', {
    stats: [{ label: '黄灯指标', value: '15项', tone: 'yellow' }, { label: '较上月', value: '-3项', tone: 'green' }],
  });
  if (/浦发银行.*流动性覆盖率/.test(question)) return createMessage('assistant', '浦发银行本期流动性覆盖率为132.6%，较上月提升2.4个百分点，当前高于演示预警阈值。', {
    stats: [{ label: '本期值', value: '132.6%', tone: 'blue' }, { label: '环比', value: '+2.4pct', tone: 'green' }, { label: '阈值', value: '120.0%', tone: 'yellow' }],
    chart: [124.8, 126.1, 127.4, 129.2, 130.2, 132.6],
  });
  if (institutionWorkbench && /本机构.*红灯/.test(question)) return createMessage('assistant', '本机构当前有6项红灯预警，主要涉及流动性覆盖率、核心一级资本充足率和不良贷款率。', {
    stats: [{ label: '红灯预警', value: '6项', tone: 'red' }, { label: '较上月', value: '+2项', tone: 'red' }],
  });
  if (institutionWorkbench && /数据.*未报送|未报送/.test(question)) return createMessage('assistant', '本月仍有1项并表数据任务待确认上报；其余近期报送任务均已完成或进入转报环节。', {
    stats: [{ label: '待上报', value: '1项', tone: 'yellow' }, { label: '已完成', value: '3项', tone: 'green' }, { label: '转报中', value: '1项', tone: 'blue' }],
  });
  if (institutionWorkbench && /处置中.*预警|处置中的预警/.test(question)) return createMessage('assistant', '本机构当前有6项预警处于处置中，较上月减少25%，整体处置进度保持改善。', {
    stats: [{ label: '处置中', value: '6项', tone: 'yellow' }, { label: '较上月', value: '-25%', tone: 'green' }],
    chart: [10, 9, 9, 8, 7, 6],
  });
  if (/国际AMC|集中度/.test(question)) return createMessage('assistant', '国际AMC当前有1项红灯、1项黄灯预警。红灯集中在单一集团客户投融资集中度，30日流动性备付余量为黄灯，建议优先跟踪客户集中度变化。', {
    stats: [{ label: '红灯预警', value: '1项', tone: 'red' }, { label: '黄灯预警', value: '1项', tone: 'yellow' }, { label: '集中度', value: '18.70%', tone: 'red' }],
    chart: [12.2, 13.4, 14.1, 15.8, 17.2, 18.7],
  });
  if (/国泰海通|流动性覆盖率/.test(question)) return createMessage('assistant', '国泰海通流动性覆盖率近6期持续回落，本期为112.40%，低于120.00%的演示预警阈值，当前显示为红灯。', {
    stats: [{ label: '本期值', value: '112.40%', tone: 'red' }, { label: '环比', value: '↓3.1%', tone: 'red' }, { label: '阈值', value: '120.00%', tone: 'yellow' }],
    chart: [135, 131, 129, 124, 118, 112.4],
  });
  if (/净利润|同比下降/.test(question)) return createMessage('assistant', '当前筛选口径下，净利润同比变化最弱的机构为国际AMC。该结论基于DEMO经营数据，建议结合机构经营明细进一步核实。', {
    stats: [{ label: '国际AMC', value: '-3.2%', tone: 'red' }, { label: '集团中位', value: '+2.6%', tone: 'blue' }],
    chart: [6.8, 5.2, 4.1, 2.4, -1.1, -3.2],
  });
  if (/重大风险事件|新增/.test(question)) return createMessage('assistant', '本月新增重大风险事件1起，来自国际AMC，当前处于执行跟踪阶段；浦发银行的信息科技系统故障事件已完成终报并归档。', {
    stats: [{ label: '本月新增', value: '1起', tone: 'red' }, { label: '处置中', value: '1起', tone: 'yellow' }, { label: '已办结', value: '1起', tone: 'green' }],
  });
  if (activeInstitution !== '全部机构') return createMessage('assistant', `当前查询范围已限定为${activeInstitution}。本期重点关注指标、预警及重大风险事项均按该机构权限口径返回；如需集团对比，请先返回风险专题看板。`, {
    stats: [{ label: '查询范围', value: activeInstitution, tone: 'blue' }, { label: '数据期次', value: '2024年6月', tone: 'green' }],
  });
  return createMessage('assistant', '当前集团共有2项红灯预警、3项黄灯预警，红灯主要集中于国际AMC的集中度风险和国泰海通的流动性风险。较上期红灯增加2项。', {
    stats: [{ label: '红灯预警', value: '2项', tone: 'red' }, { label: '黄灯预警', value: '3项', tone: 'yellow' }, { label: '较上期', value: '+2项', tone: 'red' }],
    chart: [3, 3, 4, 4, 5, 7],
  });
};

function RobotIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3V1.8M8 9h.01M16 9h.01M8.5 14.5h7M6 5.5h12a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3Z" /></svg>;
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

function SendIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 17-7-7 17-2.5-7.5L3 11Zm7.5 2.5L20 4" /></svg>;
}

export default function SmartAssistant({ role, path, embedded = false }: { role?: string; path?: string; embedded?: boolean }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; start: Point; origin: Point } | null>(null);
  const draggedRef = useRef(false);
  const [open, setOpen] = useState(embedded);
  const [position, setPosition] = useState<Point | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>(() => [createMessage('assistant', WELCOME_MESSAGE)]);
  const institutionWorkbench = path === '/workbench' && role === '各金融机构';
  const quickQuestions = path === '/workbench' ? (institutionWorkbench ? INSTITUTION_WORKBENCH_QUESTIONS : GROUP_WORKBENCH_QUESTIONS) : DEFAULT_QUESTIONS;

  const clampPosition = (point: Point): Point => {
    const rect = buttonRef.current?.getBoundingClientRect();
    const width = rect?.width || 132;
    const height = rect?.height || 46;
    return {
      x: Math.min(Math.max(VIEWPORT_GAP, point.x), Math.max(VIEWPORT_GAP, window.innerWidth - width - VIEWPORT_GAP)),
      y: Math.min(Math.max(VIEWPORT_GAP, point.y), Math.max(VIEWPORT_GAP, window.innerHeight - height - VIEWPORT_GAP)),
    };
  };

  useEffect(() => {
    if (embedded) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    setPosition({
      x: Math.max(VIEWPORT_GAP, window.innerWidth - (rect?.width || 132) - 24),
      y: Math.max(VIEWPORT_GAP, window.innerHeight - (rect?.height || 46) - 24),
    });
  }, []);

  useEffect(() => {
    if (embedded) return;
    const handleResize = () => setPosition(current => current ? clampPosition(current) : current);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (open || embedded) messageEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages, open, embedded]);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const current = position || { x: event.currentTarget.offsetLeft, y: event.currentTarget.offsetTop };
    dragRef.current = { pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: current };
    draggedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.start.x;
    const deltaY = event.clientY - drag.start.y;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 4) draggedRef.current = true;
    setPosition(clampPosition({ x: drag.origin.x + deltaX, y: drag.origin.y + deltaY }));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleLauncherClick = () => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    setOpen(true);
  };

  const sendMessage = (preset?: string) => {
    const content = (preset ?? input).trim();
    if (!content) return;
    setMessages(current => [...current, createMessage('user', content), answerFor(content, institutionWorkbench)]);
    setInput('');
  };

  const startNewConversation = () => {
    setMessages([createMessage('assistant', WELCOME_MESSAGE)]);
    setInput('');
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return <>
    {!embedded && <button
      ref={buttonRef}
      type="button"
      className="smart-assistant-launcher"
      style={position ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' } : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleLauncherClick}
      aria-label="打开智能助手"
    >
      <span className="smart-assistant-launcher-icon"><RobotIcon /></span>
      <span>AI问数</span>
    </button>}

    {(open || embedded) && <section className={`smart-assistant-panel ${embedded ? 'embedded' : ''}`} role={embedded ? 'region' : 'dialog'} aria-label={embedded ? 'AI应用智能问答' : '并表AI助手对话面板'}>
      <header className="smart-assistant-header">
        <span className="smart-assistant-avatar"><RobotIcon /></span>
        <div><strong>{embedded ? 'AI应用 · 智能问答' : '并表AI助手'}</strong><small>跟随当前权限与筛选口径</small></div>
        <div className="smart-assistant-header-actions">
          <button type="button" onClick={startNewConversation} title="新建会话" aria-label="新建会话"><PlusIcon /></button>
          {!embedded && <button type="button" onClick={() => setOpen(false)} title="关闭" aria-label="关闭智能助手"><CloseIcon /></button>}
        </div>
      </header>

      <div className="smart-assistant-messages" aria-live="polite">
        {messages.map(message => <div key={message.id} className={`smart-assistant-message ${message.role}`}>
          {message.role === 'assistant' && <span className="smart-assistant-message-avatar"><RobotIcon /></span>}
          <div><span>{message.content}</span>{message.stats && <div className="smart-assistant-stats">{message.stats.map(item => <b className={item.tone || 'blue'} key={item.label}><small>{item.label}</small>{item.value}</b>)}</div>}{message.chart && <div className="smart-assistant-chart">{message.chart.map((value, index) => <i key={`${value}-${index}`} style={{ height: `${20 + (value - Math.min(...message.chart!)) / Math.max(1, Math.max(...message.chart!) - Math.min(...message.chart!)) * 58}%` }} />)}</div>}</div>
        </div>)}
        {messages.length === 1 && <div className="smart-assistant-quick">{quickQuestions.map(question => <button key={question} onClick={() => sendMessage(question)}>{question}</button>)}</div>}
        <div ref={messageEndRef} />
      </div>

      <footer className="smart-assistant-input-area">
        <div className="smart-assistant-composer">
          <textarea
            value={input}
            maxLength={MAX_INPUT_LENGTH}
            rows={3}
            placeholder="请输入并表风险或经营问题……"
            onChange={event => setInput(event.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          <button type="button" onClick={() => sendMessage()} disabled={!input.trim()} title="发送" aria-label="发送消息"><SendIcon /></button>
        </div>
        <small>{input.length}/{MAX_INPUT_LENGTH} · Enter 发送，Shift + Enter 换行</small>
      </footer>
    </section>}
  </>;
}
