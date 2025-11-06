sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/actions/Press",
	"sap/ui/test/actions/EnterText",
	"sap/ui/test/matchers/Properties"
], function (Opa5, Press, EnterText, Properties) {
	"use strict";

	var sViewName = "PhysicalReceipt";

	Opa5.createPageObjects({
		onThePhysicalReceiptPage: {
			actions: {
				iEnterNF: function (sNF) {
					return this.waitFor({
						id: "nfInput",
						viewName: sViewName,
						actions: new EnterText({
							text: sNF
						}),
						errorMessage: "Could not enter NF"
					});
				},

				iEnterIdentificador: function (sIdentificador) {
					return this.waitFor({
						id: "identificadorInput",
						viewName: sViewName,
						actions: new EnterText({
							text: sIdentificador
						}),
						errorMessage: "Could not enter Identificador"
					});
				},

				iPressConcluirButton: function () {
					return this.waitFor({
						id: "concluirButton",
						viewName: sViewName,
						actions: new Press(),
						errorMessage: "Could not press Concluir button"
					});
				},

				iPressMontarUCButton: function () {
					return this.waitFor({
						id: "montarUCButton",
						viewName: sViewName,
						actions: new Press(),
						errorMessage: "Could not press Montar UC button"
					});
				},

				iPressVisualizarUCsButton: function () {
					return this.waitFor({
						id: "visualizarUCsButton",
						viewName: sViewName,
						actions: new Press(),
						errorMessage: "Could not press Visualizar UCs button"
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

				iPressOcorrenciaButton: function () {
					return this.waitFor({
						id: "ocorrenciaButton",
						viewName: sViewName,
						actions: new Press(),
						errorMessage: "Could not press Ocorrência button"
					});
				}
			},

			assertions: {
				iShouldSeeThePhysicalReceiptPage: function () {
					return this.waitFor({
						id: "page",
						viewName: sViewName,
						success: function () {
							Opa5.assert.ok(true, "The Physical Receipt page is displayed");
						},
						errorMessage: "Did not find the Physical Receipt page"
					});
				},

				iShouldSeeInputFields: function () {
					return this.waitFor({
						id: "nfInput",
						viewName: sViewName,
						success: function () {
							return this.waitFor({
								id: "identificadorInput",
								viewName: sViewName,
								success: function () {
									Opa5.assert.ok(true, "Both input fields are visible");
								}
							});
						},
						errorMessage: "Input fields are not visible"
					});
				},

				iShouldSeeAllActionButtons: function () {
					var aButtonIds = ["ocorrenciaButton", "visualizarUCsButton", "inicioButton", "concluirButton", "montarUCButton"];
					var iButtonCount = 0;

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
				},

				iShouldSeeNFValue: function (sExpectedValue) {
					return this.waitFor({
						id: "nfInput",
						viewName: sViewName,
						matchers: new Properties({
							value: sExpectedValue
						}),
						success: function () {
							Opa5.assert.ok(true, "NF field contains the expected value: " + sExpectedValue);
						},
						errorMessage: "NF field does not contain expected value"
					});
				},

				iShouldSeeIdentificadorValue: function (sExpectedValue) {
					return this.waitFor({
						id: "identificadorInput",
						viewName: sViewName,
						matchers: new Properties({
							value: sExpectedValue
						}),
						success: function () {
							Opa5.assert.ok(true, "Identificador field contains the expected value: " + sExpectedValue);
						},
						errorMessage: "Identificador field does not contain expected value"
					});
				}
			}
		}
	});
});