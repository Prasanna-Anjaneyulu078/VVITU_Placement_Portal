import React from 'react';
import StudentDetailsDrawer from '../../../../shared/components/StudentDetailsDrawer/index.jsx';
import './index.css';

export default function ApplicationDetailsDrawer(props) {
  return <StudentDetailsDrawer {...props} role="alumni" />;
}
