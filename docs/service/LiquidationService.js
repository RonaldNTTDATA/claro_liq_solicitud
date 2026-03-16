sap.ui.define([
	"com/demo/prototype/service/StorageService"
], function (StorageService) {
	"use strict";

	const DELAY = 500; // Simular latencia de red
	const STORAGE_KEY_PROJECTS = "projects";
	const STORAGE_KEY_LIQUIDATIONS = "liquidations";

	return {
		/**
		 * Obtiene datos completos de liquidación para un proyecto
		 * @param {string} projectId - ID del proyecto
		 * @returns {Promise<object>} - Datos de liquidación
		 */
		getLiquidationData: function (projectId) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					console.log("[LiquidationService] 📥 Cargando datos de liquidación para proyecto:", projectId);

					// Obtener imputaciones reales y planificadas
					const aActualImputations = this.getActualImputations(projectId);
					const aPlannedImputations = this.getPlannedImputations(projectId);

					// Calcular desviaciones
					const aComparativeData = this.calculateDeviations(aActualImputations, aPlannedImputations);

					// Obtener documentos SAP
					const oSAPDocuments = this.getSAPDocuments(projectId);

					// Calcular métricas de resumen
					const totalPlanned = aPlannedImputations.reduce((sum, item) => sum + item.amount, 0);
					const totalReal = aActualImputations.reduce((sum, item) => sum + item.amount, 0);
					const totalDeviation = totalReal - totalPlanned;
					const deviationPercent = totalPlanned > 0 ? ((totalDeviation / totalPlanned) * 100) : 0;
					const pendingBalance = totalPlanned - totalReal;

					const oLiquidationData = {
						projectId: projectId,
						summary: {
							totalPlanned: totalPlanned,
							totalReal: totalReal,
							totalDeviation: totalDeviation,
							deviationPercent: deviationPercent,
							pendingBalance: pendingBalance
						},
						comparativeData: aComparativeData,
						sapDocuments: oSAPDocuments,
						validations: {
							pepsValidated: aComparativeData.filter(item => Math.abs(item.deviationPercent) < 5).length,
							pepsTotal: aComparativeData.length,
							criticalDeviations: aComparativeData.filter(item => Math.abs(item.deviationPercent) > 10).length
						},
						lastUpdate: new Date()
					};

					console.log("[LiquidationService] ✅ Datos de liquidación cargados:", oLiquidationData);
					resolve(oLiquidationData);
				}, DELAY);
			});
		},

		/**
		 * Obtiene imputaciones reales desde CJI3 (simulado)
		 * @param {string} projectId - ID del proyecto
		 * @returns {Array<object>} - Imputaciones reales
		 */
		getActualImputations: function (projectId) {
			console.log("[LiquidationService] 📊 Obteniendo imputaciones reales (CJI3)");

			// Mock data: imputaciones reales por PEP y clase de coste
			return [
				{ pep: "PEP-001", costClass: "430000", costClassName: "Personal Interno", amount: 120000, period: "2024-Q1" },
				{ pep: "PEP-001", costClass: "523000", costClassName: "Consultoría Externa", amount: 85000, period: "2024-Q1" },
				{ pep: "PEP-001", costClass: "431000", costClassName: "Materiales TI", amount: 45000, period: "2024-Q1" },
				{ pep: "PEP-002", costClass: "430000", costClassName: "Personal Interno", amount: 95000, period: "2024-Q1" },
				{ pep: "PEP-002", costClass: "523000", costClassName: "Consultoría Externa", amount: 110000, period: "2024-Q1" },
				{ pep: "PEP-003", costClass: "431000", costClassName: "Materiales TI", amount: 32000, period: "2024-Q1" },
				{ pep: "PEP-003", costClass: "482000", costClassName: "Licencias Software", amount: 28000, period: "2024-Q1" }
			];
		},

		/**
		 * Obtiene imputaciones planificadas desde presupuesto
		 * @param {string} projectId - ID del proyecto
		 * @returns {Array<object>} - Imputaciones planificadas
		 */
		getPlannedImputations: function (projectId) {
			console.log("[LiquidationService] 📋 Obteniendo imputaciones planificadas (presupuesto)");

			// Mock data: imputaciones planificadas por PEP y clase de coste
			return [
				{ pep: "PEP-001", costClass: "430000", costClassName: "Personal Interno", amount: 100000, period: "2024-Q1" },
				{ pep: "PEP-001", costClass: "523000", costClassName: "Consultoría Externa", amount: 80000, period: "2024-Q1" },
				{ pep: "PEP-001", costClass: "431000", costClassName: "Materiales TI", amount: 50000, period: "2024-Q1" },
				{ pep: "PEP-002", costClass: "430000", costClassName: "Personal Interno", amount: 100000, period: "2024-Q1" },
				{ pep: "PEP-002", costClass: "523000", costClassName: "Consultoría Externa", amount: 100000, period: "2024-Q1" },
				{ pep: "PEP-003", costClass: "431000", costClassName: "Materiales TI", amount: 30000, period: "2024-Q1" },
				{ pep: "PEP-003", costClass: "482000", costClassName: "Licencias Software", amount: 25000, period: "2024-Q1" }
			];
		},

		/**
		 * Calcula desviaciones entre imputaciones reales y planificadas
		 * @param {Array<object>} aActualImputations - Imputaciones reales
		 * @param {Array<object>} aPlannedImputations - Imputaciones planificadas
		 * @returns {Array<object>} - Datos comparativos con desviaciones
		 */
		calculateDeviations: function (aActualImputations, aPlannedImputations) {
			console.log("[LiquidationService] 🧮 Calculando desviaciones");

			// Crear mapa de imputaciones planificadas
			const oPlannedMap = {};
			aPlannedImputations.forEach(item => {
				const key = `${item.pep}_${item.costClass}`;
				oPlannedMap[key] = item;
			});

			// Crear mapa de imputaciones reales
			const oActualMap = {};
			aActualImputations.forEach(item => {
				const key = `${item.pep}_${item.costClass}`;
				oActualMap[key] = item;
			});

			// Combinar y calcular desviaciones
			const aComparativeData = [];
			const allKeys = new Set([...Object.keys(oPlannedMap), ...Object.keys(oActualMap)]);

			allKeys.forEach(key => {
				const planned = oPlannedMap[key] || { amount: 0, costClassName: "N/A", pep: key.split("_")[0], costClass: key.split("_")[1] };
				const actual = oActualMap[key] || { amount: 0, costClassName: planned.costClassName, pep: planned.pep, costClass: planned.costClass };

				const deviationAmount = actual.amount - planned.amount;
				const deviationPercent = planned.amount > 0 ? ((deviationAmount / planned.amount) * 100) : 0;

				let state = "success"; // Dentro de presupuesto
				if (Math.abs(deviationPercent) > 10) {
					state = "error"; // Sobrepresupuesto crítico
				} else if (Math.abs(deviationPercent) > 5) {
					state = "warning"; // Desviación menor
				}

				aComparativeData.push({
					pep: actual.pep || planned.pep,
					costClass: actual.costClass || planned.costClass,
					costClassName: actual.costClassName || planned.costClassName,
					plannedAmount: planned.amount,
					actualAmount: actual.amount,
					deviationAmount: deviationAmount,
					deviationPercent: deviationPercent,
					state: state,
					stateText: state === "success" ? "Dentro de Presupuesto" : (state === "warning" ? "Desviación Menor" : "Sobrepresupuesto")
				});
			});

			console.log("[LiquidationService] ✅ Desviaciones calculadas:", aComparativeData.length, "registros");
			return aComparativeData;
		},

		/**
		 * Obtiene documentos SAP asociados al proyecto
		 * @param {string} projectId - ID del proyecto
		 * @returns {object} - Documentos SAP por tipo
		 */
		getSAPDocuments: function (projectId) {
			console.log("[LiquidationService] 📄 Obteniendo documentos SAP");

			return {
				invoices: [
					{ id: "INV-001", number: "4500123456", date: new Date(2024, 1, 15), vendor: "Acme Corp", amount: 85000, state: "Contabilizada", type: "FI" },
					{ id: "INV-002", number: "4500123457", date: new Date(2024, 2, 10), vendor: "Tech Solutions", amount: 45000, state: "Contabilizada", type: "FI" },
					{ id: "INV-003", number: "4500123458", date: new Date(2024, 2, 20), vendor: "Consulting Inc", amount: 110000, state: "Pendiente", type: "FI" }
				],
				purchaseOrders: [
					{ id: "PO-001", number: "4500987654", date: new Date(2024, 0, 20), vendor: "Acme Corp", amount: 90000, state: "Cerrada", type: "MM" },
					{ id: "PO-002", number: "4500987655", date: new Date(2024, 1, 5), vendor: "Tech Solutions", amount: 50000, state: "Abierta", type: "MM" },
					{ id: "PO-003", number: "4500987656", date: new Date(2024, 2, 1), vendor: "Consulting Inc", amount: 120000, state: "Abierta", type: "MM" }
				],
				invoiceRecords: [
					{ id: "IR-001", number: "5100111222", date: new Date(2024, 1, 18), relatedPO: "4500987654", amount: 85000, state: "Verificado", type: "MM" },
					{ id: "IR-002", number: "5100111223", date: new Date(2024, 2, 12), relatedPO: "4500987655", amount: 45000, state: "Verificado", type: "MM" },
					{ id: "IR-003", number: "5100111224", date: new Date(2024, 2, 22), relatedPO: "4500987656", amount: 110000, state: "Pendiente", type: "MM" }
				],
				accountingEntries: [
					{ id: "AE-001", number: "100123456", date: new Date(2024, 1, 20), costClass: "430000", amount: 120000, pep: "PEP-001", type: "CO" },
					{ id: "AE-002", number: "100123457", date: new Date(2024, 2, 5), costClass: "523000", amount: 85000, pep: "PEP-001", type: "CO" },
					{ id: "AE-003", number: "100123458", date: new Date(2024, 2, 15), costClass: "431000", amount: 45000, pep: "PEP-001", type: "CO" },
					{ id: "AE-004", number: "100123459", date: new Date(2024, 2, 25), costClass: "523000", amount: 110000, pep: "PEP-002", type: "CO" }
				]
			};
		},

		/**
		 * Crea un registro de liquidación y actualiza el estado del proyecto
		 * @param {string} projectId - ID del proyecto
		 * @param {string} userId - ID del usuario que liquida
		 * @param {string} observaciones - Observaciones de liquidación
		 * @param {object} ajustes - Ajustes manuales (opcional)
		 * @returns {Promise<object>} - Registro de liquidación creado
		 */
		createLiquidation: function (projectId, userId, observaciones, ajustes = {}) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					console.log("[LiquidationService] 💾 Creando registro de liquidación");

					// Obtener datos de liquidación
					const oLiquidationData = this.getLiquidationData(projectId);

					// Crear registro de liquidación
					const oLiquidation = {
						id: "LIQ-" + Date.now(),
						projectId: projectId,
						userId: userId,
						observaciones: observaciones,
						ajustes: ajustes,
						summary: oLiquidationData.summary,
						timestamp: new Date(),
						state: "Liquidado"
					};

					// Guardar liquidación en localStorage
					const aLiquidations = StorageService.load(STORAGE_KEY_LIQUIDATIONS) || [];
					aLiquidations.push(oLiquidation);
					StorageService.save(STORAGE_KEY_LIQUIDATIONS, aLiquidations);

					// Actualizar estado del proyecto
					const aProjects = StorageService.load(STORAGE_KEY_PROJECTS) || [];
					const oProject = aProjects.find(p => p.id === projectId);
					if (oProject) {
						oProject.status = "Liquidado";
						oProject.liquidationDate = new Date();
						oProject.liquidationId = oLiquidation.id;
						oProject.processState = "completed";
						StorageService.save(STORAGE_KEY_PROJECTS, aProjects);
					}

					console.log("[LiquidationService] ✅ Liquidación creada:", oLiquidation.id);
					resolve(oLiquidation);
				}, DELAY);
			});
		},

		/**
		 * Genera reporte de liquidación
		 * @param {string} projectId - ID del proyecto
		 * @param {string} tipo - Tipo de reporte ("completo", "desviaciones", "documentos")
		 * @returns {Promise<object>} - Datos del reporte generado
		 */
		generateLiquidationReport: function (projectId, tipo) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					console.log("[LiquidationService] 📊 Generando reporte de liquidación:", tipo);

					const oLiquidationData = this.getLiquidationData(projectId);

					const oReport = {
						id: "REP-" + Date.now(),
						projectId: projectId,
						tipo: tipo,
						data: oLiquidationData,
						timestamp: new Date(),
						format: tipo === "completo" ? "PDF" : "Excel"
					};

					console.log("[LiquidationService] ✅ Reporte generado:", oReport.id);
					resolve(oReport);
				}, DELAY);
			});
		},

		/**
		 * Valida condiciones para liquidar el proyecto
		 * @param {string} projectId - ID del proyecto
		 * @returns {Promise<object>} - Resultado de validación
		 */
		validateLiquidation: function (projectId) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					console.log("[LiquidationService] ✅ Validando condiciones de liquidación");

					const oLiquidationData = this.getLiquidationData(projectId);

					const oValidation = {
						isValid: true,
						errors: [],
						warnings: []
					};

					// Validar saldos pendientes críticos
					if (Math.abs(oLiquidationData.summary.pendingBalance) > 10000) {
						oValidation.warnings.push("Saldo pendiente superior a 10.000 €");
					}

					// Validar desviaciones críticas
					if (oLiquidationData.validations.criticalDeviations > 0) {
						oValidation.warnings.push(`${oLiquidationData.validations.criticalDeviations} desviaciones críticas (>10%)`);
					}

					// Validar documentos pendientes
					const pendingInvoices = oLiquidationData.sapDocuments.invoices.filter(inv => inv.state === "Pendiente").length;
					if (pendingInvoices > 0) {
						oValidation.warnings.push(`${pendingInvoices} facturas pendientes de contabilización`);
					}

					console.log("[LiquidationService] ✅ Validación completada:", oValidation);
					resolve(oValidation);
				}, DELAY);
			});
		}
	};
});
