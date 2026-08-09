import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminVerifications from './AdminVerifications';
import api from '../../utils/axiosConfig';

vi.mock('../../utils/axiosConfig', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  }
}));

vi.mock('../../context/DataContext', () => ({
  useData: () => ({
    profileImage: '',
    updateProfileImage: vi.fn(),
    user: { role: 'ADMIN', name: 'Admin', email: 'admin@vvit.net' },
    logout: vi.fn()
  }),
  useAuth: () => ({
    logout: vi.fn(),
    userName: 'Admin',
    userEmail: 'admin@vvit.net'
  })
}));

// Mock toast to prevent errors
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

describe('AdminVerifications Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pending alumni and displays OCR insights', async () => {
    const mockAlumni = [
      {
        id: 1,
        user: { name: 'John Doe', email: 'john@vvit.net' },
        rollNumber: '20BQ1A0501',
        department: 'CSE',
        passingYear: '2024',
        ocrVerified: true,
        ocrDetectedCollege: 'VVIT',
        ocrConfidenceScore: 0.95,
        verificationDocumentUrl: 'doc.pdf'
      }
    ];

    api.get.mockImplementation((url) => {
      if (url === '/admin/alumni/pending') {
        return Promise.resolve({ data: mockAlumni });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <BrowserRouter>
        <AdminVerifications />
      </BrowserRouter>
    );

    // Wait for API call and render
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check for OCR data and Roll Number in the table
    expect(screen.getByText('OCR Passed')).toBeInTheDocument();
    expect(screen.getByText('20BQ1A0501')).toBeInTheDocument();
  });
});
