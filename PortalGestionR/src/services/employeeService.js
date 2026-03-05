import axios from '../api/axios';

const employeeService = {
    getEmployees: async () => {
        const response = await axios.get('/api/v1/employees');
        return response.data;
    }
};

export default employeeService;