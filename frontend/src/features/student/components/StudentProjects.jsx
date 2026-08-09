import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import { Card } from '../../../components/common';
import './StudentProjects.css';

export default function StudentProjects({ projects }) {
  const navigate = useNavigate();

  return (
    <Card 
      title="Projects"
      headerAction={
        <div className="flex items-center gap-2">
          <Rocket size={20} className="text-primary" />
          <span className="view-all-link" onClick={() => navigate('/student/profile')}>View All</span>
        </div>
      }
      className="section-card"
    >
      {projects && projects.length > 0 ? (
        <div className="projects-grid">
          {projects.map((project, index) => (
            <div key={index} className="project-card">
              <h4 className="project-title">{project.title}</h4>
              <p className="project-desc">{project.description}</p>
              <div className="tech-stack">
                {project.tech && project.tech.map((t, i) => (
                  <span key={i} className="tech-badge">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No projects added yet.</p>
        </div>
      )}
    </Card>
  );
}
