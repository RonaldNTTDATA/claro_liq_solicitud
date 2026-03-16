sap.ui.define([
	"com/demo/prototype/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"com/demo/prototype/service/ProjectService",
	"com/demo/prototype/service/ValidationService",
	"com/demo/prototype/service/AuditService",
	"com/demo/prototype/model/formatter"
], function (BaseController, JSONModel, ProjectService, ValidationService, AuditService, formatter) {
	"use strict";

	return BaseController.extend("com.demo.prototype.controller.ProjectManagement.ProjectList", {
		
		formatter: formatter,

		onInit: function () {
			// Crear modelo local para proyectos
			const oModel = new JSONModel({
				projects: [],
				allProjects: [],
				rejectedCount: 0,
				projectCount: "",
				filters: {
					code: "",
					status: [],
					manager: ""
				},
				statusOptions: [
					{ key: "En Proceso", text: "En Proceso" },
					{ key: "Solicitado", text: "Solicitado" },
					{ key: "Rechazado", text: "Rechazado" }
				],
				managerOptions: [
					{ key: "", text: "Todos" },
					{ key: "Sara Cordova", text: "Sara Cordova" }
				]
			});
			this.setModel(oModel, "projectModel");

			// Cargar proyectos iniciales
			this._loadProjects();
		},

	/**
	 * Carga proyectos del gerente autenticado
	 * @private
	 */
	_loadProjects: function () {
		const oAppModel = this.getOwnerComponent().getModel("appModel");
		const sManagerId = oAppModel.getProperty("/user/id");
		
		this.getView().setBusy(true);

		ProjectService.getProjectsByManager(sManagerId).then((aProjects) => {
			const oModel = this.getModel("projectModel");
			oModel.setProperty("/projects", aProjects);
			oModel.setProperty("/allProjects", aProjects);
			
			this._updateRejectedCount();
			this._updateProjectCount(aProjects.length);
			
			this.getView().setBusy(false);
		}).catch((oError) => {
			this.getView().setBusy(false);
			this.showErrorMessage("Error al cargar proyectos: " + oError.message);
		});
	},

	/**
	 * Actualiza el contador de proyectos rechazados
	 * @private
	 */
	_updateRejectedCount: function () {
			const oModel = this.getModel("projectModel");
			const aProjects = oModel.getProperty("/projects");
			const iRejectedCount = aProjects.filter(p => p.status === "Rechazado").length;
			oModel.setProperty("/rejectedCount", iRejectedCount);
		},

		/**
		 * Actualiza el contador de proyectos
		 * @private
		 * @param {number} iCount - Cantidad de proyectos
		 */
		_updateProjectCount: function (iCount) {
			const oModel = this.getModel("projectModel");
			const sText = iCount + " proyecto" + (iCount !== 1 ? "s" : "");
			oModel.setProperty("/projectCount", sText);
		},

		/**
		 * Handler para el botón Refresh
		 */
		onRefresh: function () {
			const oAppModel = this.getOwnerComponent().getModel("appModel");
			const sManagerId = oAppModel.getProperty("/user/id");
			const sUserId = oAppModel.getProperty("/user/id");
			const sUserName = oAppModel.getProperty("/user/name");
			
			this.getView().setBusy(true);

			// Recalcular semáforos
			ValidationService.recalculateAllSemaphores(sManagerId).then((aProjects) => {
				const oModel = this.getModel("projectModel");
				oModel.setProperty("/projects", aProjects);
				oModel.setProperty("/allProjects", aProjects);
				
				this._updateRejectedCount();
				this._updateProjectCount(aProjects.length);
				
				// Registrar en auditoría
				AuditService.logAction(
					"ALL",
					"Datos actualizados desde listado",
					sUserId,
					sUserName
				);
				
				this.showSuccessMessage(this.getResourceBundle().getText("msgDataUpdated"));
				this.getView().setBusy(false);
			}).catch((oError) => {
				this.getView().setBusy(false);
				this.showErrorMessage("Error al actualizar datos: " + oError.message);
			});
		},

		/**
		 * Handler para aplicar filtros
		 */
		onFilterApply: function () {
			const oModel = this.getModel("projectModel");
			const oFilters = oModel.getProperty("/filters");
			const oAppModel = this.getOwnerComponent().getModel("appModel");
			const sManagerId = oAppModel.getProperty("/user/id");
			
			this.getView().setBusy(true);

			ProjectService.filterProjects(oFilters, sManagerId).then((aProjects) => {
				oModel.setProperty("/projects", aProjects);
				this._updateRejectedCount();
				this._updateProjectCount(aProjects.length);
				this.getView().setBusy(false);
			}).catch((oError) => {
				this.getView().setBusy(false);
				this.showErrorMessage("Error al filtrar proyectos: " + oError.message);
			});
		},

		/**
		 * Handler para limpiar filtros
		 */
		onFilterClear: function () {
			const oModel = this.getModel("projectModel");
			oModel.setProperty("/filters/code", "");
			oModel.setProperty("/filters/status", []);
		oModel.setProperty("/filters/manager", "");
		
		// Recargar todos los proyectos
		this._loadProjects();
		
		this.showSuccessMessage(this.getResourceBundle().getText("msgFilterCleared"));
	},

	/**
	 * Handler para exportar a Excel (CSV)
	 */
	onExportExcel: function () {
		const oModel = this.getModel("projectModel");
		const aProjects = oModel.getProperty("/projects");
		const sCsv = this._generateCSV(aProjects);
		
		// Descargar archivo
		const blob = new Blob(["\ufeff" + sCsv], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		const url = URL.createObjectURL(blob);
		
		link.setAttribute("href", url);
		link.setAttribute(
			"download",
			"Proyectos_" + new Date().toISOString().split('T')[0] + ".csv"
		);
		link.style.visibility = "hidden";
		
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		this.showSuccessMessage(this.getResourceBundle().getText("msgExportSuccess"));
	},
	/**
	 * Handler para navegar al detalle del proyecto
	 * @param {sap.ui.base.Event} oEvent - Evento
	 */
	onProjectPress: function (oEvent) {
			let oItem;
			
			// Determinar si viene de link o de selección de fila
			if (oEvent.getParameter("listItem")) {
				oItem = oEvent.getParameter("listItem");
			} else {
				// Viene del link, obtener el contexto del binding
				const oSource = oEvent.getSource();
				oItem = oSource.getParent();
			}
			
			const oContext = oItem.getBindingContext("projectModel");
			const sProjectId = oContext.getProperty("id");
			
			// Navegar al detalle del proyecto
			this.getRouter().navTo("projectDetail", {
				projectId: sProjectId
			});
		},

		/**
		 * Formatea el tooltip del semáforo con detalles
		 * @param {string} sSemaphore - Semáforo
		 * @param {number} iPercentage - Porcentaje
		 * @returns {string} Tooltip
		 */
		formatSemaphoreDetailedTooltip: function (sSemaphore, iPercentage) {
			return sSemaphore + ": " + iPercentage + "% de PEPs válidos";
		},

		/**
		 * Formatea el color del semáforo para Icon
		 * @param {string} sSemaphore - Semáforo
		 * @returns {string} Color hex
		 */
		formatSemaphoreColorCode: function (sSemaphore) {
			switch (sSemaphore) {
				case "Verde":
					return "#107E3E";
				case "Ámbar":
					return "#E76500";
				case "Rojo":
					return "#E4002B";
				default:
					return "#666666";
			}
		},

		/**
		 * Handler para logout
		 */
		onLogout: function () {
			this.showConfirmDialog(
				"¿Está seguro que desea cerrar sesión?",
				() => {
					this.getRouter().navTo("login");
				},
				"Cerrar Sesión"
			);
	},
	/**
	 * Genera el contenido CSV con los datos de los proyectos
	 * @param {Array} aProjects - Array de proyectos
	 * @returns {string} Contenido CSV
	 * @private
	 */
	_generateCSV: function (aProjects) {
		// Encabezados
		const aHeaders = [
			"Estado",
			"Código",
			"Descripción",
			"Nombre",
			"Dirección Ejecutora",
			"Gerencia Ejecutora",
			"Gerente",
			"Dirección Solicitante",
			"Jefatura Solicitante",
			"Fecha Inicio",
			"Fecha Fin",
			"Importe Comprometido",
			"Importe Real",
			"Semáforo",
			"% PEPs Válidos"
		];

		let sCsv = aHeaders.join(",") + "\n";

		// Datos
		aProjects.forEach((oProject) => {
			const aRow = [
				oProject.status || "",
				oProject.code || "",
				'"' + (oProject.description || "").replace(/"/g, '""') + '"',
				'"' + (oProject.name || "").replace(/"/g, '""') + '"',
				oProject.direction || "",
				oProject.management || "",
				oProject.manager || "",
				oProject.requestDirection || "",
				oProject.requestDepartment || "",
				formatter.formatDate(oProject.startDate),
				formatter.formatDate(oProject.endDate),
				oProject.importeComprometido || 0,
				oProject.importeReal || 0,
				oProject.semaphore || "",
				oProject.validPepPercentage || 0
			];
			sCsv += aRow.join(",") + "\n";
		});

		return sCsv;
	},
	
	/**
	 * Abre el diálogo de adjuntos para un proyecto
	 */
	onAttachFiles: function (oEvent) {
		const oContext = oEvent.getSource().getBindingContext("projectModel");
		const oProject = oContext.getObject();
		
		// Cargar adjuntos del proyecto desde localStorage
		const sAttachmentsKey = "attachments_" + oProject.code;
		const aAttachments = JSON.parse(localStorage.getItem(sAttachmentsKey) || "[]");
		
		// Crear modelo para el diálogo
		const oAttachmentModel = new JSONModel({
			projectCode: oProject.code,
			projectName: oProject.name,
			attachments: aAttachments
		});
		this.setModel(oAttachmentModel, "attachmentModel");
		
		// Abrir diálogo
		if (!this._attachmentsDialog) {
			this._attachmentsDialog = sap.ui.xmlfragment(
				"attachmentsDialog",
				"com.demo.prototype.view.fragment.AttachmentsDialog",
				this
			);
			this.getView().addDependent(this._attachmentsDialog);
		}
		
		this._attachmentsDialog.open();
	},
	
	/**
	 * Handler cuando se selecciona un archivo
	 */
	onFileSelected: function (oEvent) {
		const oFileUploader = sap.ui.core.Fragment.byId("attachmentsDialog", "fileUploader");
		const sFileName = oFileUploader.getValue();
		
		if (sFileName) {
			sap.m.MessageToast.show("Archivo seleccionado: " + sFileName);
		}
	},
	
	/**
	 * Agrega un archivo a la lista de adjuntos
	 */
	onAddAttachment: function () {
		const oFileUploader = sap.ui.core.Fragment.byId("attachmentsDialog", "fileUploader");
		const sFileName = oFileUploader.getValue();
		
		if (!sFileName) {
			sap.m.MessageBox.warning("Por favor seleccione un archivo primero");
			return;
		}
		
		const oAttachmentModel = this.getModel("attachmentModel");
		const aAttachments = oAttachmentModel.getProperty("/attachments");
		const sProjectCode = oAttachmentModel.getProperty("/projectCode");
		
		// Simular carga del archivo (en producción sería una llamada real al servidor)
		const oNewAttachment = {
			fileName: sFileName,
			fileSize: Math.floor(Math.random() * 1000) + " KB",
			mimeType: this._getMimeType(sFileName),
			uploadDate: new Date().toISOString(),
			url: "#",  // En producción sería la URL real
			index: aAttachments.length
		};
		
		aAttachments.push(oNewAttachment);
		oAttachmentModel.setProperty("/attachments", aAttachments);
		
		// Guardar en localStorage
		const sAttachmentsKey = "attachments_" + sProjectCode;
		localStorage.setItem(sAttachmentsKey, JSON.stringify(aAttachments));
		
		// Limpiar file uploader
		oFileUploader.clear();
		
		sap.m.MessageToast.show("Archivo adjuntado correctamente");
	},
	
	/**
	 * Elimina un adjunto
	 */
	onRemoveAttachment: function (oEvent) {
		const oAttachmentModel = this.getModel("attachmentModel");
		const aAttachments = oAttachmentModel.getProperty("/attachments");
		const sProjectCode = oAttachmentModel.getProperty("/projectCode");
		const nIndex = parseInt(oEvent.getSource().getCustomData()[0].getValue());
		
		sap.m.MessageBox.confirm(
			"¿Está seguro de eliminar este archivo?",
			{
				onClose: function (sAction) {
					if (sAction === sap.m.MessageBox.Action.OK) {
						aAttachments.splice(nIndex, 1);
						oAttachmentModel.setProperty("/attachments", aAttachments);
						
						// Guardar en localStorage
						const sAttachmentsKey = "attachments_" + sProjectCode;
						localStorage.setItem(sAttachmentsKey, JSON.stringify(aAttachments));
						
						sap.m.MessageToast.show("Archivo eliminado");
					}
				}
			}
		);
	},
	
	/**
	 * Descarga (simula) un adjunto
	 */
	onDownloadAttachment: function (oEvent) {
		const oItem = oEvent.getSource();
		const sFileName = oItem.getTitle();
		sap.m.MessageToast.show("Descargando: " + sFileName);
	},
	
	/**
	 * Cierra el diálogo de adjuntos
	 */
	onCloseAttachmentsDialog: function () {
		if (this._attachmentsDialog) {
			this._attachmentsDialog.close();
		}
	},
	
	/**
	 * Obtiene el MIME type según la extensión
	 */
	_getMimeType: function (sFileName) {
		const sExt = sFileName.split('.').pop().toLowerCase();
		const mMimeTypes = {
			'pdf': 'application/pdf',
			'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'xls': 'application/vnd.ms-excel',
			'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'doc': 'application/msword'
		};
		return mMimeTypes[sExt] || 'application/octet-stream';
	}
	});
});
