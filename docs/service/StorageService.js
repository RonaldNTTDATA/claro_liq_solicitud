sap.ui.define([], function () {
	"use strict";

	/**
	 * StorageService - Abstracción de almacenamiento en memoria usando JSONModel
	 * Usa el modelo "appData" de la aplicación para mantener datos en memoria
	 * NOTA: NO usa localStorage - todos los datos se almacenan en memoria y se pierden al recargar
	 */
	return {
		/**
		 * Obtiene el modelo appData de la aplicación actual
		 * @private
		 * @returns {sap.ui.model.json.JSONModel} El modelo appData
		 */
		_getAppDataModel: function() {
		// Primero intentar obtener el modelo desde el Core (más directo y confiable)
		var oModel = sap.ui.getCore().getModel("appData");
		
		if (!oModel) {
			console.error("❌ Modelo 'appData' no encontrado en el Core");		}
		
		return oModel;
	},

	/**	 * Guarda datos en el modelo appData
	 * @param {string} key - Clave de almacenamiento
	 * @param {object} data - Datos a guardar
	 * @returns {boolean} true si se guardó correctamente
	 */
	save: function (key, data) {
			try {
				var oModel = this._getAppDataModel();
				if (!oModel) {
					return false;
				}
				oModel.setProperty("/" + key, data);
				return true;
			} catch (e) {
				console.error("Error guardando en appData:", e);
				return false;
			}
		},

		/**
		 * Carga datos desde el modelo appData
		 * @param {string} key - Clave de almacenamiento
		 * @returns {object|null} Datos cargados o null
		 */
		load: function (key) {
			try {
				var oModel = this._getAppDataModel();
				if (!oModel) {
					return null;
				}
				return oModel.getProperty("/" + key);
			} catch (e) {
				console.error("Error cargando desde appData:", e);
				return null;
			}
		},

		/**
		 * Elimina datos del modelo appData (establece como array/objeto vacío)
		 * @param {string} key - Clave a eliminar
		 * @returns {boolean} true si se eliminó correctamente
		 */
		remove: function (key) {
			try {
				var oModel = this._getAppDataModel();
				if (!oModel) {
					return false;
				}
				// Establecer como null o array vacío según el tipo
				var currentValue = oModel.getProperty("/" + key);
				if (Array.isArray(currentValue)) {
					oModel.setProperty("/" + key, []);
				} else {
					oModel.setProperty("/" + key, null);
				}
				return true;
			} catch (e) {
				console.error("Error eliminando de appData:", e);
				return false;
			}
		},

		/**
		 * Limpia el modelo appData (resetea todas las propiedades)
		 * CUIDADO: Esto limpiará TODOS los datos de la aplicación
		 * @returns {boolean} true si se limpió correctamente
		 */
		clear: function () {
			try {
				var oModel = this._getAppDataModel();
				if (!oModel) {
					return false;
				}
				// Resetear el modelo completo con estructura vacía
				oModel.setData({
					projects: [],
					users: {},
					attachments: {},
					closureRequests: [],
					requestPriorities: {},
					liquidations: [],
					closures: [],
					afecs: [],
					capitalizations: [],
					auditLogs: [],
					balanceJustifications: [],
					commitmentJustifications: [],
					afecJustifications: [],
					closureChecklists: []
				});
				return true;
			} catch (e) {
				console.error("Error limpiando appData:", e);
				return false;
			}
		},

		/**
		 * Verifica si existe una clave en el modelo appData
		 * @param {string} key - Clave a verificar
		 * @returns {boolean} true si existe y no es null/undefined
		 */
		exists: function (key) {
			try {
				var oModel = this._getAppDataModel();
				if (!oModel) {
					return false;
				}
				var value = oModel.getProperty("/" + key);
				return value !== null && value !== undefined;
			} catch (e) {
				return false;
			}
		}
	};
});
