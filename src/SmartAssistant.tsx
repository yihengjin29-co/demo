import React, { useEffect, useRef, useState } from 'react';

type AssistantRole = 'user' | 'assistant';

type AssistantMessage = {
  id: string;
  role: AssistantRole;
  content: string;
  createdAt: number;
};

type Point = { x: number; y: number };

const MAX_INPUT_LENGTH = 2000;
const VIEWPORT_GAP = 20;
const ASSISTANT_REPLY = '测试DEMO，暂不支持该项功能';
const WELCOME_MESSAGE = '你好，我是站内智能助手。你可以直接询问网站中的功能、内容或使用方式。';

const createMessage = (role: AssistantRole, content: string): AssistantMessage => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role,
  content,
  createdAt: Date.now(),
});

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

export default function SmartAssistant() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; start: Point; origin: Point } | null>(null);
  const draggedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Point | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>(() => [createMessage('assistant', WELCOME_MESSAGE)]);

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
    const rect = buttonRef.current?.getBoundingClientRect();
    setPosition({
      x: Math.max(VIEWPORT_GAP, window.innerWidth - (rect?.width || 132) - 24),
      y: Math.max(VIEWPORT_GAP, window.innerHeight - (rect?.height || 46) - 24),
    });
  }, []);

  useEffect(() => {
    const handleResize = () => setPosition(current => current ? clampPosition(current) : current);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (open) messageEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages, open]);

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

  const sendMessage = () => {
    const content = input.trim();
    if (!content) return;
    setMessages(current => [...current, createMessage('user', content), createMessage('assistant', ASSISTANT_REPLY)]);
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
    <button
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
      <span>智能助手</span>
    </button>

    {open && <section className="smart-assistant-panel" role="dialog" aria-label="智能助手对话面板">
      <header className="smart-assistant-header">
        <span className="smart-assistant-avatar"><RobotIcon /></span>
        <div><strong>智能助手</strong><small>基于站内内容为你解答</small></div>
        <div className="smart-assistant-header-actions">
          <button type="button" onClick={startNewConversation} title="新建会话" aria-label="新建会话"><PlusIcon /></button>
          <button type="button" onClick={() => setOpen(false)} title="关闭" aria-label="关闭智能助手"><CloseIcon /></button>
        </div>
      </header>

      <div className="smart-assistant-messages" aria-live="polite">
        {messages.map(message => <div key={message.id} className={`smart-assistant-message ${message.role}`}>
          {message.role === 'assistant' && <span className="smart-assistant-message-avatar"><RobotIcon /></span>}
          <div><span>{message.content}</span></div>
        </div>)}
        <div ref={messageEndRef} />
      </div>

      <footer className="smart-assistant-input-area">
        <div className="smart-assistant-composer">
          <textarea
            value={input}
            maxLength={MAX_INPUT_LENGTH}
            rows={3}
            placeholder="请输入你想了解的问题……"
            onChange={event => setInput(event.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          <button type="button" onClick={sendMessage} disabled={!input.trim()} title="发送" aria-label="发送消息"><SendIcon /></button>
        </div>
        <small>{input.length}/{MAX_INPUT_LENGTH} · Enter 发送，Shift + Enter 换行</small>
      </footer>
    </section>}
  </>;
}
