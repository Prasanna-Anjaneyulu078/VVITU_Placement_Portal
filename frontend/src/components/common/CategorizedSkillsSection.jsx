import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Wrench, UploadCloud, RefreshCw, Plus, X, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';
import ResumeUploadModal from './ResumeUploadModal';

function CategorizedSkillsSectionComponent({ 
  hasResume = false, 
  onSkillsChange, 
  onResumeUploadSuccess,
  refreshTrigger,
  latestSkills 
}) {
  const [skillList, setSkillList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reExtracting, setReExtracting] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);

  const fetchSkills = useCallback(async (isInitial = false) => {
    if (isInitial && skillList.length === 0) {
      setLoading(true);
    }
    try {
      const res = await api.get('/student/skills', {
        params: { t: Date.now() }
      });
      const extractedSkillNames = [];
      const seen = new Set();
      if (Array.isArray(res.data)) {
        res.data.forEach(cat => {
          if (cat.skills && Array.isArray(cat.skills)) {
            cat.skills.forEach(s => {
              if (s.skillName && !seen.has(s.skillName.trim().toLowerCase())) {
                seen.add(s.skillName.trim().toLowerCase());
                extractedSkillNames.push(s.skillName.trim());
              }
            });
          }
        });
      }
      extractedSkillNames.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      setSkillList(extractedSkillNames);
      if (onSkillsChange) onSkillsChange(res.data);
    } catch {
      toast.error('Failed to load skills.');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [onSkillsChange, skillList.length]);

  useEffect(() => {
    fetchSkills(true);
  }, []);

  // Instantly sync when parent passes new extracted skills array
  useEffect(() => {
    if (latestSkills && Array.isArray(latestSkills)) {
      const sorted = [...latestSkills].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      setSkillList(sorted);
    }
  }, [latestSkills]);

  // Re-fetch skills when refresh trigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchSkills(false);
    }
  }, [refreshTrigger, fetchSkills]);

  const handleDirectReExtract = async () => {
    if (!hasResume) {
      toast.info('No uploaded resume found. Please upload a resume first.');
      setShowUploadModal(true);
      return;
    }
    setReExtracting(true);
    try {
      const res = await api.post('/student/skills/re-extract');
      if (res.data?.student) {
        if (onResumeUploadSuccess) onResumeUploadSuccess(res.data);
        toast.success(res.data.message || 'Skills re-extracted successfully!');
      } else if (res.data?.success && Array.isArray(res.data?.skills)) {
        const sorted = [...res.data.skills].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        setSkillList(sorted);
        toast.success(`Skills re-extracted successfully! (${res.data.totalSkills || sorted.length} skills total)`);
      } else {
        await fetchSkills(false);
        toast.success('Skills re-extracted successfully from your resume.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data || err.message || 'Failed to re-extract skills.';
      toast.error(errorMsg);
      if (typeof errorMsg === 'string' && (errorMsg.toLowerCase().includes('resume') || errorMsg.toLowerCase().includes('upload'))) {
        setShowUploadModal(true);
      }
    } finally {
      setReExtracting(false);
    }
  };

  const handleAddManualSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    setAddingSkill(true);
    try {
      await api.post('/student/skills', { skillName: newSkillName.trim(), categoryName: 'Tools' });
      toast.success(`Skill "${newSkillName.trim()}" added successfully.`);
      setNewSkillName('');
      setShowAddModal(false);
      await fetchSkills(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add skill.');
    } finally {
      setAddingSkill(false);
    }
  };

  const handleUploadSuccess = async (data) => {
    const extractedSkills = data?.skills || data?.student?.skills || data?.studentProfile?.skills;
    if (extractedSkills && Array.isArray(extractedSkills)) {
      const sorted = [...extractedSkills].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      setSkillList(sorted);
    } else {
      await fetchSkills(false);
    }
    if (onResumeUploadSuccess) onResumeUploadSuccess(data);
    toast.success(data?.message || 'Resume replaced successfully. Skills & Technologies have been updated automatically.');
  };

  const formattedSkillText = useMemo(() => {
    return skillList.join(', ');
  }, [skillList]);

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all xl:col-span-2">
        {/* Section Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-[#F47C20]">
              <Wrench size={16} />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                Skills &amp; Technologies
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Automatically extracted from your resume &amp; manually added
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] rounded-xl text-xs font-bold   transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Plus size={14} /> Add Skill
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3 py-1.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] rounded-xl text-xs font-bold   transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <UploadCloud size={14} /> Replace Resume
            </button>
            <button
              onClick={handleDirectReExtract}
              disabled={reExtracting}
              className="px-3 py-1.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] rounded-xl text-xs font-bold   transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              title="Re-extract skills from your latest uploaded resume"
            >
              {reExtracting ? (
                <>
                  <Loader2 size={14} className="animate-spin text-[#F47C20]" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  <span>Re-Extract Skills</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body — Displayed as a single comma-separated list */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-slate-400 text-xs font-semibold">
              <Loader2 size={16} className="animate-spin text-[#F47C20]" />
              <span>Loading skills &amp; technologies...</span>
            </div>
          ) : skillList.length > 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed break-words">
                {formattedSkillText}
              </p>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
              <Wrench size={32} className="mx-auto text-slate-300" />
              <div>
                <p className="text-xs font-bold text-slate-600">No skills added yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Upload your resume or add manual skills to populate this section.
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20]   text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                Upload Resume &amp; Extract Skills
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Resume Modal */}
      <ResumeUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        hasExistingResume={hasResume}
        onSuccess={handleUploadSuccess}
      />

      {/* Add Manual Skill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800">Add Manual Skill</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400   rounded-lg p-1"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddManualSkill} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Skill Name
                </label>
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="e.g. Docker, GraphQL, System Design"
                  className="w-full h-9 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F47C20]"
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-slate-500   text-xs font-bold border border-slate-200 rounded-xl  "
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingSkill}
                  className="px-4 py-1.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20]   text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {addingSkill ? 'Adding...' : 'Add Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const CategorizedSkillsSectionMemo = React.memo(CategorizedSkillsSectionComponent);

export { CategorizedSkillsSectionMemo as CategorizedSkillsSection };
export default CategorizedSkillsSectionMemo;
