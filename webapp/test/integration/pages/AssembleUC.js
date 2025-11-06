sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/actions/Press",
	"sap/ui/test/actions/EnterText",
	"sap/ui/test/matchers/Properties",
	"sap/ui/test/matchers/AggregationLengthEquals"
], function (Opa5, Press, EnterText, Properties, AggregationLengthEquals) {
	"use strict";

	var sViewName = "AssembleUC";

	Opa5.createPageObjects({
		onTheAssembleUCPage: {
			actions: {
				iEnterMaterial: function (sMaterial) {
					return this.waitFor({
						id: "materialInput",
						viewName: sViewName,
						actions: new EnterText({
							text: sMaterial
						}),
						errorMessage: "Could not enter material barcode"
					});
				},

				iEnterQuantidade: function (sQuantidade) {
					return this.waitFor({
						id: "quantidadeInput",
						viewName: sViewName,
						actions: new EnterText({
							text: sQuantidade
						}),
						errorMessage: "Could not enter quantity"
					});
				},

				iPressAdicionarItemButton: function () {
					return this.waitFor({
						id: "adicionarItemButton",
						viewName: sViewName,
						actions: new Press(),
						errorMessage: "Could not press Adicionar Item button"
					});
				},

				iPressScanButton: function () {
					return this.waitFor({
						id: "scanButton",
						viewName: sViewName,
						actions: new Press(),
						errorMessage: "Could not press Scan button"
					});
				},

				iPressConcluirUCButton: function () {
					return this.waitFor({
						id: "concluirUCButton",
						viewName: sViewName,
						actions: new Press(),
						errorMessage: "Could not press Concluir UC button"
					});
				},

				iPressFinalizarRecebimentoButton: function () {
					return this.waitFor({
						id: "finalizarRecebimentoButton",
						viewName: sViewName,
						actions: new Press(),
						errorMessage: "Could not press Finalizar Recebimento button"
					});
				},

				iPressInicioButton: function () {
					return this.waitFor({
						id: "inicioButton",
						viewName: sViewName,
						actions: new Press(),
						errorMessage: "Could not press Início button"
					});
				},

				iSelectMes: function (sMes) {
					return this.waitFor({
						id: "mesSelect",
						viewName: sViewName,
						actions: new Press(),
						success: function (oSelect) {
							return this.waitFor({
								controlType: "sap.ui.core.Item",
								matchers: new Properties({
									key: sMes
								}),
								actions: new Press(),
								errorMessage: "Could not select month"
							});
						},
						errorMessage: "Could not open month selector"
					});
				},

				iSelectAno: function (sAno) {
					return this.waitFor({
						id: "anoSelect",
						viewName: sViewName,
						actions: new Press(),
						success: function (oSelect) {
							return this.waitFor({
								controlType: "sap.ui.core.Item",
								matchers: new Properties({
									key: sAno
								}),
								actions: new Press(),
								errorMessage: "Could not select year"
							});
						},
						errorMessage: "Could not open year selector"
					});
				}
			},

			assertions: {
				iShouldSeeTheAssembleUCPage: function () {
					return this.waitFor({
						id: "page",
						viewName: sViewName,
						success: function () {
							Opa5.assert.ok(true, "The Assemble UC page is displayed");
						},
						errorMessage: "Did not find the Assemble UC page"
					});
				},

				iShouldSeeReadOnlyInformation: function () {
					return this.waitFor({
						id: "nfDisplay",
						viewName: sViewName,
						matchers: new Properties({
							editable: false
						}),
						success: function () {
							return this.waitFor({
								id: "identificadorDisplay",
								viewName: sViewName,
								matchers: new Properties({
									editable: false
								}),
								success: function () {
									return this.waitFor({
										id: "ucDisplay",
										viewName: sViewName,
										matchers: new Properties({
											editable: false
										}),
										success: function () {
											Opa5.assert.ok(true, "All read-only information fields are displayed");
										}
									});
								}
							});
						},
						errorMessage: "Read-only information fields are not properly configured"
					});
				},

				iShouldSeeMaterialInputWithScanButton: function () {
					return this.waitFor({
						id: "materialInput",
						viewName: sViewName,
						success: function () {
							return this.waitFor({
								id: "scanButton",
								viewName: sViewName,
								success: function () {
									Opa5.assert.ok(true, "Material input and scan button are visible");
								}
							});
						},
						errorMessage: "Material input or scan button not found"
					});
				},

				iShouldSeeQuantityInput: function () {
					return this.waitFor({
						id: "quantidadeInput",
						viewName: sViewName,
						success: function () {
							Opa5.assert.ok(true, "Quantity input field is visible");
						},
						errorMessage: "Quantity input field not found"
					});
				},

				iShouldSeeValidadeContainer: function (bVisible) {
					return this.waitFor({
						id: "validadeContainer",
						viewName: sViewName,
						matchers: new Properties({
							visible: bVisible
						}),
						success: function () {
							Opa5.assert.ok(true, "Validade container visibility is correct: " + bVisible);
						},
						errorMessage: "Validade container visibility is incorrect"
					});
				},

				iShouldSeeScannedItems: function (iExpectedCount) {
					return this.waitFor({
						id: "scannedItemsList",
						viewName: sViewName,
						matchers: new AggregationLengthEquals({
							name: "items",
							length: iExpectedCount
						}),
						success: function () {
							Opa5.assert.ok(true, "Scanned items list contains " + iExpectedCount + " items");
						},
						errorMessage: "Scanned items list does not contain expected number of items"
					});
				},

				iShouldSeeAllActionButtons: function () {
					var aButtonIds = ["ocorrenciaButton", "inicioButton", "concluirUCButton", "finalizarRecebimentoButton"];
					
					return this.waitFor({
						controlType: "sap.m.Button",
						viewName: sViewName,
						check: function (aButtons) {
							return aButtons.filter(function (oButton) {
								return aButtonIds.indexOf(oButton.getId().split("--")[1]) > -1;
							}).length === aButtonIds.length;
						},
						success: function () {
							Opa5.assert.ok(true, "All action buttons are visible");
						},
						errorMessage: "Not all action buttons are visible"
					});
				}
			}
		}
	});
});