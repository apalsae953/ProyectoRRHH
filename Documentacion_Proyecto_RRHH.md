# Informe de Creación: Portal de Gestión de RRHH - Globomatik

## 1. Introducción
Este proyecto consiste en el desarrollo de una plataforma web integral para la gestión de Recursos Humanos, diseñada específicamente para **Globomatik**. El objetivo principal es centralizar y automatizar procesos críticos como la solicitud de vacaciones, la gestión de documentos (nóminas, contratos) y el control de la estructura organizativa de la empresa.

## 2. Stack Tecnológico
Para garantizar un rendimiento óptimo, seguridad y escalabilidad, se ha optado por un stack moderno:

*   **Frontend**: React.js con Vite. Se ha priorizado una UX/UI de nivel "Premium" utilizando Tailwind CSS para un diseño limpio, moderno y responsivo.
*   **Backend**: Laravel 10+ (PHP). Proporciona una API robusta, segura y fácil de mantener.
*   **Base de Datos**: MySQL, gestionada a través del ORM Eloquent de Laravel.
*   **Autenticación**: Sistema basado en sesiones/cookies seguras de Laravel Sanctum.

## 3. Arquitectura del Sistema
El proyecto sigue una arquitectura de **Separación de Responsabilidades**:
*   **Backend (API)**: Controladores optimizados, Request Validation para seguridad de datos, y Resources para estandarizar las respuestas JSON.
*   **Frontend (SPA)**: Gestión de estado global, rutas protegidas mediante roles y servicios dedicados para la comunicación con la API.

## 4. Funcionalidades Implementadas

### 4.1. Gestión de Empleados
*   Control de acceso basado en roles (**Admin**, **Director de RRHH**, **Empleado**).
*   CRUD completo de empleados con asignación de departamentos y puestos.
*   Edición de perfiles y seguridad (cambio de contraseñas).

### 4.2. Sistema de Vacaciones y Ausencias
*   **Solicitud Inteligente**: Los empleados pueden solicitar rangos de fechas.
*   **Cálculo Automático**: El sistema descuenta automáticamente los fines de semana y los días festivos registrados del saldo total del empleado.
*   **Flujo de Aprobación**: RRHH puede aprobar o rechazar solicitudes con mensajes personalizados.

### 4.3. Calendario de Equipo y Festivos
*   **Calendario Interactivo**: Visualización de vacaciones aprobadas de todo el equipo.
*   **Gestión de Festivos**: Los administradores pueden añadir días festivos individuales o **rangos de fechas** (por ejemplo, Semana Santa) de forma masiva.

### 4.4. Gestión Documental (Expediente Digital)
*   Subida de archivos (PDF, Imágenes) asociados a cada empleado.
*   **Edición de Metadatos**: Capacidad de cambiar el nombre de los documentos tanto en el momento de la subida como una vez almacenados.
*   Descarga segura y eliminación de archivos.

## 5. Diseño y Experiencia de Usuario (UX)
*   **Estética "Premium"**: Uso de sombras suaves, bordes redondeados (extra-rounded), transiciones fluidas y micro-animaciones.
*   **Iconografía**: Integración total de Font Awesome 6 para una interfaz visualmente intuitiva.
*   **Feedback Constante**: Modales de confirmación, estados de carga (skeletons/spinners) y notificaciones de éxito/error.

## 6. Próximos Pasos Sugeridos
1.  **Notificaciones en Tiempo Real**: Implementar avisos mediante WebSockets para cambios de estado de vacaciones.
2.  **Generación de Reportes**: Exportación de datos de empleados y vacaciones a formato Excel/PDF.
3.  **Firma Digital**: Integración de una API para la firma legal de contratos y nóminas.

---
*Documento generado automáticamente como resumen de la implementación técnica hasta la fecha (Marzo 2026).*
