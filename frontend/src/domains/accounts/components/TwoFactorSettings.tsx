'use client';

/**
 * Two-Factor Authentication settings — enrollment, disable, and backup-code
 * regeneration. Lives in the Security tab of the user settings page.
 *
 * Enrollment flow: Enable → scan QR (or enter secret) → verify code → save backup codes.
 */

import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldOff, Loader2, Copy, Check, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '../services/auth.service';
import type { TwoFactorStatus } from '../types/auth.types';

type Phase = 'loading' | 'idle' | 'enrolling' | 'backup-codes';

export function TwoFactorSettings() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [busy, setBusy] = useState(false);

  // enrollment
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');

  // backup codes (shown once after enrolling/regenerating)
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // disable
  const [password, setPassword] = useState('');

  const loadStatus = async () => {
    try {
      const s = await authService.getTwoFactorStatus();
      setStatus(s);
      setPhase('idle');
    } catch {
      setStatus({ enabled: false, backupCodesCount: 0, lastUsed: null });
      setPhase('idle');
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const beginEnroll = async () => {
    setBusy(true);
    try {
      const setup = await authService.setupTwoFactorAuth();
      setQrCode(setup.qrCode);
      setSecret(setup.secret);
      setCode('');
      setPhase('enrolling');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to start 2FA setup');
    } finally {
      setBusy(false);
    }
  };

  const confirmEnroll = async () => {
    setBusy(true);
    try {
      const codes = await authService.verifyTwoFactorSetup(code.trim());
      setBackupCodes(codes);
      setPhase('backup-codes');
      toast.success('Two-factor authentication enabled');
    } catch (e: any) {
      toast.error(e?.message || 'Invalid code');
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!password) {
      toast.error('Enter your password to disable 2FA');
      return;
    }
    setBusy(true);
    try {
      await authService.disableTwoFactorAuth(password, code.trim() || undefined);
      setPassword('');
      setCode('');
      toast.success('Two-factor authentication disabled');
      await loadStatus();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to disable 2FA');
    } finally {
      setBusy(false);
    }
  };

  const regenerate = async () => {
    setBusy(true);
    try {
      const codes = await authService.regenerateBackupCodes(code.trim());
      setBackupCodes(codes);
      setCode('');
      setPhase('backup-codes');
      toast.success('New backup codes generated');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to regenerate backup codes');
    } finally {
      setBusy(false);
    }
  };

  const copyBackupCodes = async () => {
    await navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const doneWithBackupCodes = async () => {
    setBackupCodes([]);
    setQrCode('');
    setSecret('');
    await loadStatus();
  };

  if (phase === 'loading') {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading two-factor status…
      </div>
    );
  }

  // One-time backup codes view (after enabling or regenerating)
  if (phase === 'backup-codes') {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800 mb-1">Save your backup codes</p>
          <p className="text-xs text-amber-700">
            Each code works once if you lose access to your authenticator app. Store them somewhere safe — they won&apos;t be shown again.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          {backupCodes.map((c) => (
            <div key={c} className="text-neutral-800">{c}</div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyBackupCodes}>
            {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
            {copied ? 'Copied' : 'Copy codes'}
          </Button>
          <Button size="sm" onClick={doneWithBackupCodes}>I&apos;ve saved them</Button>
        </div>
      </div>
    );
  }

  // Enrollment view (QR + verify)
  if (phase === 'enrolling') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-neutral-600">
          Scan this QR code with Microsoft Authenticator, Google Authenticator, or any TOTP app — then enter the 6-digit code it shows.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {qrCode && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrCode} alt="2FA QR code" className="w-44 h-44 border border-neutral-200 rounded-lg" />
          )}
          <div className="space-y-3 flex-1">
            <div>
              <Label className="text-xs text-neutral-500">Can&apos;t scan? Enter this key manually</Label>
              <code className="block mt-1 text-sm bg-neutral-100 rounded px-2 py-1 break-all">{secret}</code>
            </div>
            <div className="space-y-2">
              <Label htmlFor="enrollCode">Verification code</Label>
              <Input
                id="enrollCode"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                className="tracking-[0.4em] text-center"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={confirmEnroll} disabled={busy || code.trim().length === 0}>
                {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-1" />}
                Verify & Enable
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setPhase('idle')} disabled={busy}>Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Idle: enabled or disabled
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status?.enabled ? (
            <ShieldCheck className="w-5 h-5 text-green-600" />
          ) : (
            <ShieldOff className="w-5 h-5 text-neutral-400" />
          )}
          <div>
            <p className="text-sm font-medium text-neutral-900">
              {status?.enabled ? 'Two-factor authentication is on' : 'Two-factor authentication is off'}
            </p>
            <p className="text-xs text-neutral-500">
              {status?.enabled
                ? `${status.backupCodesCount} backup code${status.backupCodesCount === 1 ? '' : 's'} remaining`
                : 'Add a 6-digit code from an authenticator app at login.'}
            </p>
          </div>
        </div>
        {!status?.enabled && (
          <Button size="sm" onClick={beginEnroll} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-1" />}
            Enable 2FA
          </Button>
        )}
      </div>

      {status?.enabled && (
        <div className="space-y-4 border-t border-neutral-100 pt-4">
          {/* Regenerate backup codes */}
          <div className="space-y-2">
            <Label htmlFor="regenCode" className="text-sm">Regenerate backup codes</Label>
            <div className="flex gap-2">
              <Input
                id="regenCode"
                inputMode="numeric"
                placeholder="Current 6-digit code"
                className="max-w-xs"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Button variant="outline" size="sm" onClick={regenerate} disabled={busy || code.trim().length === 0}>
                <KeyRound className="w-4 h-4 mr-1" /> Regenerate
              </Button>
            </div>
            <p className="text-xs text-neutral-500">Invalidates your old codes.</p>
          </div>

          {/* Disable */}
          <div className="space-y-2">
            <Label htmlFor="disablePw" className="text-sm">Disable two-factor authentication</Label>
            <div className="flex gap-2">
              <Input
                id="disablePw"
                type="password"
                placeholder="Your password"
                className="max-w-xs"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button variant="destructive" size="sm" onClick={disable} disabled={busy}>
                <ShieldOff className="w-4 h-4 mr-1" /> Disable
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
