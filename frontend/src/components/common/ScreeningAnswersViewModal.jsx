import React from 'react';
import { Modal, Button, Badge } from './index';
import { CheckCircle2, FileText, User, Mail, MapPin, Building, Briefcase } from 'lucide-react';
import { toTitleCase } from '../../utils/nameUtils';

export default function ScreeningAnswersViewModal({
  isOpen,
  onClose,
  application
}) {
  if (!application) return null;

  const answers = application.screeningAnswers || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Applicant Screening Answers"
      size="md"
    >
      <div className="space-y-6">
        
        {/* Applicant Header Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <h4 className="text-base font-extrabold text-slate-900">
              {toTitleCase(application.student?.user?.name || application.student?.name || 'Applicant')}
            </h4>
            <p className="text-xs font-bold text-[#F47C20]">
              {application.student?.rollNumber || application.student?.department || 'Student'}
            </p>
          </div>
          <span className="px-3 py-1 bg-orange-50 text-[#F47C20] border border-orange-200 rounded-full text-xs font-extrabold">
            {application.job?.title || application.jobTitle || 'Job Application'}
          </span>
        </div>

        {/* Screening Responses List */}
        <div className="space-y-4">
          <h5 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            Pre-Application Questionnaire Responses
          </h5>

          {answers.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 font-medium">
              No pre-application screening answers recorded for this job.
            </div>
          ) : (
            <div className="space-y-3">
              {answers.map((ans, idx) => (
                <div key={ans.id || idx} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
                  <p className="text-xs font-bold text-slate-500">
                    Q{idx + 1}: {ans.questionText || ans.questionKey}
                  </p>
                  <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 pt-0.5">
                    <CheckCircle2 size={16} className="text-[#F47C20]" />
                    <span>{ans.answer}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>

      </div>
    </Modal>
  );
}
