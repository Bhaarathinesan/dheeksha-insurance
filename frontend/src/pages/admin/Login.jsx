import React, { useState } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../../utils/auth';
import { useTranslation } from '../../i18n';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import ThemeToggle from '../../components/common/ThemeToggle';
import { Shield, AlertCircle } from 'lucide-react';

const Login = () => {
  const { t } = useTranslation();
  useDocumentTitle(t('admin.login.docTitle'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError(t('admin.login.emptyFieldsError'));
      return;
    }
    
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const data = await response.json();
        const detailMsg = typeof data.detail === 'string' ? data.detail : '';
        if (
          response.status === 401 ||
          detailMsg.toLowerCase().includes('credential') ||
          detailMsg.toLowerCase().includes('incorrect')
        ) {
          throw new Error('INVALID_CREDENTIALS');
        }
        throw new Error(detailMsg || 'LOGIN_FAILED');
      }

      const data = await response.json();
      setToken(data.access_token);
      navigate('/admin/dashboard');
      
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        setError(t('admin.login.networkError'));
      } else if (err.message === 'INVALID_CREDENTIALS') {
        setError(t('admin.login.invalidCredentials'));
      } else {
        setError(err.message === 'LOGIN_FAILED' ? t('admin.login.defaultError') : (err.message || t('admin.login.defaultError')));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light dark:bg-brand-darkBg font-sans p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-brand-darkSurface rounded-3xl shadow-premium border border-ui-border dark:border-brand-darkBorder p-8 md:p-10 animate-fade-in relative">
        <div className="flex justify-end items-center gap-2 mb-6">
          <LanguageSwitcher id="admin-login-language-switcher" size="sm" />
          <ThemeToggle id="admin-login-theme-toggle" />
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-navy dark:bg-brand-darkElevated rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-transparent dark:border-brand-darkBorder">
            <Shield className="w-8 h-8 text-white dark:text-brand-sky" />
          </div>
          <h1 className="text-3xl font-bold text-brand-navy dark:text-text-darkPrimary mb-2">
            {t('admin.login.heading')}
          </h1>
          <p className="text-text-secondary dark:text-text-darkSecondary">
            {t('admin.login.subtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300 p-4 rounded-xl border border-red-100 dark:border-red-800/40 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            id="admin-email"
            name="admin-email"
            label={t('admin.login.emailLabel')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('admin.login.emailPlaceholder')}
            disabled={isLoading}
            required
          />
          
          <Input
            id="admin-password"
            name="admin-password"
            label={t('admin.login.passwordLabel')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('admin.login.passwordPlaceholder')}
            disabled={isLoading}
            required
          />

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full py-4 text-lg mt-4"
            disabled={isLoading}
          >
            {isLoading ? t('admin.login.authenticating') : t('admin.login.signInBtn')}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;

