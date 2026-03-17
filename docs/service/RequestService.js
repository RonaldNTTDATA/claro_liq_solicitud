sap.ui.define([
	"com/demo/prototype/service/StorageService",
	"com/demo/prototype/service/PEPService",
	"com/demo/prototype/service/AuditService"
], function (StorageService, PEPService, AuditService) {
	"use strict";

	const REQUESTS_KEY = "closureRequests";
	const PROJECTS_KEY = "projects";

	return {
		/**
		 * Crea una solicitud de cierre de proyecto
		 * @param {string} projectId - ID del proyecto
		 * @param {string} userId - ID del usuario que solicita
		 * @param {string} approverUser - Usuario aprobador ingresado
		 * @param {string} projectManager - Gerente de proyecto ingresado
		 * @returns {Promise<Object>} Promesa con solicitud creada
		 */
		createRequest: function (projectId, userId, approverUser, projectManager) {
			return new Promise((resolve, reject) => {
				setTimeout(async () => {
					try {
						// Cargar proyecto
						const aProjects = StorageService.load(PROJECTS_KEY) || [];
						const oProject = aProjects.find(p => p.id === projectId);
						
						if (!oProject) {
							reject(new Error("Proyecto no encontrado"));
							return;
						}

						// Verificar que semáforo sea verde
						if (oProject.semaphore !== "Verde") {
							reject(new Error("El proyecto debe tener semáforo verde para solicitar cierre"));
							return;
						}

						// Capturar snapshot de validaciones de todos los PEPs
						const aPEPs = await PEPService.getPEPsByProject(projectId);
						const oSnapshot = {
							timestamp: new Date().toISOString(),
							projectSemaphore: oProject.semaphore,
							validPepPercentage: oProject.validPepPercentage,
							peps: aPEPs.map(pep => ({
								id: pep.id,
								code: pep.code,
								name: pep.name,
								validations: {
									movements: pep.validations.movements,
									commitments: pep.validations.commitments,
									afec: pep.validations.afec,
									balance: pep.validations.balance,
									consolidated: pep.consolidatedSemaphore
								}
							}))
						};

						// Crear solicitud
						const aRequests = StorageService.load(REQUESTS_KEY) || [];
						const iRequestId = aRequests.length + 1;
						
						const oRequest = {
							id: `request-${iRequestId}`,
							projectId: projectId,
							projectCode: oProject.code,
							projectName: oProject.name,
							requestDate: new Date(),
							requestingUser: userId,
							requestingUserName: "Juan Carlos Rodríguez", // Usuario mock
							approverUser: approverUser,
							projectManager: projectManager,
							status: "Solicitado",
							validationsSnapshot: oSnapshot,
							processingDate: null,
							processingUser: null,
							rejectionReason: null
						};

						aRequests.push(oRequest);
						StorageService.save(REQUESTS_KEY, aRequests);

						// Actualizar estado del proyecto
						const iProjectIndex = aProjects.findIndex(p => p.id === projectId);
						if (iProjectIndex !== -1) {
							aProjects[iProjectIndex].status = "Solicitado";
							aProjects[iProjectIndex].requestDate = new Date();
							StorageService.save(PROJECTS_KEY, aProjects);
						}

						// Registrar en auditoría
						AuditService.logAction({
							action: "Solicitud de Cierre Creada",
							entity: "Proyecto",
							entityId: projectId,
							user: userId,
							previousState: "EnProceso",
							newState: "Solicitado",
							additionalData: {
								requestId: oRequest.id,
								validPepPercentage: oProject.validPepPercentage,
								pepCount: aPEPs.length,
								approverUser: approverUser,
								projectManager: projectManager
							},
							result: "Exito"
						});

						resolve(oRequest);
					} catch (error) {
						reject(error);
					}
				}, 800);
			});
		},

		/**
		 * Obtiene solicitudes de un proyecto
		 * @param {string} projectId - ID del proyecto
		 * @returns {Promise<Array>} Promesa con array de solicitudes
		 */
		getRequestsByProject: function (projectId) {
			return new Promise((resolve) => {
				setTimeout(() => {
					const aAllRequests = StorageService.load(REQUESTS_KEY) || [];
					const aProjectRequests = aAllRequests.filter(r => r.projectId === projectId);
					
					// Ordenar por fecha descendente (más recientes primero)
					aProjectRequests.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
					
					resolve(aProjectRequests);
				}, 500);
			});
		},

		/**
		 * Obtiene detalle de una solicitud
		 * @param {string} requestId - ID de la solicitud
		 * @returns {Promise<Object>} Promesa con solicitud
		 */
		getRequestDetail: function (requestId) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					const aAllRequests = StorageService.load(REQUESTS_KEY) || [];
					const oRequest = aAllRequests.find(r => r.id === requestId);
					
					if (oRequest) {
						resolve(oRequest);
					} else {
						reject(new Error("Solicitud no encontrada"));
					}
				}, 500);
			});
		},

		/**
		 * Obtiene snapshot de validaciones de una solicitud
		 * @param {string} requestId - ID de la solicitud
		 * @returns {Promise<Object>} Promesa con snapshot
		 */
		getValidationsSnapshot: function (requestId) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					const aAllRequests = StorageService.load(REQUESTS_KEY) || [];
					const oRequest = aAllRequests.find(r => r.id === requestId);
					
					if (oRequest && oRequest.validationsSnapshot) {
						resolve(oRequest.validationsSnapshot);
					} else {
						reject(new Error("Snapshot no encontrado"));
					}
				}, 500);
			});
		},

		/**
		 * Aprueba una solicitud con snapshot de re-validación y observaciones
		 * @param {string} requestId - ID de la solicitud
		 * @param {string} userId - ID del usuario que aprueba
		 * @param {Object} revalidationSnapshot - Snapshot de re-validación actual
		 * @param {string} observaciones - Observaciones opcionales
		 * @returns {Promise<Object>} Promesa con solicitud actualizada
		 */
		approveRequest: function (requestId, userId, revalidationSnapshot, observaciones) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					try {
						console.log("[RequestService] 📋 Aprobando solicitud:", requestId);
						
						const aAllRequests = StorageService.load(REQUESTS_KEY) || [];
						const oRequest = aAllRequests.find(r => r.id === requestId);
						
						if (!oRequest) {
							reject(new Error("Solicitud no encontrada"));
							return;
						}

						if (oRequest.status !== "Solicitado") {
							reject(new Error("Solo se pueden aprobar solicitudes en estado Solicitado"));
							return;
						}

						// Actualizar solicitud
						oRequest.status = "Aprobado";
						oRequest.processingDate = new Date();
						oRequest.processingUser = userId;
						oRequest.processingUserName = "Usuario Actual"; // Mock
						oRequest.observaciones = observaciones || "";
						oRequest.revalidationSnapshot = revalidationSnapshot || null;
						
						StorageService.save(REQUESTS_KEY, aAllRequests);

						// Actualizar proyecto
						const aProjects = StorageService.load(PROJECTS_KEY) || [];
						const iProjectIndex = aProjects.findIndex(p => p.id === oRequest.projectId);
						if (iProjectIndex !== -1) {
							aProjects[iProjectIndex].status = "Aprobado";
							aProjects[iProjectIndex].approvalDate = new Date();
							aProjects[iProjectIndex].closureApproved = true;
							StorageService.save(PROJECTS_KEY, aProjects);
						}

						// Auditoría
						AuditService.logAction({
							action: "Solicitud de Cierre Aprobada",
							entity: "Solicitud",
							entityId: requestId,
							user: userId,
							previousState: "Solicitado",
							newState: "Aprobado",
							additionalData: { 
								observaciones: observaciones,
								hasRevalidation: !!revalidationSnapshot
							},
							result: "Exito"
						});

						console.log("[RequestService] ✅ Solicitud aprobada exitosamente");
						resolve(oRequest);
					} catch (error) {
						console.error("[RequestService] ❌ Error al aprobar solicitud:", error);
						reject(error);
					}
				}, 800);
			});
		},

		/**
		 * Rechaza una solicitud con motivo y detalle
		 * @param {string} requestId - ID de la solicitud
		 * @param {string} userId - ID del usuario que rechaza
		 * @param {string} motivo - Motivo del rechazo
		 * @param {string} detalle - Detalle del rechazo
		 * @returns {Promise<Object>} Promesa con solicitud actualizada
		 */
		rejectRequest: function (requestId, userId, motivo, detalle) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					try {
						console.log("[RequestService] 🚫 Rechazando solicitud:", requestId);
						
						const aAllRequests = StorageService.load(REQUESTS_KEY) || [];
						const oRequest = aAllRequests.find(r => r.id === requestId);
						
						if (!oRequest) {
							reject(new Error("Solicitud no encontrada"));
							return;
						}

						if (oRequest.status !== "Solicitado") {
							reject(new Error("Solo se pueden rechazar solicitudes en estado Solicitado"));
							return;
						}

						// Actualizar solicitud
						oRequest.status = "Rechazado";
						oRequest.processingDate = new Date();
						oRequest.processingUser = userId;
						oRequest.processingUserName = "Usuario Actual"; // Mock
						oRequest.rejectionReason = motivo;
						oRequest.rejectionDetail = detalle;
						
						StorageService.save(REQUESTS_KEY, aAllRequests);

						// Actualizar proyecto
						const aProjects = StorageService.load(PROJECTS_KEY) || [];
						const iProjectIndex = aProjects.findIndex(p => p.id === oRequest.projectId);
						if (iProjectIndex !== -1) {
							aProjects[iProjectIndex].status = "Rechazado";
							aProjects[iProjectIndex].rejectionDate = new Date();
							aProjects[iProjectIndex].rejectionReason = motivo;
							aProjects[iProjectIndex].rejectionDetail = detalle;
							aProjects[iProjectIndex].closureApproved = false;
							StorageService.save(PROJECTS_KEY, aProjects);
						}

						// Auditoría
						AuditService.logAction({
							action: "Solicitud de Cierre Rechazada",
							entity: "Solicitud",
							entityId: requestId,
							user: userId,
							previousState: "Solicitado",
							newState: "Rechazado",
							additionalData: { 
								motivo: motivo,
								detalle: detalle
							},
							result: "Exito"
						});

						console.log("[RequestService] ✅ Solicitud rechazada exitosamente");
						resolve(oRequest);
					} catch (error) {
						console.error("[RequestService] ❌ Error al rechazar solicitud:", error);
						reject(error);
					}
				}, 800);
			});
		},

		/**
		 * Valida si se cumplen las condiciones para aprobar una solicitud
		 * @param {Object} validaciones - Validaciones actuales del proyecto
		 * @returns {Object} Resultado de validación {canApprove: boolean, reason: string, pepsPendientes: number}
		 */
		validateApprovalConditions: function (validaciones) {
			console.log("[RequestService] 🔍 Validando condiciones de aprobación");
			
			if (!validaciones || !validaciones.peps) {
				return {
					canApprove: false,
					reason: "No hay datos de validación disponibles",
					pepsPendientes: 0
				};
			}

			// Contar PEPs con validaciones no verdes
			let nPepsPendientes = 0;
			validaciones.peps.forEach(pep => {
				const bMovimientosOK = pep.validations.movements.status === "OK";
				const bCompromisosOK = pep.validations.commitments.status === "OK";
				const bAFeCOK = pep.validations.afec.status === "OK";
				const bSaldoOK = pep.validations.balance.status === "OK";
				
				if (!bMovimientosOK || !bCompromisosOK || !bAFeCOK || !bSaldoOK) {
					nPepsPendientes++;
				}
			});

			const bCanApprove = nPepsPendientes === 0;
			const sReason = bCanApprove 
				? "Todas las validaciones están correctas" 
				: `${nPepsPendientes} PEP(s) tienen validaciones pendientes`;

			console.log("[RequestService] ✅ Validación completada:", { canApprove: bCanApprove, pepsPendientes: nPepsPendientes });

			return {
				canApprove: bCanApprove,
				reason: sReason,
				pepsPendientes: nPepsPendientes
			};
		},

		/**
		 * Simula notificación al gerente del proyecto
		 * @param {string} projectId - ID del proyecto
		 * @param {string} estado - Estado de la solicitud (Aprobado/Rechazado)
		 * @param {string} detalle - Detalle adicional
		 * @returns {Promise<boolean>} Promesa con resultado de notificación
		 */
		notifyManager: function (projectId, estado, detalle) {
			return new Promise((resolve) => {
				setTimeout(() => {
					console.log("[RequestService] 📧 Enviando notificación al gerente");
					console.log("  Proyecto:", projectId);
					console.log("  Estado:", estado);
					console.log("  Detalle:", detalle);

					// Registrar en auditoría
					AuditService.logAction({
						action: "Notificación Enviada al Gerente",
						entity: "Proyecto",
						entityId: projectId,
						user: "Sistema",
						additionalData: { 
							estado: estado,
							detalle: detalle,
							timestamp: new Date().toISOString()
						},
						result: "Exito"
					});

					console.log("[RequestService] ✅ Notificación enviada exitosamente (simulada)");
					resolve(true);
				}, 500);
			});
		}
	};
});
