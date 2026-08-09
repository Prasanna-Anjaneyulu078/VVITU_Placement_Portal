import React from 'react';
import StudentDetailsDrawer from '../common/StudentDetailsDrawer';
import './ApplicationDetailsDrawer.css';

export default function ApplicationDetailsDrawer(props) {
  return <StudentDetailsDrawer {...props} role="alumni" />;
}
