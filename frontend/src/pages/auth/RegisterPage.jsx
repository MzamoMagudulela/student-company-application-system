import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Mail, Lock, Phone, ArrowRight, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api';

const registerSchema = z
  .object({
    first_name: z.string().min(2, 'First name must be at least 2 characters.'),
    last_name: z.string().min(2, 'Last name must be at least 2 characters.'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters.')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Letters, numbers, underscores, and dashes only.'),
    email: z.string().email('Please enter a valid email address.'),
    phone_number: z.string().optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter.')
      .regex(/[0-9]/, 'Must contain at least one number.'),
    password_confirm: z.string().min(8, 'Please confirm your password.'),
    terms_accepted: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms of service and privacy policy.',
    }),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Passwords do not match.',
    path: ['password_confirm'],
  });

export default function RegisterPage() {
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      phone_number: '',
      password: '',
      password_confirm: '',
      terms_accepted: false,
    },
  });

  const onSubmit = async (values) => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const data = await authApi.register(values);
      login(data.access_token, data.user);
      navigate('/student/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please check your entries.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-lg">
        <div className="glass-panel rounded-2xl shadow-2xl p-8 transition-all">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-teal text-white font-bold text-xl shadow-md mb-3">
              M
            </div>
            <h1 className="text-xl font-bold text-primary-text">Create Student Account</h1>
            <p className="text-xs text-secondary-text mt-1">
              Join Mzamo's Youth Development Company career platform
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Registration Issue</p>
                <p className="mt-0.5 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('first_name')}
                  placeholder="e.g. Sandile"
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  disabled={isSubmitting}
                />
                {errors.first_name && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('last_name')}
                  placeholder="e.g. Magudulela"
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  disabled={isSubmitting}
                />
                {errors.last_name && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-text">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    {...register('username')}
                    placeholder="e.g. sandile_m"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.username && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-text">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    {...register('phone_number')}
                    placeholder="e.g. +27 82 123 4567"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.phone_number && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.phone_number.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-text">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="e.g. student@institution.ac.za"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-text">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="password"
                    {...register('password')}
                    placeholder="Min 8 chars, 1 uppercase, 1 digit"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.password && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-text">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="password"
                    {...register('password_confirm')}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-border-color bg-surface text-primary-text text-xs placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.password_confirm && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.password_confirm.message}</p>
                )}
              </div>
            </div>

            {/* Terms and Privacy Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('terms_accepted')}
                  className="mt-0.5 rounded border-border-color text-brand-teal focus:ring-brand-teal"
                  disabled={isSubmitting}
                />
                <span className="text-[11px] text-secondary-text leading-tight">
                  I acknowledge and accept the{' '}
                  <span className="text-brand-teal font-medium">Terms of Service</span> and{' '}
                  <span className="text-brand-teal font-medium">Privacy Policy</span> of Mzamo's Youth Development Company.
                </span>
              </label>
              {errors.terms_accepted && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.terms_accepted.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg bg-brand-teal hover:bg-brand-teal-hover text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Your Profile...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 pt-5 border-t border-border-color">
            <p className="text-xs text-secondary-text">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-brand-teal hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
