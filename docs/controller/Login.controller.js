sap.ui.define([
	"com/demo/prototype/controller/BaseController",
	"com/demo/prototype/service/AuditService",
	"sap/m/MessageBox"
], function (BaseController, AuditService, MessageBox) {
	"use strict";

	return BaseController.extend("com.demo.prototype.controller.Login", {
		
		// Usuarios mock
		_mockUsers: {
			"gerente1": {
				id: "MGR001",
				name: "Juan Carlos Rodríguez",
				email: "jrodriguez@empresa.com",
				role: "Gerente de Proyecto",
				management: "Gerencia de Infraestructura",
				password: "demo123"
			},
			"gerente2": {
				id: "MGR002",
				name: "María García López",
				email: "mgarcia@empresa.com",
				role: "Gerente de Proyecto",
				management: "Gerencia de Tecnología",
				password: "demo123"
			},
			"gerente3": {
				id: "MGR003",
				name: "Pedro Sánchez Torres",
				email: "psanchez@empresa.com",
				role: "Gerente de Proyecto",
				management: "Gerencia de Operaciones",
				password: "demo123"
			}
		},

		onInit: function () {
			// No hacer nada, esperar a que el usuario ingrese credenciales
		},

		/**
		 * Maneja el evento de login
		 */
		onLogin: function () {
			const sUsername = this.byId("usernameInput").getValue();
			const sPassword = this.byId("passwordInput").getValue();

			if (!sUsername || !sPassword) {
				MessageBox.error("Por favor ingrese usuario y contraseña.");
				return;
			}

			// Validar credenciales
			const oUser = this._mockUsers[sUsername];
			if (!oUser || oUser.password !== sPassword) {
				MessageBox.error("Usuario o contraseña incorrectos.");
				return;
			}

			// Autenticar usuario
			this._authenticateUser(oUser);
		},

		/**
		 * Simula autenticación del usuario
		 * @private
		 * @param {object} oUser - Datos del usuario
		 */
		_authenticateUser: function (oUser) {
			const oAppModel = this.getModel("appModel");
			
			// Actualizar el modelo con los datos del usuario
			oAppModel.setProperty("/user", {
				id: oUser.id,
				name: oUser.name,
				email: oUser.email,
				role: oUser.role,
				management: oUser.management
			});
			
			// Registrar login en auditoría
			AuditService.logAction(
				"SYSTEM",
				"Usuario autenticado",
				oUser.id,
				oUser.name,
				{ role: oUser.role }
			);
			
			// Navegar al listado de proyectos
			this.getRouter().navTo("projectList");
		}
	});
});
