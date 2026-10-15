import React, { useEffect, useState } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useNavigate, Link } from 'react-router-dom';
import { getToken, removeToken } from '../../utils/auth';
import Button from '../../components/ui/Button';
import Container from '../../components/layout/Container';
import { 
  Users, Inbox, PhoneCall, Clock, CheckCircle, 
  LogOut, RefreshCw, XCircle, Eye, Search, X
} from 'lucide-react';
import ThemeToggle from '../../components/common/ThemeToggle';

// Reusable Stat Card
const StatCard = ({ title, value, icon, colorClass }) => (
  <div className="bg-white dark:bg-brand-darkSurface p-6 rounded-2xl shadow-sm border border-ui-border dark:border-brand-darkBorder flex items-center gap-4 transition-colors">
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-text-secondary dark:text-text-darkSecondary mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-brand-navy dark:text-text-darkPrimary">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  useDocumentTitle('Admin Dashboard');
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
          ? 'Cannot connect to the server. Please check your internet connection.'
          : err.message
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

  const getStatusBadge = (status) => {
    const styles = {
      'NEW': 'bg-blue-100 text-blue-700',
      'CONTACTED': 'bg-yellow-100 text-yellow-700',
      'IN_PROGRESS': 'bg-purple-100 text-purple-700',
      'COMPLETED': 'bg-green-100 text-green-700',
      'INCOMPLETE': 'bg-amber-100 text-amber-700',
      'CANCELLED': 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-darkBg pb-20 transition-colors duration-300">
      {/* Top Navbar for Admin */}
      <nav className="bg-brand-navy dark:bg-brand-darkSurface text-white py-4 px-6 sticky top-0 z-50 shadow-md border-b border-transparent dark:border-brand-darkBorder transition-colors">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-sky rounded flex items-center justify-center">
              <span className="text-brand-navy font-bold">D</span>
            </div>
            <span className="font-bold text-xl">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle id="admin-theme-toggle" />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-brand-light hover:text-white transition-colors text-sm font-medium"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-bold text-brand-navy dark:text-text-darkPrimary">Overview</h1>
            <p className="text-text-secondary dark:text-text-darkSecondary text-sm">Welcome back, Mr. Neelkanth</p>
          </div>
          <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2 h-10">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          <StatCard 
            title="Total Enquiries" 
            value={stats.total} 
            icon={<Users size={24} />} 
            colorClass="bg-gray-100 dark:bg-brand-darkElevated text-gray-600 dark:text-gray-300" 
          />
          <StatCard 
            title="New" 
            value={stats.new} 
            icon={<Inbox size={24} />} 
            colorClass="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300" 
          />
          <StatCard 
            title="Contacted" 
            value={stats.contacted} 
            icon={<PhoneCall size={24} />} 
            colorClass="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-300" 
          />
          <StatCard 
            title="In Progress" 
            value={stats.inProgress} 
            icon={<Clock size={24} />} 
            colorClass="bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300" 
          />
          <StatCard 
            title="Completed" 
            value={stats.completed} 
            icon={<CheckCircle size={24} />} 
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
        <div className="bg-white dark:bg-brand-darkSurface p-4 rounded-2xl shadow-sm border border-ui-border dark:border-brand-darkBorder mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between transition-colors">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search by customer name or mobile number..."
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-brand-darkBorder rounded-xl focus:ring-2 focus:ring-brand-sky focus:border-brand-sky outline-none transition-all text-sm text-brand-navy dark:text-text-darkPrimary placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-white dark:bg-brand-darkElevated"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full transition-colors"
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="dashboard-status-filter" className="text-sm font-medium text-text-secondary dark:text-text-darkSecondary whitespace-nowrap">
              Filter by Status:
            </label>
            <select 
              id="dashboard-status-filter"
              aria-label="Filter by Status"
              className="w-full md:w-48 px-4 py-2.5 border border-gray-300 dark:border-brand-darkBorder rounded-xl focus:ring-2 focus:ring-brand-sky focus:border-brand-sky outline-none bg-white dark:bg-brand-darkElevated text-brand-navy dark:text-text-darkPrimary text-sm font-medium transition-all"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="INCOMPLETE">Incomplete</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Recent Enquiries Table */}
        <div className="bg-white dark:bg-brand-darkSurface rounded-2xl shadow-sm border border-ui-border dark:border-brand-darkBorder overflow-hidden transition-colors">
          <div className="px-6 py-5 border-b border-ui-border dark:border-brand-darkBorder flex justify-between items-center">
            <h2 className="text-lg font-bold text-brand-navy dark:text-text-darkPrimary">Recent Enquiries</h2>
            {(search.trim() || status) && (
              <span className="text-xs text-text-secondary dark:text-text-darkSecondary bg-gray-100 dark:bg-brand-darkElevated px-3 py-1 rounded-full font-medium">
                {enquiries.length} {enquiries.length === 1 ? 'result found' : 'results found'}
              </span>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-brand-darkElevated text-xs uppercase text-text-secondary dark:text-text-darkSecondary border-b border-ui-border dark:border-brand-darkBorder">
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Requirement</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ui-border dark:divide-brand-darkBorder">
                {loading && enquiries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-text-secondary dark:text-text-darkSecondary">
                      Loading enquiries...
                    </td>
                  </tr>
                ) : enquiries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-text-secondary dark:text-text-darkSecondary">
                      {search.trim() || status
                        ? 'No enquiries match your search or selected filter.'
                        : 'No enquiries found.'}
                    </td>
                  </tr>
                ) : (
                  enquiries.map((enquiry) => (
                    <tr key={enquiry.id} className="hover:bg-gray-50/50 dark:hover:bg-brand-darkElevated/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-text-darkSecondary">
                        {new Date(enquiry.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-brand-navy dark:text-text-darkPrimary">{enquiry.full_name}</div>
                        <div className="text-sm text-text-secondary dark:text-text-darkSecondary mt-1">{enquiry.mobile_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium capitalize text-brand-navy dark:text-text-darkPrimary">
                          {enquiry.requirement.replace('-', ' ')}
                        </div>
                        <div className="text-xs text-text-secondary dark:text-text-darkSecondary mt-1 capitalize">
                          {enquiry.vehicle_type.replace('-', ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(enquiry.status)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {enquiry.status === 'NEW' && (
                          <button 
                            onClick={() => updateStatus(enquiry.id, 'CONTACTED')}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-2 py-1 rounded"
                          >
                            Mark Contacted
                          </button>
                        )}
                        {(enquiry.status === 'CONTACTED' || enquiry.status === 'IN_PROGRESS' || enquiry.status === 'INCOMPLETE') && (
                          <button 
                            onClick={() => updateStatus(enquiry.id, 'COMPLETED')}
                            className="text-xs font-medium text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/40 px-2 py-1 rounded"
                          >
                            Complete
                          </button>
                        )}
                        {enquiry.status === 'COMPLETED' && (
                          <button 
                            onClick={() => updateStatus(enquiry.id, 'INCOMPLETE')}
                            className="text-xs font-medium text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-900/40 px-2 py-1 rounded"
                          >
                            Mark Incomplete
                          </button>
                        )}
                        <Link 
                          to={`/admin/enquiries/${enquiry.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-strong dark:text-brand-sky hover:text-brand-navy dark:hover:text-white bg-brand-light dark:bg-brand-darkElevated px-2 py-1 rounded transition-colors"
                        >
                          <Eye size={14} /> View
                        </Link>
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
