import React, { useState } from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

const GetInTouch = () => {
  useDocumentTitle('Enquiry Form');

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
  const [apiError, setApiError] = useState('');

  const vehicleOptions = [
    { value: '', label: 'Select Vehicle Type', disabled: true, hidden: true },
    { value: 'two-wheeler', label: 'Two-Wheeler' },
    { value: 'private-car', label: 'Private Car' },
    { value: 'commercial', label: 'Commercial Vehicle' },
    { value: 'heavy', label: 'Heavy Vehicle' },
    { value: 'other', label: 'Other' }
  ];

  const requirementOptions = [
    { value: '', label: 'Select Requirement', disabled: true, hidden: true },
    { value: 'new-insurance', label: 'New Insurance' },
    { value: 'renewal', label: 'Insurance Renewal' },
    { value: 'claim', label: 'Claim Assistance' },
    { value: 'policy', label: 'Policy Assistance' },
    { value: 'other', label: 'Other' }
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
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile Number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobileNumber.replace(/\s+/g, ''))) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    }
    
    if (formData.whatsappNumber && !/^[0-9]{10}$/.test(formData.whatsappNumber.replace(/\s+/g, ''))) {
      newErrors.whatsappNumber = 'Please enter a valid 10-digit WhatsApp number';
    }

    if (!formData.vehicleType) newErrors.vehicleType = 'Please select a vehicle type';
    if (!formData.requirement) newErrors.requirement = 'Please select a requirement';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    
    if (validate()) {
      setIsSubmitting(true);
      
      try {
        const payload = {
          full_name: formData.fullName,
          mobile_number: formData.mobileNumber,
          whatsapp_number: formData.whatsappNumber || null,
          vehicle_type: formData.vehicleType,
          vehicle_registration_number: formData.registrationNumber || null,
          requirement: formData.requirement,
          message: formData.message || null
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
          const errorData = await response.json();
          throw new Error(errorData.detail?.[0]?.msg || 'Failed to submit enquiry');
        }

        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        console.error('Error submitting enquiry:', error);
        setApiError(
          error.message === 'Failed to fetch' 
            ? 'Cannot connect to the server. Please check your internet connection.' 
            : error.message || 'An unexpected error occurred. Please try again.'
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isSuccess) {
    return (
      <div className="animate-fade-in min-h-[70vh] flex items-center">
        <Container>
          <div className="max-w-2xl mx-auto text-center bg-white p-12 rounded-3xl shadow-premium border border-ui-border">
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-4">
              Enquiry Submitted Successfully!
            </h2>
            <p className="text-lg text-text-secondary mb-8">
              Thank you for contacting Dheeksha Insurance. Our team will get in touch with you shortly.
            </p>
            <Button variant="primary" onClick={() => {
              setIsSuccess(false);
              setFormData({
                fullName: '', mobileNumber: '', whatsappNumber: '', vehicleType: '', registrationNumber: '', requirement: '', message: ''
              });
            }}>
              Submit Another Enquiry
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-brand-light min-h-screen py-16 md:py-24">
      <Container>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-brand-navy mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-text-secondary">
              Fill out the form below and our team will contact you shortly to assist with your insurance needs.
            </p>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-premium border border-ui-border">
            {apiError && (
              <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <p>{apiError}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name *"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  error={errors.fullName}
                  disabled={isSubmitting}
                />
                <Input
                  label="Mobile Number *"
                  name="mobileNumber"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  error={errors.mobileNumber}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="WhatsApp Number (Optional)"
                  name="whatsappNumber"
                  type="tel"
                  placeholder="If different from mobile"
                  value={formData.whatsappNumber}
                  onChange={handleChange}
                  error={errors.whatsappNumber}
                  disabled={isSubmitting}
                />
                <Select
                  label="Vehicle Type *"
                  name="vehicleType"
                  options={vehicleOptions}
                  value={formData.vehicleType}
                  onChange={handleChange}
                  error={errors.vehicleType}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Vehicle Registration Number (Optional)"
                  name="registrationNumber"
                  placeholder="e.g. TN 49 AA 1234"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                <Select
                  label="Requirement *"
                  name="requirement"
                  options={requirementOptions}
                  value={formData.requirement}
                  onChange={handleChange}
                  error={errors.requirement}
                  disabled={isSubmitting}
                />
              </div>

                <Textarea
                  label="Message (Optional)"
                  name="message"
                  rows={4}
                  placeholder="Please provide any additional details..."
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
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send size={20} />
                      Submit Enquiry
                    </span>
                  )}
                </Button>
                <p className="text-center text-sm text-text-secondary mt-4">
                  By submitting this form, you agree to let our team contact you regarding your enquiry.
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
