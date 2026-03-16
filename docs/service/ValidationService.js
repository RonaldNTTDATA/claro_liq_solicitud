sap.ui.define([
	"com/demo/prototype/service/StorageService",
	"com/demo/prototype/service/MockDataGenerator",
	"com/demo/prototype/util/Constants"
], function (StorageService, MockDataGenerator, Constants) {
	"use strict";

	const PEP_STORAGE_KEY = "peps";
	const COMMITMENTS_KEY = "commitments";
	const DELAY = 500;

	/**
	 * ValidationService - Servicio para cálculo de semáforos y validaciones
	 */
	return {
		/**
		 * Inicializa PEPs si no existen
		 * @param {string} projectId - ID del proyecto
		 * @param {number} pepCount - Cantidad de PEPs
		 */
		_initializePEPs: function (projectId, pepCount) {
			const peps = StorageService.load(PEP_STORAGE_KEY) || [];
			const projectPEPs = peps.filter(p => p.projectId === projectId);
			
			if (projectPEPs.length === 0) {
				const newPEPs = MockDataGenerator.generatePEPs(projectId, pepCount);
				peps.push(...newPEPs);
				StorageService.save(PEP_STORAGE_KEY, peps);
			}
		},

		/**
		 * Calcula el semáforo consolidado de un proyecto
		 * @param {string} projectId - ID del proyecto
		 * @returns {Promise<object>} Promesa con {semaphore, validCount, totalCount, percentage}
		 */
		calculateSemaphore: function (projectId) {
			return new Promise((resolve) => {
				setTimeout(() => {
					// Cargar proyecto
					const projects = StorageService.load("projects") || [];
					const project = projects.find(p => p.id === projectId);
					
					if (!project) {
						resolve({
							semaphore: "Rojo",
							validCount: 0,
							totalCount: 0,
							percentage: 0
						});
						return;
					}

					// Inicializar PEPs si no existen
					this._initializePEPs(projectId, project.pepCount);

					// Cargar PEPs del proyecto
					const allPEPs = StorageService.load(PEP_STORAGE_KEY) || [];
					const projectPEPs = allPEPs.filter(p => p.projectId === projectId);
					
					if (projectPEPs.length === 0) {
						resolve({
							semaphore: "Rojo",
							validCount: 0,
							totalCount: 0,
							percentage: 0
						});
						return;
					}

					// Contar PEPs válidos (todos los semáforos en verde)
					const validPEPs = projectPEPs.filter(pep => 
						pep.semaphoreConsolidated === "Verde"
					);

					const totalCount = projectPEPs.length;
					const validCount = validPEPs.length;
					const percentage = Math.round((validCount / totalCount) * 100);

					// Determinar semáforo según umbrales
					let semaphore;
					if (percentage === 100) {
						semaphore = Constants.SemaphoreStatus.GREEN;
					} else if (percentage >= 85 && percentage <= 99) {
						semaphore = Constants.SemaphoreStatus.AMBER;
					} else {
						semaphore = Constants.SemaphoreStatus.RED;
					}

					// Actualizar el proyecto con el nuevo semáforo
					const projectIndex = projects.findIndex(p => p.id === projectId);
					if (projectIndex !== -1) {
						projects[projectIndex].semaphore = semaphore;
						projects[projectIndex].validPepPercentage = percentage;
						projects[projectIndex].validPepCount = validCount;
						StorageService.save("projects", projects);
					}

					resolve({
						semaphore: semaphore,
						validCount: validCount,
						totalCount: totalCount,
						percentage: percentage
					});
				}, DELAY);
			});
		},

		/**
		 * Recalcula semáforos de todos los proyectos de un gerente
		 * @param {string} managerId - ID del gerente
		 * @returns {Promise<Array>} Promesa con proyectos actualizados
		 */
		recalculateAllSemaphores: function (managerId) {
			return new Promise((resolve) => {
				setTimeout(async () => {
					const projects = StorageService.load("projects") || [];
					const managerProjects = projects.filter(p => p.managerId === managerId);
					
					// Recalcular cada proyecto
					for (const project of managerProjects) {
						await this.calculateSemaphore(project.id);
					}
					
					// Recargar proyectos actualizados
					const updatedProjects = StorageService.load("projects") || [];
					const updatedManagerProjects = updatedProjects.filter(p => p.managerId === managerId);
					
					resolve(updatedManagerProjects);
				}, DELAY);
			});
		},

		/**
		 * Valida si un proyecto está listo para solicitar cierre
		 * @param {string} projectId - ID del proyecto
		 * @returns {Promise<object>} Promesa con {ready, reason}
		 */
		validateReadyForClosure: function (projectId) {
			return new Promise((resolve) => {
				setTimeout(() => {
					const projects = StorageService.load("projects") || [];
					const project = projects.find(p => p.id === projectId);
					
					if (!project) {
						resolve({ ready: false, reason: "Proyecto no encontrado" });
						return;
					}

					if (project.semaphore !== "Verde") {
						resolve({ 
							ready: false, 
							reason: `El proyecto tiene un ${project.validPepPercentage}% de PEPs válidos. Debe alcanzar el 100%.` 
						});
						return;
					}

					if (project.status === "Solicitado") {
						resolve({ 
							ready: false, 
							reason: "El proyecto ya tiene una solicitud de cierre pendiente." 
						});
						return;
					}

					if (project.status === "Aprobado" || project.status === "Liquidado" || project.status === "Cerrado") {
						resolve({ 
							ready: false, 
							reason: `El proyecto ya está en estado ${project.status}.` 
						});
						return;
					}

					resolve({ 
						ready: true, 
						reason: "Proyecto listo para solicitar cierre" 
					});
				}, DELAY);
			});
		},

		/**
		 * Valida un PEP completo (ejecuta las 4 validaciones)
		 * @param {string} pepId - ID del PEP
		 * @returns {Object} Objeto con resultados de las 4 validaciones
		 */
		validatePEP: function (pepId) {
			const oPEP = (StorageService.load(PEP_STORAGE_KEY) || []).find(p => p.id === pepId);
			if (!oPEP) {
				return {
					movements: "Error",
					commitments: "Error",
					afec: "Error",
					balance: "Error",
					consolidated: "Rojo",
					movementMessages: ["PEP no encontrado"],
					commitmentMessages: [],
					afecMessages: [],
					balanceDetail: null
				};
			}

			const oMovements = this.validateMovements(pepId);
			const oCommitments = this.validateCommitments(pepId);
			const oAFeC = this.validateAFeC(pepId);
			const oBalance = this.validateBalance(pepId);
			const sConsolidated = this.calculateConsolidatedSemaphore(
				oMovements.status,
				oCommitments.status,
				oAFeC.status,
				oBalance.status
			);

			return {
				movements: oMovements.status,
				commitments: oCommitments.status,
				afec: oAFeC.status,
				balance: oBalance.status,
				consolidated: sConsolidated,
				movementMessages: oMovements.messages,
				commitmentMessages: oCommitments.messages,
				afecMessages: oAFeC.messages,
				balanceDetail: oBalance.detail
			};
		},

		/**
		 * Validación 1: Movimientos contables (simula CJI3)
		 * @param {string} pepId - ID del PEP
		 * @returns {Object} {status: "OK"|"Error", messages: [], movements: []}
		 */
		validateMovements: function (pepId) {
			const oPEP = (StorageService.load(PEP_STORAGE_KEY) || []).find(p => p.id === pepId);
			if (!oPEP || !oPEP.validations) {
				return {
					status: "Error",
					messages: ["No se pudo cargar información de movimientos"],
					movements: []
				};
			}

			// Si ya tiene resultado guardado, lo usamos
			if (oPEP.validations.movements === "OK") {
				return {
					status: "OK",
					messages: [],
					movements: [
						{ account: "410000", costCenter: oPEP.costCenter, costClass: "Personal", amount: 50000, status: "OK", message: "" },
						{ account: "420000", costCenter: oPEP.costCenter, costClass: "Materiales", amount: 30000, status: "OK", message: "" },
						{ account: "430000", costCenter: oPEP.costCenter, costClass: "Servicios", amount: 20000, status: "OK", message: "" }
					]
				};
			} else {
				return {
					status: "Error",
					messages: oPEP.validations.movementMessages || ["Imputación contable sin clase de costo válida"],
					movements: [
						{ account: "410000", costCenter: oPEP.costCenter, costClass: "Personal", amount: 50000, status: "OK", message: "" },
						{ account: "420000", costCenter: "", costClass: "Materiales", amount: 30000, status: "Error", message: "Sin centro de costo" },
						{ account: "430000", costCenter: oPEP.costCenter, costClass: "Servicios", amount: 20000, status: "OK", message: "" }
					]
				};
			}
		},

		/**
		 * Validación 2: Compromisos (simula CJI5)
		 * @param {string} pepId - ID del PEP
		 * @returns {Object} {status: "OK"|"Error", messages: [], commitmentCount: 0}
		 */
		validateCommitments: function (pepId) {
			const oPEP = (StorageService.load(PEP_STORAGE_KEY) || []).find(p => p.id === pepId);
			if (!oPEP || !oPEP.validations) {
				return {
					status: "Error",
					messages: ["No se pudo verificar compromisos"],
					commitmentCount: 0
				};
			}

			// Cargar compromisos del PEP
			const aCommitments = (StorageService.load(COMMITMENTS_KEY) || []).filter(c => c.pepId === pepId);
			const aPendingCommitments = aCommitments.filter(c => !c.entryFinal || c.acceptancePercentage < 100);

			if (oPEP.validations.commitments === "OK") {
				return {
					status: "OK",
					messages: [],
					commitmentCount: 0,
					pendingCommitments: []
				};
			} else {
				return {
					status: "Error",
					messages: oPEP.validations.commitmentMessages || ["Compromisos pendientes de entrada final"],
					commitmentCount: aPendingCommitments.length,
					pendingCommitments: aPendingCommitments.map(c => ({
						documentNumber: c.documentReference,
						position: c.positionReference,
						material: c.material,
						supplier: c.supplierName,
						amount: c.amountSoles,
						deliveryDate: c.deliveryDate,
						missing: c.acceptancePercentage < 100 ? "EM pendiente" : "RF pendiente"
					}))
				};
			}
		},

		/**
		 * Validación 3: AFeC y Norma de Liquidación
		 * @param {string} pepId - ID del PEP
		 * @returns {Object} {status: "OK"|"Error", messages: [], afecDetail: {}}
		 */
		validateAFeC: function (pepId) {
			const oPEP = (StorageService.load(PEP_STORAGE_KEY) || []).find(p => p.id === pepId);
			if (!oPEP || !oPEP.validations) {
				return {
					status: "Error",
					messages: ["No se pudo verificar AFeC"],
					afecDetail: null
				};
			}

			if (oPEP.validations.afec === "OK") {
				return {
					status: "OK",
					messages: [],
					afecDetail: {
						number: oPEP.afecId,
						description: oPEP.afecDescription,
						liquidationRule: {
							percentage: 100,
							receivingAccount: "1540101001",
							receivingAccountName: "Activos Fijos - Infraestructura"
						},
						status: "OK"
					}
				};
			} else {
				return {
					status: "Error",
					messages: oPEP.validations.afecMessages || ["AFeC sin norma de liquidación configurada"],
					afecDetail: {
						number: oPEP.afecId,
						description: oPEP.afecDescription,
						liquidationRule: null,
						status: "Error"
					}
				};
			}
		},

		/**
		 * Validación 4: Saldo
		 * @param {string} pepId - ID del PEP
		 * @returns {Object} {status: "OK"|"Error", messages: [], detail: {}}
		 */
		validateBalance: function (pepId) {
			const oPEP = (StorageService.load(PEP_STORAGE_KEY) || []).find(p => p.id === pepId);
			if (!oPEP || !oPEP.validations) {
				return {
					status: "Error",
					messages: ["No se pudo verificar saldo"],
					detail: null
				};
			}

			if (oPEP.validations.balance === "OK") {
				return {
					status: "OK",
					messages: [],
					detail: oPEP.validations.balanceDetail || {
						currentBalance: 0.00,
						tolerance: 0.01,
						breakdown: [
							{ costClass: "410000", description: "Personal", amount: 0.00, status: "OK" },
							{ costClass: "420000", description: "Materiales", amount: 0.00, status: "OK" },
							{ costClass: "430000", description: "Servicios", amount: 0.00, status: "OK" }
						]
					}
				};
			} else {
				return {
					status: "Error",
					messages: [`Saldo pendiente: PEN ${parseFloat(oPEP.currentBalance).toFixed(2)}`],
					detail: oPEP.validations.balanceDetail || {
						currentBalance: parseFloat(oPEP.currentBalance),
						tolerance: 0.01,
						breakdown: [
							{ costClass: "410000", description: "Personal", amount: parseFloat(oPEP.currentBalance) * 0.4, status: "OK" },
							{ costClass: "420000", description: "Materiales", amount: parseFloat(oPEP.currentBalance) * 0.6, status: "Error" },
							{ costClass: "430000", description: "Servicios", amount: 0.00, status: "OK" }
						]
					}
				};
			}
		},

		/**
		 * Calcula semáforo consolidado de un PEP
		 * @param {string} movements - Estado validación movimientos
		 * @param {string} commitments - Estado validación compromisos
		 * @param {string} afec - Estado validación AFeC
		 * @param {string} balance - Estado validación saldo
		 * @returns {string} "Verde" o "Rojo"
		 */
		calculateConsolidatedSemaphore: function (movements, commitments, afec, balance) {
			if (movements === "OK" && commitments === "OK" && afec === "OK" && balance === "OK") {
				return "Verde";
			}
			return "Rojo";
		},

		/**
		 * Re-valida un proyecto completo ejecutando validaciones en tiempo real
		 * @param {string} projectId - ID del proyecto
		 * @returns {Promise<object>} Promesa con resultados actuales de validación
		 */
		revalidateProject: function (projectId) {
			return new Promise((resolve, reject) => {
				setTimeout(async () => {
					try {
						console.log("[ValidationService] 🔄 Re-validando proyecto:", projectId);
						
						// Cargar PEPs del proyecto
						const peps = StorageService.load(PEP_STORAGE_KEY) || [];
						const projectPEPs = peps.filter(p => p.projectId === projectId);
						
						if (projectPEPs.length === 0) {
							reject(new Error("No se encontraron PEPs para el proyecto"));
							return;
						}

						// Ejecutar validaciones para cada PEP
						const validationResults = [];
						for (const pep of projectPEPs) {
							const movements = this._validatePEPMovements(pep);
							const commitments = this._validatePEPCommitments(pep);
							const afec = this._validatePEPAFeC(pep);
							const balance = this._validatePEPBalance(pep);
							const consolidated = this.calculateConsolidatedSemaphore(
								movements.status, commitments.status, afec.status, balance.status
							);

							validationResults.push({
								pepId: pep.id,
								pepCode: pep.code,
								pepName: pep.name,
								validations: {
									movements: movements,
									commitments: commitments,
									afec: afec,
									balance: balance
								},
								consolidated: consolidated,
								timestamp: new Date().toISOString()
							});
						}

						// Calcular semáforo del proyecto
						const validPeps = validationResults.filter(v => v.consolidated === "Verde").length;
						const totalPeps = validationResults.length;
						const percentage = Math.round((validPeps / totalPeps) * 100);
						
						let projectSemaphore = "Rojo";
						if (percentage === 100) {
							projectSemaphore = "Verde";
						} else if (percentage >= 85) {
							projectSemaphore = "Ámbar";
						}

						console.log("[ValidationService] ✅ Re-validación completada:", {
							validPeps, totalPeps, percentage, projectSemaphore
						});

						resolve({
							projectId: projectId,
							projectSemaphore: projectSemaphore,
							validPepCount: validPeps,
							totalPepCount: totalPeps,
							validPepPercentage: percentage,
							peps: validationResults,
							timestamp: new Date().toISOString()
						});
					} catch (error) {
						console.error("[ValidationService] ❌ Error en re-validación:", error);
						reject(error);
					}
				}, DELAY);
			});
		},

		/**
		 * Compara validaciones entre snapshot original y validaciones actuales
		 * @param {object} snapshotOriginal - Snapshot guardado en la solicitud
		 * @param {object} validacionesActuales - Resultado de re-validación
		 * @returns {object} Diferencias con indicadores de cambio
		 */
		compareValidations: function (snapshotOriginal, validacionesActuales) {
			console.log("[ValidationService] 🔍 Comparando validaciones");
			
			if (!snapshotOriginal || !validacionesActuales) {
				return {
					hasChanges: false,
					projectChange: "sin_cambio",
					pepChanges: [],
					summary: {
						unchanged: 0,
						improved: 0,
						worsened: 0
					}
				};
			}

			const pepChanges = [];
			let improved = 0;
			let worsened = 0;
			let unchanged = 0;

			// Comparar cada PEP
			validacionesActuales.peps.forEach(pepActual => {
				const pepOriginal = snapshotOriginal.peps.find(p => p.id === pepActual.pepId);
				if (!pepOriginal) return;

				// Comparar cada validación
				const validationChanges = {
					pepId: pepActual.pepId,
					pepCode: pepActual.pepCode,
					pepName: pepActual.pepName,
					changes: {
						movements: this._compareValidationStatus(
							pepOriginal.validations.movements, pepActual.validations.movements.status
						),
						commitments: this._compareValidationStatus(
							pepOriginal.validations.commitments, pepActual.validations.commitments.status
						),
						afec: this._compareValidationStatus(
							pepOriginal.validations.afec, pepActual.validations.afec.status
						),
						balance: this._compareValidationStatus(
							pepOriginal.validations.balance, pepActual.validations.balance.status
						)
					},
					consolidatedChange: this._compareValidationStatus(
						pepOriginal.validations.consolidated, pepActual.consolidated
					),
					originalData: pepOriginal,
					currentData: pepActual
				};

				// Determinar si mejoró o empeoró
				const changesArray = [
					validationChanges.changes.movements,
					validationChanges.changes.commitments,
					validationChanges.changes.afec,
					validationChanges.changes.balance
				];

				const hasImprovements = changesArray.some(c => c === "improved");
				const hasWorsened = changesArray.some(c => c === "worsened");
				const hasNoChanges = changesArray.every(c => c === "unchanged");

				if (hasWorsened) {
					validationChanges.overallChange = "worsened";
					worsened++;
				} else if (hasImprovements) {
					validationChanges.overallChange = "improved";
					improved++;
				} else if (hasNoChanges) {
					validationChanges.overallChange = "unchanged";
					unchanged++;
				} else {
					validationChanges.overallChange = "mixed";
					unchanged++;
				}

				pepChanges.push(validationChanges);
			});

			// Comparar semáforo del proyecto
			const projectChange = this._compareValidationStatus(
				snapshotOriginal.projectSemaphore,
				validacionesActuales.projectSemaphore
			);

			console.log("[ValidationService] 📊 Comparación completada:", {
				unchanged, improved, worsened, projectChange
			});

			return {
				hasChanges: improved > 0 || worsened > 0 || projectChange !== "unchanged",
				projectChange: projectChange,
				pepChanges: pepChanges,
				summary: {
					unchanged: unchanged,
					improved: improved,
					worsened: worsened,
					total: pepChanges.length
				},
				originalSnapshot: snapshotOriginal,
				currentValidation: validacionesActuales
			};
		},

		/**
		 * Compara estado de una validación específica
		 * @private
		 * @param {string} original - Estado original (OK/Error/Verde/Rojo)
		 * @param {string} actual - Estado actual
		 * @returns {string} "improved", "worsened" o "unchanged"
		 */
		_compareValidationStatus: function (original, actual) {
			// Normalizar estados
			const normalize = (status) => {
				if (status === "OK" || status === "Verde") return "OK";
				return "Error";
			};

			const origNorm = normalize(original);
			const actNorm = normalize(actual);

			if (origNorm === actNorm) return "unchanged";
			if (origNorm === "Error" && actNorm === "OK") return "improved";
			if (origNorm === "OK" && actNorm === "Error") return "worsened";
			return "unchanged";
		},

		/**
		 * Obtiene cambios detallados en validaciones de un PEP específico
		 * @param {string} pepId - ID del PEP
		 * @param {object} snapshotOriginal - Snapshot original
		 * @param {object} validacionActual - Validación actual
		 * @returns {object} Detalle de cambios
		 */
		getValidationChanges: function (pepId, snapshotOriginal, validacionActual) {
			console.log("[ValidationService] 🔎 Obteniendo cambios detallados para PEP:", pepId);
			
			if (!snapshotOriginal || !validacionActual) {
				return null;
			}

			const pepOriginal = snapshotOriginal.peps.find(p => p.id === pepId);
			const pepActual = validacionActual.peps.find(p => p.pepId === pepId);

			if (!pepOriginal || !pepActual) {
				return null;
			}

			return {
				pepId: pepId,
				pepCode: pepActual.pepCode,
				pepName: pepActual.pepName,
				detailedChanges: {
					movements: {
						original: pepOriginal.validations.movements,
						current: pepActual.validations.movements.status,
						change: this._compareValidationStatus(
							pepOriginal.validations.movements,
							pepActual.validations.movements.status
						),
						details: pepActual.validations.movements.messages,
						fullData: pepActual.validations.movements.detail
					},
					commitments: {
						original: pepOriginal.validations.commitments,
						current: pepActual.validations.commitments.status,
						change: this._compareValidationStatus(
							pepOriginal.validations.commitments,
							pepActual.validations.commitments.status
						),
						details: pepActual.validations.commitments.messages,
						fullData: pepActual.validations.commitments.detail
					},
					afec: {
						original: pepOriginal.validations.afec,
						current: pepActual.validations.afec.status,
						change: this._compareValidationStatus(
							pepOriginal.validations.afec,
							pepActual.validations.afec.status
						),
						details: pepActual.validations.afec.messages,
						fullData: pepActual.validations.afec.detail
					},
					balance: {
						original: pepOriginal.validations.balance,
						current: pepActual.validations.balance.status,
						change: this._compareValidationStatus(
							pepOriginal.validations.balance,
							pepActual.validations.balance.status
						),
						details: pepActual.validations.balance.messages,
						fullData: pepActual.validations.balance.detail
					}
				},
				timestamps: {
					original: snapshotOriginal.timestamp,
					current: pepActual.timestamp
				}
			};
		},

		/**
		 * Calcula porcentaje de drift (cambios) desde la solicitud
		 * @param {object} snapshotOriginal - Snapshot original
		 * @param {object} validacionActual - Validación actual
		 * @returns {number} Porcentaje de drift (0-100)
		 */
		calculateValidationDrift: function (snapshotOriginal, validacionActual) {
			if (!snapshotOriginal || !validacionActual) {
				return 0;
			}

			const comparison = this.compareValidations(snapshotOriginal, validacionActual);
			const totalChanges = comparison.summary.improved + comparison.summary.worsened;
			const totalValidations = comparison.summary.total * 4; // 4 validaciones por PEP
			
			const driftPercentage = totalValidations > 0 ? 
				Math.round((totalChanges / totalValidations) * 100) : 0;

			console.log("[ValidationService] 📈 Drift calculado:", driftPercentage + "%");

			return driftPercentage;
		}
	};
});
