sap.ui.define([], function () {
	"use strict";

	return {
		/**
		 * Estados de proyectos
		 */
		ProjectStatus: {
			IN_PROGRESS: "En Proceso",
			REQUESTED: "Solicitado",
			REJECTED: "Rechazado",
			APPROVED: "Aprobado",
			LIQUIDATED: "Liquidado",
			CLOSED: "Cerrado"
		},

		/**
		 * Semáforos de validación
		 */
		SemaphoreStatus: {
			GREEN: "Verde",
			AMBER: "Ámbar",
			RED: "Rojo"
		},

		/**
		 * Roles de usuario
		 */
		UserRoles: {
			PROJECT_MANAGER: "Gerente de Proyecto",
			FINANCE_OPERATOR: "Operador de Finanzas",
			FINANCE_SUPERVISOR: "Supervisor Financiero"
		},

		/**
		 * Tipos de proyecto
		 */
		ProjectTypes: {
			INVESTMENT: "Proyecto de Inversión",
			INFRASTRUCTURE: "Infraestructura",
			TECHNOLOGY: "Tecnología"
		},

		/**
		 * Estados SAP de PEP
		 */
		PEPStatus: {
			RELEASED: "LIB",
			LIQUIDATED: "LIQ",
			CLOSED: "CERR",
			TECHNICALLY_COMPLETED: "TECO"
		},

		/**
		 * Tipos de documento
		 */
		DocumentTypes: {
			PURCHASE_ORDER: "Pedido",
			PURCHASE_REQUISITION: "SolPed"
		},

		/**
		 * Umbrales de semáforos
		 */
		SemaphoreThresholds: {
			GREEN_MIN: 100,
			AMBER_MIN: 85,
			AMBER_MAX: 99,
			RED_MAX: 84
		},

		/**
		 * Mensajes del sistema
		 */
		Messages: {
			DATA_UPDATED: "Datos actualizados exitosamente",
			VALIDATION_COMPLETED: "Validación completada",
			PROJECT_READY: "Proyecto listo para solicitar cierre",
			EXPORT_SUCCESS: "Exportación completada",
			FILTERS_CLEARED: "Filtros limpiados"
		}
	};
});
