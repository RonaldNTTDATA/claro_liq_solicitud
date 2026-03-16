sap.ui.define([], function () {
	"use strict";

	const DELAY = 500; // Simular latencia de red

	return {
		/**
		 * Retorna lista de AFeC de un proyecto
		 * @param {string} projectId - ID del proyecto
		 * @returns {Promise<Array>} Lista de AFeC
		 */
		getAFeCList: function (projectId) {
			return new Promise((resolve) => {
				setTimeout(() => {
					const afecs = this._getMockAFeC();
					const filtered = projectId ? afecs.filter(a => a.projectId === projectId) : afecs;
					console.log(`[CapitalizationService] getAFeCList(${projectId || 'all'}): ${filtered.length} AFeC encontrados`);
					resolve(filtered);
				}, DELAY);
			});
		},

		/**
		 * Retorna AFeC pendientes de capitalización
		 * @param {string} projectId - ID del proyecto (opcional)
		 * @returns {Promise<Array>} Lista de AFeC pendientes
		 */
		getPendingAFeC: function (projectId) {
			return new Promise((resolve) => {
				setTimeout(() => {
					const afecs = this._getMockAFeC();
					const filtered = afecs.filter(a => {
						const isPending = a.estado === "Pendiente";
						const matchesProject = !projectId || a.projectId === projectId;
						return isPending && matchesProject;
					});
					console.log(`[CapitalizationService] getPendingAFeC(${projectId || 'all'}): ${filtered.length} AFeC pendientes`);
					resolve(filtered);
				}, DELAY);
			});
		},

		/**
		 * Retorna detalle de un AFeC
		 * @param {string} afecId - ID del AFeC
		 * @returns {Promise<Object>} Detalle del AFeC
		 */
		getAFeCDetail: function (afecId) {
			return new Promise((resolve) => {
				setTimeout(() => {
					const afecs = this._getMockAFeC();
					const afec = afecs.find(a => a.id === afecId);
					
					if (afec) {
						// Agregar movimientos contables mock
						afec.movimientos = this._getMockMovimientos(afecId);
						console.log(`[CapitalizationService] getAFeCDetail(${afecId}): AFeC encontrado`);
						resolve(afec);
					} else {
						console.error(`[CapitalizationService] getAFeCDetail(${afecId}): AFeC no encontrado`);
						resolve(null);
					}
				}, DELAY);
			});
		},

		/**
		 * Clasifica un AFeC (guarda clasificación sin capitalizar)
		 * @param {string} afecId - ID del AFeC
		 * @param {Object} clasificacion - Datos de clasificación
		 * @returns {Promise<Object>} AFeC actualizado
		 */
		classifyAFeC: function (afecId, clasificacion) {
			return new Promise((resolve) => {
				setTimeout(() => {
					const afecs = JSON.parse(localStorage.getItem('afecs') || '[]');
					const afec = afecs.find(a => a.id === afecId);
					
					if (afec) {
						afec.clasificacion = clasificacion;
						afec.fechaClasificacion = new Date();
						
						// Actualizar en localStorage
						const index = afecs.findIndex(a => a.id === afecId);
						afecs[index] = afec;
						localStorage.setItem('afecs', JSON.stringify(afecs));
						
						console.log(`[CapitalizationService] classifyAFeC(${afecId}): Clasificación guardada`);
						resolve(afec);
					} else {
						console.error(`[CapitalizationService] classifyAFeC(${afecId}): AFeC no encontrado`);
						resolve(null);
					}
				}, DELAY);
			});
		},

		/**
		 * Retorna catálogo de tipos de activo
		 * @returns {Array} Catálogo de tipos
		 */
		getAssetTypesCatalog: function () {
			return [
				{
					key: "MACHINERY",
					text: "Maquinaria y Equipos",
					categorias: [
						{ key: "INDUSTRIAL", text: "Industrial" },
						{ key: "PRODUCTION", text: "Producción" },
						{ key: "MAINTENANCE", text: "Mantenimiento" }
					],
					vidaUtilDefault: 10,
					cuentaContable: "1520-Maquinaria y Equipos"
				},
				{
					key: "BUILDING",
					text: "Edificios e Instalaciones",
					categorias: [
						{ key: "OFFICES", text: "Oficinas" },
						{ key: "PLANTS", text: "Plantas" },
						{ key: "WAREHOUSES", text: "Almacenes" }
					],
					vidaUtilDefault: 30,
					cuentaContable: "1510-Edificios e Instalaciones"
				},
				{
					key: "IT",
					text: "Equipamiento IT",
					categorias: [
						{ key: "SERVERS", text: "Servidores" },
						{ key: "COMPUTERS", text: "Computadoras" },
						{ key: "SOFTWARE", text: "Software" }
					],
					vidaUtilDefault: 3,
					cuentaContable: "1530-Equipamiento IT"
				},
				{
					key: "VEHICLE",
					text: "Vehículos",
					categorias: [
						{ key: "TRANSPORT", text: "Transporte" },
						{ key: "DISTRIBUTION", text: "Distribución" }
					],
					vidaUtilDefault: 5,
					cuentaContable: "1540-Vehículos"
				},
				{
					key: "FURNITURE",
					text: "Mobiliario",
					categorias: [
						{ key: "OFFICE", text: "Oficina" },
						{ key: "PRODUCTION", text: "Producción" }
					],
					vidaUtilDefault: 7,
					cuentaContable: "1550-Mobiliario"
				},
				{
					key: "OTHER",
					text: "Otros",
					categorias: [
						{ key: "VARIOUS", text: "Varios" }
					],
					vidaUtilDefault: 10,
					cuentaContable: "1590-Otros Activos Fijos"
				}
			];
		},

		/**
		 * Retorna catálogo de métodos de amortización
		 * @returns {Array} Catálogo de métodos
		 */
		getDepreciationMethodsCatalog: function () {
			return [
				{ key: "LINEAR", text: "Lineal", description: "Amortización lineal constante" },
				{ key: "ACCELERATED", text: "Acelerada", description: "Amortización acelerada mayor al inicio" },
				{ key: "REDUCED", text: "Reducida", description: "Amortización reducida" },
				{ key: "NONE", text: "Sin Amortización", description: "Sin amortización (ej: terrenos)" }
			];
		},

		/**
		 * Calcula vida útil sugerida según tipo y categoría
		 * @param {string} tipo - Tipo de activo
		 * @param {string} categoria - Categoría
		 * @returns {number} Años de vida útil
		 */
		calculateUsefulLife: function (tipo, categoria) {
			const catalog = this.getAssetTypesCatalog();
			const tipoData = catalog.find(t => t.key === tipo);
			
			if (!tipoData) return 10; // Default
			
			// Ajustes por categoría
			if (tipo === "IT" && categoria === "SOFTWARE") return 2;
			if (tipo === "MACHINERY" && categoria === "INDUSTRIAL") return 15;
			if (tipo === "BUILDING" && categoria === "PLANTS") return 40;
			
			return tipoData.vidaUtilDefault;
		},

		/**
		 * Retorna cuentas contables según tipo de activo
		 * @param {string} tipo - Tipo de activo
		 * @returns {Array} Lista de cuentas contables
		 */
		getAccountingAccounts: function (tipo) {
			const catalog = this.getAssetTypesCatalog();
			const tipoData = catalog.find(t => t.key === tipo);
			
			if (tipoData) {
				return [{ key: tipoData.cuentaContable, text: tipoData.cuentaContable }];
			}
			
			return [{ key: "1590-Otros Activos Fijos", text: "1590-Otros Activos Fijos" }];
		},

		/**
		 * Retorna catálogo de centros de beneficio
		 * @returns {Array} Catálogo de centros
		 */
		getCostCentersCatalog: function () {
			return [
				{ key: "CC-001", text: "CC-001 - Administración" },
				{ key: "CC-002", text: "CC-002 - Producción" },
				{ key: "CC-003", text: "CC-003 - Ventas" },
				{ key: "CC-004", text: "CC-004 - Logística" },
				{ key: "CC-005", text: "CC-005 - IT" },
				{ key: "CC-006", text: "CC-006 - Finanzas" }
			];
		},

		/**
		 * Valida que la clasificación esté completa
		 * @param {string} afecId - ID del AFeC
		 * @param {Object} clasificacion - Datos de clasificación
		 * @returns {Promise<Object>} Resultado de validación
		 */
		validateCapitalization: function (afecId, clasificacion) {
			return new Promise((resolve) => {
				setTimeout(() => {
					const errors = [];
					
					if (!clasificacion.tipo) errors.push("Tipo de activo es obligatorio");
					if (!clasificacion.categoria) errors.push("Categoría es obligatoria");
					if (!clasificacion.metodoAmortizacion) errors.push("Método de amortización es obligatorio");
					if (!clasificacion.vidaUtil || clasificacion.vidaUtil <= 0) errors.push("Vida útil debe ser mayor a 0");
					if (!clasificacion.cuentaContable) errors.push("Cuenta contable es obligatoria");
					if (!clasificacion.centroBeneficio) errors.push("Centro de beneficio es obligatorio");
					
					const result = {
						isValid: errors.length === 0,
						errors: errors,
						warnings: []
					};
					
					console.log(`[CapitalizationService] validateCapitalization(${afecId}): ${result.isValid ? 'OK' : errors.length + ' errores'}`);
					resolve(result);
				}, DELAY);
			});
		},

		/**
		 * Crea capitalización (marca AFeC como capitalizado)
		 * @param {string} afecId - ID del AFeC
		 * @param {string} userId - ID del usuario
		 * @param {Object} clasificacion - Datos de clasificación
		 * @param {string} observaciones - Observaciones
		 * @param {Object} asientoContable - Asiento contable generado
		 * @returns {Promise<Object>} Capitalización creada
		 */
		createCapitalization: function (afecId, userId, clasificacion, observaciones, asientoContable) {
			return new Promise((resolve) => {
				setTimeout(() => {
					const capitalizacion = {
						id: "CAP-" + Date.now(),
						afecId: afecId,
						userId: userId,
						clasificacion: clasificacion,
						observaciones: observaciones,
						asientoContable: asientoContable,
						fechaCapitalizacion: new Date(),
						estado: "Capitalizado"
					};
					
					// Guardar capitalización
					const capitalizations = JSON.parse(localStorage.getItem('capitalizations') || '[]');
					capitalizations.push(capitalizacion);
					localStorage.setItem('capitalizations', JSON.stringify(capitalizations));
					
					// Actualizar estado del AFeC
					const afecs = JSON.parse(localStorage.getItem('afecs') || '[]');
					const afec = afecs.find(a => a.id === afecId);
					if (afec) {
						afec.estado = "Capitalizado";
						afec.fechaCapitalizacion = new Date();
						afec.clasificacion = clasificacion;
						
						const index = afecs.findIndex(a => a.id === afecId);
						afecs[index] = afec;
						localStorage.setItem('afecs', JSON.stringify(afecs));
					}
					
					console.log(`[CapitalizationService] createCapitalization(${afecId}): Capitalización creada`);
					resolve(capitalizacion);
				}, DELAY);
			});
		},

		/**
		 * Genera asiento contable simulado
		 * @param {Object} afecData - Datos del AFeC
		 * @param {Object} clasificacion - Clasificación del activo
		 * @returns {Promise<Object>} Asiento contable
		 */
		generateAccountingEntry: function (afecData, clasificacion) {
			return new Promise((resolve) => {
				setTimeout(() => {
					const asiento = {
						numero: "ASI-" + Date.now(),
						fecha: new Date(),
						sociedad: "S001",
						moneda: "PEN",
						referencia: `Capitalización AFeC ${afecData.codigo}`,
						posiciones: [
							{
								tipo: "DEBE",
								cuenta: clasificacion.cuentaContable,
								descripcion: "Cuenta Activo Fijo",
								importe: afecData.importe,
								centroBeneficio: clasificacion.centroBeneficio,
								texto: `Capitalización AFeC ${afecData.codigo}`
							},
							{
								tipo: "HABER",
								cuenta: "1610-AFeC",
								descripcion: "Cuenta AFeC Origen",
								importe: afecData.importe,
								centroBeneficio: afecData.centroBeneficioOrigen || "CC-002",
								texto: "Traspaso a Activo Fijo"
							}
						],
						balance: {
							debe: afecData.importe,
							haber: afecData.importe,
							diferencia: 0,
							balanceado: true
						}
					};
					
					console.log(`[CapitalizationService] generateAccountingEntry(${afecData.codigo}): Asiento generado #${asiento.numero}`);
					resolve(asiento);
				}, DELAY);
			});
		},

		/**
		 * Genera reporte de capitalización (PDF simulado)
		 * @param {string} afecId - ID del AFeC
		 * @returns {Promise<Object>} Reporte generado
		 */
		generateCapitalizationReport: function (afecId) {
			return new Promise((resolve) => {
				setTimeout(() => {
					const report = {
						id: "REP-" + Date.now(),
						afecId: afecId,
						tipo: "PDF",
						nombre: `Reporte_Capitalizacion_${afecId}.pdf`,
						url: `/mock/reports/${afecId}.pdf`,
						fechaGeneracion: new Date(),
						size: "245 KB"
					};
					
					console.log(`[CapitalizationService] generateCapitalizationReport(${afecId}): Reporte generado`);
					resolve(report);
				}, DELAY);
			});
		},

		/**
		 * Mock: Retorna lista de AFeC de prueba
		 * @private
		 */
		_getMockAFeC: function () {
			// Intentar cargar desde localStorage
			let afecs = JSON.parse(localStorage.getItem('afecs') || '[]');
			
			// Si no hay datos, crear mock inicial
			if (afecs.length === 0) {
				afecs = [
					{
						id: "AFEC-001",
						codigo: "AFEC-001",
						descripcion: "Servidor de Aplicaciones HP ProLiant DL380",
						projectId: "PRJ-002",
						projectCode: "PRJ-2024-002",
						projectName: "Renovación Infraestructura TI",
						pepId: "PEP-002-01",
						pepCode: "PEP-002-01",
						importe: 50000.00,
						estado: "Pendiente",
						fechaCreacion: new Date(2024, 1, 15),
						clasificacion: null
					},
					{
						id: "AFEC-002",
						codigo: "AFEC-002",
						descripcion: "Equipamiento de Red Cisco Switch 48 puertos",
						projectId: "PRJ-002",
						projectCode: "PRJ-2024-002",
						projectName: "Renovación Infraestructura TI",
						pepId: "PEP-002-02",
						pepCode: "PEP-002-02",
						importe: 30000.00,
						estado: "Pendiente",
						fechaCreacion: new Date(2024, 1, 20),
						clasificacion: null
					},
					{
						id: "AFEC-003",
						codigo: "AFEC-003",
						descripcion: "Sistema de Almacenamiento SAN 10TB",
						projectId: "PRJ-002",
						projectCode: "PRJ-2024-002",
						projectName: "Renovación Infraestructura TI",
						pepId: "PEP-002-03",
						pepCode: "PEP-002-03",
						importe: 80000.00,
						estado: "Pendiente",
						fechaCreacion: new Date(2024, 1, 25),
						clasificacion: null
					},
					{
						id: "AFEC-004",
						codigo: "AFEC-004",
						descripcion: "Estructura Metálica Almacén Norte",
						projectId: "PRJ-004",
						projectCode: "PRJ-2024-004",
						projectName: "Construcción Almacén Norte",
						pepId: "PEP-004-01",
						pepCode: "PEP-004-01",
						importe: 1200000.00,
						estado: "Capitalizado",
						fechaCreacion: new Date(2024, 1, 10),
						fechaCapitalizacion: new Date(2024, 2, 1),
						clasificacion: {
							tipo: "BUILDING",
							categoria: "WAREHOUSES",
							metodoAmortizacion: "LINEAR",
							vidaUtil: 30,
							cuentaContable: "1510-Edificios e Instalaciones",
							centroBeneficio: "CC-004"
						}
					},
					{
						id: "AFEC-005",
						codigo: "AFEC-005",
						descripcion: "Mobiliario de Oficina (escritorios, sillas)",
						projectId: "PRJ-001",
						projectCode: "PRJ-2024-001",
						projectName: "Implementación SAP S/4HANA",
						pepId: "PEP-001-04",
						pepCode: "PEP-001-04",
						importe: 15000.00,
						estado: "Justificado",
						fechaCreacion: new Date(2024, 1, 5),
						clasificacion: null,
						justificacion: {
							motivo: "Activo de bajo valor, amortizado directamente",
							detalle: "Según política contable, activos menores a 20k se amortizan directamente sin capitalizar",
							fecha: new Date(2024, 2, 10),
							usuario: "finance-user"
						}
					}
				];
				
				localStorage.setItem('afecs', JSON.stringify(afecs));
			}
			
			return afecs;
		},

		/**
		 * Mock: Retorna movimientos contables de un AFeC
		 * @private
		 */
		_getMockMovimientos: function (afecId) {
			const movimientos = [
				{
					numero: "MOV-" + Date.now() + "-1",
					fecha: new Date(2024, 1, 15),
					claseCoste: "Material",
					descripcion: "Compra de equipamiento",
					importe: 25000.00
				},
				{
					numero: "MOV-" + Date.now() + "-2",
					fecha: new Date(2024, 1, 20),
					claseCoste: "Servicios",
					descripcion: "Instalación y configuración",
					importe: 15000.00
				},
				{
					numero: "MOV-" + Date.now() + "-3",
					fecha: new Date(2024, 1, 25),
					claseCoste: "Material",
					descripcion: "Componentes adicionales",
					importe: 10000.00
				}
			];
			
			return movimientos;
		}
	};
});
