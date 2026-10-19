import React, { useEffect, useState } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getToken, removeToken } from '../../utils/auth';
import { useTranslation, useLanguage } from '../../i18n';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import ThemeToggle from '../../components/common/ThemeToggle';
import { ArrowLeft, Phone, MessageCircle, Clock, Save, Edit, LogOut } from 'lucide-react';

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

const EnquiryDetail = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  useDocumentTitle(t('admin.enquiryDetail.docTitle'));

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
          ? t('admin.errors.serverConnection')
          : (err.message || t('admin.errors.detailFetchFailed'))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiry();
  }, [id]);

  const handleLogout = () => {
    removeToken();
    navigate('/admin/login');
  };

  const updateStatus = async (newStatus) => {
    const targetStatusName = t(`admin.status.${newStatus}`, {}, newStatus.replace('_', ' '));
    const confirmMsg = t('admin.enquiryDetail.confirmStatusChange', { status: targetStatusName });
    if (!window.confirm(confirmMsg)) return;

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
      alert(err.message === 'Failed to update status' ? t('admin.errors.statusUpdateFailed') : err.message);
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
      alert(err.message === 'Failed to add note' ? t('admin.errors.addNoteFailed') : err.message);
    } finally {
      setNoteUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-brand-darkBg flex items-center justify-center text-text-secondary dark:text-text-darkSecondary">
        {t('admin.enquiryDetail.loading')}
      </div>
    );
  }

  if (error || !enquiry) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-brand-darkBg flex flex-col items-center justify-center p-4">
        <p className="text-red-500 dark:text-red-400 mb-4">{error || t('admin.enquiryDetail.notFound')}</p>
        <Link to="/admin/enquiries" className="text-brand-sky font-medium hover:underline">
          ← {t('admin.enquiryDetail.backToEnquiries')}
        </Link>
      </div>
    );
  }

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
      <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide ${styles[s] || 'bg-gray-100 text-gray-700 dark:bg-brand-darkElevated dark:text-text-darkSecondary'}`}>
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
            <LanguageSwitcher id="admin-enquiry-detail-language-switcher" size="sm" />
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link to="/admin/enquiries" className="inline-flex items-center gap-2 text-text-secondary dark:text-text-darkSecondary hover:text-brand-navy dark:hover:text-brand-sky mb-6 transition-colors">
          <ArrowLeft size={20} /> {t('admin.enquiryDetail.backToList')}
        </Link>

        <div className="bg-white dark:bg-brand-darkSurface rounded-3xl shadow-sm border border-ui-border dark:border-brand-darkBorder overflow-hidden transition-colors">
          {/* Header */}
          <div className="bg-brand-light dark:bg-brand-darkElevated p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ui-border dark:border-brand-darkBorder transition-colors">
            <div>
              <h1 className="text-3xl font-bold text-brand-navy dark:text-text-darkPrimary mb-2">{enquiry.full_name}</h1>
              <p className="text-text-secondary dark:text-text-darkSecondary text-sm">
                {t('admin.enquiryDetail.enquiryId')} <span className="font-mono bg-white dark:bg-brand-darkSurface px-2 py-1 rounded text-xs border border-ui-border dark:border-brand-darkBorder">{enquiry.id}</span>
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-3">
              {getStatusBadge(enquiry.status)}
              <div className="text-sm text-text-secondary dark:text-text-darkSecondary flex items-center gap-1">
                <Clock size={14} /> {new Date(enquiry.created_at).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Info Column */}
            <div className="space-y-8">
              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary dark:text-text-darkSecondary mb-4 flex items-center gap-2">
                  {t('admin.enquiryDetail.customerDetails')}
                </h3>
                <div className="bg-gray-50 dark:bg-brand-darkElevated p-5 rounded-2xl space-y-4 border border-ui-border dark:border-brand-darkBorder transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-text-secondary dark:text-text-darkSecondary mb-1">{t('admin.enquiryDetail.phone')}</p>
                      <p className="font-medium text-brand-navy dark:text-text-darkPrimary">{enquiry.mobile_number}</p>
                    </div>
                    <a 
                      href={`tel:${enquiry.mobile_number}`} 
                      className="bg-brand-sky/20 text-brand-navy dark:text-brand-sky p-2 rounded-xl hover:bg-brand-sky/30 transition-colors"
                      title={t('admin.enquiryDetail.callCustomer')}
                      aria-label={t('admin.enquiryDetail.callCustomer')}
                    >
                      <Phone size={18} />
                    </a>
                  </div>
                  
                  {enquiry.whatsapp_number && (
                    <div className="flex items-start justify-between gap-2 border-t border-gray-200 dark:border-brand-darkBorder pt-4">
                      <div>
                        <p className="text-xs text-text-secondary dark:text-text-darkSecondary mb-1">{t('admin.enquiryDetail.whatsapp')}</p>
                        <p className="font-medium text-brand-navy dark:text-text-darkPrimary">{enquiry.whatsapp_number}</p>
                      </div>
                      <a 
                        href={`https://wa.me/91${enquiry.whatsapp_number}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 p-2 rounded-xl hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
                        title={t('admin.enquiryDetail.chatOnWhatsapp')}
                        aria-label={t('admin.enquiryDetail.chatOnWhatsapp')}
                      >
                        <MessageCircle size={18} />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Requirement Info */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary dark:text-text-darkSecondary mb-4">
                  {t('admin.enquiryDetail.requirementDetails')}
                </h3>
                <div className="bg-gray-50 dark:bg-brand-darkElevated p-5 rounded-2xl space-y-4 border border-ui-border dark:border-brand-darkBorder transition-colors">
                  <div>
                    <p className="text-xs text-text-secondary dark:text-text-darkSecondary mb-1">{t('admin.enquiryDetail.requirement')}</p>
                    <p className="font-medium text-brand-navy dark:text-text-darkPrimary">{formatRequirement(enquiry.requirement, t)}</p>
                  </div>
                  <div className="border-t border-gray-200 dark:border-brand-darkBorder pt-4">
                    <p className="text-xs text-text-secondary dark:text-text-darkSecondary mb-1">{t('admin.enquiryDetail.vehicleType')}</p>
                    <p className="font-medium text-brand-navy dark:text-text-darkPrimary">{formatVehicleType(enquiry.vehicle_type, t)}</p>
                  </div>
                  {enquiry.vehicle_registration_number && (
                    <div className="border-t border-gray-200 dark:border-brand-darkBorder pt-4">
                      <p className="text-xs text-text-secondary dark:text-text-darkSecondary mb-1">{t('admin.enquiryDetail.registrationNumber')}</p>
                      <p className="font-mono font-medium text-brand-navy dark:text-text-darkPrimary uppercase bg-white dark:bg-brand-darkSurface px-3 py-1 rounded inline-block border border-gray-200 dark:border-brand-darkBorder shadow-sm mt-1">
                        {enquiry.vehicle_registration_number}
                      </p>
                    </div>
                  )}
                  {enquiry.message && (
                    <div className="border-t border-gray-200 dark:border-brand-darkBorder pt-4">
                      <p className="text-xs text-text-secondary dark:text-text-darkSecondary mb-1">{t('admin.enquiryDetail.message')}</p>
                      <p className="text-sm text-brand-navy dark:text-text-darkPrimary bg-white dark:bg-brand-darkSurface p-3 rounded-lg italic border border-gray-200 dark:border-brand-darkBorder">
                        "{enquiry.message}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary dark:text-text-darkSecondary mb-4">
                  {t('admin.enquiryDetail.changeStatus')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['NEW', 'CONTACTED', 'IN_PROGRESS', 'COMPLETED', 'INCOMPLETE', 'CANCELLED'].map((s) => (
                    <button
                      key={s}
                      disabled={enquiry.status === s || statusUpdating}
                      onClick={() => updateStatus(s)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        enquiry.status === s 
                          ? 'bg-brand-navy text-white dark:bg-brand-sky dark:text-brand-navy shadow-md font-semibold' 
                          : 'bg-white dark:bg-brand-darkElevated border border-gray-200 dark:border-brand-darkBorder text-gray-700 dark:text-text-darkSecondary hover:border-brand-sky hover:text-brand-sky'
                      } disabled:opacity-50`}
                    >
                      {t(`admin.status.${s}`, {}, s.replace('_', ' '))}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes Column */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary dark:text-text-darkSecondary mb-4 flex items-center gap-2">
                <Edit size={16} /> {t('admin.enquiryDetail.followUpNotes')}
              </h3>
              
              <div className="bg-gray-50 dark:bg-brand-darkElevated rounded-2xl p-5 mb-6 max-h-[400px] overflow-y-auto space-y-4 border border-ui-border dark:border-brand-darkBorder transition-colors">
                {(!enquiry.notes || enquiry.notes.length === 0) ? (
                  <p className="text-sm text-text-secondary dark:text-text-darkSecondary text-center py-8">
                    {t('admin.enquiryDetail.noNotes')}
                  </p>
                ) : (
                  enquiry.notes.map((note, index) => (
                    <div key={index} className="bg-white dark:bg-brand-darkSurface p-4 rounded-xl shadow-sm border border-ui-border dark:border-brand-darkBorder">
                      <p className="text-sm text-brand-navy dark:text-text-darkPrimary whitespace-pre-wrap">{note.text}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
                        {new Date(note.created_at).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={addNote} className="space-y-3">
                <Textarea
                  name="newNote"
                  label={t('admin.enquiryDetail.addNote')}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder={t('admin.enquiryDetail.notePlaceholder')}
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
                  <Save size={18} /> {noteUpdating ? t('admin.enquiryDetail.savingNote') : t('admin.enquiryDetail.addNoteBtn')}
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

