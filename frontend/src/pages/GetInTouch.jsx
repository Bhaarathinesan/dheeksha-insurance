import React, { useState } from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from '../i18n';

const GetInTouch = () => {
  const { t } = useTranslation();
  useDocumentTitle(t('form.docTitle'));

  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    whatsappNumber: '',
    vehicleType: '',
    registrationNumber: '',
    requirement: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiErrorKey, setApiErrorKey] = useState('');
  const [apiErrorMessage, setApiErrorMessage] = useState('');

  const vehicleOptions = [
    { value: '', label: t('form.selectVehicleType'), disabled: true, hidden: true },
    { value: 'two-wheeler', label: t('form.vehicleTypes.twoWheeler') },
    { value: 'private-car', label: t('form.vehicleTypes.privateCar') },
    { value: 'commercial', label: t('form.vehicleTypes.commercial') },
    { value: 'heavy', label: t('form.vehicleTypes.heavy') },
    { value: 'other', label: t('form.vehicleTypes.other') }
  ];

  const requirementOptions = [
    { value: '', label: t('form.selectRequirement'), disabled: true, hidden: true },
    { value: 'new-insurance', label: t('form.requirements.newInsurance') },
    { value: 'renewal', label: t('form.requirements.renewal') },
    { value: 'claim', label: t('form.requirements.claim') },
    { value: 'policy', label: t('form.requirements.policy') },
    { value: 'other', label: t('form.requirements.other') }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const trimmedName = formData.fullName.trim();
    if (!trimmedName) {
      newErrors.fullName = 'nameRequired';
    } else if (trimmedName.length < 2) {
      newErrors.fullName = 'nameTooShort';
    }

    const cleanMobile = formData.mobileNumber.replace(/\s+/g, '');
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'mobileRequired';
    } else if (!/^[0-9]{10}$/.test(cleanMobile)) {
      newErrors.mobileNumber = 'mobileInvalid';
    }
    
    if (formData.whatsappNumber && formData.whatsappNumber.trim()) {
      const cleanWhatsapp = formData.whatsappNumber.replace(/\s+/g, '');
      if (!/^[0-9]{10}$/.test(cleanWhatsapp)) {
        newErrors.whatsappNumber = 'whatsappInvalid';
      }
    }

    if (!formData.vehicleType) {
      newErrors.vehicleType = 'vehicleTypeRequired';
    }
    if (!formData.requirement) {
      newErrors.requirement = 'requirementRequired';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper to dynamically resolve validation errors in active language
  const getFieldError = (field) => {
    const err = errors[field];
    if (!err) return '';
    return t(`form.validation.${err}`, {}, err);
  };

  // Helper to dynamically resolve API errors in active language
  const getApiError = () => {
    if (apiErrorKey) {
      return t(`form.${apiErrorKey}`, {}, apiErrorKey);
    }
    return apiErrorMessage;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiErrorKey('');
    setApiErrorMessage('');
    
    if (validate()) {
      setIsSubmitting(true);
      
      try {
        const payload = {
          full_name: formData.fullName.trim(),
          mobile_number: formData.mobileNumber.replace(/\s+/g, ''),
          whatsapp_number: formData.whatsappNumber?.trim() ? formData.whatsappNumber.replace(/\s+/g, '') : null,
          vehicle_type: formData.vehicleType,
          vehicle_registration_number: formData.registrationNumber?.trim() || null,
          requirement: formData.requirement,
          message: formData.message?.trim() || null
        };

        // Cleanup empty strings to null for backend optional fields
        if (!payload.whatsapp_number) delete payload.whatsapp_number;
        if (!payload.vehicle_registration_number) delete payload.vehicle_registration_number;
        if (!payload.message) delete payload.message;

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/enquiries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          if (response.status === 429) {
            setApiErrorKey('errorRateLimit');
            return;
          }

          if (response.status >= 500) {
            setApiErrorKey('errorServer');
            return;
          }

          const errorData = await response.json().catch(() => ({}));
          let errMsg = '';
          if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
            errMsg = errorData.detail[0]?.msg || '';
          } else if (typeof errorData.detail === 'string') {
            errMsg = errorData.detail;
          } else if (typeof errorData.error === 'string') {
            errMsg = errorData.error;
          }

          if (response.status === 422) {
            setApiErrorKey('errorValidation');
          } else if (errMsg) {
            setApiErrorMessage(errMsg);
          } else {
            setApiErrorKey('errorDefault');
          }
          return;
        }

        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        console.error('Error submitting enquiry:', error);
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
          setApiErrorKey('errorNetwork');
        } else {
          setApiErrorKey('errorDefault');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isSuccess) {
    return (
      <div className="animate-fade-in min-h-[70vh] flex items-center">
        <Container>
          <div className="max-w-2xl mx-auto text-center bg-white dark:bg-brand-darkSurface p-12 rounded-3xl shadow-premium border border-ui-border dark:border-brand-darkBorder">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-950/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy dark:text-text-darkPrimary mb-4 leading-tight">
              {t('form.successTitle')}
            </h2>
            <p className="text-lg text-text-secondary dark:text-text-darkSecondary mb-8 leading-relaxed">
              {t('form.successMessage')}
            </p>
            <Button variant="primary" onClick={() => {
              setIsSuccess(false);
              setFormData({
                fullName: '', mobileNumber: '', whatsappNumber: '', vehicleType: '', registrationNumber: '', requirement: '', message: ''
              });
              setErrors({});
              setApiErrorKey('');
              setApiErrorMessage('');
            }}>
              {t('form.submitAnother')}
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-brand-light dark:bg-brand-darkBg min-h-screen py-16 md:py-24 transition-colors duration-300">
      <Container>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-brand-navy dark:text-text-darkPrimary mb-4 leading-tight">
              {t('form.pageTitle')}
            </h1>
            <p className="text-lg text-text-secondary dark:text-text-darkSecondary leading-relaxed">
              {t('form.pageSubtitle')}
            </p>
          </div>

          <div className="bg-white dark:bg-brand-darkSurface p-8 md:p-12 rounded-3xl shadow-premium border border-ui-border dark:border-brand-darkBorder">
            {getApiError() && (
              <div className="mb-6 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-300 p-4 rounded-xl border border-red-100 dark:border-red-900/40 flex items-start gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <p>{getApiError()}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-end -mt-2 mb-2">
                <span className="text-xs text-text-secondary dark:text-text-darkSecondary">
                  {t('form.requiredNote')}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label={t('form.fullName')}
                  name="fullName"
                  placeholder={t('form.fullNamePlaceholder')}
                  value={formData.fullName}
                  onChange={handleChange}
                  error={getFieldError('fullName')}
                  disabled={isSubmitting}
                />
                <Input
                  label={t('form.mobileNumber')}
                  name="mobileNumber"
                  type="tel"
                  placeholder={t('form.phonePlaceholder')}
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  error={getFieldError('mobileNumber')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label={t('form.whatsappNumber')}
                  name="whatsappNumber"
                  type="tel"
                  placeholder={t('form.whatsappPlaceholder')}
                  value={formData.whatsappNumber}
                  onChange={handleChange}
                  error={getFieldError('whatsappNumber')}
                  disabled={isSubmitting}
                />
                <Select
                  label={t('form.vehicleType')}
                  name="vehicleType"
                  options={vehicleOptions}
                  value={formData.vehicleType}
                  onChange={handleChange}
                  error={getFieldError('vehicleType')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label={t('form.vehicleRegistrationNumber')}
                  name="registrationNumber"
                  placeholder={t('form.regNoPlaceholder')}
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                <Select
                  label={t('form.requirement')}
                  name="requirement"
                  options={requirementOptions}
                  value={formData.requirement}
                  onChange={handleChange}
                  error={getFieldError('requirement')}
                  disabled={isSubmitting}
                />
              </div>

              <Textarea
                label={t('form.message')}
                name="message"
                rows={4}
                placeholder={t('form.messagePlaceholder')}
                value={formData.message}
                onChange={handleChange}
                disabled={isSubmitting}
              />

              <div className="pt-4">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full flex justify-center items-center gap-2 py-4 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t('form.submitting')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send size={20} />
                      {t('form.sendEnquiry')}
                    </span>
                  )}
                </Button>
                <p className="text-center text-sm text-text-secondary dark:text-text-darkSecondary mt-4">
                  {t('form.consentText')}
                </p>
              </div>
            </form>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default GetInTouch;
