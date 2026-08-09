import React from 'react';
import { Globe, ExternalLink } from 'lucide-react';
import { ProfilePlatformIcon } from '../common/ProfileIcons';

/* HackerRank SVG Icon */
const HackerRankIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect width="24" height="24" rx="4.5" fill="#2EC866"/>
    <path d="M12 6L7 12H10V18H14V12H17L12 6Z" fill="white"/>
  </svg>
);

export default function ProfessionalLinksSection({ details }) {
  if (!details) return null;

  const links = [
    { key: 'github', name: 'GitHub', url: details.githubUrl },
    { key: 'linkedin', name: 'LinkedIn', url: details.linkedinUrl },
    { key: 'leetcode', name: 'LeetCode', url: details.leetcodeUrl },
    { key: 'codechef', name: 'CodeChef', url: details.codechefUrl },
    { key: 'hackerrank', name: 'HackerRank', url: details.hackerrankUrl, customIcon: <HackerRankIcon size={20} /> },
    { key: 'gfg', name: 'GeeksforGeeks', url: details.gfgUrl }
  ].filter(link => link.url && link.url.trim().length > 0);

  if (links.length === 0) {
    return null; // Hide empty links section completely
  }

  const formatUrl = (url) => {
    if (!url) return '#';
    const clean = url.trim();
    return clean.startsWith('http') ? clean : `https://${clean}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <Globe size={16} className="text-[#F47C20]" />
        <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Professional Links</h4>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {links.map((item) => (
          <a
            key={item.key}
            href={formatUrl(item.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 border border-slate-200 hover:border-[#F47C20] hover:bg-[#FFF4EB] rounded-xl transition-all shadow-2xs group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F47C20]"
            title={`Open ${item.name} profile in new tab`}
          >
            {item.customIcon ? (
              item.customIcon
            ) : (
              <ProfilePlatformIcon platformKey={item.key} size={20} />
            )}
            <span className="text-xs font-bold text-slate-800 group-hover:text-[#F47C20] transition-colors">
              {item.name}
            </span>
            <ExternalLink size={12} className="text-slate-400 group-hover:text-[#F47C20] transition-colors" />
          </a>
        ))}
      </div>
    </div>
  );
}
