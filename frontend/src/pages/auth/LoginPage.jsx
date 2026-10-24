import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, Mail, User, ShieldCheck, ArrowRight, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Please enter your username or registered email address.'),
  password: z.string().min(1, 'Please enter your password.'),
});

export default function LoginPage() {
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/student/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (values) => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const data = await authApi.login(values);
      login(data.access_token, data.user);
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const autofillDemo = (role) => {
    if (role === 'admin') {
      setValue('identifier', 'admin@mydc.org.za');
      setValue('password', 'MzamoAdmin2026!');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md">
        {/* Glassmorphism Card */}
        <div className="glass-panel rounded-2xl shadow-2xl p-8 transition-all">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-navy dark:bg-brand-teal text-white dark:text-slate-900 font-bold text-xl shadow-md mb-4">
              M
            </div>
            <h1 className="text-xl font-bold text-primary-text">Welcome Back</h1>
            <p className="text-xs text-secondary-text mt-1.5">
              Sign in to your Mzamo's Youth Development Company account
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Authentication Error</p>
                <p className="mt-0.5 leading-relaxed">{errorMsg}</p>
                {errorMsg.includes('locked') && (
                  <Link
                    to="/recovery"
                    className="inline-flex items-center gap-1 font-semibold text-brand-teal hover:underline mt-1.5"
                  >
                    Go to Account Recovery Centre &rarr;
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">
                Username or Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-text">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  {...register('identifier')}
                  placeholder="e.g. mzamo or student@example.co.za"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand-teal transition-all"
                  disabled={isSubmitting}
                />
              </div>
              {errors.identifier && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.identifier.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-primary-text">
                  Password <span className="text-rose-500">*</span>
                </label>
                <Link
                  to="/recovery"
                  className="text-[11px] font-medium text-brand-teal hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-text">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  {...register('password')}
                  placeholder="Enter your account password"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand-teal transition-all"
                  disabled={isSubmitting}
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-brand-navy dark:bg-brand-teal text-white dark:text-slate-900 text-xs font-bold hover:opacity-95 shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credential Autofill */}
          <div className="mt-6 pt-5 border-t border-border-color text-center">
            <span className="text-[11px] text-secondary-text block mb-2 font-medium">Quick System Access</span>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => autofillDemo('admin')}
                className="px-2.5 py-1 rounded-md text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
              >
                Autofill Admin
              </button>
            </div>
          </div>

          {/* Account Recovery Centre Callout */}
          <div className="mt-4 p-3 rounded-xl border border-border-color bg-surface-secondary/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-secondary-text">
              <ShieldCheck className="w-4 h-4 text-brand-teal" />
              <span>Need account assistance?</span>
            </div>
            <Link
              to="/recovery"
              className="text-brand-teal font-semibold hover:underline"
            >
              Recovery Centre
            </Link>
          </div>

          <div className="text-center mt-6">
            <p className="text-xs text-secondary-text">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-semibold text-brand-teal hover:underline">
                Create Student Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
