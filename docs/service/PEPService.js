sap.ui.define([
	"com/demo/prototype/service/StorageService",
	"com/demo/prototype/service/ValidationService",
	"com/demo/prototype/util/Constants"
], function (StorageService, ValidationService, Constants) {
	"use strict";

	return {
		/**
		 * Obtiene todos los PEPs de un proyecto
		 * @param {string} projectId - ID del proyecto
		 * @returns {Promise<Array>} Promesa con array de PEPs
		 */
		getPEPsByProject: function (projectId) {
			return new Promise((resolve) => {
				setTimeout(() => {
					const aAllPEPs = StorageService.load("peps") || [];
					const aProjectPEPs = aAllPEPs.filter(pep => pep.projectId === projectId);
					resolve(aProjectPEPs);
				}, 500);
			});
		},

		/**
		 * Obtiene un PEP por ID
		 * @param {string} pepId - ID del PEP
		 * @returns {Promise<Object>} Promesa con objeto PEP
		 */
		getPEPById: function (pepId) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					const aAllPEPs = StorageService.load("peps") || [];
					const oPEP = aAllPEPs.find(pep => pep.id === pepId);
					if (oPEP) {
						resolve(oPEP);
					} else {
						reject(new Error("PEP no encontrado"));
					}
				}, 500);
			});
		},

		/**
		 * Valida un PEP específico (ejecuta las 4 validaciones)
		 * @param {string} pepId - ID del PEP
		 * @returns {Promise<Object>} Promesa con resultados de validación
		 */
		validatePEP: function (pepId) {
			return new Promise((resolve) => {
				setTimeout(() => {
					const oValidation = ValidationService.validatePEP(pepId);
					resolve(oValidation);
				}, 800);
			});
		},

		/**
		 * Recalcula validaciones de todos los PEPs de un proyecto
		 * @param {string} projectId - ID del proyecto
		 * @returns {Promise<Array>} Promesa con PEPs actualizados
		 */
		recalculateAllPEPValidations: function (projectId) {
			return new Promise((resolve) => {
				setTimeout(() => {
					let aAllPEPs = StorageService.load("peps") || [];
					const aProjectPEPs = aAllPEPs.filter(pep => pep.projectId === projectId);
					
					// Recalcular validaciones para cada PEP
					aProjectPEPs.forEach(oPEP => {
						const oValidation = ValidationService.validatePEP(oPEP.id);
						oPEP.validations = oValidation;
						oPEP.consolidatedSemaphore = oValidation.consolidated;
					});

					// Guardar en localStorage
					StorageService.save("peps", aAllPEPs);
					
					resolve(aProjectPEPs);
				}, 1500);
			});
		},

		/**
		 * Genera datos mock de PEPs para todos los proyectos
		 * @returns {Array} Array de PEPs mock
		 */
		generateMockPEPs: function () {
			const aProjects = StorageService.load("projects") || [];
			const aPEPs = [];
			let iPEPCounter = 1;

			const aPEPTypes = [
				"PE-RM-IT-OER (Operación Equipo Rodante)",
				"PE-RM-IC-IIT (Inversión Infraestructura IT)",
				"PE-RM-IT-ICI (Infraestructura Civil)",
				"PE-RM-IC-OTR (Otros)"
			];

			const aCostCenters = [
				"CC-INFRA-001",
				"CC-SISTEMAS-002",
				"CC-OPERACIONES-003",
				"CC-MANTENIMIENTO-004",
				"CC-ADMINISTRACION-005"
			];

			const aAFeCPrefixes = ["AFEC-2024-", "AFEC-2025-", "AFEC-2026-"];

			aProjects.forEach((oProject) => {
				// Cada proyecto tiene entre 2 y 6 PEPs
				const iNumPEPs = Math.floor(Math.random() * 5) + 2;

				for (let i = 0; i < iNumPEPs; i++) {
					const sPEPCode = `${oProject.code}-PEP-${String(i + 1).padStart(2, "0")}`;
					const sAFeCNumber = aAFeCPrefixes[Math.floor(Math.random() * aAFeCPrefixes.length)] + String(iPEPCounter).padStart(4, "0");
					
					// Determinar estado de validaciones (la mayoría OK, algunos con errores)
					const bHasMovementIssue = Math.random() < 0.15;
					const bHasCommitmentIssue = Math.random() < 0.20;
					const bHasAFeCIssue = Math.random() < 0.10;
					const bHasBalanceIssue = Math.random() < 0.12;

					const oPEP = {
						id: `pep-${iPEPCounter}`,
						code: sPEPCode,
						name: `Elemento ${i + 1} - ${oProject.name}`,
						projectId: oProject.id,
						type: aPEPTypes[Math.floor(Math.random() * aPEPTypes.length)],
						costCenter: aCostCenters[Math.floor(Math.random() * aCostCenters.length)],
						financeProjectCode: `FIN-${oProject.code}-${String(i + 1).padStart(2, "0")}`,
						currentBalance: bHasBalanceIssue ? (Math.random() * 5000 + 100).toFixed(2) : 0.00,
						sapStatus: Math.random() < 0.7 ? "ABIE" : (Math.random() < 0.5 ? "LIQ" : "CERR"),
						afecId: sAFeCNumber,
						afecDescription: `Activo Fijo en Curso - ${sPEPCode}`,
						afecValue: (Math.random() * 500000 + 50000).toFixed(2),
						validations: {
							movements: bHasMovementIssue ? "Error" : "OK",
							commitments: bHasCommitmentIssue ? "Error" : "OK",
							afec: bHasAFeCIssue ? "Error" : "OK",
							balance: bHasBalanceIssue ? "Error" : "OK",
							consolidated: (bHasMovementIssue || bHasCommitmentIssue || bHasAFeCIssue || bHasBalanceIssue) ? "Rojo" : "Verde",
							movementMessages: bHasMovementIssue ? [
								"Imputación contable sin clase de costo válida",
								"Movimiento sin centro de costo asignado"
							] : [],
							commitmentMessages: bHasCommitmentIssue ? [
								`${Math.floor(Math.random() * 5) + 1} órdenes de compra sin entrada de actividad`,
								"Pedidos pendientes de entrada final"
							] : [],
							afecMessages: bHasAFeCIssue ? [
								"AFeC sin norma de liquidación configurada",
								"Falta configurar cuenta receptora"
							] : [],
							balanceDetail: bHasBalanceIssue ? {
								currentBalance: parseFloat((Math.random() * 5000 + 100).toFixed(2)),
								tolerance: 0.01,
								breakdown: [
									{ costClass: "410000", description: "Personal", amount: (Math.random() * 2000).toFixed(2), status: "OK" },
									{ costClass: "420000", description: "Materiales", amount: (Math.random() * 2000).toFixed(2), status: "Error" },
									{ costClass: "430000", description: "Servicios", amount: (Math.random() * 1000).toFixed(2), status: "OK" }
								]
							} : {
								currentBalance: 0.00,
								tolerance: 0.01,
								breakdown: [
									{ costClass: "410000", description: "Personal", amount: 0.00, status: "OK" },
									{ costClass: "420000", description: "Materiales", amount: 0.00, status: "OK" },
									{ costClass: "430000", description: "Servicios", amount: 0.00, status: "OK" }
								]
							}
						},
						consolidatedSemaphore: (bHasMovementIssue || bHasCommitmentIssue || bHasAFeCIssue || bHasBalanceIssue) ? "Rojo" : "Verde"
					};

					aPEPs.push(oPEP);
					iPEPCounter++;
				}
			});

			StorageService.save("peps", aPEPs);
			return aPEPs;
		},

		/**
		 * Actualiza la validación de un PEP
		 * @param {string} pepId - ID del PEP
		 * @param {Object} oValidation - Objeto con resultados de validación
		 * @returns {Promise<Object>} Promesa con PEP actualizado
		 */
		updatePEPValidation: function (pepId, oValidation) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					let aAllPEPs = StorageService.load("peps") || [];
					const oPEP = aAllPEPs.find(pep => pep.id === pepId);
					
					if (oPEP) {
						oPEP.validations = oValidation;
						oPEP.consolidatedSemaphore = oValidation.consolidated;
						StorageService.save("peps", aAllPEPs);
						resolve(oPEP);
					} else {
						reject(new Error("PEP no encontrado"));
					}
				}, 500);
			});
		}
	};
});
