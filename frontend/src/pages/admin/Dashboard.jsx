import React, { useEffect, useState } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useNavigate } from 'react-router-dom';
import { getToken, removeToken } from '../../utils/auth';
import Button from '../../components/ui/Button';
import Container from '../../components/layout/Container';
import { 
  Users, Inbox, PhoneCall, Clock, CheckCircle, 
  LogOut, RefreshCw, XCircle
} from 'lucide-react';

// Reusable Stat Card
const StatCard = ({ title, value, icon, colorClass }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-ui-border flex items-center gap-4">
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-text-secondary mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-brand-navy">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  useDocumentTitle('Admin Dashboard');
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/enquiries`, {
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
    fetchEnquiries();
  }, []);

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
        fetchEnquiries(); // Refresh data
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Calculate stats
  const stats = {
    total: enquiries.length,
    new: enquiries.filter(e => e.status === 'NEW').length,
    contacted: enquiries.filter(e => e.status === 'CONTACTED').length,
    inProgress: enquiries.filter(e => e.status === 'IN_PROGRESS').length,
    completed: enquiries.filter(e => e.status === 'COMPLETED').length,
  };

  const getStatusBadge = (status) => {
    const styles = {
      'NEW': 'bg-blue-100 text-blue-700',
      'CONTACTED': 'bg-yellow-100 text-yellow-700',
      'IN_PROGRESS': 'bg-purple-100 text-purple-700',
      'COMPLETED': 'bg-green-100 text-green-700',
      'CANCELLED': 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Navbar for Admin */}
      <nav className="bg-brand-navy text-white py-4 px-6 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-sky rounded flex items-center justify-center">
              <span className="text-brand-navy font-bold">D</span>
            </div>
            <span className="font-bold text-xl">Admin Dashboard</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-brand-light hover:text-white transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">Overview</h1>
            <p className="text-text-secondary text-sm">Welcome back, Mr. Neelkanth</p>
          </div>
          <Button variant="outline" onClick={fetchEnquiries} className="flex items-center gap-2 h-10">
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
            colorClass="bg-gray-100 text-gray-600" 
          />
          <StatCard 
            title="New" 
            value={stats.new} 
            icon={<Inbox size={24} />} 
            colorClass="bg-blue-100 text-blue-600" 
          />
          <StatCard 
            title="Contacted" 
            value={stats.contacted} 
            icon={<PhoneCall size={24} />} 
            colorClass="bg-yellow-100 text-yellow-600" 
          />
          <StatCard 
            title="In Progress" 
            value={stats.inProgress} 
            icon={<Clock size={24} />} 
            colorClass="bg-purple-100 text-purple-600" 
          />
          <StatCard 
            title="Completed" 
            value={stats.completed} 
            icon={<CheckCircle size={24} />} 
            colorClass="bg-green-100 text-green-600" 
          />
        </div>

        {/* Recent Enquiries Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-ui-border overflow-hidden">
          <div className="px-6 py-5 border-b border-ui-border">
            <h2 className="text-lg font-bold text-brand-navy">Recent Enquiries</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase text-text-secondary border-b border-ui-border">
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Requirement</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ui-border">
                {loading && enquiries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-text-secondary">
                      Loading enquiries...
                    </td>
                  </tr>
                ) : enquiries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-text-secondary">
                      No enquiries found.
                    </td>
                  </tr>
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
                        <div className="text-sm font-medium capitalize">
                          {enquiry.requirement.replace('-', ' ')}
                        </div>
                        <div className="text-xs text-text-secondary mt-1 capitalize">
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
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                          >
                            Mark Contacted
                          </button>
                        )}
                        {(enquiry.status === 'CONTACTED' || enquiry.status === 'IN_PROGRESS') && (
                          <button 
                            onClick={() => updateStatus(enquiry.id, 'COMPLETED')}
                            className="text-xs font-medium text-green-600 hover:text-green-800 bg-green-50 px-2 py-1 rounded"
                          >
                            Complete
                          </button>
                        )}
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
