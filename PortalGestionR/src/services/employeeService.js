import axios from '../api/axios';

const employeeService = {
    getEmployees: async (params = {}) => {
        const response = await axios.get('/api/v1/employees', { params });
        return response.data;
    },
    createEmployee: async (data) => {
        const response = await axios.post('/api/v1/employees', data);
        return response.data;
    },
    updateEmployee: async (id, data) => {
        const response = await axios.put('/api/v1/employees/' + id, data);
        return response.data;
    }
};

export default employeeService;