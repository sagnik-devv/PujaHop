'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { IconClose, IconSparkles } from './Icons';

interface Message {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  suggestedAction?: {
    label: string;
    href: string;
  };
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text: 'নমস্কার! I am your PujaHop AI Assistant. Tell me your starting location, budget, or preferred pandals, and I will recommend the smartest route.',
    },
  ]);

  const quickPrompts = [
    'I am near Sealdah with ₹150. Suggest 4 famous pandals.',
    'Fastest way to visit Sreebhumi & Baghbazar via Metro.',
    'Less crowded North Kolkata Sabeki pandals.',
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');

    // Generate smart context-aware response based on real data
    setTimeout(() => {
      let reply = '';
      let action: { label: string; href: string } | undefined;

      const lower = text.toLowerCase();
      if (lower.includes('sealdah') || lower.includes('150') || lower.includes('budget')) {
        reply =
          'From Sealdah, take the Green Line Metro to Phoolbagan or switch at Central. Here is a high-yield 4-pandal route: 1) Chaltabagan Lohapatty 2) Amherst Street 3) Baghbazar Sarbojanin 4) Kumartuli Park. Total Metro + Toto fare is approx ₹65!';
        action = { label: 'Open in Hop Planner', href: '/planner' };
      } else if (lower.includes('sreebhumi')) {
        reply =
          'Sreebhumi Sporting Club attracts massive crowds on VIP Road. The smartest route is taking the Blue Line Metro to Belgachia Station, then boarding a designated Puja Auto/Toto directly to the VIP Road gate.';
        action = { label: 'View Sreebhumi Route', href: '/route?to=87' };
      } else if (lower.includes('north') || lower.includes('sabeki') || lower.includes('crowd')) {
        reply =
          'For authentic Sabeki idols with manageable lines before 8 PM, explore the Shyambazar-Shobhabazar corridor: Ahiritola Jubak Brinda, Baghbazar Palli, and Darjeepara Sarbojanin.';
        action = { label: 'Explore North Pandals', href: '/explore?region=North+Kolkata' };
      } else {
        reply =
          'I have analyzed Kolkata’s 248 verified pandals and Metro network. For an optimal hopping route with minimal traffic delays, I recommend combining Blue Line Metro with short walking hops.';
        action = { label: 'Explore 248 Pandals', href: '/explore' };
      }

      setMessages(prev => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: reply,
          suggestedAction: action,
        },
      ]);
    }, 600);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ai-fab"
        aria-label="Open Puja AI Assistant"
      >
        <span style={{ fontSize: '1.2rem' }}>🤖</span>
        <span>Puja AI</span>
        <IconSparkles size={14} color="#D4B77A" />
      </button>

      {/* Chat Drawer */}
      {isOpen && (
        <div className="ai-drawer" role="dialog" aria-label="Puja AI Chat">
          {/* Header */}
          <div className="ai-drawer-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🤖</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>PujaHop AI Guide</div>
                <div style={{ fontSize: '0.7rem', color: '#D4B77A' }}>Live Transit & Route Intelligence</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ color: '#FFF' }}
              aria-label="Close chat"
            >
              <IconClose size={20} />
            </button>
          </div>

          {/* Quick Prompts */}
          <div style={{ padding: '8px 12px', background: '#F4ECE1', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '6px', overflowX: 'auto' }}>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 8px',
                  background: '#FFF',
                  borderRadius: '12px',
                  whiteSpace: 'nowrap',
                  border: '1px solid #D8CBB8',
                  color: '#4A3B2C',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="ai-messages-list">
            {messages.map(m => (
              <div key={m.id} className={`ai-message ${m.sender}`}>
                <p>{m.text}</p>
                {m.suggestedAction && (
                  <div style={{ marginTop: '8px' }}>
                    <Link
                      href={m.suggestedAction.href}
                      onClick={() => setIsOpen(false)}
                      className="btn btn-vermilion btn-sm"
                      style={{ padding: '4px 10px', fontSize: '0.72rem', display: 'inline-flex' }}
                    >
                      {m.suggestedAction.label} →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input form */}
          <form
            className="ai-input-form"
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              placeholder="Ask for routes, metro tips, timings..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button type="submit" className="btn btn-vermilion btn-sm" style={{ padding: '6px 14px' }}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
