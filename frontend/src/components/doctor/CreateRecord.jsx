import React, { useState } from 'react';
import { 
  UserIcon, 
  DocumentTextIcon, 
  ClipboardDocumentListIcon,
  CalendarIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Button from '../common/Button';
import doctorService from '../../services/doctorService';
import { useToast } from '../../contexts/ToastContext';

const CreateRecord = ({ onRecordCreated, onCancel }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    patientWalletAddress: '',
    diagnosis: '',
    symptoms: '',
    prescriptionDetails: '',
    treatmentPlan: '',
    visitDate: new Date().toISOString().split('T')[0],
    recordType: 'Consultation',
    notes: '',
    uploadedDocuments: []
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const recordTypes = [
    'Consultation',
    'Follow-up',
    'Check-up',
    'Emergency',
    'Surgery',
    'Diagnostic',
    'Treatment',
    'Other'
  ];

  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!formData.patientWalletAddress.trim()) {
      newErrors.patientWalletAddress = 'Patient wallet address is required';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.patientWalletAddress)) {
      newErrors.patientWalletAddress = 'Invalid Ethereum wallet address';
    }

    if (!formData.diagnosis.trim()) {
      newErrors.diagnosis = 'Diagnosis is required';
    }

    if (!formData.symptoms.trim()) {
      newErrors.symptoms = 'Symptoms are required';
    }

    if (!formData.prescriptionDetails.trim()) {
      newErrors.prescriptionDetails = 'Prescription details are required';
    }

    if (!formData.treatmentPlan.trim()) {
      newErrors.treatmentPlan = 'Treatment plan is required';
    }

    if (!formData.visitDate) {
      newErrors.visitDate = 'Visit date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // Files will be uploaded to IPFS when record is created
      // Store file objects for now
      const uploadedFiles = files.map((file, index) => ({
        id: `doc_${Date.now()}_${index}`,
        file: file, // Store actual file object
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date().toISOString()
      }));

      setFormData(prev => ({
        ...prev,
        uploadedDocuments: [...prev.uploadedDocuments, ...uploadedFiles]
      }));
      
      showToast('Files ready for upload. They will be uploaded to IPFS when you create the record.', 'info');
    } catch (error) {
      console.error('Error preparing files:', error);
      showToast('Error preparing files for upload', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const removeDocument = (docId) => {
    setFormData(prev => ({
      ...prev,
      uploadedDocuments: prev.uploadedDocuments.filter(doc => doc.id !== docId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare files for IPFS upload
      const files = formData.uploadedDocuments
        .filter(doc => doc.file)
        .map(doc => doc.file);

      // Prepare record data
      const recordData = {
        diagnosis: formData.diagnosis,
        symptoms: formData.symptoms.split(',').map(s => s.trim()).filter(s => s),
        prescription: formData.prescriptionDetails,
        treatmentPlan: formData.treatmentPlan,
        treatment: formData.treatmentPlan,
        doctorNotes: formData.notes || ''
      };

      // Create record on blockchain with IPFS file upload
      const result = await doctorService.createRecord(
        formData.patientWalletAddress,
        recordData,
        files
      );

      if (result.success) {
        showToast('Medical record created successfully on blockchain!', 'success');
        onRecordCreated(result.record);
      } else {
        throw new Error(result.error || 'Failed to create record');
      }
    } catch (error) {
      console.error('Error creating record:', error);
      showToast(error.message || 'Failed to create medical record', 'error');
      setErrors({ general: error.message || 'Failed to create record. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const InputField = ({ 
    name, 
    label, 
    type = 'text', 
    placeholder, 
    icon: Icon, 
    required = false,
    options = null,
    multiline = false,
    rows = 3
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        {options ? (
          <select
            name={name}
            value={formData[name]}
            onChange={handleInputChange}
            className={`
              block w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
              ${Icon ? 'pl-10 pr-4' : 'px-4'}
              ${errors[name] 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
              }
              py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white
            `}
          >
            <option value="">Select {label}</option>
            {options.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : multiline ? (
          <textarea
            name={name}
            value={formData[name]}
            onChange={handleInputChange}
            placeholder={placeholder}
            rows={rows}
            className={`
              block w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
              ${Icon ? 'pl-10 pr-4' : 'px-4'}
              ${errors[name] 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
              }
              py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none
            `}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={`
              block w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
              ${Icon ? 'pl-10 pr-4' : 'px-4'}
              ${errors[name] 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
              }
              py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white
            `}
          />
        )}
      </div>
      
      {errors[name] && (
        <div className="flex items-center space-x-1 text-red-600 text-sm">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <span>{errors[name]}</span>
        </div>
      )}
    </div>
  );

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
          <DocumentTextIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Create Medical Record
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Document patient visit and medical information
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Information */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            Patient Information
          </h4>
          
          <InputField
            name="patientWalletAddress"
            label="Patient Wallet Address"
            placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
            icon={UserIcon}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              name="visitDate"
              label="Visit Date"
              type="date"
              icon={CalendarIcon}
              required
            />
            <InputField
              name="recordType"
              label="Record Type"
              options={recordTypes}
              required
            />
          </div>
        </div>

        {/* Medical Information */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            Medical Information
          </h4>
          
          <InputField
            name="diagnosis"
            label="Diagnosis"
            placeholder="Enter primary diagnosis..."
            multiline
            rows={3}
            required
          />

          <InputField
            name="symptoms"
            label="Symptoms"
            placeholder="List all symptoms observed..."
            multiline
            rows={4}
            required
          />

          <InputField
            name="prescriptionDetails"
            label="Prescription Details"
            placeholder="Medications, dosages, and instructions..."
            icon={ClipboardDocumentListIcon}
            multiline
            rows={4}
            required
          />

          <InputField
            name="treatmentPlan"
            label="Treatment Plan"
            placeholder="Detailed treatment plan and follow-up instructions..."
            multiline
            rows={4}
            required
          />

          <InputField
            name="notes"
            label="Additional Notes"
            placeholder="Any additional observations or notes..."
            multiline
            rows={3}
          />
        </div>

        {/* Document Upload */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            Medical Documents
          </h4>
          
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
            <div className="text-center">
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                    Upload medical documents
                  </span>
                  <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">
                    X-rays, lab reports, images, etc. (IPFS storage)
                  </span>
                </label>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.dcm,.dicom"
                  onChange={handleFileUpload}
                  className="sr-only"
                  disabled={isUploading}
                />
              </div>
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file-upload').click()}
                  disabled={isUploading}
                  icon={<CloudArrowUpIcon className="w-4 h-4" />}
                >
                  {isUploading ? 'Uploading...' : 'Choose Files'}
                </Button>
              </div>
            </div>
          </div>

          {/* Uploaded Documents */}
          {formData.uploadedDocuments.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Uploaded Documents ({formData.uploadedDocuments.length})
              </h5>
              <div className="space-y-2">
                {formData.uploadedDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {doc.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(doc.size)} • {doc.ipfsHash ? `IPFS: ${doc.ipfsHash.slice(0, 10)}...` : 'Ready to upload'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(doc.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-error-500 mr-3" />
              <p className="text-sm text-error-700 dark:text-error-300">{errors.general}</p>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            icon={isSubmitting ? null : <CheckCircleIcon className="w-5 h-5" />}
          >
            {isSubmitting ? 'Creating Record...' : 'Create Record'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateRecord;
