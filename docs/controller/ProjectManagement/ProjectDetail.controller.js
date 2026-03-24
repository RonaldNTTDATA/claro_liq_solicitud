sap.ui.define([
	"com/demo/prototype/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"com/demo/prototype/service/ProjectService",
	"com/demo/prototype/service/PEPService",
	"com/demo/prototype/service/CommitmentService",
	"com/demo/prototype/service/RequestService",
	"com/demo/prototype/service/ValidationService",
	"com/demo/prototype/service/AuditService",
	"com/demo/prototype/model/formatter",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function (
	BaseController,
	JSONModel,
	ProjectService,
	PEPService,
	CommitmentService,
	RequestService,
	ValidationService,
	AuditService,
	formatter,
	MessageBox,
	MessageToast
) {
	"use strict";

	return BaseController.extend("com.demo.prototype.controller.ProjectManagement.ProjectDetail", {

		formatter: formatter,

		onInit: function () {
			const oRouter = this.getRouter();
			oRouter.getRoute("projectDetail").attachPatternMatched(this._onObjectMatched, this);

			// Crear modelo local
			const oModel = new JSONModel({
				project: {},
				peps: [],
				commitments: [],
				pepSummary: "",
				commitmentSummary: "",
				canRequestClosure: false,
				filters: {
					showOnlyProblems: false
				},
				commitmentFilters: {
					docType: "",
					pep: "",
					showOnlyPending: false
				}
			});
			this.setModel(oModel, "detailModel");
		},

		_onObjectMatched: function (oEvent) {
			const sProjectId = oEvent.getParameter("arguments").projectId;
			this._loadProjectData(sProjectId);
		},

		_loadProjectData: function (sProjectId) {
			this.getView().setBusy(true);

			Promise.all([
				ProjectService.getProjectById(sProjectId),
				PEPService.getPEPsByProject(sProjectId),
				CommitmentService.getCommitmentsByProject(sProjectId)
			]).then(([oProject, aPEPs, aCommitments]) => {
				const oModel = this.getModel("detailModel");
				
				oModel.setProperty("/project", oProject);
				oModel.setProperty("/peps", aPEPs);
				oModel.setProperty("/commitments", aCommitments);
				
				// Cargar adjuntos del proyecto
				const sAttachmentsKey = "attachments_" + oProject.code;
				const aAttachmentsRaw = JSON.parse(localStorage.getItem(sAttachmentsKey) || "[]");
				const aAttachments = this._normalizeAttachments(aAttachmentsRaw);
				oModel.setProperty("/attachments", aAttachments);
				this._refreshAttachmentBuckets(oModel, aAttachments);

				// Calcular si puede solicitar cierre
				const bCanRequest = oProject.semaphore === "Verde" && 
									oProject.status === "En Proceso";
				oModel.setProperty("/canRequestClosure", bCanRequest);

				// Actualizar resúmenes
				this._updateSummaries();

				this.getView().setBusy(false);
			}).catch((oError) => {
				this.getView().setBusy(false);
				this.showErrorMessage("Error al cargar datos del proyecto: " + oError.message);
			});
		},

		_updateSummaries: function () {
			const oModel = this.getModel("detailModel");
			const aPEPs = oModel.getProperty("/peps");
			const aCommitments = oModel.getProperty("/commitments");

			// Resumen PEPs
			const iValidPEPs = aPEPs.filter(p => p.consolidatedSemaphore === "Verde").length;
			const fPercentage = aPEPs.length > 0 ? Math.round((iValidPEPs / aPEPs.length) * 100) : 0;
			oModel.setProperty("/pepSummary", 
				`${aPEPs.length} elementos PEP - ${iValidPEPs} válidos (${fPercentage}%)`);

			// Resumen Compromisos
			const iPending = aCommitments.filter(c => !c.entryFinal || c.acceptancePercentage < 100).length;
			oModel.setProperty("/commitmentSummary",
				`${aCommitments.length} OCs - ${iPending} pendientes`);
		},

		onNavBack: function () {
			this.getRouter().navTo("projectList", {}, true);
		},

		onUpdateValidations: function () {
			const oModel = this.getModel("detailModel");
			const sProjectId = oModel.getProperty("/project/id");

			this.getView().setBusy(true);

			PEPService.recalculateAllPEPValidations(sProjectId).then((aPEPs) => {
				// Recalcular semáforo del proyecto
				return ValidationService.calculateSemaphore(sProjectId).then((oResult) => {
					// Recargar proyecto actualizado
					return ProjectService.getProjectById(sProjectId).then((oProject) => {
						oModel.setProperty("/project", oProject);
						oModel.setProperty("/peps", aPEPs);

						const bCanRequest = oProject.semaphore === "Verde" && 
											oProject.status === "EnProceso";
						oModel.setProperty("/canRequestClosure", bCanRequest);

						this._updateSummaries();
						this.getView().setBusy(false);

						MessageToast.show(this.getResourceBundle().getText("msgValidationsUpdated"));

						if (oProject.semaphore === "Verde") {
							MessageBox.success(this.getResourceBundle().getText("msgProjectReady"));
						}
					});
				});
			}).catch((oError) => {
				this.getView().setBusy(false);
				this.showErrorMessage("Error al actualizar validaciones: " + oError.message);
			});
		},

		onRequestClosure: function () {
			const oModel = this.getModel("detailModel");
			const aAttachments = oModel.getProperty("/attachments") || [];
			const oRequiredCheck = this._validateRequiredAttachments(aAttachments);

			if (!oRequiredCheck.valid) {
				MessageBox.warning(oRequiredCheck.message);
				return;
			}

			if (!this._oConfirmDialog) {
				this._oConfirmDialog = sap.ui.xmlfragment(
					"com.demo.prototype.view.fragment.ConfirmRequestDialog",
					this
				);
				this.getView().addDependent(this._oConfirmDialog);
			}

			// Pasar datos del proyecto al diálogo
			const oProject = oModel.getProperty("/project");
			const aPEPs = oModel.getProperty("/peps");

			this._oConfirmDialog.setModel(new JSONModel({
				code: oProject.code,
				name: oProject.name,
				manager: oProject.manager,
				pepCount: aPEPs.length,
				semaphore: oProject.semaphore,
				status: oProject.status,
				approverUser: "",
				projectManager: "",
				approverOptions: [
					{ key: "apro_finanzas_01", text: "apro_finanzas_01" },
					{ key: "apro_finanzas_02", text: "apro_finanzas_02" },
					{ key: "apro_finanzas_03", text: "apro_finanzas_03" }
				],
				projectManagerOptions: [
					{ key: "gproy_001", text: "gproy_001" },
					{ key: "gproy_002", text: "gproy_002" },
					{ key: "gproy_003", text: "gproy_003" }
				]
			}), "dialogModel");

			this._oConfirmDialog.open();
		},

		onConfirmRequest: function () {
			const oModel = this.getModel("detailModel");
			const sProjectId = oModel.getProperty("/project/id");
			const oAppModel = this.getOwnerComponent().getModel("appModel");
			const sUserId = oAppModel.getProperty("/user/id");
			const oDialogModel = this._oConfirmDialog.getModel("dialogModel");
			const sApproverUser = (oDialogModel.getProperty("/approverUser") || "").trim();
			const sProjectManager = (oDialogModel.getProperty("/projectManager") || "").trim();

			if (!sApproverUser || !sProjectManager) {
				MessageBox.warning("Debe ingresar Usuario Aprobador y Gerente de Proyecto para continuar.");
				return;
			}

			this._oConfirmDialog.close();
			this.getView().setBusy(true);

			RequestService.createRequest(sProjectId, sUserId, sApproverUser, sProjectManager).then((oRequest) => {
				this.getView().setBusy(false);
				
				MessageBox.success(this.getResourceBundle().getText("msgRequestSuccess"), {
					onClose: () => {
						// Recargar datos
						this._loadProjectData(sProjectId);
					}
				});
			}).catch((oError) => {
				this.getView().setBusy(false);
				MessageBox.error("Error al crear solicitud: " + oError.message);
			});
		},

		onCancelRequest: function () {
			this._oConfirmDialog.close();
		},

		onPEPPress: function (oEvent) {
			const oContext = oEvent.getSource().getBindingContext("detailModel");
			const oPEP = oContext.getObject();

			if (!this._oValidationDialog) {
				this._oValidationDialog = sap.ui.xmlfragment(
					"com.demo.prototype.view.fragment.ValidationDetailPopup",
					this
				);
				this.getView().addDependent(this._oValidationDialog);
			}

			// Cargar detalles de validación
			this._oValidationDialog.setBusy(true);
			this._oValidationDialog.open();

			ValidationService.validatePEP(oPEP.id).then((oValidation) => {
				const oDialogData = {
					pep: oPEP,
					validation: oValidation,
					movements: oValidation.movements === "OK" ? 
						[
							{ account: "410000", costCenter: oPEP.costCenter, costClass: "Personal", amount: 50000, status: "OK", message: "" },
							{ account: "420000", costCenter: oPEP.costCenter, costClass: "Materiales", amount: 30000, status: "OK", message: "" }
						] : oValidation.movements || [],
					commitments: oValidation.pendingCommitments || []
				};

				this._oValidationDialog.setModel(new JSONModel(oDialogData), "dialogModel");
				this._oValidationDialog.setBusy(false);
			});
		},

		onCloseValidationDialog: function () {
			this._oValidationDialog.close();
		},

		onOpenInSAP: function () {
			const oDialogModel = this._oValidationDialog.getModel("dialogModel");
			const sPEPCode = oDialogModel.getProperty("/pep/code");
			MessageToast.show(`Abrir CJ20N con PEP: ${sPEPCode}`);
		},

		onCommitmentPress: function (oEvent) {
			const oContext = oEvent.getSource().getBindingContext("detailModel");
			const oCommitment = oContext.getObject();

			if (!this._oOCDialog) {
				this._oOCDialog = sap.ui.xmlfragment(
					"com.demo.prototype.view.fragment.OCDetailPopup",
					this
				);
				this.getView().addDependent(this._oOCDialog);
			}

			this._oOCDialog.setBusy(true);
			this._oOCDialog.open();

			CommitmentService.getCommitmentDetail(oCommitment.documentReference).then((oDetail) => {
				this._oOCDialog.setModel(new JSONModel(oDetail), "dialogModel");
				this._oOCDialog.setBusy(false);
			});
		},

		onCloseOCDialog: function () {
			this._oOCDialog.close();
		},

		onOpenOCInSAP: function () {
			const oDialogModel = this._oOCDialog.getModel("dialogModel");
			const sDocType = oDialogModel.getProperty("/documentType");
			const sDocNumber = oDialogModel.getProperty("/documentReference");
			const sTransaction = sDocType === "Pedido" ? "ME23N" : "ME53N";
			MessageToast.show(`Abrir ${sTransaction} con documento: ${sDocNumber}`);
		},

		onFilterProblems: function () {
			const oModel = this.getModel("detailModel");
			const bShowOnlyProblems = oModel.getProperty("/filters/showOnlyProblems");
			
			const aAllPEPs = oModel.getProperty("/peps");
			const aFilteredPEPs = bShowOnlyProblems ? 
				aAllPEPs.filter(p => p.consolidatedSemaphore === "Rojo") : 
				aAllPEPs;

			// Actualizar binding
			const oTable = this.byId("pepsTable");
			oTable.getBinding("items").filter(
				bShowOnlyProblems ? 
					new sap.ui.model.Filter("consolidatedSemaphore", sap.ui.model.FilterOperator.EQ, "Rojo") :
					[]
			);
		},

		onFilterCommitments: function () {
			const oModel = this.getModel("detailModel");
			const oFilters = oModel.getProperty("/commitmentFilters");
			
			const aFilters = [];

			if (oFilters.docType) {
				aFilters.push(new sap.ui.model.Filter("documentType", sap.ui.model.FilterOperator.EQ, oFilters.docType));
			}

			if (oFilters.pep) {
				aFilters.push(new sap.ui.model.Filter("pepCode", sap.ui.model.FilterOperator.Contains, oFilters.pep));
			}

			if (oFilters.showOnlyPending) {
				aFilters.push(new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("entryFinal", sap.ui.model.FilterOperator.EQ, false),
						new sap.ui.model.Filter("acceptancePercentage", sap.ui.model.FilterOperator.LT, 100)
					],
					and: false
				}));
			}

			const oTable = this.byId("commitmentsTable");
			oTable.getBinding("items").filter(aFilters);
		},

		onViewSnapshot: function (oEvent) {
			const oContext = oEvent.getSource().getBindingContext("detailModel");
			const sRequestId = oContext.getProperty("id");

			RequestService.getValidationsSnapshot(sRequestId).then((oSnapshot) => {
				MessageBox.information(
					`Snapshot capturado el ${formatter.formatDateTime(oSnapshot.timestamp)}\n\n` +
					`Semáforo del Proyecto: ${oSnapshot.projectSemaphore}\n` +
					`PEPs Válidos: ${oSnapshot.validPepPercentage}%\n` +
					`Total PEPs: ${oSnapshot.peps.length}`,
					{
						title: "Snapshot de Validaciones"
					}
				);
			});
		},

		onExportPEPs: function () {
			const oModel = this.getModel("detailModel");
			const aPEPs = oModel.getProperty("/peps");
			
			const sCsv = this._generatePEPsCSV(aPEPs);
			const blob = new Blob(["\ufeff" + sCsv], { type: "text/csv;charset=utf-8;" });
			const link = document.createElement("a");
			const url = URL.createObjectURL(blob);
			
			link.setAttribute("href", url);
			link.setAttribute("download", "PEPs_" + new Date().toISOString().split('T')[0] + ".csv");
			link.style.visibility = "hidden";
			
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			MessageToast.show(this.getResourceBundle().getText("msgExportSuccess"));
		},

		_generatePEPsCSV: function (aPEPs) {
			const aHeaders = [
				"Código PEP", "Nombre", "Tipo", "Centro Costo", 
				"Val. Movimientos", "Val. Compromisos", "Val. AFeC", "Val. Saldo",
				"Semáforo Consolidado", "Saldo Actual", "AFeC"
			];

			let sCsv = aHeaders.join(",") + "\n";

			aPEPs.forEach((oPEP) => {
				const aRow = [
					oPEP.code || "",
					'"' + (oPEP.name || "").replace(/"/g, '""') + '"',
					'"' + (oPEP.type || "").replace(/"/g, '""') + '"',
					oPEP.costCenter || "",
					oPEP.validations.movements || "",
					oPEP.validations.commitments || "",
					oPEP.validations.afec || "",
					oPEP.validations.balance || "",
					oPEP.consolidatedSemaphore || "",
					oPEP.currentBalance || 0,
					oPEP.afecId || ""
				];
				sCsv += aRow.join(",") + "\n";
			});

			return sCsv;
		},

		onExportCommitments: function () {
			MessageToast.show("Exportando compromisos...");
		},

		onExportHistory: function () {
			MessageToast.show("Exportando historial...");
		},

		formatSemaphoreDetailedTooltip: function (sSemaphore, fPercentage) {
			return `${sSemaphore}: ${fPercentage}% PEPs válidos`;
		},

		/* =========================================================== */
		/* Gestión de Adjuntos                                         */
		/* =========================================================== */

		onAttachFiles: function () {
			const oDetailModel = this.getModel("detailModel");
			const oProject = oDetailModel.getProperty("/project");
			
			if (!oProject) {
				MessageToast.show("No hay proyecto seleccionado");
				return;
			}

			// Cargar adjuntos del localStorage
			const sAttachmentsKey = "attachments_" + oProject.code;
			const aAttachmentsRaw = JSON.parse(localStorage.getItem(sAttachmentsKey) || "[]");
			const aAttachments = this._normalizeAttachments(aAttachmentsRaw);

			// Crear modelo para el diálogo
			const oAttachmentModel = new JSONModel({
				projectCode: oProject.code,
				projectName: oProject.name,
				selectedType: "ACTA_CIERRE",
				attachmentTypeOptions: [
					{ key: "ACTA_CIERRE", text: "Acta de Cierre" },
					{ key: "INFORME_TECNICO", text: "Informe Técnico" },
					{ key: "OTRO", text: "Otro" }
				],
				attachments: aAttachments,
				actaAttachments: aAttachments.filter(a => a.type === "ACTA_CIERRE"),
				informeAttachments: aAttachments.filter(a => a.type === "INFORME_TECNICO"),
				otherAttachments: aAttachments.filter(a => a.type === "OTRO")
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

		onFileSelected: function (oEvent) {
			const sFileName = oEvent.getParameter("newValue");
			if (sFileName) {
				MessageToast.show("Archivo seleccionado: " + sFileName);
			}
		},

		onAddAttachment: function () {
			const oFileUploader = sap.ui.core.Fragment.byId("attachmentsDialog", "fileUploader");
			
			if (!oFileUploader) {
				MessageToast.show("Error: no se encontró el FileUploader");
				return;
			}

			const sFileName = oFileUploader.getValue();
			if (!sFileName) {
				MessageBox.warning("Por favor, seleccione un archivo antes de agregarlo");
				return;
			}

			const oAttachmentModel = this.getModel("attachmentModel");
			const sProjectCode = oAttachmentModel.getProperty("/projectCode");
			const aAttachments = oAttachmentModel.getProperty("/attachments") || [];
			const sAttachmentType = oAttachmentModel.getProperty("/selectedType") || "OTRO";

			if ((sAttachmentType === "ACTA_CIERRE" || sAttachmentType === "INFORME_TECNICO") &&
				aAttachments.some(att => att.type === sAttachmentType)) {
				MessageBox.warning("Solo puede adjuntar un archivo para ese tipo obligatorio. Si desea cambiarlo, elimine el actual.");
				return;
			}

			// Simular lectura del archivo
			const oFile = oFileUploader.oFileUpload.files[0];
			if (oFile) {
				// Validar tamaño (máx 10MB)
				if (oFile.size > 10 * 1024 * 1024) {
					MessageBox.error("El archivo excede el tamaño máximo permitido de 10MB");
					return;
				}

				// Crear objeto adjunto
				const oAttachment = {
					fileName: oFile.name,
					fileSize: this._formatFileSize(oFile.size),
					mimeType: this._getMimeType(oFile.name),
					uploadDate: new Date().toISOString(),
					url: URL.createObjectURL(oFile),
					type: sAttachmentType,
					typeLabel: this._getAttachmentTypeLabel(sAttachmentType),
					index: aAttachments.length
				};

				// Agregar al array
				aAttachments.push(oAttachment);

				// Guardar en localStorage
				const sAttachmentsKey = "attachments_" + sProjectCode;
				localStorage.setItem(sAttachmentsKey, JSON.stringify(aAttachments));

				// Actualizar modelo
				oAttachmentModel.setProperty("/attachments", aAttachments);
				this._refreshAttachmentBuckets(oAttachmentModel, aAttachments);

				// Actualizar también el detailModel para reflejar cambios en la vista principal
				const oDetailModel = this.getModel("detailModel");
				oDetailModel.setProperty("/attachments", aAttachments);
				this._refreshAttachmentBuckets(oDetailModel, aAttachments);

				// Limpiar FileUploader
				oFileUploader.clear();

				MessageToast.show("Archivo agregado correctamente");
			} else {
				MessageBox.warning("No se pudo leer el archivo seleccionado");
			}
		},

		onRemoveAttachment: function (oEvent) {
			const oItem = oEvent.getParameter("listItem");
			const oContext = oItem.getBindingContext("attachmentModel");
			const iIndex = oContext.getProperty("index");

			MessageBox.confirm("¿Está seguro que desea eliminar este archivo?", {
				onClose: (sAction) => {
					if (sAction === MessageBox.Action.OK) {
						const oAttachmentModel = this.getModel("attachmentModel");
						const sProjectCode = oAttachmentModel.getProperty("/projectCode");
						let aAttachments = oAttachmentModel.getProperty("/attachments");

						// Eliminar del array
						aAttachments = aAttachments.filter(att => att.index !== iIndex);

						// Reindexar
						aAttachments.forEach((att, idx) => {
							att.index = idx;
						});

						// Guardar en localStorage
						const sAttachmentsKey = "attachments_" + sProjectCode;
						localStorage.setItem(sAttachmentsKey, JSON.stringify(aAttachments));

						// Actualizar modelos
						oAttachmentModel.setProperty("/attachments", aAttachments);
						this._refreshAttachmentBuckets(oAttachmentModel, aAttachments);
						
						const oDetailModel = this.getModel("detailModel");
						oDetailModel.setProperty("/attachments", aAttachments);
						this._refreshAttachmentBuckets(oDetailModel, aAttachments);

						MessageToast.show("Archivo eliminado");
					}
				}
			});
		},

		onDownloadAttachment: function (oEvent) {
			const oContext = oEvent.getSource().getBindingContext("attachmentModel") || oEvent.getSource().getBindingContext("detailModel");
			const sFileName = oContext.getProperty("fileName");
			MessageToast.show("Descargando: " + sFileName);
			// En una implementación real, aquí se descargaría el archivo
		},

		onCloseAttachmentsDialog: function () {
			if (this._attachmentsDialog) {
				this._attachmentsDialog.close();
			}
		},

		_getMimeType: function (sFileName) {
			const sExtension = sFileName.split('.').pop().toLowerCase();
			const mMimeTypes = {
				"pdf": "application/pdf",
				"xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				"xls": "application/vnd.ms-excel",
				"docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				"doc": "application/msword"
			};
			return mMimeTypes[sExtension] || "application/octet-stream";
		},

		_formatFileSize: function (iBytes) {
			if (iBytes < 1024) return iBytes + " B";
			if (iBytes < 1024 * 1024) return (iBytes / 1024).toFixed(2) + " KB";
			return (iBytes / (1024 * 1024)).toFixed(2) + " MB";
		},

		_normalizeAttachments: function (aAttachments) {
			return (aAttachments || []).map((att, idx) => {
				const sType = att.type || "OTRO";
				const oNormalized = Object.assign({}, att);
				oNormalized.type = sType;
				oNormalized.typeLabel = att.typeLabel || this._getAttachmentTypeLabel(sType);
				oNormalized.index = typeof att.index === "number" ? att.index : idx;
				return oNormalized;
			});
		},

		_getAttachmentTypeLabel: function (sType) {
			if (sType === "ACTA_CIERRE") {
				return "Acta de Cierre";
			}
			if (sType === "INFORME_TECNICO") {
				return "Informe Técnico";
			}
			return "Otro";
		},

		_validateRequiredAttachments: function (aAttachments) {
			const iActaCount = (aAttachments || []).filter(att => att.type === "ACTA_CIERRE").length;
			const iInformeCount = (aAttachments || []).filter(att => att.type === "INFORME_TECNICO").length;
			const bHasActa = iActaCount >= 1;
			const bHasInforme = iInformeCount >= 1;
			const bSingleActa = iActaCount === 1;
			const bSingleInforme = iInformeCount === 1;

			let sMessage = "";
			if (!bHasActa || !bHasInforme) {
				sMessage = "Debe adjuntar obligatoriamente un Acta de Cierre y un Informe Técnico antes de solicitar el cierre.";
			} else if (!bSingleActa || !bSingleInforme) {
				sMessage = "Solo se permite un Acta de Cierre y un Informe Técnico. Elimine duplicados antes de solicitar el cierre.";
			}

			return {
				valid: bHasActa && bHasInforme && bSingleActa && bSingleInforme,
				hasActa: bHasActa,
				hasInforme: bHasInforme,
				actaCount: iActaCount,
				informeCount: iInformeCount,
				message: sMessage
			};
		},

		_refreshAttachmentBuckets: function (oModel, aAttachments) {
			if (!oModel) {
				return;
			}

			const aAll = aAttachments || [];
			oModel.setProperty("/actaAttachments", aAll.filter(a => a.type === "ACTA_CIERRE"));
			oModel.setProperty("/informeAttachments", aAll.filter(a => a.type === "INFORME_TECNICO"));
			oModel.setProperty("/otherAttachments", aAll.filter(a => a.type === "OTRO"));

			const oRequiredCheck = this._validateRequiredAttachments(aAll);
			oModel.setProperty("/hasRequiredAttachments", oRequiredCheck.valid);
		}
	});
});
