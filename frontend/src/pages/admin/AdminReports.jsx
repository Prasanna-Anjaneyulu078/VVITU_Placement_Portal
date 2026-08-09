import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, Button } from '../../components/common';
import { FileText, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';

export default function AdminReports() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type, format) => {
    setIsExporting(true);
    try {
      const response = await api.get(`/admin/reports/export`, {
        params: { type, format },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const extension = format === 'EXCEL' ? 'xlsx' : 'csv';
      link.setAttribute('download', `${type.toLowerCase()}_report.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Report Generated Successfully');
    } catch (err) {
      console.error('Export Failed', err);
      toast.error('Export Failed');
    } finally {
      setIsExporting(false);
    }
  };

  const reportTypes = [
    { id: 'STUDENT', title: 'Students Report', desc: 'Export all students data including verification status and CGPA.' },
    { id: 'ALUMNI', title: 'Alumni Report', desc: 'Export all alumni details including company, designation and status.' },
    { id: 'JOB', title: 'Jobs Report', desc: 'Export job postings, types, locations and their current status.' },
    { id: 'APP', title: 'Applications Report', desc: 'Export all applications with student, job details and funnel status.' }
  ];

  return (
    <DashboardLayout role="admin">
      <PageHeader 
        title="Export Reports" 
        subtitle="Generate and download data reports in CSV or Excel format." 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {reportTypes.map((report) => (
          <div key={report.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{report.title}</h3>
              <p className="text-sm text-gray-500 mb-6">{report.desc}</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 flex justify-center items-center gap-2"
                onClick={() => handleExport(report.id, 'CSV')}
                disabled={isExporting}
              >
                <Download size={16} /> CSV
              </Button>
              <Button 
                className="flex-1 flex justify-center items-center gap-2 bg-green-600   text-white"
                onClick={() => handleExport(report.id, 'EXCEL')}
                disabled={isExporting}
              >
                <FileSpreadsheet size={16} /> Excel
              </Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
