import axios from '../api/axios';

const documentService = {
    // El empleado ve sus propios documentos
    getMyDocuments: (params) => {
        return axios.get('/api/v1/employees/me/documents', { params });
    },

    // RRHH o Admin listan documentos de un empleado
    getEmployeeDocuments: (employeeId, params) => {
        return axios.get(`/api/v1/employees/${employeeId}/documents-list`, { params });
    },

    // RRHH o Admin suben un documento a un empleado
    uploadDocument: (employeeId, formData) => {
        return axios.post(`/api/v1/employees/${employeeId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Descargar un documento
    downloadDocument: (documentId) => {
        return axios.get(`/api/v1/documents/${documentId}/download`, {
            responseType: 'blob'
        });
    },

    // Actualizar metadatos de un documento
    updateDocument: (documentId, data) => {
        return axios.patch(`/api/v1/documents/${documentId}`, data);
    },

    // Eliminar un documento (Solo RRHH/Admin)
    deleteDocument: (documentId) => {
        return axios.delete(`/api/v1/documents/${documentId}`);
    }
};

export default documentService;
