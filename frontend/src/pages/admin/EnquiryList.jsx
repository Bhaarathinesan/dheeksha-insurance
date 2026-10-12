import React, { useEffect, useState } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Link, useNavigate } from 'react-router-dom';
import { getToken, removeToken } from '../../utils/auth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Search, Filter, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

const EnquiryList = () => {
  useDocumentTitle('Enquiries');

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
      if (search) url += `&search=${encodeURIComponent(search)}`;

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
          ? 'Cannot connect to the server. Please check your internet connection.'
          : err.message
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

  const getStatusBadge = (s) => {
    const styles = {
      'NEW': 'bg-blue-100 text-blue-700',
      'CONTACTED': 'bg-yellow-100 text-yellow-700',
      'IN_PROGRESS': 'bg-purple-100 text-purple-700',
      'COMPLETED': 'bg-green-100 text-green-700',
      'CANCELLED': 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[s] || 'bg-gray-100 text-gray-700'}`}>
        {s.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-brand-navy text-white py-4 px-6 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-sky rounded flex items-center justify-center">
                <span className="text-brand-navy font-bold">D</span>
              </div>
              <span className="font-bold text-xl hidden sm:block">Admin Portal</span>
            </Link>
            <div className="hidden sm:flex gap-4 ml-6 border-l border-white/20 pl-6">
              <Link to="/admin/dashboard" className="text-brand-light hover:text-white transition-colors">Dashboard</Link>
              <Link to="/admin/enquiries" className="text-white font-medium">Enquiries</Link>
            </div>
          </div>
          <button 
            onClick={() => { removeToken(); navigate('/admin/login'); }}
            className="text-brand-light hover:text-white transition-colors text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">Enquiry Management</h1>
            <p className="text-text-secondary text-sm">View and manage customer enquiries</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-ui-border mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search by name, phone, or reg number..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-sky focus:border-brand-sky outline-none transition-all"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
          
          <select 
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-sky outline-none bg-white text-brand-navy"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select 
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-sky outline-none bg-white text-brand-navy"
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Desktop Table / Mobile Cards */}
        <div className="bg-white rounded-2xl shadow-sm border border-ui-border overflow-hidden mb-6">
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase text-text-secondary border-b border-ui-border">
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Vehicle</th>
                  <th className="px-6 py-4 font-semibold">Requirement</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ui-border">
                {loading ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                ) : enquiries.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">No enquiries found.</td></tr>
                ) : (
                  enquiries.map((enquiry) => (
                    <tr key={enquiry.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {new Date(enquiry.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-brand-navy">{enquiry.full_name}</div>
                        <div className="text-sm text-text-secondary mt-1">{enquiry.mobile_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm capitalize">{enquiry.vehicle_type.replace('-', ' ')}</div>
                        {enquiry.vehicle_registration_number && (
                          <div className="text-xs text-text-secondary font-mono mt-1 uppercase">
                            {enquiry.vehicle_registration_number}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                        {enquiry.requirement.replace('-', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(enquiry.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          to={`/admin/enquiries/${enquiry.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-brand-sky hover:text-brand-navy transition-colors bg-brand-light px-3 py-1.5 rounded-lg"
                        >
                          <Eye size={16} /> View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="md:hidden divide-y divide-ui-border">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : enquiries.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No enquiries found.</div>
            ) : (
              enquiries.map((enquiry) => (
                <div key={enquiry.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-brand-navy">{enquiry.full_name}</h3>
                      <p className="text-sm text-text-secondary">{new Date(enquiry.created_at).toLocaleDateString()}</p>
                    </div>
                    {getStatusBadge(enquiry.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-text-secondary">Phone:</span> {enquiry.mobile_number}</div>
                    <div><span className="text-text-secondary">Req:</span> <span className="capitalize">{enquiry.requirement.replace('-', ' ')}</span></div>
                  </div>
                  <Button variant="outline" className="w-full text-sm py-2" onClick={() => navigate(`/admin/enquiries/${enquiry.id}`)}>
                    View Details
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Showing page {page}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="p-2"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={20} />
            </Button>
            <Button 
              variant="outline" 
              className="p-2"
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
