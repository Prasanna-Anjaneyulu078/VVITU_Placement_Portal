import React from 'react';
import githubLogoAsset from '../../assets/profile-icons/github.svg';
import linkedinLogoAsset from '../../assets/profile-icons/linkedin.svg';
import leetcodeLogoAsset from '../../assets/profile-logos/leetcode.svg';
import codechefLogoAsset from '../../assets/profile-logos/codechef.svg';
import geeksforgeeksLogoAsset from '../../assets/profile-logos/geeksforgeeks.png';

/* GitHub & LinkedIn keep their inline SVG components (unchanged) */

export const GitHubIcon = ({ size = 32, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fill="#181717"/>
  </svg>
);

export const LinkedInIcon = ({ size = 32, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect width="24" height="24" rx="4.5" fill="#0A66C2"/>
    <path d="M19 19H16V13.88C16 12.3 15.28 11.23 13.87 11.23C12.79 11.23 12.14 11.96 11.86 12.66C11.76 12.91 11.73 13.26 11.73 13.61V19H8.73S8.77 9.87 8.73 9H11.73V10.42C12.13 9.81 13.08 8.94 14.66 8.94C16.6 8.94 18 10.21 18 13.16V19H19Z" fill="white"/>
    <circle cx="6.5" cy="6.5" r="1.5" fill="white"/>
    <rect x="5" y="9" width="3" height="10" fill="white"/>
  </svg>
);

/* LeetCode, CodeChef, GFG: use <img> to load official SVG asset files */

export const LeetCodeIcon = ({ size = 32, className = '' }) => (
  <img
    src={leetcodeLogoAsset}
    alt="LeetCode"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    style={{ objectFit: 'contain', display: 'block' }}
  />
);

export const CodeChefIcon = ({ size = 32, className = '' }) => (
  <img
    src={codechefLogoAsset}
    alt="CodeChef"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    style={{ objectFit: 'contain', display: 'block' }}
  />
);

export const GeeksforGeeksIcon = ({ size = 32, className = '' }) => (
  <img
    src={geeksforgeeksLogoAsset}
    alt="GeeksforGeeks"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    style={{ objectFit: 'contain', display: 'block' }}
  />
);

export const PROFILE_ICONS = {
  github: {
    asset: githubLogoAsset,
    component: GitHubIcon,
    name: 'GitHub',
    alt: 'GitHub Official Brand Logo',
  },
  linkedin: {
    asset: linkedinLogoAsset,
    component: LinkedInIcon,
    name: 'LinkedIn',
    alt: 'LinkedIn Official Brand Logo',
  },
  leetcode: {
    asset: leetcodeLogoAsset,
    component: LeetCodeIcon,
    name: 'LeetCode',
    alt: 'LeetCode Official Brand Logo',
  },
  codechef: {
    asset: codechefLogoAsset,
    component: CodeChefIcon,
    name: 'CodeChef',
    alt: 'CodeChef Official Brand Logo',
  },
  gfg: {
    asset: geeksforgeeksLogoAsset,
    component: GeeksforGeeksIcon,
    name: 'GeeksforGeeks',
    alt: 'GeeksforGeeks Official Brand Logo',
  },
};

/**
 * ProfileIconCard - renders a single clickable platform logo.
 * If url is empty, renders a disabled version with a "Profile not added" tooltip.
 */
export const ProfileIconCard = ({ platformKey, url, size = 32 }) => {
  const platform = PROFILE_ICONS[platformKey];
  if (!platform) return null;

  const IconComponent = platform.component;
  const hasUrl = url && url.trim().length > 0;

  if (!hasUrl) {
    return (
      <div
        aria-label={platform.name + ' Profile (Not added)'}
        className="group w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center cursor-not-allowed opacity-50"
        title="Profile not added"
      >
        <IconComponent
          size={size}
          className="w-8 h-8 grayscale opacity-60"
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={platform.name + ' Profile'}
      className="group w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/80     flex items-center justify-center transition-all duration-200 shadow-sm     cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F47C20]"
      title={platform.name}
    >
      <IconComponent
        size={size}
        className="w-8 h-8 transition-transform duration-200  "
      />
    </a>
  );
};

export const ProfilePlatformIcon = ({ platformKey, size = 24, className = '' }) => {
  const platform = PROFILE_ICONS[platformKey];
  if (!platform) return null;
  const IconComponent = platform.component;
  return <IconComponent size={size} className={className} />;
};

export default PROFILE_ICONS;
