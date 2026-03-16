sap.ui.define([
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/format/NumberFormat"
], function (DateFormat, NumberFormat) {
	"use strict";

	return {
		/**
		 * Formatea fechas en español (dd/MM/yyyy)
		 * @param {Date|string} date - Fecha a formatear
		 * @param {string} pattern - Patrón opcional (default: dd/MM/yyyy)
		 * @returns {string} Fecha formateada
		 */
		formatDate: function (date, pattern) {
			if (!date) {
				return "";
			}
			
			const dateFormat = DateFormat.getDateInstance({
				pattern: pattern || "dd/MM/yyyy"
			});
			
			const dateObj = (typeof date === "string") ? new Date(date) : date;
			return dateFormat.format(dateObj);
		},

		/**
		 * Formatea fecha con hora
		 * @param {Date|string} date - Fecha a formatear
		 * @returns {string} Fecha y hora formateadas
		 */
		formatDateTime: function (date) {
			if (!date) {
				return "";
			}
			
			const dateFormat = DateFormat.getDateTimeInstance({
				pattern: "dd/MM/yyyy HH:mm:ss"
			});
			
			const dateObj = (typeof date === "string") ? new Date(date) : date;
			return dateFormat.format(dateObj);
		},

		/**
		 * Formatea moneda en PEN (Soles peruanos)
		 * @param {number} value - Valor a formatear
		 * @returns {string} Valor formateado como moneda
		 */
		formatCurrency: function (value) {
			if (value === null || value === undefined) {
				return "PEN 0.00";
			}
			
			const currencyFormat = NumberFormat.getCurrencyInstance({
				currencyCode: false,
				decimals: 2,
				groupingEnabled: true
			});
			
			return "PEN " + currencyFormat.format(value);
		},

		/**
		 * Formatea número sin símbolo de moneda
		 * @param {number} value - Valor a formatear
		 * @returns {string} Valor formateado como número
		 */
		formatNumber: function (value) {
			if (value === null || value === undefined) {
				return "0.00";
			}
			
			const numberFormat = NumberFormat.getCurrencyInstance({
				currencyCode: false,
				decimals: 2,
				groupingEnabled: true
			});
			
			return numberFormat.format(value);
		},

		/**
		 * Formatea el estado del proyecto con badge colorido
		 * @param {string} state - Estado del proyecto
		 * @returns {string} Clase CSS para el estado
		 */
		formatState: function (state) {
			const stateMap = {
				"En Proceso": "Information",
				"Solicitado": "Warning",
				"Rechazado": "Error",
				"Aprobado": "Success",
				"Liquidado": "Information",
				"Cerrado": "None"
			};
			return stateMap[state] || "None";
		},

		/**
		 * Retorna icono y estado según semáforo Verde/Ámbar/Rojo
		 * @param {string} semaphore - Valor del semáforo
		 * @returns {string} Icono SAP
		 */
		formatSemaphoreIcon: function (semaphore) {
			switch (semaphore) {
				case "Verde":
					return "sap-icon://message-success";
				case "Ámbar":
					return "sap-icon://message-warning";
				case "Rojo":
					return "sap-icon://message-error";
				default:
					return "sap-icon://question-mark";
			}
		},

		/**
		 * Retorna color según semáforo Verde/Ámbar/Rojo
		 * @param {string} semaphore - Valor del semáforo
		 * @returns {string} Estado de color SAP
		 */
		formatSemaphoreColor: function (semaphore) {
			switch (semaphore) {
				case "Verde":
					return "Success";
				case "Ámbar":
					return "Warning";
				case "Rojo":
					return "Error";
				default:
					return "None";
			}
		},

		/**
		 * Retorna tooltip text según semáforo
		 * @param {string} semaphore - Valor del semáforo
		 * @returns {string} Texto del tooltip
		 */
		formatSemaphoreTooltip: function (semaphore) {
			switch (semaphore) {
				case "Verde":
					return "100% de PEPs válidos";
				case "Ámbar":
					return "85-99% de PEPs válidos";
				case "Rojo":
					return "0-84% de PEPs válidos";
				default:
					return "Estado desconocido";
			}
		},

		/**
		 * Calcula días transcurridos desde una fecha
		 * @param {Date|string} date - Fecha inicial
		 * @returns {number} Días transcurridos
		 */
		formatDaysElapsed: function (date) {
			if (!date) {
				return 0;
			}
			
			const dateObj = (typeof date === "string") ? new Date(date) : date;
			const today = new Date();
			const diffTime = Math.abs(today - dateObj);
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			return diffDays;
		},

		/**
		 * Formatea porcentaje
		 * @param {number} value - Valor a formatear
		 * @returns {string} Valor formateado como porcentaje
		 */
		formatPercentage: function (value) {
			if (value === null || value === undefined) {
				return "0%";
			}
			
			const percentFormat = NumberFormat.getPercentInstance({
				decimals: 1
			});
			
			return percentFormat.format(value / 100);
		},

		/**
		 * Formatea número entero
		 * @param {number} value - Valor a formatear
		 * @returns {string} Valor formateado
		 */
		formatInteger: function (value) {
			if (value === null || value === undefined) {
				return "0";
			}
			
			const intFormat = NumberFormat.getIntegerInstance({
				groupingEnabled: true
			});
			
			return intFormat.format(value);
		},

		/**
		 * Retorna icono para validación OK/Error
		 * @param {string} status - Estado de validación
		 * @returns {string} Icono SAP
		 */
		formatValidationIcon: function (status) {
			return status === "OK" ? "sap-icon://accept" : "sap-icon://error";
		},

		/**
		 * Retorna color para validación OK/Error
		 * @param {string} status - Estado de validación
		 * @returns {string} Color CSS
		 */
		formatValidationColor: function (status) {
			return status === "OK" ? "#107E3E" : "#B00";
		},

		/**
		 * Retorna estado de ObjectNumber según el saldo
		 * @param {number} balance - Saldo
		 * @returns {string} Estado de color SAP
		 */
		formatBalanceState: function (balance) {
			if (balance === null || balance === undefined) {
				return "None";
			}
			return balance === 0 ? "Success" : "Error";
		},

		/**
		 * Retorna icono para booleano
		 * @param {boolean} value - Valor booleano
		 * @returns {string} Icono SAP
		 */
		formatBooleanIcon: function (value) {
			return value ? "sap-icon://accept" : "sap-icon://decline";
		},

		/**
		 * Retorna color para booleano
		 * @param {boolean} value - Valor booleano
		 * @returns {string} Color CSS
		 */
		formatBooleanColor: function (value) {
			return value ? "#107E3E" : "#BB0000";
		},

		/**
		 * Retorna estado según porcentaje
		 * @param {number} percentage - Porcentaje
		 * @returns {string} Estado de color SAP
		 */
		formatPercentageState: function (percentage) {
			if (percentage === null || percentage === undefined) {
				return "None";
			}
			if (percentage >= 100) {
				return "Success";
			} else if (percentage >= 80) {
				return "Warning";
			} else {
				return "Error";
			}
		},

		/**
		 * Retorna icono según estado de solicitud
		 * @param {string} status - Estado de solicitud
		 * @returns {string} Icono SAP
		 */
		formatRequestIcon: function (status) {
			switch (status) {
				case "Solicitado":
					return "sap-icon://request";
				case "Aprobado":
					return "sap-icon://accept";
				case "Rechazado":
					return "sap-icon://decline";
				default:
					return "sap-icon://question-mark";
			}
		},

		/**
		 * Retorna color según estado de solicitud
		 * @param {string} status - Estado de solicitud
		 * @returns {string} Color CSS
		 */
		formatRequestColor: function (status) {
			switch (status) {
				case "Solicitado":
					return "#0A6ED1";
				case "Aprobado":
					return "#107E3E";
				case "Rechazado":
					return "#B00";
				default:
					return "#6A6D70";
			}
		},

		/**
		 * Retorna código de color del semáforo para binding directo
		 * @param {string} semaphore - Valor del semáforo
		 * @returns {string} Código de color CSS
		 */
		formatSemaphoreColorCode: function (semaphore) {
			switch (semaphore) {
				case "Verde":
					return "#107E3E";
				case "Ámbar":
					return "#E78C07";
				case "Rojo":
					return "#B00";
				default:
					return "#6A6D70";
			}
		},
		
		/**
		 * Retorna icono según tipo MIME
		 * @param {string} mimeType - Tipo MIME del archivo
		 * @returns {string} Icono SAP
		 */
		formatFileIcon: function (mimeType) {
			if (!mimeType) return "sap-icon://document";
			
			if (mimeType.includes("pdf")) return "sap-icon://pdf-attachment";
			if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "sap-icon://excel-attachment";
			if (mimeType.includes("word") || mimeType.includes("document")) return "sap-icon://doc-attachment";
			
			return "sap-icon://document";
		}
	};
});
