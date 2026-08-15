import { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';

const useDepartments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await api.get('/departments');
                setDepartments(response.data);
                setError(null);
            } catch (err) {
                console.error("Failed to load departments", err);
                setError("Failed to load departments.");
                // Fallback list
                setDepartments([
                    { code: 'CSE', name: 'Computer Science and Engineering' },
                    { code: 'IT', name: 'Information Technology' },
                    { code: 'AIML', name: 'Artificial Intelligence and Machine Learning' },
                    { code: 'CSM', name: 'Computer Science and Engineering (Artificial Intelligence & Machine Learning)' },
                    { code: 'AIDS', name: 'Artificial Intelligence and Data Science' },
                    { code: 'CSO', name: 'Computer Science and Engineering (Internet of Things)' },
                    { code: 'CIC', name: 'Computer Science and Information Technology' },
                    { code: 'ECE', name: 'Electronics and Communication Engineering' },
                    { code: 'EEE', name: 'Electrical and Electronics Engineering' },
                    { code: 'CIVIL', name: 'Civil Engineering' },
                    { code: 'MECH', name: 'Mechanical Engineering' }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchDepartments();
    }, []);

    return { departments, loading, error };
};

export default useDepartments;
