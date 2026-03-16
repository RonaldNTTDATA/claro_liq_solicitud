sap.ui.define([
	"com/demo/prototype/service/StorageService"
], function (StorageService) {
	"use strict";

	const DELAY = 500; // Simular latencia de red

	return {
		/**
		 * Obtiene datos completos para el cierre del proyecto
		 * @param {string} sProjectId - ID del proyecto
		 * @returns {Promise<Object>} Datos de cierre
		 */
		getClosureData: function (sProjectId) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					try {
						const oBalances = this.calculatePendingBalances(sProjectId);
						const aCommitments = this.getOpenCommitments(sProjectId);
						const aAFeC = this.getPendingAFeC(sProjectId);
						const oChecklist = this.getDocumentationChecklist(sProjectId);
						const oValidations = this.validateClosureConditions(sProjectId);

						resolve({
							projectId: sProjectId,
							balances: oBalances,
							openCommitments: aCommitments,
							pendingAFeC: aAFeC,
							documentationChecklist: oChecklist,
							validations: oValidations,
							lastUpdate: new Date()
						});
					} catch (error) {
						reject(error);
					}
				}, DELAY);
			});
		},

		/**
		 * Valida condiciones para cerrar el proyecto
		 * @param {string} sProjectId - ID del proyecto
		 * @returns {Object} Resultado de validaciones
		 */
		validateClosureConditions: function (sProjectId) {
			const oBalances = this.calculatePendingBalances(sProjectId);
			const aCommitments = this.getOpenCommitments(sProjectId);
			const aAFeC = this.getPendingAFeC(sProjectId);
			const oChecklist = this.getDocumentationChecklist(sProjectId);

			const warnings = [];
			const errors = [];

			// Validar saldos
			const iPendingBalances = oBalances.peps.filter(p => p.balance > 0.01 && !p.justified).length;
			if (iPendingBalances > 0) {
				errors.push(`${iPendingBalances} PEPs tienen saldos pendientes sin justificar (>${0.01} EUR)`);
			}

			// Validar compromisos abiertos
			const iOpenCommitments = aCommitments.filter(c => c.state === "Abierto" && !c.justified).length;
			if (iOpenCommitments > 0) {
				errors.push(`${iOpenCommitments} compromisos abiertos sin cerrar o justificar`);
			}

			// Validar AFeC (advertencia, no error)
			const iPendingAFeC = aAFeC.filter(a => a.state === "Pendiente" && !a.justified).length;
			if (iPendingAFeC > 0) {
				warnings.push(`${iPendingAFeC} AFeC pendientes de capitalización o justificación`);
			}

			// Validar documentación
			const iMissingDocs = oChecklist.items.filter(d => !d.completed).length;
			if (iMissingDocs > 0) {
				errors.push(`${iMissingDocs} documentos faltantes en el checklist`);
			}

			const bIsValid = errors.length === 0;

			return {
				isValid: bIsValid,
				errors: errors,
				warnings: warnings,
				summary: {
					pepsWithZeroBalance: oBalances.peps.filter(p => p.balance <= 0.01 || p.justified).length,
					pepsTotal: oBalances.peps.length,
					openCommitments: iOpenCommitments,
					pendingAFeC: iPendingAFeC,
					documentsCompleted: oChecklist.items.filter(d => d.completed).length,
					documentsTotal: oChecklist.items.length
				}
			};
		},

		/**
		 * Calcula saldos pendientes por PEP
		 * @param {string} sProjectId - ID del proyecto
		 * @returns {Object} Saldos por PEP
		 */
		calculatePendingBalances: function (sProjectId) {
			// Mock de saldos de PEPs
			const aPEPs = [
				{
					id: "PEP-001",
					code: "PEP-001",
					name: "Infraestructura Base",
					balance: 0.00,
					budgeted: 100000,
					actual: 100000,
					tolerance: 0.01,
					state: "SaldoCero",
					stateText: "Saldo Cero",
					justified: false
				},
				{
					id: "PEP-002",
					code: "PEP-002",
					name: "Desarrollo Aplicación",
					balance: 0.00,
					budgeted: 150000,
					actual: 150000,
					tolerance: 0.01,
					state: "SaldoCero",
					stateText: "Saldo Cero",
					justified: false
				},
				{
					id: "PEP-003",
					code: "PEP-003",
					name: "Hardware y Servidores",
					balance: 250.50,
					budgeted: 80000,
					actual: 80250.50,
					tolerance: 0.01,
					state: "SaldoPendiente",
					stateText: "Saldo Pendiente",
					justified: false,
					justification: null
				},
				{
					id: "PEP-004",
					code: "PEP-004",
					name: "Capacitación Usuarios",
					balance: 0.00,
					budgeted: 25000,
					actual: 25000,
					tolerance: 0.01,
					state: "SaldoCero",
					stateText: "Saldo Cero",
					justified: false
				},
				{
					id: "PEP-005",
					code: "PEP-005",
					name: "Gestión de Proyecto",
					balance: 0.00,
					budgeted: 45000,
					actual: 45000,
					tolerance: 0.01,
					state: "SaldoCero",
					stateText: "Saldo Cero",
					justified: false
				}
			];

			const iTotalPEPs = aPEPs.length;
			const iPEPsWithZeroBalance = aPEPs.filter(p => p.balance <= 0.01 || p.justified).length;
			const iTotalBalance = aPEPs.reduce((sum, p) => sum + p.balance, 0);

			return {
				peps: aPEPs,
				summary: {
					totalPEPs: iTotalPEPs,
					pepsWithZeroBalance: iPEPsWithZeroBalance,
					pepsWithPendingBalance: iTotalPEPs - iPEPsWithZeroBalance,
					totalPendingBalance: iTotalBalance
				}
			};
		},

		/**
		 * Obtiene compromisos abiertos
		 * @param {string} sProjectId - ID del proyecto
		 * @returns {Array<Object>} Compromisos abiertos
		 */
		getOpenCommitments: function (sProjectId) {
			// Mock de compromisos abiertos
			return [
				{
					id: "OC-001",
					type: "OC",
					typeText: "Orden de Compra",
					number: "4500123456",
					pep: "PEP-003",
					vendor: "Proveedor Hardware S.A.",
					amount: 5000,
					state: "Abierto",
					stateText: "Abierta",
					justified: false,
					justification: null
				},
				{
					id: "RF-001",
					type: "RF",
					typeText: "Registro de Factura",
					number: "5105678901",
					pep: "PEP-003",
					vendor: "Proveedor Hardware S.A.",
					amount: 3000,
					state: "Pendiente",
					stateText: "Pendiente",
					justified: false,
					justification: null
				},
				{
					id: "EM-001",
					type: "EM",
					typeText: "Entrada de Mercancía",
					number: "4900234567",
					pep: "PEP-003",
					vendor: "Proveedor Hardware S.A.",
					amount: 2000,
					state: "Abierto",
					stateText: "Abierta",
					justified: false,
					justification: null
				}
			];
		},

		/**
		 * Obtiene AFeC pendientes de capitalización
		 * @param {string} sProjectId - ID del proyecto
		 * @returns {Array<Object>} AFeC pendientes
		 */
		getPendingAFeC: function (sProjectId) {
			// Mock de AFeC pendientes
			return [
				{
					id: "AFEC-001",
					code: "AFEC-001",
					description: "Servidor de Aplicaciones",
					amount: 50000,
					pep: "PEP-003",
					state: "Pendiente",
					stateText: "Pendiente Capitalización",
					justified: false,
					justification: null
				},
				{
					id: "AFEC-002",
					code: "AFEC-002",
					description: "Equipamiento de Red",
					amount: 30000,
					pep: "PEP-003",
					state: "Pendiente",
					stateText: "Pendiente Capitalización",
					justified: false,
					justification: null
				}
			];
		},

		/**
		 * Obtiene checklist de documentación
		 * @param {string} sProjectId - ID del proyecto
		 * @returns {Object} Checklist de documentación
		 */
		getDocumentationChecklist: function (sProjectId) {
			// Mock de checklist de documentación
			return {
				projectId: sProjectId,
				items: [
					{
						id: "DOC-001",
						name: "Certificado de Liquidación",
						description: "Certificado generado automáticamente tras liquidación",
						completed: true,
						completedDate: new Date(),
						required: true
					},
					{
						id: "DOC-002",
						name: "Informe Final de Proyecto",
						description: "Informe del gerente con resultados y lecciones aprendidas",
						completed: false,
						completedDate: null,
						required: true
					},
					{
						id: "DOC-003",
						name: "Actas de Cierre de Hitos",
						description: "Actas firmadas de cierre de cada hito del proyecto",
						completed: false,
						completedDate: null,
						required: true
					},
					{
						id: "DOC-004",
						name: "Documentación Técnica",
						description: "Manuales técnicos, arquitectura, diagramas",
						completed: false,
						completedDate: null,
						required: true
					},
					{
						id: "DOC-005",
						name: "Aprobación de Dirección",
						description: "Aprobación formal de dirección para el cierre",
						completed: false,
						completedDate: null,
						required: true
					}
				]
			};
		},

		/**
		 * Crea registro de cierre
		 * @param {string} sProjectId - ID del proyecto
		 * @param {string} sUserId - ID del usuario
		 * @param {string} sObservaciones - Observaciones del cierre
		 * @param {Object} oCertificate - Certificado generado
		 * @returns {Promise<Object>} Registro de cierre
		 */
		createClosure: function (sProjectId, sUserId, sObservaciones, oCertificate) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					try {
						const oClosure = {
							id: "CLO-" + Date.now(),
							projectId: sProjectId,
							userId: sUserId,
							observaciones: sObservaciones,
							certificate: oCertificate,
							timestamp: new Date(),
							state: "Cerrado"
						};

						// Guardar en localStorage
						const aClosures = StorageService.getAll("closures") || [];
						aClosures.push(oClosure);
						StorageService.saveAll("closures", aClosures);

						// Actualizar proyecto a "Cerrado"
						const aProjects = StorageService.getAll("projects") || [];
						const oProject = aProjects.find(p => p.id === sProjectId);
						if (oProject) {
							oProject.status = "Cerrado";
							oProject.closureDate = new Date();
							oProject.closureId = oClosure.id;
							oProject.processState = "completed";
							oProject.pendingAction = null;
							StorageService.saveAll("projects", aProjects);
						}

						resolve(oClosure);
					} catch (error) {
						reject(error);
					}
				}, DELAY);
			});
		},

		/**
		 * Genera certificado de cierre
		 * @param {string} sProjectId - ID del proyecto
		 * @returns {Promise<Object>} Certificado generado
		 */
		generateClosureCertificate: function (sProjectId) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					try {
						const aProjects = StorageService.getAll("projects") || [];
						const oProject = aProjects.find(p => p.id === sProjectId);

						if (!oProject) {
							reject(new Error("Proyecto no encontrado"));
							return;
						}

						const oClosureData = this.getClosureData(sProjectId);

						const oCertificate = {
							id: "CERT-" + Date.now(),
							number: "CERT-" + oProject.code + "-" + Date.now(),
							projectId: sProjectId,
							projectCode: oProject.code,
							projectName: oProject.name,
							managerName: oProject.managerName,
							issueDate: new Date(),
							data: {
								balances: oClosureData.balances,
								commitments: oClosureData.openCommitments,
								afec: oClosureData.pendingAFeC,
								checklist: oClosureData.documentationChecklist,
								validations: oClosureData.validations
							},
							signatures: [
								{
									role: "Operador Finanzas",
									name: "Usuario Sistema",
									date: new Date(),
									digital: true
								}
							]
						};

						resolve(oCertificate);
					} catch (error) {
						reject(error);
					}
				}, DELAY);
			});
		},

		/**
		 * Marca proyecto como archivado
		 * @param {string} sProjectId - ID del proyecto
		 * @returns {Promise<void>}
		 */
		archiveProject: function (sProjectId) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					try {
						const aProjects = StorageService.getAll("projects") || [];
						const oProject = aProjects.find(p => p.id === sProjectId);

						if (oProject) {
							oProject.archived = true;
							oProject.archivedDate = new Date();
							StorageService.saveAll("projects", aProjects);
						}

						resolve();
					} catch (error) {
						reject(error);
					}
				}, DELAY);
			});
		},

		/**
		 * Guarda justificación de diferencia de saldo
		 * @param {string} sProjectId - ID del proyecto
		 * @param {string} sPEPId - ID del PEP
		 * @param {string} sMotivo - Motivo de la diferencia
		 * @param {string} sDetalle - Detalle de la justificación
		 * @returns {Promise<void>}
		 */
		saveBalanceJustification: function (sProjectId, sPEPId, sMotivo, sDetalle) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					try {
						const aJustifications = StorageService.getAll("balanceJustifications") || [];
						
						const oJustification = {
							id: "JUS-BAL-" + Date.now(),
							projectId: sProjectId,
							pepId: sPEPId,
							motivo: sMotivo,
							detalle: sDetalle,
							timestamp: new Date()
						};

						aJustifications.push(oJustification);
						StorageService.saveAll("balanceJustifications", aJustifications);

						resolve(oJustification);
					} catch (error) {
						reject(error);
					}
				}, DELAY);
			});
		},

		/**
		 * Guarda justificación de compromiso abierto
		 * @param {string} sProjectId - ID del proyecto
		 * @param {string} sCommitmentId - ID del compromiso
		 * @param {string} sMotivo - Motivo de mantener abierto
		 * @param {string} sDetalle - Detalle de la justificación
		 * @returns {Promise<void>}
		 */
		saveCommitmentJustification: function (sProjectId, sCommitmentId, sMotivo, sDetalle) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					try {
						const aJustifications = StorageService.getAll("commitmentJustifications") || [];
						
						const oJustification = {
							id: "JUS-COM-" + Date.now(),
							projectId: sProjectId,
							commitmentId: sCommitmentId,
							motivo: sMotivo,
							detalle: sDetalle,
							timestamp: new Date()
						};

						aJustifications.push(oJustification);
						StorageService.saveAll("commitmentJustifications", aJustifications);

						resolve(oJustification);
					} catch (error) {
						reject(error);
					}
				}, DELAY);
			});
		},

		/**
		 * Guarda justificación de AFeC no capitalizado
		 * @param {string} sProjectId - ID del proyecto
		 * @param {string} sAFeCId - ID del AFeC
		 * @param {string} sMotivo - Motivo de no capitalizar
		 * @param {string} sDetalle - Detalle de la justificación
		 * @returns {Promise<void>}
		 */
		saveAFeCJustification: function (sProjectId, sAFeCId, sMotivo, sDetalle) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					try {
						const aJustifications = StorageService.getAll("afecJustifications") || [];
						
						const oJustification = {
							id: "JUS-AFEC-" + Date.now(),
							projectId: sProjectId,
							afecId: sAFeCId,
							motivo: sMotivo,
							detalle: sDetalle,
							timestamp: new Date()
						};

						aJustifications.push(oJustification);
						StorageService.saveAll("afecJustifications", aJustifications);

						resolve(oJustification);
					} catch (error) {
						reject(error);
					}
				}, DELAY);
			});
		},

		/**
		 * Actualiza estado de item del checklist
		 * @param {string} sProjectId - ID del proyecto
		 * @param {string} sItemId - ID del item
		 * @param {boolean} bCompleted - Si está completado
		 * @returns {Promise<void>}
		 */
		updateChecklistItem: function (sProjectId, sItemId, bCompleted) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					try {
						const aChecklists = StorageService.getAll("closureChecklists") || [];
						let oChecklist = aChecklists.find(c => c.projectId === sProjectId);

						if (!oChecklist) {
							oChecklist = this.getDocumentationChecklist(sProjectId);
							oChecklist.projectId = sProjectId;
							aChecklists.push(oChecklist);
						}

						const oItem = oChecklist.items.find(i => i.id === sItemId);
						if (oItem) {
							oItem.completed = bCompleted;
							oItem.completedDate = bCompleted ? new Date() : null;
						}

						StorageService.saveAll("closureChecklists", aChecklists);
						resolve();
					} catch (error) {
						reject(error);
					}
				}, DELAY);
			});
		}
	};
});
