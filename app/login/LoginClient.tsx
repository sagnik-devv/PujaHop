'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconUser, IconSparkles } from '../../components/Icons';
import { useToast } from '../../lib/toast-context';

export default function LoginClient() {
  const router = useRouter();
  const { showToast } = useToast();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter your email and password', 'warning');
      return;
    }

    showToast(`Welcome ${name || 'Hopper'}! Signed in to PujaHop.`, 'success');
    setTimeout(() => {
      router.push('/');
    }, 800);
  };

  return (
    <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
      <div
        style={{
          background: '#FFFDF9',
          border: '1px solid var(--border-gold)',
          borderRadius: '8px',
          padding: '40px',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 16px 40px rgba(23,18,15,0.08)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Image src="/images/logo.png" alt="Logo" width={48} height={48} style={{ margin: '0 auto 12px' }} />
          <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif)', marginBottom: '4px' }}>
            PUJAHOP
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--taupe)' }}>
            Save your customized pandal hopping routes & crowd alerts
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'var(--warm-cream)', padding: '4px', borderRadius: '6px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => setTab('signin')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '4px',
              background: tab === 'signin' ? '#FFF' : 'transparent',
              fontWeight: 700,
              fontSize: '0.82rem',
              color: tab === 'signin' ? 'var(--foreground)' : 'var(--taupe)',
              boxShadow: tab === 'signin' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab('signup')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '4px',
              background: tab === 'signup' ? '#FFF' : 'transparent',
              fontWeight: 700,
              fontSize: '0.82rem',
              color: tab === 'signup' ? 'var(--foreground)' : 'var(--taupe)',
              boxShadow: tab === 'signup' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tab === 'signup' && (
            <div className="input-field-group">
              <label className="input-field-label">Your Name</label>
              <div className="input-field-wrapper" style={{ background: '#FFF' }}>
                <input
                  type="text"
                  placeholder="Sagnik Chakraborty"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="input-field-group">
            <label className="input-field-label">Email Address</label>
            <div className="input-field-wrapper" style={{ background: '#FFF' }}>
              <input
                type="email"
                placeholder="sagnik@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-field-group">
            <label className="input-field-label">Password</label>
            <div className="input-field-wrapper" style={{ background: '#FFF' }}>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-vermilion"
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '14px' }}
          >
            <IconSparkles size={16} />
            <span>{tab === 'signin' ? 'Sign In to PujaHop' : 'Create Free Account'}</span>
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--taupe)' }}>
          By signing in, you agree to PujaHop’s{' '}
          <Link href="/privacy" style={{ color: 'var(--vermilion)', textDecoration: 'underline' }}>
            Privacy Policy
          </Link>.
        </div>
      </div>
    </div>
  );
}
