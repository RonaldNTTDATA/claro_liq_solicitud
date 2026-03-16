sap.ui.define([
	"com/demo/prototype/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("com.demo.prototype.controller.App", {
		onInit: function () {
			// Aplicar el modelo de dispositivo
			this.getView().setModel(this.getOwnerComponent().getModel("device"), "device");
			
			// Aplicar el modelo de aplicación
			this.getView().setModel(this.getOwnerComponent().getModel("appModel"), "appModel");
		}
	});
});
