sap.ui.define([], function () {
	"use strict";

	/**
	 * MockDataGenerator - Generador de datos realistas para el prototipo
	 */
	return {
		/**
		 * Genera proyectos de muestra realistas
		 * @param {number} count - Cantidad de proyectos a generar
		 * @returns {Array} Array de proyectos
		 */
		generateProjects: function (count = 25) {
			const projects = [];
			const statuses = ["En Proceso", "Solicitado", "Rechazado", "Aprobado"];
			const managers = ["Sara Cordova"];

			for (let i = 1; i <= count; i++) {
				// Formato: NDRSAP000006 (6 dígitos con ceros a la izquierda)
				const code = `NDRSAP${String(i).padStart(6, "0")}`;
				
				// Los primeros 3 proyectos siempre tienen semáforo verde y estado "En Proceso"
				// Y cada uno se asigna a una gerencia diferente
				let status, validPepPercentage, semaphore;
				if (i <= 3) {
					status = "En Proceso";
					validPepPercentage = 100;
					semaphore = "Verde";
				} else {
					status = statuses[Math.floor(Math.random() * statuses.length)];
					validPepPercentage = Math.floor(Math.random() * 100);
					
					// Verde = 100%, Ámbar = todo lo demás (nunca rojo)
					if (validPepPercentage === 100) {
						semaphore = "Verde";
					} else {
						semaphore = "Ámbar";
					}
				}
				
				const pepCount = Math.floor(Math.random() * 15) + 5; // 5-20 PEPs

				const startDate = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
				const endDate = new Date(startDate);
				endDate.setMonth(endDate.getMonth() + Math.floor(Math.random() * 24) + 12); // 12-36 meses

				const importeComprometido = Math.floor(Math.random() * 5000000) + 500000;
				const importeReal = Math.floor(importeComprometido * (Math.random() * 0.3 + 0.6)); // 60-90% del comprometido
				const currencies = ["PEN", "USD"];
				const currency = currencies[i % 2]; // Solo Soles y Dólares

				projects.push({
					id: `PRJ${String(i).padStart(4, "0")}`,
					code: code,
				description: `Proyecto de Finanzas ${i}`,
					name: `Implementación Sistema ${["SAP", "Oracle", "Microsoft", "AWS"][i % 4]} - Fase ${Math.floor(Math.random() * 3) + 1}`,
					status: status,
					management: "Finanzas",
					direction: "Dirección de Proyectos",
					requestDirection: "Dirección de Desarrollo",
					requestDepartment: "Jefatura de Desarrollo",
					manager: managers[0],
					managerId: "MGR001",
					startDate: startDate.toISOString(),
					endDate: endDate.toISOString(),
					currency: currency,
					importeComprometido: importeComprometido,
					importeReal: importeReal,
					semaphore: semaphore,
					pepCount: pepCount,
					validPepCount: Math.floor(pepCount * validPepPercentage / 100),
					validPepPercentage: validPepPercentage,
					rejectionReason: status === "Rechazado" ? "Compromisos pendientes (OCs sin entrada final)" : null,
					requestDate: status !== "En Proceso" ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString() : null
				});
			}

			return projects;
		},

		/**
		 * Genera PEPs de muestra para un proyecto
		 * @param {string} projectId - ID del proyecto
		 * @param {number} count - Cantidad de PEPs
		 * @returns {Array} Array de PEPs
		 */
		generatePEPs: function (projectId, count = 10) {
			const peps = [];
			const types = ["PE-RM-IT-OER", "PE-RM-IC-IIT"];
			const statuses = ["LIB", "LIQ", "CERR"];
			const requesterCostCenters = ["0211A02610", "0211A02810"];
			const financeProjectCodes = ["26SAP0001", "26SAP0002", "26SAP0003", "26SAP0004", "26SAP0005"];
			
			// Verificar si es uno de los primeros 3 proyectos (semáforo verde garantizado)
			const isGreenProject = projectId.match(/PRJ000[1-3]$/);

			for (let i = 1; i <= count; i++) {
			// Formato: RM-PE02AI26P014-IT-OER05
			// RM: Regional, PE: Perú, 02: año, AI: área, 26: mes, P: proyecto, 014: número, IT: tipo, OER05: código operación
			const pepCode = `RM-PE${String(24 + (i % 10)).padStart(2, "0")}AI${String(1 + (i % 12)).padStart(2, "0")}P${String(i).padStart(3, "0")}-IT-OER${String(i % 100).padStart(2, "0")}`;
				
				// Los primeros 3 proyectos NUNCA tienen problemas
				const hasIssues = isGreenProject ? false : (Math.random() > 0.7); // 30% tienen problemas
				
				// Validaciones individuales (formato "OK" o "Error")
				const hasMovementIssue = hasIssues && Math.random() > 0.5;
				const hasCommitmentIssue = hasIssues && Math.random() > 0.5;
				const hasAfecIssue = hasIssues && Math.random() > 0.7;
				const hasBalanceIssue = hasIssues;
				
				// Calcular semáforo consolidado
				let consolidatedSemaphore = "Verde";
				if (hasMovementIssue || hasAfecIssue || hasBalanceIssue) {
					consolidatedSemaphore = "Rojo";
				} else if (hasCommitmentIssue) {
					consolidatedSemaphore = "Ámbar";
				}

				peps.push({
					id: `${projectId}-PEP${i}`,
					projectId: projectId,
					code: pepCode,
					name: `Elemento PEP ${i} - ${types[i % 2]}`,
					type: types[i % 2],
					costCenter: `CC-${String(Math.floor(Math.random() * 1000)).padStart(4, "0")}`,
					costCenterResponsible: "0211A00809",
					costCenterRequester: requesterCostCenters[i % requesterCostCenters.length],
					financeProjectCode: financeProjectCodes[i % financeProjectCodes.length],
					status: statuses[Math.floor(Math.random() * statuses.length)],
					currentBalance: hasBalanceIssue ? (Math.floor(Math.random() * 50000) + 1000).toFixed(2) : "0.00",
					afecId: `AFEC-${String(Math.floor(Math.random() * 100000)).padStart(8, "0")}`,
					consolidatedSemaphore: consolidatedSemaphore,
					validations: {
						movements: hasMovementIssue ? "Error" : "OK",
						commitments: hasCommitmentIssue ? "Error" : "OK",
						afec: hasAfecIssue ? "Error" : "OK",
						balance: hasBalanceIssue ? "Error" : "OK",
						consolidated: consolidatedSemaphore,
						movementMessages: hasMovementIssue ? ["Imputación contable sin clase de costo válida"] : [],
						commitmentMessages: hasCommitmentIssue ? ["Órdenes de compra sin entrada de actividad"] : [],
						afecMessages: hasAfecIssue ? ["AFeC no encontrado o inactivo"] : [],
						balanceMessages: hasBalanceIssue ? ["Saldo pendiente superior al límite permitido"] : []
					}
				});
			}

			return peps;
		},

		/**
		 * Genera audit logs de muestra
		 * @param {string} projectId - ID del proyecto
		 * @param {number} count - Cantidad de logs
		 * @returns {Array} Array de logs
		 */
		generateAuditLogs: function (projectId, count = 5) {
			const logs = [];
			const actions = ["Validación ejecutada", "Solicitud de cierre creada", "Proyecto actualizado", "Datos recargados desde SAP"];
			const users = ["Sara Cordova"];

			for (let i = 1; i <= count; i++) {
				const timestamp = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
				logs.push({
					id: `LOG${String(i).padStart(6, "0")}`,
					projectId: projectId,
					action: actions[Math.floor(Math.random() * actions.length)],
					user: users[0],
					timestamp: timestamp.toISOString(),
					details: `Acción ejecutada correctamente`
				});
			}

			return logs;
		}
	};
});
