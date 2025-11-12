import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../services/api';
import toast from 'react-hot-toast';

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [deletingPatient, setDeletingPatient] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'M',
    phone_number: '',
    email: '',
    medical_history: '',
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await patientService.getAll();
      setPatients(response.data);
    } catch (error) {
      toast.error('Failed to load patients');
    }
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setFormData({
      patient_id: patient.patient_id,
      first_name: patient.first_name,
      last_name: patient.last_name,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      phone_number: patient.phone_number || '',
      email: patient.email || '',
      medical_history: patient.medical_history || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingPatient) {
        await patientService.update(editingPatient.id, formData);
        toast.success('Patient record updated successfully');
      } else {
        await patientService.create(formData);
        toast.success('Patient record created successfully');
      }
      
      handleCancelForm();
      loadPatients();
    } catch (error) {
      toast.error(error.response?.data?.patient_id?.[0] || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPatient) return;
    
    try {
      await patientService.delete(deletingPatient.id);
      toast.success('Patient record deleted successfully');
      setDeletingPatient(null);
      loadPatients();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Sorry, you can not delete a patient with an uploaded x-ray image');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPatient(null);
    setFormData({
      patient_id: '',
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: 'M',
      phone_number: '',
      email: '',
      medical_history: '',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-xl font-semibold text-gray-900"
              >
                Tunzadent
              </button>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Patient Management</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage patient records and view diagnostic history
            </p>
          </div>
          <button
            onClick={() => {
              if (showForm && !editingPatient) {
                handleCancelForm();
              } else {
                setShowForm(!showForm);
                setEditingPatient(null);
              }
            }}
            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            {showForm && !editingPatient ? 'Cancel' : 'New Patient Record'}
          </button>
        </div>

        {/* Add/Edit Patient Form */}
        {showForm && (
          <div className="bg-white border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                {editingPatient ? 'Update Patient Record' : 'New Patient Registration'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-6">
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Patient ID
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., P001"
                        value={formData.patient_id}
                        onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                        disabled={editingPatient !== null}
                      />
                      {editingPatient && (
                        <p className="mt-1 text-xs text-gray-500">Patient ID cannot be changed</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+254 712 345 678"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">
                    Medical Information
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medical History
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter relevant medical history, allergies, medications, or pre-existing conditions..."
                      value={formData.medical_history}
                      onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="flex-1 px-6 py-3 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading 
                    ? (editingPatient ? 'Updating Record...' : 'Creating Record...') 
                    : (editingPatient ? 'Update Patient Record' : 'Create Patient Record')
                  }
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Patients Table */}
        <div className="bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Patient Records
              </h3>
              <span className="text-xs text-gray-500">
                {patients.length} {patients.length === 1 ? 'record' : 'records'}
              </span>
            </div>
          </div>
          
          {patients.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
                />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-gray-900">No patient records</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new patient record
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-6 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                New Patient Record
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Patient ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Date of Birth
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Scans
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {patient.patient_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(patient.date_of_birth).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.xray_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => navigate(`/patients/${patient.id}/history`)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Records
                          </button>
                          <button
                            onClick={() => handleEdit(patient)}
                            className="text-gray-600 hover:text-gray-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingPatient(patient)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Confirm Deletion
              </h3>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm text-gray-700 mb-4">
                Are you sure you want to delete the patient record for{' '}
                <span className="font-semibold">
                  {deletingPatient.first_name} {deletingPatient.last_name}
                </span>
                ?
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex space-x-4">
              <button
                onClick={() => setDeletingPatient(null)}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700"
              >
                Delete Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;