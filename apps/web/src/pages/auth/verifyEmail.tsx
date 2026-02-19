import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MailCheck,
  MailX,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormAlert, type AlertState } from '@/components/form-alert';
import { AUTH_ENDPOINTS } from '@/lib/api-endpints';

type PageState = 'ready' | 'verifying' | 'success' | 'error';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [pageState, setPageState] = useState<PageState>(
    token ? 'ready' : 'error',
  );

  const [alert, setAlert] = useState<AlertState>(
    token
      ? null
      : {
          type: 'error',
          message:
            'No verification token found. Please use the link from your email.',
        },
  );

  const [countdown, setCountdown] = useState(5);
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendAlert, setResendAlert] = useState<AlertState>(null);

  const handleVerify = async () => {
    if (!token) return;

    setPageState('verifying');
    setAlert(null);

    try {
      const { data } = await axios.post(
        `${AUTH_ENDPOINTS.VERIFY_EMAIL}?token=${token}`,
        {}, // Empty body
        { withCredentials: true },
      );

      setPageState('success');
      setAlert({
        type: 'success',
        message: data?.message || 'Your email has been verified successfully!',
      });
    } catch (err) {
      setPageState('error');
      if (axios.isAxiosError(err)) {
        setAlert({
          type: 'error',
          message:
            err.response?.data?.message ??
            'Verification failed. The link may have expired.',
        });
      } else {
        setAlert({
          type: 'error',
          message: 'Network error. Please try again.',
        });
      }
    }
  };

  useEffect(() => {
    if (pageState !== 'success') return;
    const interval = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(interval);
          navigate('/login');
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pageState, navigate]);

  const handleResend = async () => {
    if (!resendEmail.trim()) {
      setResendAlert({
        type: 'error',
        message: 'Please enter your email address.',
      });
      return;
    }
    setResendLoading(true);
    try {
      const { data } = await axios.post(
        AUTH_ENDPOINTS.RESEND_VERIFICATION,
        { email: resendEmail.trim() },
        { withCredentials: true },
      );
      setResendAlert({
        type: 'success',
        message: data?.message || 'Email sent!',
      });
      setResendEmail('');
    } catch (err) {
      setResendAlert({ type: 'error', message: 'Failed to resend.' });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        {pageState === 'ready' && (
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Verify your email</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Click the button below to complete your registration.
              </p>
            </div>
            <Button className="w-full" size="lg" onClick={handleVerify}>
              Confirm Verification
            </Button>
          </div>
        )}

        {pageState === 'verifying' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h1 className="text-2xl font-bold">Verifying...</h1>
          </div>
        )}

        {pageState === 'success' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <MailCheck className="h-12 w-12 text-emerald-500" />
            <h1 className="text-2xl font-bold">Email Verified!</h1>
            {alert && <FormAlert alert={alert} className="w-full text-left" />}
            <p className="text-muted-foreground text-sm">
              Redirecting in <span className="font-semibold">{countdown}s</span>
              ...
            </p>
            <Button className="w-full" onClick={() => navigate('/login')}>
              Go to Sign In
            </Button>
          </div>
        )}

        {pageState === 'error' && (
          <div className="flex flex-col items-center gap-5 text-center">
            <MailX className="h-12 w-12 text-red-500" />
            <h1 className="text-2xl font-bold">Verification Failed</h1>
            {alert && <FormAlert alert={alert} className="w-full text-left" />}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowResend(!showResend)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Resend verification email
            </Button>
            {showResend && (
              <div className="flex w-full flex-col gap-3 rounded-xl border bg-muted/40 p-4 text-left">
                <Input
                  placeholder="Email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
                <Button onClick={handleResend} disabled={resendLoading}>
                  {resendLoading ? 'Sending...' : 'Send Link'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
