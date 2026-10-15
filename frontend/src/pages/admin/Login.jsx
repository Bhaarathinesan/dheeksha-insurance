import React, { useState } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../../utils/auth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Shield, AlertCircle } from 'lucide-react';

const Login = () => {
  useDocumentTitle('Admin Login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password.');
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
        throw new Error(data.detail || 'Invalid credentials');
      }

      const data = await response.json();
      setToken(data.access_token);
      navigate('/admin/dashboard');
      
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to the server. Please check your internet connection.'
          : err.message || 'An error occurred during login.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light dark:bg-brand-darkBg font-sans p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-brand-darkSurface rounded-3xl shadow-premium border border-ui-border dark:border-brand-darkBorder p-8 md:p-10 animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-brand-navy dark:bg-brand-darkElevated rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-transparent dark:border-brand-darkBorder">
            <Shield className="w-8 h-8 text-white dark:text-brand-sky" />
          </div>
          <h1 className="text-3xl font-bold text-brand-navy dark:text-text-darkPrimary mb-2">Admin Portal</h1>
          <p className="text-text-secondary dark:text-text-darkSecondary">Sign in to manage Dheeksha Insurance</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@dheekshainsurance.com"
            disabled={isLoading}
          />
          
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isLoading}
          />

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full py-4 text-lg mt-4"
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
