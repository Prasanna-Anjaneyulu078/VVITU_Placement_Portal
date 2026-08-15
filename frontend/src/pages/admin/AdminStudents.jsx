import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, Table, Button } from '../../components/common';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';
import useDepartments from '../../hooks/useDepartments';
import { toTitleCase } from '../../utils/nameUtils';

export default function AdminStudents() {
  const { departments } = useDepartments();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/students');
      setStudents(res.data);
    } catch (err) {
      console.error('Failed to load students', err);
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudentIds(currentUsers.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSelectStudent = (id) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleBulkVerify = async (approved) => {
    if (selectedStudentIds.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    try {
      await api.post('/admin/students/verify/bulk', {
        studentIds: selectedStudentIds,
        approved
      });
      toast.success(`Students ${approved ? 'Verified' : 'Rejected'} Successfully`);
      setSelectedStudentIds([]);
      fetchStudents();
    } catch (err) {
      toast.error('Bulk verification failed');
    }
  };

  const filteredUsers = students.filter(s => {
    const matchesSearch = !searchTerm || s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !filterDept || s.department === filterDept;
    const matchesStatus = !filterStatus || s.verificationStatus === filterStatus.toUpperCase();
    return matchesSearch && matchesDept && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetFilters = () => {
    setSearchTerm('');
    setFilterDept('');
    setFilterStatus('');
  };

  const getStatusBadge = (status) => {
    switch(status?.toUpperCase()) {
      case 'VERIFIED': return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const columns = [
    {
      header: (
        <input 
          type="checkbox" 
          checked={currentUsers.length > 0 && selectedStudentIds.length === currentUsers.length}
          onChange={handleSelectAll}
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
      ),
      render: (student) => (
        <input 
          type="checkbox"
          checked={selectedStudentIds.includes(student.id)}
          onChange={() => handleSelectStudent(student.id)}
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
      )
    },
    {
      header: 'Name',
      render: (student) => (
        <div className="font-bold text-gray-900">{toTitleCase(student.name)}</div>
      )
    },
    { header: 'Roll Number', accessor: 'rollNumber', className: 'text-gray-600 font-medium' },
    { header: 'Department', accessor: 'department', className: 'text-gray-600' },
    { header: 'Semester', accessor: 'semester', className: 'text-gray-600' },
    { header: 'CGPA', accessor: 'cgpa', className: 'text-gray-600 font-bold' },
    {
      header: 'Status',
      render: (student) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(student.verificationStatus)}`}>
          {student.verificationStatus}
        </span>
      )
    }
  ];

  return (
    <DashboardLayout role="admin">
      <PageHeader 
        title="Student Directory" 
        subtitle="Manage and verify all registered students." 
      />

      <div className="mt-6">
        <div className="flex justify-end gap-2 mb-4">
          <Button 
            variant="outline"
            className="text-red-600 border-red-200  "
            onClick={() => handleBulkVerify(false)}
          >
            Reject Selected
          </Button>
          <Button 
            className="bg-green-600   text-white"
            onClick={() => handleBulkVerify(true)}
          >
            Verify Selected
          </Button>
        </div>

        {filteredUsers.length === 0 && !isLoading ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-gray-500">No students found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <Table 
              columns={columns}
              data={currentUsers}
              isLoading={isLoading}
              pagination={{
                currentPage,
                totalPages,
                onPageChange: setCurrentPage,
                totalItems: filteredUsers.length,
                pageSize: itemsPerPage,
                itemLabel: "students"
              }}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
