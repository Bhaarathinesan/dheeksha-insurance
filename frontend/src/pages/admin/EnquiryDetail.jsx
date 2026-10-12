import React, { useEffect, useState } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getToken, removeToken } from '../../utils/auth';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import { ArrowLeft, Phone, MessageCircle, Clock, CheckCircle, Save, X, Edit } from 'lucide-react';

const EnquiryDetail = () => {
  useDocumentTitle('Enquiry Details');

  const { id } = useParams();
  const [enquiry, setEnquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newNote, setNewNote] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [noteUpdating, setNoteUpdating] = useState(false);

  const navigate = useNavigate();

  const fetchEnquiry = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/enquiries/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          removeToken();
          navigate('/admin/login');
          return;
        }
        throw new Error('Failed to fetch enquiry details');
      }

      const data = await response.json();
      setEnquiry(data);
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
    fetchEnquiry();
  }, [id]);

  const updateStatus = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    setStatusUpdating(true);
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
        fetchEnquiry();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setNoteUpdating(true);
    try {
      const token = getToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/enquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ new_note: newNote })
      });

      if (response.ok) {
        setNewNote('');
        fetchEnquiry();
      } else {
        throw new Error('Failed to add note');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setNoteUpdating(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  if (error || !enquiry) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error || "Enquiry not found"}</p>
        <Link to="/admin/enquiries" className="text-brand-sky font-medium">← Back to Enquiries</Link>
      </div>
    );
  }

  const getStatusBadge = (s) => {
    const styles = {
      'NEW': 'bg-blue-100 text-blue-700',
      'CONTACTED': 'bg-yellow-100 text-yellow-700',
      'IN_PROGRESS': 'bg-purple-100 text-purple-700',
      'COMPLETED': 'bg-green-100 text-green-700',
      'CANCELLED': 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide ${styles[s] || 'bg-gray-100 text-gray-700'}`}>
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
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link to="/admin/enquiries" className="inline-flex items-center gap-2 text-text-secondary hover:text-brand-navy mb-6 transition-colors">
          <ArrowLeft size={20} /> Back to List
        </Link>

        <div className="bg-white rounded-3xl shadow-sm border border-ui-border overflow-hidden">
          {/* Header */}
          <div className="bg-brand-light p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ui-border">
            <div>
              <h1 className="text-3xl font-bold text-brand-navy mb-2">{enquiry.full_name}</h1>
              <p className="text-text-secondary text-sm">
                Enquiry ID: <span className="font-mono bg-white px-2 py-1 rounded text-xs">{enquiry.id}</span>
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-3">
              {getStatusBadge(enquiry.status)}
              <div className="text-sm text-text-secondary flex items-center gap-1">
                <Clock size={14} /> {new Date(enquiry.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Info Column */}
            <div className="space-y-8">
              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
                  Customer Details
                </h3>
                <div className="bg-gray-50 p-5 rounded-2xl space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-text-secondary mb-1">Phone Number</p>
                      <p className="font-medium text-brand-navy">{enquiry.mobile_number}</p>
                    </div>
                    <a href={`tel:${enquiry.mobile_number}`} className="bg-brand-sky/20 text-brand-navy p-2 rounded-xl hover:bg-brand-sky/30">
                      <Phone size={18} />
                    </a>
                  </div>
                  
                  {enquiry.whatsapp_number && (
                    <div className="flex items-start justify-between gap-2 border-t border-gray-200 pt-4">
                      <div>
                        <p className="text-xs text-text-secondary mb-1">WhatsApp</p>
                        <p className="font-medium text-brand-navy">{enquiry.whatsapp_number}</p>
                      </div>
                      <a href={`https://wa.me/91${enquiry.whatsapp_number}`} target="_blank" rel="noreferrer" className="bg-green-100 text-green-700 p-2 rounded-xl hover:bg-green-200">
                        <MessageCircle size={18} />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Requirement Info */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
                  Requirement Details
                </h3>
                <div className="bg-gray-50 p-5 rounded-2xl space-y-4">
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Requirement</p>
                    <p className="font-medium text-brand-navy capitalize">{enquiry.requirement.replace('-', ' ')}</p>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs text-text-secondary mb-1">Vehicle Type</p>
                    <p className="font-medium text-brand-navy capitalize">{enquiry.vehicle_type.replace('-', ' ')}</p>
                  </div>
                  {enquiry.vehicle_registration_number && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-xs text-text-secondary mb-1">Registration No.</p>
                      <p className="font-mono font-medium text-brand-navy uppercase bg-white px-3 py-1 rounded inline-block border border-gray-200 shadow-sm mt-1">
                        {enquiry.vehicle_registration_number}
                      </p>
                    </div>
                  )}
                  {enquiry.message && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-xs text-text-secondary mb-1">Message</p>
                      <p className="text-sm text-brand-navy bg-white p-3 rounded-lg italic">"{enquiry.message}"</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
                  Change Status
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['NEW', 'CONTACTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((s) => (
                    <button
                      key={s}
                      disabled={enquiry.status === s || statusUpdating}
                      onClick={() => updateStatus(s)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        enquiry.status === s 
                          ? 'bg-brand-navy text-white shadow-md' 
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-sky hover:text-brand-sky'
                      } disabled:opacity-50`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes Column */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
                <Edit size={16} /> Follow-up Notes
              </h3>
              
              <div className="bg-gray-50 rounded-2xl p-5 mb-6 max-h-[400px] overflow-y-auto space-y-4">
                {(!enquiry.notes || enquiry.notes.length === 0) ? (
                  <p className="text-sm text-gray-500 text-center py-8">No notes added yet.</p>
                ) : (
                  enquiry.notes.map((note, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-ui-border">
                      <p className="text-sm text-brand-navy whitespace-pre-wrap">{note.text}</p>
                      <p className="text-xs text-gray-400 mt-2 text-right">
                        {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={addNote} className="space-y-3">
                <Textarea
                  name="newNote"
                  label="Add Note"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type a new follow-up note..."
                  rows={4}
                  disabled={noteUpdating}
                  required
                />
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full flex items-center justify-center gap-2"
                  disabled={noteUpdating || !newNote.trim()}
                >
                  <Save size={18} /> {noteUpdating ? 'Saving...' : 'Add Note'}
                </Button>
              </form>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnquiryDetail;
