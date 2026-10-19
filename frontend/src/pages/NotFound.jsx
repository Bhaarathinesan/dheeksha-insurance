import React from 'react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import { AlertCircle, Home } from 'lucide-react';
import { useTranslation } from '../i18n';

const NotFound = () => {
  const { t } = useTranslation();
  useDocumentTitle(t('notFound.docTitle'));

  return (
    <div className="animate-fade-in py-20 md:py-28 bg-brand-light/30 dark:bg-brand-darkBg transition-colors duration-300 min-h-[60vh] flex items-center">
      <Container>
        <div className="max-w-xl mx-auto text-center px-4">
          <div className="w-20 h-20 rounded-3xl bg-brand-light dark:bg-brand-darkElevated text-brand-strong dark:text-brand-sky flex items-center justify-center mx-auto mb-6 shadow-sm border border-brand-sky/20">
            <AlertCircle size={40} />
          </div>
          <span className="text-sm font-bold tracking-widest text-brand-strong dark:text-brand-sky uppercase mb-2 block">
            {t('notFound.statusCode')}
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-brand-navy dark:text-text-darkPrimary mb-4">
            {t('notFound.title')}
          </h1>
          <p className="text-base md:text-lg text-text-secondary dark:text-text-darkSecondary mb-8 leading-relaxed">
            {t('notFound.description')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/">
              <Button variant="primary" className="flex items-center gap-2">
                <Home size={18} />
                {t('notFound.backHome')}
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default NotFound;
