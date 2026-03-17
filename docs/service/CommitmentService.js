sap.ui.define([
	"com/demo/prototype/service/StorageService"
], function (StorageService) {
	"use strict";

	const COMMITMENTS_KEY = "commitments";
	const PEPS_KEY = "peps";

	return {
		/**
		 * Obtiene compromisos de un proyecto
		 * @param {string} projectId - ID del proyecto
		 * @returns {Promise<Array>} Promesa con array de compromisos
		 */
		getCommitmentsByProject: function (projectId) {
			return new Promise((resolve) => {
				setTimeout(() => {
					// Cargar PEPs del proyecto
					const aAllPEPs = StorageService.load(PEPS_KEY) || [];
					const aProjectPEPs = aAllPEPs.filter(pep => pep.projectId === projectId);
					const aPEPIds = aProjectPEPs.map(pep => pep.id);

					// Cargar compromisos de esos PEPs
					let aAllCommitments = StorageService.load(COMMITMENTS_KEY) || this.generateMockCommitments();
					const aProjectCommitments = aAllCommitments.filter(c => aPEPIds.includes(c.pepId));

					resolve(aProjectCommitments);
				}, 500);
			});
		},

		/**
		 * Obtiene compromisos de un PEP específico
		 * @param {string} pepId - ID del PEP
		 * @returns {Promise<Array>} Promesa con array de compromisos
		 */
		getCommitmentsByPEP: function (pepId) {
			return new Promise((resolve) => {
				setTimeout(() => {
					let aAllCommitments = StorageService.load(COMMITMENTS_KEY) || this.generateMockCommitments();
					const aPEPCommitments = aAllCommitments.filter(c => c.pepId === pepId);
					resolve(aPEPCommitments);
				}, 500);
			});
		},

		/**
		 * Obtiene detalle de un compromiso (OC)
		 * @param {string} documentReference - Número de documento
		 * @returns {Promise<Object>} Promesa con objeto compromiso
		 */
		getCommitmentDetail: function (documentReference) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					const aAllCommitments = StorageService.load(COMMITMENTS_KEY) || [];
					const oCommitment = aAllCommitments.find(c => c.documentReference === documentReference);
					
					if (oCommitment) {
						// Agregar historial simulado de EMs y RFs
						oCommitment.history = {
							goodsReceipts: oCommitment.emNumber ? [
								{
									number: oCommitment.emNumber,
									date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
									quantity: oCommitment.quantityRegistered,
									responsible: "Usuario SAP",
									amount: oCommitment.amountSolesEM,
									document: `DOC-EM-${oCommitment.emNumber}`
								}
							] : [],
							invoiceReceipts: oCommitment.rfNumber ? [
								{
									number: oCommitment.rfNumber,
									date: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
									amount: oCommitment.amountSolesRF,
									logisticReference: `LR-${oCommitment.rfNumber}`,
									paymentStatus: Math.random() < 0.7 ? "Pagado" : "Pendiente"
								}
							] : []
						};
						resolve(oCommitment);
					} else {
						reject(new Error("Compromiso no encontrado"));
					}
				}, 500);
			});
		},

		/**
		 * Calcula porcentaje de aceptación (EM)
		 * @param {number} amountSoles - Importe total
		 * @param {number} amountSolesEM - Importe EM
		 * @returns {number} Porcentaje
		 */
		calculateAcceptancePercentage: function (amountSoles, amountSolesEM) {
			if (!amountSoles || amountSoles === 0) return 0;
			return Math.min(100, Math.round((amountSolesEM / amountSoles) * 100));
		},

		/**
		 * Calcula porcentaje de facturación (RF)
		 * @param {number} amountSoles - Importe total
		 * @param {number} amountSolesRF - Importe RF
		 * @returns {number} Porcentaje
		 */
		calculateInvoicePercentage: function (amountSoles, amountSolesRF) {
			if (!amountSoles || amountSoles === 0) return 0;
			return Math.min(100, Math.round((amountSolesRF / amountSoles) * 100));
		},

		/**
		 * Genera compromisos mock para todos los PEPs
		 * @returns {Array} Array de compromisos mock
		 */
		generateMockCommitments: function () {
			const aAllPEPs = StorageService.load(PEPS_KEY) || [];
			const aCommitments = [];
			let iCommitmentCounter = 1;

			const aDocumentTypes = ["SolPed", "Pedido"];
			const aMaterialTypes = ["ZMAT", "SERV", "LEIH"];
			const aCurrencies = ["PEN", "USD"];
			const aSuppliers = [
				{ code: "100025", name: "Proveedor Industrial SAC" },
				{ code: "100026", name: "Servicios Técnicos EIRL" },
				{ code: "100027", name: "Distribuidora Nacional SA" },
				{ code: "100028", name: "Constructora del Sur SAC" },
				{ code: "100029", name: "Equipos y Maquinarias SA" }
			];

			aAllPEPs.forEach((oPEP) => {
				// Cada PEP tiene entre 2 y 8 compromisos
				const iNumCommitments = Math.floor(Math.random() * 7) + 2;

				for (let i = 0; i < iNumCommitments; i++) {
					const sDocType = aDocumentTypes[Math.floor(Math.random() * aDocumentTypes.length)];
					const sDocPrefix = sDocType === "SolPed" ? "2000757" : "4500794";
					const oSupplier = aSuppliers[Math.floor(Math.random() * aSuppliers.length)];
					const fAmount = Math.random() * 50000 + 5000;
					const sCurrency = aCurrencies[Math.floor(Math.random() * aCurrencies.length)];
					
					// Determinar si tiene EM y RF
					const bHasEM = Math.random() < 0.75;
					const bHasRF = bHasEM && Math.random() < 0.80;
					const bIsEntryFinal = bHasEM && Math.random() < 0.85;
					
					const fEMAmount = bHasEM ? fAmount * (Math.random() * 0.3 + 0.7) : 0;
					const fRFAmount = bHasRF ? fEMAmount * (Math.random() * 0.2 + 0.8) : 0;

					const oCommitment = {
						id: `commitment-${iCommitmentCounter}`,
						documentType: sDocType,
						documentReference: sDocPrefix + String(iCommitmentCounter).padStart(5, "0"),
						positionReference: String(Math.floor(Math.random() * 10) + 1).padStart(5, "0"),
						pepId: oPEP.id,
						pepCode: oPEP.code,
						fund: `FOND-${Math.floor(Math.random() * 100) + 1}`,
						posPre: `POS-${Math.floor(Math.random() * 1000) + 1}`,
						supplierCode: oSupplier.code,
						supplierName: oSupplier.name,
						material: `MAT-${Math.floor(Math.random() * 10000) + 1000}`,
						materialText: `Material para proyecto ${oPEP.code}`,
						materialType: aMaterialTypes[Math.floor(Math.random() * aMaterialTypes.length)],
						deliveryDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
						entryFinal: bIsEntryFinal,
						currency: sCurrency,
						amountSoles: fAmount.toFixed(2),
						emNumber: bHasEM ? `EM-${String(iCommitmentCounter).padStart(6, "0")}` : null,
						quantityRegistered: bHasEM ? Math.floor(Math.random() * 100) + 1 : 0,
						amountSolesEM: fEMAmount.toFixed(2),
						rfNumber: bHasRF ? `RF-${String(iCommitmentCounter).padStart(6, "0")}` : null,
						amountSolesRF: fRFAmount.toFixed(2),
						acceptancePercentage: this.calculateAcceptancePercentage(fAmount, fEMAmount),
						invoicePercentage: this.calculateInvoicePercentage(fAmount, fRFAmount)
					};

					aCommitments.push(oCommitment);
					iCommitmentCounter++;
				}
			});

			StorageService.save(COMMITMENTS_KEY, aCommitments);
			return aCommitments;
		}
	};
});
