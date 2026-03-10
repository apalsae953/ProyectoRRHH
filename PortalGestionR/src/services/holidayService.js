import axios from '../api/axios';

const holidayService = {
    getHolidays: () => axios.get('/api/v1/holidays'),
    createHoliday: (data) => axios.post('/api/v1/holidays', data),
    deleteHoliday: (id) => axios.delete(`/api/v1/holidays/${id}`)
};

export default holidayService;
