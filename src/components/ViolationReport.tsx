import React, { useState } from 'react';
import { Camera, AlertTriangle, Upload, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useWeb3 } from '../contexts/Web3Context';
import { ViolationType } from '../types';
import { greenfieldService } from '../services/greenfieldService';
import { apiService } from '../services/apiService';

const ViolationReport: React.FC = () => {
  const { userVehicles, reportViolation, isLoading } = useData();
  const { account } = useWeb3();
  const [formData, setFormData] = useState({
    vehicleId: '',
    violationType: ViolationType.HELMET_VIOLATION,
    description: '',
    location: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const violationTypes = [
    { value: ViolationType.HELMET_VIOLATION, label: 'Helmet Violation', color: 'red' },
    { value: ViolationType.PLATE_TAMPERING, label: 'Plate Tampering', color: 'orange' },
    { value: ViolationType.SPEEDING, label: 'Speeding', color: 'yellow' },
    { value: ViolationType.WRONG_PARKING, label: 'Wrong Parking', color: 'blue' },
    { value: ViolationType.OTHER, label: 'Other', color: 'gray' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId) {
      setErrorMessage('Please select a vehicle to report against');
      return;
    }

    if (!account) {
      setErrorMessage('Please connect your wallet');
      return;
    }

    if (!selectedFile) {
      setErrorMessage('Please upload evidence photo/video');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');
    setErrorMessage('');

    try {
      // Step 1: Upload to Greenfield
      setUploadProgress(25);
      const tempViolationId = `temp-${Date.now()}`;
      const greenfieldUrl = await greenfieldService.uploadViolationEvidence(
        selectedFile,
        tempViolationId,
        account
      );
      
      setUploadProgress(50);

      // Step 2: Submit to backend API first
      const backendData = {
        reporter: account,
        vehicleId: parseInt(formData.vehicleId),
        violationType: formData.violationType,
        description: formData.description,
        location: formData.location,
        greenfieldUrl,
        blockchainTxHash: '' // Will be updated after blockchain submission
      };

      const backendResult = await apiService.submitViolation(backendData);
      setUploadProgress(75);

      // Step 3: Submit to blockchain
      await reportViolation({
        vehicleId: parseInt(formData.vehicleId),
        violationType: formData.violationType,
        description: formData.description,
        imageFile: selectedFile,
        greenfieldUrl,
        location: formData.location
      });
      
      setUploadProgress(100);
      setUploadStatus('success');
      setSuccess(true);
      
      // Reset form
      setFormData({
        vehicleId: '',
        violationType: ViolationType.HELMET_VIOLATION,
        description: '',
        location: ''
      });
      setSelectedFile(null);
      setPreview(null);
      
      setTimeout(() => {
        setSuccess(false);
        setUploadStatus('idle');
      }, 5000);
    } catch (error) {
      console.error('Report failed:', error);
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit violation report');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      const validation = greenfieldService.validateFile(file);
      if (!validation.valid) {
        setErrorMessage(validation.error || 'Invalid file');
        return;
      }

      setSelectedFile(file);
      setErrorMessage('');
      
      // Create preview
      try {
        const preview = await greenfieldService.fileToBase64(file);
        setPreview(preview);
      } catch (error) {
        console.error('Error creating preview:', error);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const simulateAIDetection = () => {
    const detectionResults = [
      "Helmet not detected on rider",
      "License plate appears tampered",
      "Vehicle exceeding speed limit detected",
      "Parking violation detected",
      "Traffic rule violation identified"
    ];
    
    const randomResult = detectionResults[Math.floor(Math.random() * detectionResults.length)];
    setFormData(prev => ({ 
      ...prev, 
      description: prev.description + (prev.description ? '\n\n' : '') + `AI Detection: ${randomResult}`
    }));
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setErrorMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-white" />
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-white">Report Violation</h1>
              <p className="text-orange-100">Help improve road safety by reporting violations</p>
            </div>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 px-6 py-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Violation report submitted successfully! Evidence uploaded to Greenfield. You'll receive CIVIC tokens if approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 px-6 py-4">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <div>
                <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700">
                  Select Vehicle (from registered vehicles)
                </label>
                <select
                  name="vehicleId"
                  id="vehicleId"
                  value={formData.vehicleId}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                  required
                >
                  <option value="">Select a vehicle to report against</option>
                  {userVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      Vehicle #{vehicle.id} - {vehicle.vehicleType} ({vehicle.ownerName})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Note: In real scenario, you would report violations against any vehicle, not just your own
                </p>
              </div>

              <div>
                <label htmlFor="violationType" className="block text-sm font-medium text-gray-700">
                  Violation Type
                </label>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {violationTypes.map((type) => (
                    <label key={type.value} className="flex items-center">
                      <input
                        type="radio"
                        name="violationType"
                        value={type.value}
                        checked={formData.violationType === type.value}
                        onChange={handleChange}
                        className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300"
                      />
                      <span className="ml-3 block text-sm font-medium text-gray-700">
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="location"
                    id="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="MG Road, Bangalore"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 focus:ring-orange-500 focus:border-orange-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="Describe the violation in detail..."
                  required
                />
                <button
                  type="button"
                  onClick={simulateAIDetection}
                  className="mt-2 inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Simulate AI Detection
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Evidence Photo/Video *
                </label>
                
                {isUploading && (
                  <div className="mb-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {uploadProgress < 50 ? 'Uploading to Greenfield...' : 
                       uploadProgress < 75 ? 'Submitting to backend...' : 
                       'Finalizing blockchain transaction...'}
                    </p>
                  </div>
                )}

                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-orange-400 transition-colors duration-200">
                  <div className="space-y-1 text-center">
                    {preview ? (
                      <div className="space-y-2">
                        {selectedFile?.type.startsWith('video/') ? (
                          <video src={preview} className="mx-auto h-32 w-32 object-cover rounded-lg" controls />
                        ) : (
                          <img src={preview} alt="Preview" className="mx-auto h-32 w-32 object-cover rounded-lg" />
                        )}
                        <div className="text-sm text-gray-600">
                          <p className="font-medium">{selectedFile?.name}</p>
                          <p className="text-xs">{(selectedFile?.size || 0 / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <div className="flex space-x-2 justify-center">
                          <label htmlFor="file-upload" className="cursor-pointer font-medium text-orange-600 hover:text-orange-500">
                            Change file
                          </label>
                          <button
                            type="button"
                            onClick={removeFile}
                            className="font-medium text-red-600 hover:text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="text-sm text-gray-600">
                          <label htmlFor="file-upload" className="cursor-pointer font-medium text-orange-600 hover:text-orange-500">
                            Upload a file
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF, MP4, MOV up to 10MB
                        </p>
                      </>
                    )}
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Camera className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      BNB Greenfield Storage
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Evidence is securely stored on BNB Greenfield decentralized storage. 
                        Files are encrypted and accessible only to authorized officers for review.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-orange-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-800">
                      Reward System
                    </h3>
                    <div className="mt-2 text-sm text-orange-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Valid reports earn 10 CIVIC tokens</li>
                        <li>False reports may result in penalties</li>
                        <li>Reports are reviewed by government officers</li>
                        <li>Evidence is stored permanently on blockchain</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || isUploading || !selectedFile}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading || isUploading ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  {isUploading ? 'Uploading to Greenfield...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <Camera className="h-5 w-5 mr-2" />
                  Submit Report with Evidence
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ViolationReport;