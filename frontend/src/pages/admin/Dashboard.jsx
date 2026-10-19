import React, { useEffect, useState } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useNavigate, Link } from 'react-router-dom';
import { getToken, removeToken } from '../../utils/auth';
import { useTranslation, useLanguage } from '../../i18n';
import Button from '../../components/ui/Button';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import ThemeToggle from '../../components/common/ThemeToggle';
import { 
  Users, Inbox, PhoneCall, Clock, CheckCircle, 
  LogOut, RefreshCw, Eye, Search, X
} from 'lucide-react';

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

// Reusable Stat Card with robust responsive sizing and Tamil text-wrapping support
const StatCard = ({ title, value, icon, colorClass }) => (
  <div className="bg-white dark:bg-brand-darkSurface p-4 sm:p-5 rounded-2xl shadow-sm border border-ui-border dark:border-brand-darkBorder flex items-center gap-3.5 sm:gap-4 transition-colors h-full">
    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs sm:text-sm font-medium text-text-secondary dark:text-text-darkSecondary mb-1 leading-snug break-words">
        {title}
      </p>
      <h3 className="text-2xl sm:text-3xl font-bold text-brand-navy dark:text-text-darkPrimary tracking-tight">
        {value}
      </h3>
    </div>
  </div>
);

const Dashboard = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  useDocumentTitle(t('admin.dashboard.docTitle'));

  const [allEnquiries, setAllEnquiries] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const fetchOverviewStats = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/enquiries`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAllEnquiries(data);
      }
    } catch (err) {
      console.error('Error fetching overview stats:', err);
    }
  };

  const fetchEnquiries = async (searchVal = search, statusVal = status) => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      if (!token) {
        navigate('/admin/login');
        return;
      }

      let url = `${import.meta.env.VITE_API_BASE_URL}/enquiries`;
      const params = new URLSearchParams();
      if (statusVal) params.append('status', statusVal);
      if (searchVal.trim()) params.append('search', searchVal.trim());
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

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
      if (!searchVal.trim() && !statusVal) {
        setAllEnquiries(data);
      }
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
    fetchOverviewStats();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEnquiries(search, status);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, status]);

  const handleRefresh = () => {
    fetchOverviewStats();
    fetchEnquiries(search, status);
  };

  const handleLogout = () => {
    removeToken();
    navigate('/admin/login');
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const token = getToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/enquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchOverviewStats();
        fetchEnquiries(search, status);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Calculate stats based on all enquiries
  const stats = {
    total: allEnquiries.length,
    new: allEnquiries.filter(e => e.status === 'NEW').length,
    contacted: allEnquiries.filter(e => e.status === 'CONTACTED').length,
    inProgress: allEnquiries.filter(e => e.status === 'IN_PROGRESS').length,
    completed: allEnquiries.filter(e => e.status === 'COMPLETED').length,
  };

  const getStatusBadge = (statusCode) => {
    const styles = {
      'NEW': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      'CONTACTED': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
      'IN_PROGRESS': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
      'COMPLETED': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      'INCOMPLETE': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      'CANCELLED': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    };
    const translatedStatus = t(`admin.status.${statusCode}`, {}, statusCode.replace('_', ' '));
    return (
      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold leading-tight whitespace-nowrap ${styles[statusCode] || 'bg-gray-100 text-gray-700 dark:bg-brand-darkElevated dark:text-text-darkSecondary'}`}>
        {translatedStatus}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-darkBg pb-20 transition-colors duration-300">
      {/* Top Navbar for Admin */}
      <nav className="bg-brand-navy dark:bg-brand-darkSurface text-white py-3.5 sm:py-4 px-3 sm:px-6 sticky top-0 z-50 shadow-md border-b border-transparent dark:border-brand-darkBorder transition-colors">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <Link to="/admin/dashboard" className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
              <div className="w-8 h-8 bg-brand-sky rounded flex items-center justify-center flex-shrink-0">
                <span className="text-brand-navy font-bold text-base">D</span>
              </div>
              <span className="font-bold text-base sm:text-xl truncate max-w-[120px] xs:max-w-[180px] sm:max-w-none">
                {t('admin.nav.portalTitle')}
              </span>
            </Link>
            <div className="hidden md:flex gap-4 ml-2 lg:ml-6 border-l border-white/20 pl-4 lg:pl-6">
              <Link to="/admin/dashboard" className="text-white font-medium text-sm">{t('admin.nav.dashboard')}</Link>
              <Link to="/admin/enquiries" className="text-brand-light hover:text-white transition-colors text-sm">{t('admin.nav.enquiries')}</Link>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <LanguageSwitcher id="admin-dashboard-language-switcher" size="sm" />
            <ThemeToggle id="admin-theme-toggle" />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 sm:gap-2 text-brand-light hover:text-white transition-colors text-sm font-medium p-1.5 sm:p-0 rounded"
              title={t('admin.nav.signOut')}
              aria-label={t('admin.nav.signOut')}
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">{t('admin.nav.signOut')}</span>
            </button>
          </div>
        </div>
        {/* Mobile subnavigation bar for quick access to dashboard / enquiries */}
        <div className="flex md:hidden items-center justify-around border-t border-white/10 mt-2.5 pt-2 text-xs">
          <Link to="/admin/dashboard" className="text-white font-semibold px-3 py-1 rounded bg-white/15">
            {t('admin.nav.dashboard')}
          </Link>
          <Link to="/admin/enquiries" className="text-brand-light hover:text-white transition-colors px-3 py-1">
            {t('admin.nav.enquiries')}
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-brand-navy dark:text-text-darkPrimary leading-tight">
              {t('admin.dashboard.heading')}
            </h1>
            <p className="text-text-secondary dark:text-text-darkSecondary text-xs sm:text-sm mt-1 break-words">
              {t('admin.dashboard.welcome')}
            </p>
          </div>
          <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2 h-9 sm:h-10 text-xs sm:text-sm flex-shrink-0 self-end sm:self-auto">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>{t('admin.dashboard.refresh')}</span>
          </Button>
        </div>

        {/* Stats Grid: 1 col on mobile, 2 on tablet portrait, 3 on tablet landscape, 5 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5 mb-8 sm:mb-10">
          <StatCard 
            title={t('admin.dashboard.totalEnquiries')} 
            value={stats.total} 
            icon={<Users className="w-5 h-5 sm:w-6 sm:h-6" />} 
            colorClass="bg-gray-100 dark:bg-brand-darkElevated text-gray-600 dark:text-gray-300" 
          />
          <StatCard 
            title={t('admin.dashboard.statNew')} 
            value={stats.new} 
            icon={<Inbox className="w-5 h-5 sm:w-6 sm:h-6" />} 
            colorClass="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300" 
          />
          <StatCard 
            title={t('admin.dashboard.statContacted')} 
            value={stats.contacted} 
            icon={<PhoneCall className="w-5 h-5 sm:w-6 sm:h-6" />} 
            colorClass="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-300" 
          />
          <StatCard 
            title={t('admin.dashboard.statInProgress')} 
            value={stats.inProgress} 
            icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6" />} 
            colorClass="bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300" 
          />
          <StatCard 
            title={t('admin.dashboard.statCompleted')} 
            value={stats.completed} 
            icon={<CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />} 
            colorClass="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300" 
          />
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-4 rounded-xl mb-6 border border-red-100 dark:border-red-800/40 text-sm">
            {error}
          </div>
        )}

        {/* Search & Status Filters */}
        <div className="bg-white dark:bg-brand-darkSurface p-4 rounded-2xl shadow-sm border border-ui-border dark:border-brand-darkBorder mb-6 flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between transition-colors">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 pointer-events-none" />
            <input 
              type="text" 
              placeholder={t('admin.dashboard.searchPlaceholder')}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-brand-darkBorder rounded-xl focus:ring-2 focus:ring-brand-sky focus:border-brand-sky outline-none transition-all text-sm text-brand-navy dark:text-text-darkPrimary placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-white dark:bg-brand-darkElevated"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full transition-colors"
                title={t('admin.dashboard.clearSearch')}
                aria-label={t('admin.dashboard.clearSearch')}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-shrink-0">
            <label htmlFor="dashboard-status-filter" className="text-xs sm:text-sm font-medium text-text-secondary dark:text-text-darkSecondary whitespace-nowrap">
              {t('admin.dashboard.filterByStatus')}
            </label>
            <select 
              id="dashboard-status-filter"
              aria-label={t('admin.dashboard.filterByStatus')}
              className="w-full sm:w-auto sm:min-w-[12rem] px-3.5 py-2.5 border border-gray-300 dark:border-brand-darkBorder rounded-xl focus:ring-2 focus:ring-brand-sky focus:border-brand-sky outline-none bg-white dark:bg-brand-darkElevated text-brand-navy dark:text-text-darkPrimary text-sm font-medium transition-all"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">{t('admin.dashboard.allStatuses')}</option>
              <option value="NEW">{t('admin.status.NEW')}</option>
              <option value="CONTACTED">{t('admin.status.CONTACTED')}</option>
              <option value="IN_PROGRESS">{t('admin.status.IN_PROGRESS')}</option>
              <option value="COMPLETED">{t('admin.status.COMPLETED')}</option>
              <option value="INCOMPLETE">{t('admin.status.INCOMPLETE')}</option>
              <option value="CANCELLED">{t('admin.status.CANCELLED')}</option>
            </select>
          </div>
        </div>

        {/* Recent Enquiries Table */}
        <div className="bg-white dark:bg-brand-darkSurface rounded-2xl shadow-sm border border-ui-border dark:border-brand-darkBorder overflow-hidden transition-colors">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-ui-border dark:border-brand-darkBorder flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-base sm:text-lg font-bold text-brand-navy dark:text-text-darkPrimary">
              {t('admin.dashboard.recentEnquiries')}
            </h2>
            {(search.trim() || status) && (
              <span className="text-xs text-text-secondary dark:text-text-darkSecondary bg-gray-100 dark:bg-brand-darkElevated px-3 py-1 rounded-full font-medium">
                {enquiries.length === 1 
                  ? t('admin.dashboard.resultFound', { count: enquiries.length }) 
                  : t('admin.dashboard.resultsFound', { count: enquiries.length })}
              </span>
            )}
          </div>
          
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[650px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-brand-darkElevated text-xs uppercase text-text-secondary dark:text-text-darkSecondary border-b border-ui-border dark:border-brand-darkBorder">
                  <th className="px-4 sm:px-6 py-3.5 sm:py-4 font-semibold whitespace-nowrap min-w-[6.5rem]">{t('admin.enquiries.tableDate')}</th>
                  <th className="px-4 sm:px-6 py-3.5 sm:py-4 font-semibold min-w-[10rem]">{t('admin.enquiries.tableCustomer')}</th>
                  <th className="px-4 sm:px-6 py-3.5 sm:py-4 font-semibold min-w-[10rem]">{t('admin.enquiries.tableRequirement')}</th>
                  <th className="px-4 sm:px-6 py-3.5 sm:py-4 font-semibold whitespace-nowrap min-w-[8rem]">{t('admin.enquiries.tableStatus')}</th>
                  <th className="px-4 sm:px-6 py-3.5 sm:py-4 font-semibold text-right whitespace-nowrap min-w-[10rem]">{t('admin.enquiries.tableActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ui-border dark:divide-brand-darkBorder">
                {loading && enquiries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-text-secondary dark:text-text-darkSecondary">
                      {t('admin.dashboard.loadingEnquiries')}
                    </td>
                  </tr>
                ) : enquiries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-text-secondary dark:text-text-darkSecondary">
                      {search.trim() || status
                        ? t('admin.dashboard.noResultsFilter')
                        : t('admin.dashboard.noEnquiries')}
                    </td>
                  </tr>
                ) : (
                  enquiries.map((enquiry) => (
                    <tr key={enquiry.id} className="hover:bg-gray-50/50 dark:hover:bg-brand-darkElevated/50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-text-secondary dark:text-text-darkSecondary">
                        {new Date(enquiry.created_at).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                      </td>
                      <td className="px-4 sm:px-6 py-4 min-w-[10rem]">
                        <div className="font-medium text-xs sm:text-sm text-brand-navy dark:text-text-darkPrimary break-words">
                          {enquiry.full_name}
                        </div>
                        <div className="text-xs text-text-secondary dark:text-text-darkSecondary mt-0.5">
                          {enquiry.mobile_number}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 min-w-[10rem]">
                        <div className="text-xs sm:text-sm font-medium text-brand-navy dark:text-text-darkPrimary leading-snug break-words">
                          {formatRequirement(enquiry.requirement, t)}
                        </div>
                        <div className="text-xs text-text-secondary dark:text-text-darkSecondary mt-0.5 leading-snug break-words">
                          {formatVehicleType(enquiry.vehicle_type, t)}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(enquiry.status)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {enquiry.status === 'NEW' && (
                            <button 
                              onClick={() => updateStatus(enquiry.id, 'CONTACTED')}
                              className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded transition-colors whitespace-nowrap"
                            >
                              {t('admin.actions.markContacted')}
                            </button>
                          )}
                          {(enquiry.status === 'CONTACTED' || enquiry.status === 'IN_PROGRESS' || enquiry.status === 'INCOMPLETE') && (
                            <button 
                              onClick={() => updateStatus(enquiry.id, 'COMPLETED')}
                              className="text-xs font-medium text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/40 px-2.5 py-1 rounded transition-colors whitespace-nowrap"
                            >
                              {t('admin.actions.complete')}
                            </button>
                          )}
                          {enquiry.status === 'COMPLETED' && (
                            <button 
                              onClick={() => updateStatus(enquiry.id, 'INCOMPLETE')}
                              className="text-xs font-medium text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-900/40 px-2.5 py-1 rounded transition-colors whitespace-nowrap"
                            >
                              {t('admin.actions.markIncomplete')}
                            </button>
                          )}
                          <Link 
                            to={`/admin/enquiries/${enquiry.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-strong dark:text-brand-sky hover:text-brand-navy dark:hover:text-white bg-brand-light dark:bg-brand-darkElevated px-2.5 py-1 rounded transition-colors whitespace-nowrap"
                          >
                            <Eye size={14} /> {t('admin.actions.view')}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

