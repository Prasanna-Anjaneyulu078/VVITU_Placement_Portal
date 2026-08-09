import React from 'react';
import { Brain } from 'lucide-react';
import { Card } from '../../../components/common';
import './TechnicalSkills.css';

export default function TechnicalSkills({ skills }) {
  return (
    <Card 
      title="Technical Skills"
      headerAction={<Brain size={20} className="text-primary" />}
      className="section-card"
    >
      {skills && skills.length > 0 ? (
        <div className="skills-container">
          {skills.map((skill, index) => (
            <span 
              key={index} 
              className="skill-tag"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No skills added yet.</p>
        </div>
      )}
    </Card>
  );
}
