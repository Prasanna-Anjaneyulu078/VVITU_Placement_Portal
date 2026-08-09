import React, { useState } from 'react';
import { Modal, Button, LoadingSpinner } from './index';
import { CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, ShieldCheck, Target, Check, X, HelpCircle, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';

/**
 * Reusable Radio Option Selector Component for Screening Questions
 * Renders modern, crisp radio buttons with 14px text, hover states, and responsive layout.
 */
function RadioOptionSelector({ options = ['Yes', 'No'], selectedValue, onChange, groupName }) {
  return (
    <div 
      role="radiogroup" 
      aria-label={groupName}
      className="flex flex-col sm:flex-row flex-wrap gap-3 w-full"
    >
      {options.map((option) => {
        const isSelected = selectedValue === option;
        return (
          <label
            key={option}
            tabIndex={0}
            role="radio"
            aria-checked={isSelected}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                onChange(option);
              }
            }}
            onClick={() => onChange(option)}
            className={`
              flex-1 min-w-[140px] flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-150 cursor-pointer select-none min-h-[46px]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] focus-visible:ring-offset-2
              ${isSelected
                ? 'bg-orange-50/70 border-[#F47C20] text-[#F47C20] shadow-xs ring-1 ring-[#F47C20]/20'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
              }
            `}
          >
            <span className="flex items-center gap-3">
              <span 
                className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                  isSelected ? 'border-[#F47C20] bg-white' : 'border-slate-300 bg-white'
                }`}
              >
                {isSelected && <span className="w-2 h-2 rounded-full bg-[#F47C20]" />}
              </span>
              <span className="text-[14px] font-semibold">{option}</span>
            </span>
            {isSelected && <CheckCircle2 size={16} className="text-[#F47C20] shrink-0 ml-1.5" />}
          </label>
        );
      })}
    </div>
  );
}

export default function PreApplicationScreeningModal({
  isOpen,
  onClose,
  job,
  studentProfile,
  onSuccess
}) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Skill Match & Eligibility, 2: Questions, 3: Review
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for screening questions
  const [joiningAvailability, setJoiningAvailability] = useState('');
  const [relocation, setRelocation] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [serviceBond, setServiceBond] = useState('');
  const [declaration, setDeclaration] = useState(false);

  const resetState = () => {
    setCurrentStep(1);
    setJoiningAvailability('');
    setRelocation('');
    setPreferredLocation('');
    setServiceBond('');
    setDeclaration(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!job) return null;

  // Validation checks
  const isQ1Valid = Boolean(joiningAvailability);
  const isQ2Valid = Boolean(relocation);
  const isQ3Valid = Boolean(preferredLocation);
  const isQ4Valid = Boolean(serviceBond);
  const isQ5Valid = Boolean(declaration);

  const isScreeningComplete = isQ1Valid && isQ2Valid && isQ3Valid && isQ4Valid && isQ5Valid;

  const handleSubmitApplication = async () => {
    if (!isScreeningComplete && job.enableScreening) {
      toast.error('Please complete all mandatory screening questions and accept the declaration.');
      return;
    }

    setIsSubmitting(true);

    const screeningAnswers = job.enableScreening ? [
      {
        questionKey: 'JOINING_AVAILABILITY',
        questionText: 'Are you available to join immediately after completing your graduation?',
        answer: joiningAvailability
      },
      {
        questionKey: 'RELOCATION',
        questionText: 'Are you willing to relocate based on business requirements?',
        answer: relocation
      },
      {
        questionKey: 'PREFERRED_LOCATION',
        questionText: 'Select your preferred work location.',
        answer: preferredLocation
      },
      {
        questionKey: 'SERVICE_BOND',
        questionText: 'Are you willing to sign a service agreement if required by the company?',
        answer: serviceBond
      },
      {
        questionKey: 'DECLARATION',
        questionText: 'I confirm that all information provided in this application is accurate.',
        answer: declaration ? 'Accepted' : 'Not Accepted'
      }
    ] : [];

    try {
      await api.post(`/student/jobs/${job.id}/apply`, { screeningAnswers });
      toast.success(`Application submitted successfully for ${job.title}!`);
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || err.message || 'Failed to submit application';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const skillMatchPercentage = job.skillMatchPercentage ?? 100;
  const matchedSkills = job.matchedSkills || [];
  const missingSkills = job.missingSkills || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Job Application - ${job.company}`}
    >
      <div className="space-y-6">
        
        {/* PROGRESS STEPPER HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center ${
              currentStep === 1 
                ? 'bg-[#F47C20] text-white shadow-xs' 
                : currentStep > 1 
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200/60' 
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              {currentStep > 1 ? '✓' : '1'}
            </span>
            <span className={`text-xs font-extrabold ${currentStep === 1 ? 'text-slate-900' : currentStep > 1 ? 'text-emerald-700' : 'text-slate-400'}`}>
              Skill Match & Eligibility
            </span>
          </div>

          <div className="h-0.5 w-6 sm:w-10 bg-slate-200" />

          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center ${
              currentStep === 2 
                ? 'bg-[#F47C20] text-white shadow-xs' 
                : currentStep > 2 
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200/60' 
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              {currentStep > 2 ? '✓' : '2'}
            </span>
            <span className={`text-xs font-extrabold ${currentStep === 2 ? 'text-slate-900' : currentStep > 2 ? 'text-emerald-700' : 'text-slate-400'}`}>
              Screening
            </span>
          </div>

          <div className="h-0.5 w-6 sm:w-10 bg-slate-200" />

          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center ${
              currentStep === 3 
                ? 'bg-[#F47C20] text-white shadow-xs' 
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              3
            </span>
            <span className={`text-xs font-extrabold ${currentStep === 3 ? 'text-slate-900' : 'text-slate-400'}`}>
              Review & Submit
            </span>
          </div>
        </div>

        {/* STEP 1: SKILL MATCH & ELIGIBILITY CHECK SUMMARY */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-3">
              <ShieldCheck className="text-emerald-600 shrink-0" size={24} />
              <div>
                <h4 className="text-sm font-extrabold text-emerald-900">Academic & Resume Eligibility Verified</h4>
                <p className="text-xs text-emerald-700 font-medium">You meet all mandatory academic requirements for {job.company}.</p>
              </div>
            </div>

            {/* SKILL MATCH SUMMARY */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={18} className="text-[#F47C20]" />
                  <h5 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Skill Match Analysis</h5>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-black">
                  {skillMatchPercentage}% Match
                </span>
              </div>

              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    skillMatchPercentage >= 80 ? 'bg-emerald-500' : skillMatchPercentage >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                  }`} 
                  style={{ width: `${skillMatchPercentage}%` }} 
                />
              </div>

              {matchedSkills.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-emerald-700 mb-2 flex items-center gap-1">
                    <CheckCircle2 size={12}/> Matched Skills ({matchedSkills.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedSkills.map(skill => (
                      <span key={skill} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Check size={12}/> {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {missingSkills.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1">
                    <X size={12}/> Missing Skills ({missingSkills.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {missingSkills.map(skill => (
                      <span key={skill} className="px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="w-full sm:w-auto h-11 text-[#F47C20] border-2 border-[#F47C20] hover:bg-orange-50 font-extrabold rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (job.enableScreening) {
                    setCurrentStep(2);
                  } else {
                    setCurrentStep(3);
                  }
                }}
                className="w-full sm:w-auto h-11 bg-[#F47C20] hover:bg-[#d96916] text-white flex items-center justify-center gap-2 font-extrabold rounded-xl shadow-xs"
              >
                {job.enableScreening ? 'Continue to Screening' : 'Continue to Review'} <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: PRE-APPLICATION SCREENING QUESTIONS */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="p-4 bg-orange-50/80 border border-orange-200/80 rounded-2xl flex items-center gap-3">
              <HelpCircle size={22} className="text-[#F47C20] shrink-0" />
              <div>
                <h4 className="text-sm font-extrabold text-[#F47C20]">Mandatory Screening Questions</h4>
                <p className="text-[14px] text-slate-600 font-medium mt-0.5">Please answer all mandatory screening questions required by {job.company}.</p>
              </div>
            </div>

            <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-1">
              
              {/* Question 1: Joining Availability */}
              <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4 transition-all hover:border-slate-300">
                <div className="flex items-start gap-3">
                  <span className="text-[16px] font-bold text-[#F47C20] shrink-0 pt-0.5">
                    Q1
                  </span>
                  <div>
                    <label className="block text-[17px] font-extrabold text-slate-800 leading-snug">
                      Are you available to join immediately after completing your graduation? <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[14px] font-medium text-slate-500 mt-1">Select your availability status upon graduation.</p>
                  </div>
                </div>

                <RadioOptionSelector
                  options={['Yes', 'No', 'Need Discussion']}
                  selectedValue={joiningAvailability}
                  onChange={setJoiningAvailability}
                  groupName="Joining Availability"
                />

                {!isQ1Valid && (
                  <p className="text-[13px] text-red-500 font-medium flex items-center gap-1 mt-2">
                    <AlertCircle size={13} /> Please answer this question.
                  </p>
                )}
              </div>

              {/* Question 2: Relocation */}
              <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4 transition-all hover:border-slate-300">
                <div className="flex items-start gap-3">
                  <span className="text-[16px] font-bold text-[#F47C20] shrink-0 pt-0.5">
                    Q2
                  </span>
                  <div>
                    <label className="block text-[17px] font-extrabold text-slate-800 leading-snug">
                      Are you willing to relocate based on business requirements? <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[14px] font-medium text-slate-500 mt-1">Specify your relocation willingness for this role.</p>
                  </div>
                </div>

                <RadioOptionSelector
                  options={['Yes', 'No', 'Depends on Location']}
                  selectedValue={relocation}
                  onChange={setRelocation}
                  groupName="Relocation Willingness"
                />

                {!isQ2Valid && (
                  <p className="text-[13px] text-red-500 font-medium flex items-center gap-1 mt-2">
                    <AlertCircle size={13} /> Please answer this question.
                  </p>
                )}
              </div>

              {/* Question 3: Preferred Location (Dropdown) */}
              <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4 transition-all hover:border-slate-300">
                <div className="flex items-start gap-3">
                  <span className="text-[16px] font-bold text-[#F47C20] shrink-0 pt-0.5">
                    Q3
                  </span>
                  <div>
                    <label className="block text-[17px] font-extrabold text-slate-800 leading-snug">
                      Select your preferred work location. <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[14px] font-medium text-slate-500 mt-1">Choose your primary work location preference from the options below.</p>
                  </div>
                </div>

                <div className="w-full">
                  <select
                    value={preferredLocation}
                    onChange={(e) => setPreferredLocation(e.target.value)}
                    className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 focus:outline-none focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all cursor-pointer"
                  >
                    <option value="">-- Choose Preferred Location --</option>
                    <option value="Any Location">Any Location</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Pune">Pune</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                {!isQ3Valid && (
                  <p className="text-[13px] text-red-500 font-medium flex items-center gap-1 mt-2">
                    <AlertCircle size={13} /> Please select a preferred work location.
                  </p>
                )}
              </div>

              {/* Question 4: Service Agreement / Bond */}
              <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4 transition-all hover:border-slate-300">
                <div className="flex items-start gap-3">
                  <span className="text-[16px] font-bold text-[#F47C20] shrink-0 pt-0.5">
                    Q4
                  </span>
                  <div>
                    <label className="block text-[17px] font-extrabold text-slate-800 leading-snug">
                      Are you willing to sign a service agreement if required by the company? <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[14px] font-medium text-slate-500 mt-1">Indicate if you agree to standard service agreement terms.</p>
                  </div>
                </div>

                <RadioOptionSelector
                  options={['Yes', 'No']}
                  selectedValue={serviceBond}
                  onChange={setServiceBond}
                  groupName="Service Agreement Bond"
                />

                {!isQ4Valid && (
                  <p className="text-[13px] text-red-500 font-medium flex items-center gap-1 mt-2">
                    <AlertCircle size={13} /> Please answer this question.
                  </p>
                )}
              </div>

              {/* Question 5: Declaration Checkbox */}
              <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-3 transition-all hover:border-slate-300">
                <div className="flex items-start gap-3">
                  <span className="text-[16px] font-bold text-[#F47C20] shrink-0 pt-0.5">
                    Q5
                  </span>
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={declaration}
                      onChange={(e) => setDeclaration(e.target.checked)}
                      className="mt-1 rounded border-slate-300 text-[#F47C20] focus:ring-[#F47C20] w-4.5 h-4.5 cursor-pointer shrink-0"
                    />
                    <span className="text-[14px] font-semibold text-slate-700 leading-relaxed">
                      I confirm that all information provided in this application is accurate. I understand that submitting false information may lead to rejection of my application. <span className="text-red-500">*</span>
                    </span>
                  </label>
                </div>

                {!isQ5Valid && (
                  <p className="text-[13px] text-red-500 font-medium flex items-center gap-1 pl-9 mt-2">
                    <AlertCircle size={13} /> You must accept the declaration to proceed.
                  </p>
                )}
              </div>

            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(1)} 
                className="w-full sm:w-auto h-11 text-[#F47C20] border-2 border-[#F47C20] hover:bg-orange-50 font-extrabold flex items-center justify-center gap-1.5 px-5 rounded-xl"
              >
                <ChevronLeft size={16} className="text-[#F47C20]" /> Back
              </Button>
              <Button 
                onClick={() => setCurrentStep(3)}
                disabled={!isScreeningComplete}
                className="w-full sm:w-auto h-11 bg-[#F47C20] hover:bg-[#d96916] text-white flex items-center justify-center gap-2 font-extrabold px-6 rounded-xl shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Review Application <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: APPLICATION REVIEW & CONFIRM */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">{job.title}</h4>
                  <p className="text-xs font-bold text-[#F47C20]">{job.company}</p>
                </div>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold uppercase">{job.jobType}</span>
              </div>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><MapPin size={13} /> {job.location}</p>
            </div>

            {/* SCREENING ANSWERS SUMMARY BOX */}
            {job.enableScreening && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                <h5 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Screening Answers Summary</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Immediate Joining</p>
                    <p className="font-extrabold text-slate-800">{joiningAvailability}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Relocation</p>
                    <p className="font-extrabold text-slate-800">{relocation}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Preferred Location</p>
                    <p className="font-extrabold text-slate-800">{preferredLocation}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Service Bond</p>
                    <p className="font-extrabold text-slate-800">{serviceBond}</p>
                  </div>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-100 p-2.5 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Declaration accepted & confirmed</span>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(job.enableScreening ? 2 : 1)} 
                disabled={isSubmitting}
                className="w-full sm:w-auto h-11 text-[#F47C20] border-2 border-[#F47C20] hover:bg-orange-50 font-extrabold flex items-center justify-center gap-1.5 px-5 rounded-xl"
              >
                <ChevronLeft size={16} className="text-[#F47C20]" /> Back
              </Button>
              <Button 
                onClick={handleSubmitApplication}
                disabled={isSubmitting}
                className="w-full sm:w-auto h-11 bg-[#F47C20] hover:bg-[#d96916] text-white font-extrabold px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <span className="flex items-center gap-2"><LoadingSpinner size="sm"/> Submitting...</span> : 'Submit Application'}
              </Button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
}
