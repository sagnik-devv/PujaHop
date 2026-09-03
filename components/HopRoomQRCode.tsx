'use client';

import React, { useEffect, useState } from 'react';
import { generateRoomQRCode } from '../lib/qr';
import { useToast } from '../lib/toast-context';

interface HopRoomQRCodeProps {
  roomCode: string;
  roomName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function HopRoomQRCode({
  roomCode,
  roomName,
  isOpen,
  onClose,
}: HopRoomQRCodeProps) {
  const { showToast } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !roomCode) return;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/hop/join/${roomCode}`;
    setInviteUrl(url);

    generateRoomQRCode(url, { width: 340, margin: 2 })
      .then(dataUrl => setQrDataUrl(dataUrl))
      .catch(err => console.error('Failed to render QR:', err));
  }, [isOpen, roomCode]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      showToast('Invite link copied to clipboard!', 'success');
    } catch {
      showToast(inviteUrl, 'info');
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Join ${roomName} on Pujo Navigation`,
          text: `Hop pandals together with live location sharing! Join room "${roomName}" with code ${roomCode}:`,
          url: inviteUrl,
        });
      } catch {
        // Ignored or cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFDF9',
          borderRadius: '12px',
          border: '1.5px solid var(--border-gold)',
          maxWidth: '420px',
          width: '100%',
          padding: '28px',
          textAlign: 'center',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--antique-gold)' }}>
            Scan to Join Hop Room
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--taupe)' }}
          >
            ✕
          </button>
        </div>

        <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', margin: '0 0 4px', color: 'var(--foreground)' }}>
          {roomName}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--taupe)', margin: '0 0 20px' }}>
          Have your friends scan this QR with their phone camera to join live location sharing.
        </p>

        {/* QR Display */}
        <div
          style={{
            background: '#FFFFFF',
            padding: '16px',
            borderRadius: '8px',
            display: 'inline-block',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            marginBottom: '16px',
          }}
        >
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code for room ${roomCode}`}
              width={260}
              height={260}
              style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
            />
          ) : (
            <div style={{ width: '260px', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--taupe)' }}>
              Generating QR...
            </div>
          )}
        </div>

        {/* Room Code Callout */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--taupe)', marginBottom: '4px' }}>
            Room Code
          </div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              letterSpacing: '4px',
              fontFamily: 'monospace',
              color: 'var(--vermilion)',
              background: 'var(--warm-cream)',
              display: 'inline-block',
              padding: '4px 20px',
              borderRadius: '6px',
              border: '1px solid var(--border-gold)',
            }}
          >
            {roomCode}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleCopyLink}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid var(--border-gold)',
              background: '#FFF',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--foreground)',
              cursor: 'pointer',
            }}
          >
            📋 Copy Link
          </button>
          <button
            type="button"
            onClick={handleNativeShare}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--gold-gradient)',
              fontSize: '13px',
              fontWeight: 700,
              color: '#17120F',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-gold)',
            }}
          >
            📲 Share Room
          </button>
        </div>
      </div>
    </div>
  );
}
