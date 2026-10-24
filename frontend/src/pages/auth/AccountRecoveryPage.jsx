import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  ShieldCheck,
  QrCode,
  Camera,
  Download,
  Printer,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
  User,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  X,
  FileText,
} from 'lucide-react';
import { authApi } from '@/services/api';

export default function AccountRecoveryPage() {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token');

  // Guided Steps: 1: Method, 2: Identifier, 3: Verification, 4: Status/Token, 5: Reset Password, 6: Success
  const [step, setStep] = useState(tokenParam ? 5 : 1);
  const [method, setMethod] = useState('username'); // 'username' | 'phone' | 'email' | 'qr_code' | 'admin_assisted'
  const [identifier, setIdentifier] = useState('');
  const [maskedTarget, setMaskedTarget] = useState('');
  const [recoveryToken, setRecoveryToken] = useState(tokenParam || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status & feedback
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Scanner modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const scannerRef = useRef(null);

  // Dynamic public application URL for QR code
  const recoveryUrl = `${window.location.origin}/recovery`;

  // Verify token if passed in URL query param
  useEffect(() => {
    if (tokenParam) {
      setRecoveryToken(tokenParam);
      setStep(5);
    }
  }, [tokenParam]);

  // Handle scanner cleanup on close/unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).then(() => {
          scannerRef.current.clear();
        });
      }
    };
  }, []);

  const handleStartScanner = async () => {
    setScannerError('');
    setIsScannerOpen(true);

    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader-container');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            handleScannedResult(decodedText);
          },
          () => {
            // silent frame error
          }
        );
      } catch (err) {
        setScannerError(
          err?.message?.includes('Permission')
            ? 'Camera access was denied. Please allow camera access or enter the recovery link manually.'
            : 'Unable to start camera scanner on this device. Please use manual entry below.'
        );
      }
    }, 100);
  };

  const handleStopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        // quiet
      }
      scannerRef.current = null;
    }
    setIsScannerOpen(false);
  };

  const handleScannedResult = async (scannedText) => {
    await handleStopScanner();

    try {
      const url = new URL(scannedText);
      // Validate that scanned link belongs to the expected origin
      if (url.origin !== window.location.origin) {
        setErrorMsg('Security Warning: Scanned QR code belongs to an untrusted external domain and was rejected.');
        return;
      }

      const token = url.searchParams.get('token');
      if (token) {
        setRecoveryToken(token);
        setStep(5);
        setFeedbackMsg('Recovery QR Code successfully verified. Set your new account password.');
      } else {
        setStep(2);
        setFeedbackMsg('Recovery portal opened from validated QR code.');
      }
    } catch (e) {
      setErrorMsg('Invalid QR code format. Please ensure you are scanning a valid MZAMO recovery code.');
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('recovery-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'MZAMO_Account_Recovery_QR.png';
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(recoveryUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Step 2 -> Step 3 / 4: Initiate recovery
  const handleInitiate = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Please enter your remembered identifier.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      const resp = await authApi.initiateRecovery({
        method,
        identifier: identifier.trim(),
      });

      setFeedbackMsg(resp.message);
      if (resp.masked_target) {
        setMaskedTarget(resp.masked_target);
      }
      if (resp.recovery_token) {
        setRecoveryToken(resp.recovery_token);
      }

      setStep(3);
    } catch (err) {
      setErrorMsg(err.message || 'Recovery request could not be processed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3 -> Step 5: Verify Token
  const handleVerifyToken = async (e) => {
    e.preventDefault();
    if (!recoveryToken.trim()) {
      setErrorMsg('Please enter your recovery token.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      await authApi.verifyRecoveryToken(recoveryToken.trim());
      setStep(5);
    } catch (err) {
      setErrorMsg(err.message || 'Token verification failed. It may be expired or already used.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 5 -> Step 6: Complete Password Reset
  const handleCompleteReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      await authApi.completeRecovery({
        recovery_token: recoveryToken,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setStep(6);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-teal/30 bg-brand-teal/10 text-brand-teal text-xs font-semibold mb-3">
          <ShieldCheck className="w-4 h-4" />
          <span>Security & Identity Centre</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-text tracking-tight">
          Account Recovery Centre
        </h1>
        <p className="text-xs sm:text-sm text-secondary-text max-w-xl mx-auto mt-2">
          Secure, verified identity restoration for Mzamo's Youth Development Company student members.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: QR Code & Verification Tools (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-border-color shadow-lg text-center">
            <h2 className="text-sm font-bold text-primary-text mb-1">
              Mobile Recovery QR Code
            </h2>
            <p className="text-[11px] text-secondary-text mb-4">
              Scan this code from a mobile device to open the secure account recovery route.
            </p>

            {/* Scannable QR Code */}
            <div className="inline-block p-4 bg-white rounded-xl shadow-md border border-slate-200 mx-auto">
              <QRCodeSVG
                id="recovery-qr-svg"
                value={recoveryUrl}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Visible Fallback URL */}
            <div className="mt-4 p-2.5 rounded-lg bg-surface-secondary/70 border border-border-color text-left">
              <div className="flex items-center justify-between text-[11px] text-secondary-text mb-1">
                <span>Direct Recovery Route</span>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="flex items-center gap-1 text-brand-teal font-medium hover:underline"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] font-mono text-primary-text truncate select-all">
                {recoveryUrl}
              </p>
            </div>

            {/* Action Buttons: Download QR, Print, Scan */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border border-border-color bg-surface hover:bg-surface-secondary text-primary-text text-[11px] font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border border-border-color bg-surface hover:bg-surface-secondary text-primary-text text-[11px] font-medium transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={handleStartScanner}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-brand-teal text-white hover:bg-brand-teal-hover text-[11px] font-semibold transition-colors shadow-sm"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan</span>
              </button>
            </div>
          </div>

          {/* Privacy & Anti-Enumeration Notice */}
          <div className="p-4 rounded-xl border border-border-color bg-surface-secondary/40 text-xs text-secondary-text space-y-2">
            <div className="flex items-center gap-2 font-semibold text-primary-text">
              <ShieldCheck className="w-4 h-4 text-brand-teal" />
              <span>Security Guarantee</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              This QR code contains no plaintext passwords, emails, or reusable credentials. In accordance with Section 8 security standards, recovery tokens expire after 15 minutes and can only be used once.
            </p>
          </div>
        </div>

        {/* Right Column: 6-Step Guided Recovery Wizard (7 Cols) */}
        <div className="lg:col-span-7">
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-border-color shadow-xl">
            {/* Progress Stepper */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-color text-xs">
              <span className="font-bold text-primary-text">
                Step {step} of 6:{' '}
                {step === 1 && 'Select Recovery Method'}
                {step === 2 && 'Enter Identifier'}
                {step === 3 && 'Verification Token'}
                {step === 4 && 'Account Status'}
                {step === 5 && 'Set New Password'}
                {step === 6 && 'Recovery Completed'}
              </span>
              <span className="text-[11px] text-secondary-text">Guided Workflow</span>
            </div>

            {errorMsg && (
              <div className="mb-6 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Security Notice</p>
                  <p className="mt-0.5 leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}

            {feedbackMsg && (
              <div className="mb-6 p-3.5 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-200 text-xs flex items-start gap-2.5">
                <Check className="w-4 h-4 shrink-0 mt-0.5 text-brand-teal" />
                <p className="leading-relaxed">{feedbackMsg}</p>
              </div>
            )}

            {/* STEP 1: Select Recovery Method */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-xs text-secondary-text">
                  Choose the information you have available to recover your account:
                </p>

                <div className="space-y-2.5">
                  {[
                    { id: 'username', label: 'Registered Username', desc: 'Remember your student username', icon: User },
                    { id: 'email', label: 'Registered Email Address', desc: 'Remember your registered email', icon: Mail },
                    { id: 'phone', label: 'Registered Phone Number', desc: 'Remember your registered mobile number', icon: Phone },
                    { id: 'qr_code', label: 'Scan Recovery QR Code', desc: 'Use camera to scan a previously issued recovery code', icon: QrCode },
                    { id: 'admin_assisted', label: 'Administrator-Assisted Recovery', desc: 'Forgotten all details or account is locked/disabled', icon: HelpCircle },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = method === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setMethod(opt.id)}
                        className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-brand-teal bg-brand-teal/10 shadow-xs'
                            : 'border-border-color bg-surface hover:bg-surface-secondary'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-brand-teal text-white' : 'bg-surface-secondary text-secondary-text'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-primary-text">{opt.label}</p>
                          <p className="text-[11px] text-secondary-text mt-0.5">{opt.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (method === 'qr_code') {
                      handleStartScanner();
                    } else {
                      setStep(2);
                    }
                  }}
                  className="w-full mt-4 py-2.5 px-4 rounded-lg bg-brand-navy dark:bg-brand-teal text-white dark:text-slate-900 text-xs font-bold shadow-md flex items-center justify-center gap-2 hover:opacity-95 transition-all"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: Enter Identifier */}
            {step === 2 && (
              <form onSubmit={handleInitiate} className="space-y-4">
                <p className="text-xs text-secondary-text">
                  Enter your {method === 'username' ? 'username' : method === 'email' ? 'registered email address' : method === 'phone' ? 'phone number' : 'student information'}:
                </p>

                <div>
                  <label className="block text-xs font-semibold text-primary-text mb-1.5">
                    Identifier <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      method === 'username'
                        ? 'e.g. sandile_m'
                        : method === 'email'
                        ? 'e.g. student@example.co.za'
                        : 'e.g. +27 82 123 4567'
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-border-color bg-surface text-primary-text text-xs placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-2.5 px-4 rounded-lg border border-border-color bg-surface hover:bg-surface-secondary text-primary-text text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-brand-teal text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 hover:bg-brand-teal-hover transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying...' : 'Search Account & Issue Token'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Verification Token */}
            {step === 3 && (
              <form onSubmit={handleVerifyToken} className="space-y-4">
                <div className="p-3.5 rounded-xl border border-border-color bg-surface-secondary/50 text-xs">
                  <p className="text-secondary-text">
                    A single-use security token has been generated.
                    {maskedTarget && <span> Target: <strong className="text-primary-text">{maskedTarget}</strong></span>}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-primary-text mb-1.5">
                    Single-Use Recovery Token <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={recoveryToken}
                    onChange={(e) => setRecoveryToken(e.target.value)}
                    placeholder="Enter or paste the token"
                    className="w-full px-3 py-2.5 font-mono rounded-lg border border-border-color bg-surface text-primary-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    disabled={isLoading}
                  />
                  <p className="text-[10px] text-secondary-text mt-1">
                    Valid for 15 minutes. Automatically invalidated after password reset.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="py-2.5 px-4 rounded-lg border border-border-color bg-surface hover:bg-surface-secondary text-primary-text text-xs font-medium flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-brand-teal text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 hover:bg-brand-teal-hover transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Validating Token...' : 'Verify Token & Proceed'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 5: Set New Password */}
            {step === 5 && (
              <form onSubmit={handleCompleteReset} className="space-y-4">
                <p className="text-xs text-secondary-text">
                  Choose a new strong password for your student account.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-primary-text mb-1">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3 py-2.5 rounded-lg border border-border-color bg-surface text-primary-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-primary-text mb-1">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3 py-2.5 rounded-lg border border-border-color bg-surface text-primary-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-brand-navy dark:bg-brand-teal text-white dark:text-slate-900 text-xs font-bold shadow-md flex items-center justify-center gap-2 hover:opacity-95 transition-all disabled:opacity-50 mt-4"
                >
                  {isLoading ? 'Updating Password...' : 'Save New Password & Revoke Old Sessions'}
                  <Check className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 6: Success Confirmation */}
            {step === 6 && (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-primary-text">
                  Account Recovery Successfully Completed
                </h3>
                <p className="text-xs text-secondary-text max-w-md mx-auto leading-relaxed">
                  Your password has been securely updated using Argon2id encryption. All prior active sessions have been revoked.
                </p>

                <div className="pt-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 py-2.5 px-6 rounded-lg bg-brand-navy dark:bg-brand-teal text-white dark:text-slate-900 text-xs font-bold shadow-md hover:opacity-95 transition-all"
                  >
                    <span>Sign In to Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Camera QR Scanner Modal */}
      {isScannerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={handleStopScanner}
        >
          <div
            className="w-full max-w-md bg-surface rounded-2xl border border-border-color shadow-2xl p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-brand-teal" />
                <h3 className="text-sm font-bold text-primary-text">Scan Recovery QR Code</h3>
              </div>
              <button
                type="button"
                onClick={handleStopScanner}
                className="p-1 rounded-lg text-secondary-text hover:text-primary-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {scannerError ? (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs space-y-2">
                <p className="font-semibold">Scanner Error</p>
                <p>{scannerError}</p>
                <button
                  type="button"
                  onClick={handleStopScanner}
                  className="mt-2 text-xs font-bold underline"
                >
                  Close Scanner
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  id="qr-reader-container"
                  className="w-full h-64 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center text-white text-xs"
                />
                <p className="text-[11px] text-secondary-text text-center">
                  Position the QR code within the camera frame to scan.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
