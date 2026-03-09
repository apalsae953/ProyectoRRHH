import axios from '../api/axios';

const vacationService = {
    // Pedimos la lista de mis solicitudes de vacaciones
    getMyVacations: async () => {
        const response = await axios.get('/api/v1/vacations/me');
        return response.data;
    },

    // Pedimos el balance de días de vacaciones que me quedan
    getMyBalance: async () => {
        const response = await axios.get('/api/v1/vacation-balances/me');
        return response.data;
    },

    // Enviamos una nueva solicitud de vacaciones
    requestVacation: async (vacationData) => {
        const response = await axios.post('/api/v1/vacations', vacationData);
        return response.data;
    },

    // Pedir TODAS las vacaciones de la empresa (Vista Admin)
    getAllVacations: async () => {
        // Asumiendo que el backend devuelve todas si eres admin
        const response = await axios.get('/api/v1/vacations');
        return response.data;
    },

    // Aprobar una solicitud
    approveVacation: async (id, admin_message) => {
        const response = await axios.post('/api/v1/vacations/' + id + '/approve', { admin_message });
        return response.data;
    },

    // Rechazar una solicitud
    rejectVacation: async (id, admin_message) => {
        const response = await axios.post('/api/v1/vacations/' + id + '/reject', { admin_message });
        return response.data;
    },

    // Cancelar la solicitud por parte del empleado (si está pendiente o aprobada antes de empezar)
    cancelVacation: async (id, cancel_reason) => {
        const response = await axios.patch('/api/v1/vacations/' + id, { status: 'canceled', cancel_reason });
        return response.data;
    },

    // Borrar de mi historial (si está cancelada, rechazada o pasada)
    deleteVacation: async (id) => {
        const response = await axios.delete('/api/v1/vacations/' + id);
        return response.data;
    }
};

export default vacationService;