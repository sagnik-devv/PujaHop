'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconUser, IconSparkles } from '../../components/Icons';
import { useToast } from '../../lib/toast-context';
import { useAuth } from '../../lib/auth-context';

export default function LoginClient() {
  const router = useRouter();
  const { user, signIn, signUp, sendEmailOtp, verifyEmailOtp, signOut, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState<'otp' | 'signin' | 'signup'>('otp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Timer countdown for OTP resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Handle Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please enter your email address', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await sendEmailOtp(email);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        setOtpSent(true);
        setResendTimer(60);
        showToast(res.message || '6-digit verification code sent to your email!', 'success');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      showToast('Please enter the 6-digit verification code', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await verifyEmailOtp(email, otpCode, name);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast('Email verified successfully! Signed in.', 'success');
        setTimeout(() => {
          router.push('/hop');
        }, 500);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Password Signin / Signup
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter your email and password', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (tab === 'signup') {
        const res = await signUp(email, password, name);
        if (res.error) {
          showToast(res.error, 'error');
          return;
        }
        showToast(`Welcome ${name || 'Hopper'}! Account created.`, 'success');
      } else {
        const res = await signIn(email, password);
        if (res.error) {
          showToast(res.error, 'error');
          return;
        }
        showToast('Welcome back! Signed in.', 'success');
      }
      setTimeout(() => {
        router.push('/hop');
      }, 500);
    } finally {
      setSubmitting(false);
    }
  };

  if (!authLoading && user) {
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
            textAlign: 'center',
            boxShadow: '0 16px 40px rgba(23,18,15,0.08)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--vermilion)',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 700,
              margin: '0 auto 16px',
            }}
          >
            {user.name?.charAt(0).toUpperCase() || 'H'}
          </div>
          <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', margin: '0 0 4px' }}>
            {user.name || 'Pujo Hopper'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--taupe)', margin: '0 0 24px' }}>
            {user.email}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link
              href="/hop"
              className="btn btn-vermilion"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              Go to Pandal Hop Room 📡
            </Link>
            <button
              type="button"
              onClick={signOut}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--taupe)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--background)', minHeight: 'calc(100vh - var(--header-height))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
      <div
        style={{
          background: '#FFFDF9',
          border: '1px solid var(--border-gold)',
          borderRadius: '8px',
          padding: '36px',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 16px 40px rgba(23,18,15,0.08)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Image src="/images/logo.png" alt="Pujo Navigation Logo" width={48} height={48} style={{ margin: '0 auto 12px', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '1.7rem', fontFamily: 'var(--font-serif)', marginBottom: '4px' }}>
            PUJO NAVIGATION
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--taupe)' }}>
            Email OTP Verification & Account Sign In
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'var(--warm-cream)', padding: '4px', borderRadius: '6px', marginBottom: '22px' }}>
          <button
            type="button"
            onClick={() => { setTab('otp'); setOtpSent(false); }}
            style={{
              flex: 1,
              padding: '9px 4px',
              borderRadius: '4px',
              background: tab === 'otp' ? '#FFF' : 'transparent',
              fontWeight: 700,
              fontSize: '0.8rem',
              color: tab === 'otp' ? 'var(--vermilion)' : 'var(--taupe)',
              boxShadow: tab === 'otp' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Email OTP ✨
          </button>
          <button
            type="button"
            onClick={() => setTab('signin')}
            style={{
              flex: 1,
              padding: '9px 4px',
              borderRadius: '4px',
              background: tab === 'signin' ? '#FFF' : 'transparent',
              fontWeight: 700,
              fontSize: '0.8rem',
              color: tab === 'signin' ? 'var(--foreground)' : 'var(--taupe)',
              boxShadow: tab === 'signin' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab('signup')}
            style={{
              flex: 1,
              padding: '9px 4px',
              borderRadius: '4px',
              background: tab === 'signup' ? '#FFF' : 'transparent',
              fontWeight: 700,
              fontSize: '0.8rem',
              color: tab === 'signup' ? 'var(--foreground)' : 'var(--taupe)',
              boxShadow: tab === 'signup' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Tab 1: Email OTP Code */}
        {tab === 'otp' && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-field-group">
                  <label className="input-field-label">Email Address for Verification</label>
                  <div className="input-field-wrapper" style={{ background: '#FFF' }}>
                    <input
                      type="email"
                      placeholder="sagnik@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--taupe)', marginTop: '4px', display: 'block' }}>
                    We'll send a 6-digit one-time code to this email. No password needed.
                  </span>
                </div>

                <div className="input-field-group">
                  <label className="input-field-label">Your Name (Optional)</label>
                  <div className="input-field-wrapper" style={{ background: '#FFF' }}>
                    <input
                      type="text"
                      placeholder="e.g. Sagnik Chakraborty"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-vermilion"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '4px', padding: '13px' }}
                >
                  <IconSparkles size={16} />
                  <span>{submitting ? 'Sending Code...' : 'Send Verification OTP'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'var(--warm-cream)', border: '1px solid var(--border-gold)', borderRadius: '6px', padding: '12px', fontSize: '12px' }}>
                  Code sent to <strong>{email}</strong>.{' '}
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--vermilion)', cursor: 'pointer', padding: 0, fontWeight: 700, textDecoration: 'underline' }}
                  >
                    Change
                  </button>
                </div>

                <div className="input-field-group">
                  <label className="input-field-label">Enter 6-Digit OTP Code</label>
                  <div className="input-field-wrapper" style={{ background: '#FFF' }}>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      style={{ letterSpacing: '6px', fontSize: '1.2rem', textAlign: 'center', fontWeight: 700 }}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || otpCode.length < 6}
                  className="btn btn-vermilion"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '4px', padding: '13px' }}
                >
                  <span>{submitting ? 'Verifying...' : 'Verify OTP & Sign In'}</span>
                </button>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                  {resendTimer > 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--taupe)' }}>
                      Resend code in {resendTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={submitting}
                      style={{ background: 'none', border: 'none', color: 'var(--antique-gold)', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                    >
                      Resend OTP Code
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 2 & 3: Password Sign In / Sign Up */}
        {(tab === 'signin' || tab === 'signup') && (
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              disabled={submitting}
              className="btn btn-vermilion"
              style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '14px' }}
            >
              <IconSparkles size={16} />
              <span>
                {submitting
                  ? 'Please wait...'
                  : tab === 'signin'
                  ? 'Sign In with Password'
                  : 'Create Free Account'}
              </span>
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--taupe)' }}>
          By continuing, you agree to Pujo Navigation’s{' '}
          <Link href="/privacy" style={{ color: 'var(--vermilion)', textDecoration: 'underline' }}>
            Privacy Policy
          </Link>.
        </div>
      </div>
    </div>
  );
}
