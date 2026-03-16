sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {
		/**
		 * Crea el modelo del dispositivo
		 * @returns {sap.ui.model.json.JSONModel} Modelo de dispositivo
		 */
		createDeviceModel: function () {
			const oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		/**
		 * Crea el modelo de aplicación con datos del usuario autenticado
		 * @returns {sap.ui.model.json.JSONModel} Modelo de aplicación
		 */
		createAppModel: function () {
			const oModel = new JSONModel({
				busy: false,
				user: {
					id: "MGR001",
					name: "Juan Carlos Rodríguez",
					email: "jrodriguez@empresa.com",
					role: "Gerente de Proyecto"
				},
				currentProject: null,
				filters: {
					code: "",
					status: [],
					management: ""
				}
			});
			return oModel;
		},

		/**
		 * Crea el modelo de usuario
		 * @returns {sap.ui.model.json.JSONModel} Modelo de usuario
		 */
		createUserModel: function () {
			const oModel = new JSONModel({
				id: "",
				username: "",
				name: "",
				role: "",
				isAuthenticated: false
			});
			return oModel;
		}
	};
});
