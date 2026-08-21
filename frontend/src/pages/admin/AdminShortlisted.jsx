import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Search, CheckCircle, Calendar, CheckSquare, Users, X, RotateCcw } from 'lucide-react';
import api from '../../utils/axiosConfig';
import StudentDetailsDrawer from '../../components/common/StudentDetailsDrawer';
import ApplicationStudentTable from '../../components/common/ApplicationStudentTable';

export default function AdminShortlisted({ isTab = false, onCountsUpdate }) {
  const [shortlisted, setShortlisted] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // Student Details Drawer states
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchShortlisted = async () => {
    try {
      setIsLoading(true);
      let data = [];
      try {
        const res = await api.get('/admin/applications/shortlisted');
        data = Array.isArray(res.data) ? res.data : (res.data?.content || []);
      } catch {
        const altRes = await api.get('/admin/students/shortlisted');
        data = Array.isArray(altRes.data) ? altRes.data : (altRes.data?.content || []);
      }
      setShortlisted(data);
      if (onCountsUpdate) onCountsUpdate(data.length);
    } catch (err) {
      console.error('Failed to load shortlisted applications', err);
      setShortlisted([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShortlisted();
  }, []);



  const content = (
    <div className="admin-shortlisted-content w-full">

      {/* TABLE & MOBILE CARDS */}

      {/* TABLE */}
      <ApplicationStudentTable
        data={shortlisted}
        isLoading={isLoading}
        emptyMessage={
          "No shortlisted students available."
        }
        onSelectStudent={(item) => {
          setSelectedAppId(item.id);
          setIsDrawerOpen(true);
        }}
      />

      {/* Student Details Drawer */}
      <StudentDetailsDrawer
        applicationId={selectedAppId}
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedAppId(null); }}
        onStatusUpdate={() => fetchShortlisted()}
        role="admin"
      />
    </div>
  );

  return isTab ? content : <DashboardLayout role="admin">{content}</DashboardLayout>;
}
