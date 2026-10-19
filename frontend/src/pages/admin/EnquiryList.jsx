import React, { useEffect, useState } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Link, useNavigate } from 'react-router-dom';
import { getToken, removeToken } from '../../utils/auth';
import { useTranslation, useLanguage } from '../../i18n';
import Button from '../../components/ui/Button';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import ThemeToggle from '../../components/common/ThemeToggle';
import { Search, ChevronLeft, ChevronRight, Eye, LogOut } from 'lucide-react';

// Format helpers using i18n
const formatRequirement = (req, t) => {
  const map = {
    'new-insurance': 'form.requirements.newInsurance',
    'renewal': 'form.requirements.renewal',
    'claim': 'form.requirements.claim',
    'policy': 'form.requirements.policy',
    'other': 'form.requirements.other',
  };
  return map[req] ? t(map[req]) : (req ? req.replace('-', ' ') : '');
};

const formatVehicleType = (type, t) => {
  const map = {
    'two-wheeler': 'form.vehicleTypes.twoWheeler',
    'private-car': 'form.vehicleTypes.privateCar',
    'commercial': 'form.vehicleTypes.commercial',
    'heavy': 'form.vehicleTypes.heavy',
    'other': 'form.vehicleTypes.other',
  };
  return map[type] ? t(map[type]) : (type ? type.replace('-', ' ') : '');
};

const EnquiryList = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  useDocumentTitle(t('admin.enquiries.docTitle'));

  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const limit = 20;

  const navigate = useNavigate();

  const fetchEnquiries = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const skip = (page - 1) * limit;
      let url = `${import.meta.env.VITE_API_BASE_URL}/enquiries?limit=${limit}&skip=${skip}&sort_by=${sortBy}`;
      if (status) url += `&status=${status}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          removeToken();
          navigate('/admin/login');
          return;
        }
        throw new Error('Failed to fetch enquiries');
      }

      const data = await response.json();
      setEnquiries(data);
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? t('admin.errors.serverConnection')
          : (err.message || t('admin.errors.fetchFailed'))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEnquiries();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, status, sortBy, page]);

  const handleLogout = () => {
    removeToken();
    navigate('/admin/login');
  };

  const getStatusBadge = (s) => {
    const styles = {
      'NEW': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      'CONTACTED': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
      'IN_PROGRESS': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
      'COMPLETED': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      'INCOMPLETE': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      'CANCELLED': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    };
    const translatedStatus = t(`admin.status.${s}`, {}, s.replace('_', ' '));
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[s] || 'bg-gray-100 text-gray-700 dark:bg-brand-darkElevated dark:text-text-darkSecondary'}`}>
        {translatedStatus}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-darkBg pb-20 transition-colors duration-300">
      <nav className="bg-brand-navy dark:bg-brand-darkSurface text-white py-4 px-6 sticky top-0 z-50 shadow-md border-b border-transparent dark:border-brand-darkBorder transition-colors">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-sky rounded flex items-center justify-center">
                <span className="text-brand-navy font-bold">D</span>
              </div>
              <span className="font-bold text-xl hidden sm:block">{t('admin.nav.portalTitle')}</span>
            </Link>
            <div className="hidden sm:flex gap-4 ml-6 border-l border-white/20 pl-6">
              <Link to="/admin/dashboard" className="text-brand-light hover:text-white transition-colors">{t('admin.nav.dashboard')}</Link>
              <Link to="/admin/enquiries" className="text-white font-medium">{t('admin.nav.enquiries')}</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher id="admin-enquiries-language-switcher" size="sm" />
            <ThemeToggle id="admin-theme-toggle" />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-brand-light hover:text-white transition-colors text-sm font-medium"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">{t('admin.nav.signOut')}</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-navy dark:text-text-darkPrimary">{t('admin.enquiries.heading')}</h1>
            <p className="text-text-secondary dark:text-text-darkSecondary text-sm">{t('admin.enquiries.subtitle')}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-brand-darkSurface p-4 rounded-2xl shadow-sm border border-ui-border dark:border-brand-darkBorder mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 transition-colors">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5 pointer-events-none" />
              <input 
                type="text" 
                placeholder={t('admin.enquiries.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-brand-darkBorder rounded-xl focus:ring-2 focus:ring-brand-sky focus:border-brand-sky outline-none transition-all text-sm text-brand-navy dark:text-text-darkPrimary placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-white dark:bg-brand-darkElevated"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
          
          <select 
            aria-label={t('admin.dashboard.filterByStatus')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-brand-darkBorder rounded-xl focus:ring-2 focus:ring-brand-sky outline-none bg-white dark:bg-brand-darkElevated text-brand-navy dark:text-text-darkPrimary text-sm transition-all"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">{t('admin.enquiries.allStatuses')}</option>
            <option value="NEW">{t('admin.status.NEW')}</option>
            <option value="CONTACTED">{t('admin.status.CONTACTED')}</option>
            <option value="IN_PROGRESS">{t('admin.status.IN_PROGRESS')}</option>
            <option value="COMPLETED">{t('admin.status.COMPLETED')}</option>
            <option value="INCOMPLETE">{t('admin.status.INCOMPLETE')}</option>
            <option value="CANCELLED">{t('admin.status.CANCELLED')}</option>
          </select>

          <select 
            aria-label="Sort enquiries"
            className="w-full px-4 py-2 border border-gray-300 dark:border-brand-darkBorder rounded-xl focus:ring-2 focus:ring-brand-sky outline-none bg-white dark:bg-brand-darkElevated text-brand-navy dark:text-text-darkPrimary text-sm transition-all"
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
          >
            <option value="newest">{t('admin.enquiries.sortByNewest')}</option>
            <option value="oldest">{t('admin.enquiries.sortByOldest')}</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-4 rounded-xl mb-6 border border-red-100 dark:border-red-800/40 text-sm">
            {error}
          </div>
        )}

        {/* Desktop Table / Mobile Cards */}
        <div className="bg-white dark:bg-brand-darkSurface rounded-2xl shadow-sm border border-ui-border dark:border-brand-darkBorder overflow-hidden mb-6 transition-colors">
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-brand-darkElevated text-xs uppercase text-text-secondary dark:text-text-darkSecondary border-b border-ui-border dark:border-brand-darkBorder">
                  <th className="px-6 py-4 font-semibold">{t('admin.enquiries.tableDate')}</th>
                  <th className="px-6 py-4 font-semibold">{t('admin.enquiries.tableCustomer')}</th>
                  <th className="px-6 py-4 font-semibold">{t('admin.enquiries.tableVehicle')}</th>
                  <th className="px-6 py-4 font-semibold">{t('admin.enquiries.tableRequirement')}</th>
                  <th className="px-6 py-4 font-semibold">{t('admin.enquiries.tableStatus')}</th>
                  <th className="px-6 py-4 font-semibold text-right">{t('admin.enquiries.tableActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ui-border dark:divide-brand-darkBorder">
                {loading ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-text-secondary dark:text-text-darkSecondary">{t('admin.enquiries.loading')}</td></tr>
                ) : enquiries.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-text-secondary dark:text-text-darkSecondary">{t('admin.enquiries.noEnquiries')}</td></tr>
                ) : (
                  enquiries.map((enquiry) => (
                    <tr key={enquiry.id} className="hover:bg-gray-50/50 dark:hover:bg-brand-darkElevated/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-text-darkSecondary">
                        {new Date(enquiry.created_at).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-brand-navy dark:text-text-darkPrimary">{enquiry.full_name}</div>
                        <div className="text-sm text-text-secondary dark:text-text-darkSecondary mt-1">{enquiry.mobile_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-brand-navy dark:text-text-darkPrimary">{formatVehicleType(enquiry.vehicle_type, t)}</div>
                        {enquiry.vehicle_registration_number && (
                          <div className="text-xs text-text-secondary dark:text-text-darkSecondary font-mono mt-1 uppercase">
                            {enquiry.vehicle_registration_number}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-navy dark:text-text-darkPrimary">
                        {formatRequirement(enquiry.requirement, t)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(enquiry.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          to={`/admin/enquiries/${enquiry.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-brand-sky hover:text-brand-navy dark:hover:text-white transition-colors bg-brand-light dark:bg-brand-darkElevated px-3 py-1.5 rounded-lg"
                        >
                          <Eye size={16} /> {t('admin.enquiries.viewAction')}
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="md:hidden divide-y divide-ui-border dark:divide-brand-darkBorder">
            {loading ? (
              <div className="p-8 text-center text-text-secondary dark:text-text-darkSecondary">{t('admin.enquiries.loading')}</div>
            ) : enquiries.length === 0 ? (
              <div className="p-8 text-center text-text-secondary dark:text-text-darkSecondary">{t('admin.enquiries.noEnquiries')}</div>
            ) : (
              enquiries.map((enquiry) => (
                <div key={enquiry.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-brand-navy dark:text-text-darkPrimary">{enquiry.full_name}</h3>
                      <p className="text-sm text-text-secondary dark:text-text-darkSecondary">{new Date(enquiry.created_at).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN')}</p>
                    </div>
                    {getStatusBadge(enquiry.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-text-secondary dark:text-text-darkSecondary">{t('admin.enquiries.phoneLabel')} </span> 
                      <span className="text-brand-navy dark:text-text-darkPrimary">{enquiry.mobile_number}</span>
                    </div>
                    <div>
                      <span className="text-text-secondary dark:text-text-darkSecondary">{t('admin.enquiries.reqLabel')} </span> 
                      <span className="text-brand-navy dark:text-text-darkPrimary">{formatRequirement(enquiry.requirement, t)}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full text-sm py-2" onClick={() => navigate(`/admin/enquiries/${enquiry.id}`)}>
                    {t('admin.enquiries.viewDetails')}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary dark:text-text-darkSecondary">
            {t('admin.enquiries.showingPage', { page })}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="p-2"
              aria-label={t('admin.enquiries.previousPage')}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={20} />
            </Button>
            <Button 
              variant="outline" 
              className="p-2"
              aria-label={t('admin.enquiries.nextPage')}
              onClick={() => setPage(p => p + 1)}
              disabled={enquiries.length < limit}
            >
              <ChevronRight size={20} />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EnquiryList;

