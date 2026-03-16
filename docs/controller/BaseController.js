sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/core/UIComponent",
	"com/demo/prototype/model/formatter"
], function (Controller, History, UIComponent, formatter) {
	"use strict";

	return Controller.extend("com.demo.prototype.controller.BaseController", {
		
		formatter: formatter,

		/**
		 * Obtiene el router
		 * @returns {sap.ui.core.routing.Router} Router instance
		 */
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},

		/**
		 * Obtiene un modelo por nombre
		 * @param {string} sName - Nombre del modelo
		 * @returns {sap.ui.model.Model} Modelo
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Establece un modelo en la vista
		 * @param {sap.ui.model.Model} oModel - Modelo
		 * @param {string} sName - Nombre del modelo
		 * @returns {sap.ui.core.mvc.View} Vista
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Obtiene el ResourceBundle para i18n
		 * @returns {sap.base.i18n.ResourceBundle} ResourceBundle
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Navega atrás en el historial
		 */
		onNavBack: function () {
			const sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("projectList", {}, true);
			}
		},

		/**
		 * Muestra un mensaje de éxito
		 * @param {string} sMessage - Mensaje a mostrar
		 */
		showSuccessMessage: function (sMessage) {
			sap.m.MessageToast.show(sMessage);
		},

		/**
		 * Muestra un mensaje de error
		 * @param {string} sMessage - Mensaje de error
		 */
		showErrorMessage: function (sMessage) {
			sap.m.MessageBox.error(sMessage);
		},

		/**
		 * Muestra un mensaje de warning
		 * @param {string} sMessage - Mensaje de advertencia
		 */
		showWarningMessage: function (sMessage) {
			sap.m.MessageBox.warning(sMessage);
		},

		/**
		 * Muestra un diálogo de confirmación
		 * @param {string} sMessage - Mensaje de confirmación
		 * @param {function} fnOnConfirm - Callback al confirmar
		 * @param {string} sTitle - Título del diálogo (opcional)
		 */
		showConfirmDialog: function (sMessage, fnOnConfirm, sTitle) {
			sap.m.MessageBox.confirm(sMessage, {
				title: sTitle || "Confirmación",
				onClose: function (oAction) {
					if (oAction === sap.m.MessageBox.Action.OK) {
						fnOnConfirm();
					}
				}
			});
		}
	});
});
