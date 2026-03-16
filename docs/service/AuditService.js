sap.ui.define([
	"com/demo/prototype/service/StorageService"
], function (StorageService) {
	"use strict";

	const AUDIT_STORAGE_KEY = "auditLogs";

	/**
	 * AuditService - Servicio de auditoría inmutable para registro de acciones
	 */
	return {
		/**
		 * Registra una acción en el historial de auditoría
		 * @param {string} projectId - ID del proyecto
		 * @param {string} action - Descripción de la acción
		 * @param {string} userId - ID del usuario
		 * @param {string} userName - Nombre del usuario
		 * @param {object} details - Detalles adicionales opcionales
		 * @returns {Promise<object>} Promesa con el log creado
		 */
		logAction: function (projectId, action, userId, userName, details = {}) {
			return new Promise((resolve) => {
				setTimeout(() => {
					const logs = StorageService.load(AUDIT_STORAGE_KEY) || [];
					
					const newLog = {
						id: `LOG${Date.now()}${Math.floor(Math.random() * 1000)}`,
						projectId: projectId,
						action: action,
						userId: userId,
						userName: userName,
						timestamp: new Date().toISOString(),
						details: details
					};
					
					// Los logs son inmutables - solo se agregan, nunca se modifican
					logs.push(newLog);
					StorageService.save(AUDIT_STORAGE_KEY, logs);
					
					resolve(newLog);
				}, 100);
			});
		},

		/**
		 * Obtiene logs de auditoría de un proyecto
		 * @param {string} projectId - ID del proyecto
		 * @returns {Promise<Array>} Promesa con array de logs
		 */
		getProjectLogs: function (projectId) {
			return new Promise((resolve) => {
				setTimeout(() => {
					const allLogs = StorageService.load(AUDIT_STORAGE_KEY) || [];
					const projectLogs = allLogs
						.filter(log => log.projectId === projectId)
						.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
					
					resolve(projectLogs);
				}, 100);
			});
		},

		/**
		 * Obtiene todos los logs del sistema
		 * @returns {Promise<Array>} Promesa con array de logs
		 */
		getAllLogs: function () {
			return new Promise((resolve) => {
				setTimeout(() => {
					const logs = StorageService.load(AUDIT_STORAGE_KEY) || [];
					const sortedLogs = logs.sort((a, b) => 
						new Date(b.timestamp) - new Date(a.timestamp)
					);
					resolve(sortedLogs);
				}, 100);
			});
		}
	};
});
