sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/demo/prototype/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("com.demo.prototype.Component", {
		metadata: {
			manifest: "json"
		},

		/**
		 * Inicialización del componente
		 */
		init: function () {
			// Llamar a la función init del padre
			UIComponent.prototype.init.apply(this, arguments);

			// Cargar datos mock en memoria (NO localStorage)
			this._loadMockData();

			// Configurar modelos
			this.setModel(models.createDeviceModel(), "device");
			this.setModel(models.createAppModel(), "appModel");
			
			// Auto-autenticación como gerente1
			var oUserModel = models.createUserModel();
			oUserModel.setData({
				id: "user001",
				username: "gerente1",
				name: "Juan Pérez",
				role: "Gerente",
				isAuthenticated: true
			});
			this.setModel(oUserModel, "userModel");
			
			// Habilitar el router
			this.getRouter().initialize();
		},

		/**
	 * Carga datos mock inicializando estructura vacía en memoria
	 * Los datos reales serán generados por ProjectService al primer acceso
	 * @private
	 */
	_loadMockData: function() {
		console.log("⚙ Inicializando estructura de datos en memoria (App1)...");

		// Inicializar JSONModel con estructura vacía
		// ProjectService se encargará de generar los datos con MockDataGenerator
		var oDataModel = new sap.ui.model.json.JSONModel();
		
		// Inicializar con estructura vacía
		var oAppData = {
			projects: [],
			peps: [],
			users: {
				"MGR001": { id: "MGR001", username: "gerente1", name: "Juan Pérez", role: "Gerente Infraestructura" },
				"MGR002": { id: "MGR002", username: "gerente2", name: "María García", role: "Gerente Tecnología" },
				"MGR003": { id: "MGR003", username: "gerente3", name: "Carlos López", role: "Gerente Operaciones" }
			},
			attachments: {},
			dataVersion: null // ProjectService establecerá la versión
		};
		
		oDataModel.setData(oAppData);
		console.log("✅ Estructura de datos inicializada. Los datos se generarán al acceder a ProjectService.");
			// Establecer el modelo global de datos de la aplicación
			this.setModel(oDataModel, "appData");
			
			// También establecer en el Core para acceso global
			sap.ui.getCore().setModel(oDataModel, "appData");
		}
	});
});
