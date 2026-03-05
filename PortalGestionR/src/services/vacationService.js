import axios from '../api/axios';

const vacationService = {
    // Pedimos la lista de mis solicitudes de vacaciones
    getMyVacations: async () => {
        const response = await axios.get('/api/v1/vacations');
        return response.data;
    },

    // Pedimos el balance de días de vacaciones que me quedan
    getMyBalance: async () => {
        const response = await axios.get('/api/v1/vacation-balances');
        return response.data;
    },

    // Enviamos una nueva solicitud de vacaciones
    requestVacation: async (vacationData) => {
        const response = await axios.post('/api/v1/vacations', vacationData);
        return response.data;
    }
};

export default vacationService;