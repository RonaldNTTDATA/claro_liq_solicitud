sap.ui.define([
	"com/demo/prototype/service/StorageService",
	"com/demo/prototype/service/MockDataGenerator"
], function (StorageService, MockDataGenerator) {
	"use strict";

	const STORAGE_KEY = "projects";
	const DELAY = 500; // Simula delay de red

	/**
	 * ProjectService - Servicio para gestión de proyectos con datos mock
	 */
	return {
		/**
		 * Inicializa los datos si no existen
		 */
		_initializeData: function () {
			// Verificar si existe la clave de versión de datos
			const DATA_VERSION = "v3.5"; // Versión con reglas APP1 de moneda y columnas fijas
			const currentVersion = StorageService.load("dataVersion");
			const existingProjects = StorageService.load(STORAGE_KEY) || [];
			
			// Regenerar si no existen proyectos O si la versión no coincide
			if (existingProjects.length === 0 || currentVersion !== DATA_VERSION) {
				console.log("🔄 Generando datos de proyectos con versión " + DATA_VERSION);
				const projects = MockDataGenerator.generateProjects(25);
				StorageService.save(STORAGE_KEY, projects);
				
				// Generar PEPs para todos los proyectos
				const allPEPs = [];
				projects.forEach(project => {
					const peps = MockDataGenerator.generatePEPs(project.id, project.pepCount);
					allPEPs.push(...peps);
				});
				StorageService.save("peps", allPEPs);
				
				StorageService.save("dataVersion", DATA_VERSION);
				console.log("✅ Datos generados: " + projects.length + " proyectos, " + allPEPs.length + " PEPs");
				if (allPEPs.length > 0) {
					console.log("📋 Ejemplo de código PEP:", allPEPs[0].code);
				}
			} else {
				console.log("✓ Datos ya inicializados (versión " + currentVersion + ")");
			}
		},

		/**
		 * Retorna proyectos del gerente autenticado
		 * @param {string} managerId - ID del gerente
		 * @returns {Promise<Array>} Promesa con array de proyectos
		 */
		getProjectsByManager: function (managerId) {
			this._initializeData();

			return new Promise((resolve) => {
				setTimeout(() => {
					const allProjects = StorageService.load(STORAGE_KEY) || [];
					const managerProjects = allProjects.filter(p => p.managerId === managerId);
					resolve(managerProjects);
				}, DELAY);
			});
		},

		/**
		 * Retorna proyecto por ID
		 * @param {string} projectId - ID del proyecto
		 * @returns {Promise<object>} Promesa con el proyecto
		 */
		getProjectById: function (projectId) {
			this._initializeData();

			return new Promise((resolve, reject) => {
				setTimeout(() => {
					const projects = StorageService.load(STORAGE_KEY) || [];
					const project = projects.find(p => p.id === projectId);
					
					if (project) {
						resolve(project);
					} else {
						reject(new Error("Proyecto no encontrado"));
					}
				}, DELAY);
			});
		},

		/**
		 * Retorna todos los proyectos
		 * @returns {Promise<Array>} Promesa con array de proyectos
		 */
		getAllProjects: function () {
			this._initializeData();

			return new Promise((resolve) => {
				setTimeout(() => {
					const projects = StorageService.load(STORAGE_KEY) || [];
					resolve(projects);
				}, DELAY);
			});
		},

		/**
		 * Filtra proyectos por criterios
	 * @param {object} criteria - Criterios de filtro {code, status, manager}
	 * @param {string} managerId - ID del gerente
	 * @returns {Promise<Array>} Promesa con proyectos filtrados
	 */
	filterProjects: function (criteria, managerId) {
		this._initializeData();

		return new Promise((resolve) => {
			setTimeout(() => {
				let projects = StorageService.load(STORAGE_KEY) || [];
				
				// Filtrar por gerente
				if (managerId) {
					projects = projects.filter(p => p.managerId === managerId);
				}

				// Filtrar por código
				if (criteria.code && criteria.code.trim() !== "") {
					const codeUpper = criteria.code.trim().toUpperCase();
					projects = projects.filter(p => 
						p.code.toUpperCase().includes(codeUpper)
					);
				}

				// Filtrar por estado
				if (criteria.status && criteria.status.length > 0) {
					projects = projects.filter(p => 
						criteria.status.includes(p.status)
					);
				}

				// Filtrar por gerente (nombre)
				if (criteria.manager && criteria.manager.trim() !== "") {
					projects = projects.filter(p => 
						p.manager === criteria.manager
					);
				}

				resolve(projects);
			}, DELAY);
		});
	},

	/**
	 * Calcula importes comprometido y real de un proyecto
	 * @param {string} projectId - ID del proyecto
	 * @returns {Promise<object>} Promesa con {comprometido, real}
	 */
	calculateImportes: function (projectId) {
		return new Promise((resolve) => {
			setTimeout(() => {
				const project = this._findProject(projectId);
				
				if (project) {
					} else {
						resolve({ comprometido: 0, real: 0 });
					}
				}, DELAY);
			});
		},

		/**
		 * Actualiza el estado de un proyecto
		 * @param {string} projectId - ID del proyecto
		 * @param {string} newState - Nuevo estado
		 * @returns {Promise<object>} Promesa con proyecto actualizado
		 */
		updateProjectState: function (projectId, newState) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					const projects = StorageService.load(STORAGE_KEY) || [];
					const projectIndex = projects.findIndex(p => p.id === projectId);
					
					if (projectIndex !== -1) {
						projects[projectIndex].status = newState;
						if (newState === "Solicitado") {
							projects[projectIndex].requestDate = new Date().toISOString();
						}
						StorageService.save(STORAGE_KEY, projects);
						resolve(projects[projectIndex]);
					} else {
						reject(new Error("Proyecto no encontrado"));
					}
				}, DELAY);
			});
		},

		/**
		 * Obtiene proyectos aprobados (listos para gestión financiera)
		 * @returns {Promise<Array>} Promesa con array de proyectos aprobados
		 */
		getApprovedProjects: function () {
			return new Promise((resolve) => {
				setTimeout(() => {
					console.log("[ProjectService] 📊 Obteniendo proyectos aprobados");
					const aProjects = StorageService.load(STORAGE_KEY) || [];
					const aApprovedProjects = aProjects.filter(p => p.status === "Aprobado");
					
					// Enriquecer con acción pendiente y estado de proceso
					const aEnrichedProjects = aApprovedProjects.map(p => {
						return {
							...p,
							pendingAction: this._determinePendingAction(p),
							processState: p.processState || "pending",
							lastUpdate: p.lastUpdate || new Date()
						};
					});

					console.log("[ProjectService] ✅ Proyectos aprobados encontrados:", aEnrichedProjects.length);
					resolve(aEnrichedProjects);
				}, DELAY);
			});
		},

		/**
		 * Obtiene proyectos pendientes de liquidación
		 * @returns {Promise<Array>} Promesa con array de proyectos
		 */
		getPendingLiquidationProjects: function () {
			return new Promise((resolve) => {
				setTimeout(() => {
					this.getApprovedProjects().then(projects => {
						const filtered = projects.filter(p => p.pendingAction === "liquidation");
						resolve(filtered);
					});
				}, DELAY);
			});
		},

		/**
		 * Obtiene proyectos pendientes de cierre
		 * @returns {Promise<Array>} Promesa con array de proyectos
		 */
		getPendingClosureProjects: function () {
			return new Promise((resolve) => {
				setTimeout(() => {
					this.getApprovedProjects().then(projects => {
						const filtered = projects.filter(p => p.pendingAction === "closure");
						resolve(filtered);
					});
				}, DELAY);
			});
		},

		/**
		 * Obtiene proyectos pendientes de capitalización
		 * @returns {Promise<Array>} Promesa con array de proyectos
		 */
		getPendingCapitalizationProjects: function () {
			return new Promise((resolve) => {
				setTimeout(() => {
					this.getApprovedProjects().then(projects => {
						const filtered = projects.filter(p => p.pendingAction === "capitalization");
						resolve(filtered);
					});
				}, DELAY);
			});
		},

		/**
		 * Determina la acción pendiente según características del proyecto
		 * @param {Object} project - Proyecto
		 * @returns {string} Acción pendiente (liquidation, closure, capitalization)
		 * @private
		 */
		_determinePendingAction: function (project) {
			// Lógica simplificada para determinar acción pendiente
			// En un sistema real, esto se basaría en reglas de negocio complejas
			
			// Si el proyecto tiene AFeC pendientes de capitalizar
			if (project.pendingCapitalization || (project.afec && project.afec > 0)) {
				return "capitalization";
			}
			
			// Si el proyecto es de CAPEX, requiere liquidación financiera
			if (project.type === "CAPEX") {
				return "liquidation";
			}
			
			// Por defecto, cierre administrativo
			return "closure";
		}
	};
});
