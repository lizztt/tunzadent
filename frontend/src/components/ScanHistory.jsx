import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { predictionService } from '../services/api';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ScanHistory = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const loadScanHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await predictionService.getPatientScans(patientId);
      setPatient(response.data.patient);
      setScans(response.data.scans);
    } catch (error) {
      toast.error('Failed to load scan history');
      console.error('Error loading scan history:', error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadScanHistory();
  }, [loadScanHistory]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadCSV = () => {
    if (scans.length === 0) {
      toast.error('No scans to download');
      return;
    }

    const headers = ['Date', 'Image Type', 'Tooth Region', 'Caries Detected', 'Confidence', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...scans.map(scan => [
        formatDate(scan.uploaded_at),
        scan.image_type || 'N/A',
        scan.tooth_region || 'N/A',
        scan.prediction?.has_caries ? 'Yes' : 'No',
        scan.prediction?.confidence_score ? `${(scan.prediction.confidence_score * 100).toFixed(2)}%` : 'N/A',
        `"${scan.notes || 'None'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${patient.first_name}_${patient.last_name}_scan_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV downloaded successfully');
  };

  const downloadPDF = async () => {
    if (scans.length === 0) {
      toast.error('No scans to download');
      return;
    }

    if (!patient) {
      toast.error('Patient information not loaded');
      return;
    }

    setDownloadingPDF(true);
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235);
      doc.text('Tunzadent', 14, 20);
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Patient Scan History Report', 14, 30);
      
      // Patient Info
      doc.setFontSize(12);
      doc.text(`Patient: ${patient.first_name || ''} ${patient.last_name || ''}`, 14, 45);
      doc.text(`Patient ID: ${patient.patient_id || 'N/A'}`, 14, 52);
      
      let dobText = 'N/A';
      if (patient.date_of_birth) {
        try {
          dobText = new Date(patient.date_of_birth).toLocaleDateString();
        } catch (e) {
          dobText = patient.date_of_birth;
        }
      }
      doc.text(`Date of Birth: ${dobText}`, 14, 59);
      doc.text(`Gender: ${patient.gender || 'N/A'}`, 14, 66);
      doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 14, 73);
      
      // Summary
      const cariesCount = scans.filter(scan => scan.prediction?.has_caries).length;
      doc.setFontSize(11);
      doc.text(`Total Scans: ${scans.length}`, 14, 85);
      doc.text(`Caries Detected: ${cariesCount} (${scans.length > 0 ? ((cariesCount/scans.length)*100).toFixed(1) : 0}%)`, 14, 92);
      
      // Table
      const tableData = scans.map(scan => {
        let dateStr = 'N/A';
        try {
          dateStr = formatDate(scan.uploaded_at);
        } catch (e) {
          dateStr = scan.uploaded_at || 'N/A';
        }
        
        return [
          dateStr,
          scan.image_type || 'N/A',
          scan.tooth_region || 'N/A',
          scan.prediction?.has_caries ? 'Yes' : 'No',
          scan.prediction?.confidence_score ? `${(scan.prediction.confidence_score * 100).toFixed(2)}%` : 'N/A',
          (scan.notes || 'None').substring(0, 50)
        ];
      });

      // Use autoTable
      autoTable(doc, {
        startY: 100,
        head: [['Date', 'Type', 'Region', 'Caries', 'Confidence', 'Notes']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 25 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25 },
          5: { cellWidth: 45 }
        }
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(128);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      const firstName = patient.first_name || 'Patient';
      const lastName = patient.last_name || '';
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `${firstName}_${lastName}_scan_history_${dateStr}.pdf`.replace(/\s+/g, '_');
      
      doc.save(filename);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(`Failed to generate PDF: ${error.message}`);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const viewScanDetails = (scanId) => {
    navigate(`/results/${scanId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading scan history...</p>
        </div>
      </div>
    );
  }

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
              onClick={() => navigate('/patients')}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Back to Patients
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Patient Information Card */}
        <div className="bg-white border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Patient Information
            </h2>
          </div>
          <div className="px-6 py-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                  {patient?.first_name} {patient?.last_name}
                </h1>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Patient ID:</span>
                    <span className="ml-2 text-gray-900 font-medium">{patient?.patient_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Date of Birth:</span>
                    <span className="ml-2 text-gray-900 font-medium">{patient?.date_of_birth}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Gender:</span>
                    <span className="ml-2 text-gray-900 font-medium">{patient?.gender}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Scans:</span>
                    <span className="ml-2 text-gray-900 font-medium">{scans.length}</span>
                  </div>
                </div>
              </div>
              
              {/* Download Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={downloadCSV}
                  disabled={scans.length === 0}
                  className="flex items-center px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
                
                <button
                  onClick={downloadPDF}
                  disabled={scans.length === 0 || downloadingPDF}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingPDF ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Export PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scan History Table */}
        <div className="bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Diagnostic Scan Records
              </h3>
              <span className="text-xs text-gray-500">
                {scans.length} {scans.length === 1 ? 'record' : 'records'}
              </span>
            </div>
          </div>

          {scans.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-gray-900">No Scan Records</h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload a dental X-ray to begin diagnostic analysis for this patient
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/upload')}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload X-Ray
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Image Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Tooth Region
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Diagnosis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Confidence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(scan.uploaded_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {scan.image_type || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {scan.tooth_region || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {scan.prediction ? (
                          <span className={`px-2 py-1 text-xs font-semibold ${
                            scan.prediction.has_caries 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {scan.prediction.has_caries ? 'Caries Detected' : 'No Caries'}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Pending Analysis</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {scan.prediction?.confidence_score 
                          ? `${(scan.prediction.confidence_score * 100).toFixed(2)}%`
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => viewScanDetails(scan.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanHistory;