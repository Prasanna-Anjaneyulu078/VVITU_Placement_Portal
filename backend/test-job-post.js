const axios = require('axios');
const FormData = require('form-data');
const form = new FormData();
form.append('title', 'Software Engineer');
form.append('company', 'Google');
form.append('requiredSkills', 'React, Node');
form.append('requiredSkillsList', '["React", "Node"]');
form.append('eligibleDepartments', 'CSE, ECE');

axios.post('http://localhost:8082/api/jobs/post', form, {
  headers: {
    ...form.getHeaders(),
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTYsImVtYWlsIjoiYXNocml0aGFAZXhhbXBsZS5jb20iLCJyb2xlIjoiQUxVTU5JIiwiaWF0IjoxNzg3MjU5ODIwLCJleHAiOjE3ODcyNjM0MjB9.dVWPR-gAoQvFElJJ5A4QQtYQyTvnmvsy2sd9BNMWzpU'
  }
}).then(res => console.log('OK', res.data)).catch(err => {
  console.log('ERR STATUS', err.response?.status);
  console.log('ERR DATA', err.response?.data);
});
