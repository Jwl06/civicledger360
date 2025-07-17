import React, { useState } from 'react';
import { Car, Hash, User, Save } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const VehicleRegistration: React.FC = () => {
  const { registerVehicle, isLoading } = useData();
  const [formData, setFormData] = useState({
    plateNumber: '',
    chassisId: '',
    engineNumber: '',
    ownerName: '',
    vehicleType: 'motorcycle'
  });
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerVehicle(formData);
      setSuccess(true);
      setFormData({
        plateNumber: '',
        chassisId: '',
        engineNumber: '',
        ownerName: '',
        vehicleType: 'motorcycle'
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center">
            <Car className="h-8 w-8 text-white" />
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-white">Vehicle Registration</h1>
              <p className="text-blue-100">Register your vehicle on the blockchain ledger</p>
            </div>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 px-6 py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Save className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Vehicle registered successfully on the blockchain!
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="plateNumber" className="block text-sm font-medium text-gray-700">
                License Plate Number
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="plateNumber"
                  id="plateNumber"
                  value={formData.plateNumber}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="MH12AB1234"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                This will be hashed and stored securely on blockchain
              </p>
            </div>

            <div>
              <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">
                Vehicle Type
              </label>
              <select
                name="vehicleType"
                id="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="motorcycle">Motorcycle</option>
                <option value="car">Car</option>
                <option value="truck">Truck</option>
                <option value="bus">Bus</option>
                <option value="auto-rickshaw">Auto Rickshaw</option>
              </select>
            </div>

            <div>
              <label htmlFor="chassisId" className="block text-sm font-medium text-gray-700">
                Chassis Number
              </label>
              <input
                type="text"
                name="chassisId"
                id="chassisId"
                value={formData.chassisId}
                onChange={handleChange}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                placeholder="MA3ERLF3S00000001"
                required
              />
            </div>

            <div>
              <label htmlFor="engineNumber" className="block text-sm font-medium text-gray-700">
                Engine Number
              </label>
              <input
                type="text"
                name="engineNumber"
                id="engineNumber"
                value={formData.engineNumber}
                onChange={handleChange}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                placeholder="G15B1234567"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
                Owner Name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="ownerName"
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Hash className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Blockchain Security
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Your vehicle details will be securely hashed using cryptographic algorithms
                    and stored on the BNB Smart Chain. This ensures data integrity and prevents tampering.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Registering...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Register Vehicle
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleRegistration;