sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/actions/Press",
	"sap/ui/test/matchers/Properties",
	"sap/ui/test/matchers/AggregationLengthEquals"
], function (Opa5, Press, Properties, AggregationLengthEquals) {
	"use strict";

	var sViewName = "UCVisualization";

	Opa5.createPageObjects({
		onTheUCVisualizationPage: {
			actions: {
				iPressUCItem: function (sUC) {
					return this.waitFor({
						controlType: "sap.m.StandardListItem",
						viewName: sViewName,
						matchers: function (oItem) {
							return oItem.getTitle().indexOf(sUC) > -1;
						},
						actions: new Press(),
						errorMessage: "Could not press UC item: " + sUC
					});
				},

				iPressDeleteUC: function (sUC) {
					return this.waitFor({
						controlType: "sap.m.Button",
						viewName: sViewName,
						matchers: function (oButton) {
							return oButton.getIcon() === "sap-icon://delete" &&
								   oButton.data("uc") === sUC;
						},
						actions: new Press(),
						errorMessage: "Could not press delete button for UC: " + sUC
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
				}
			},

			assertions: {
				iShouldSeeTheUCVisualizationPage: function () {
					return this.waitFor({
						id: "page",
						viewName: sViewName,
						success: function () {
							Opa5.assert.ok(true, "The UC Visualization page is displayed");
						},
						errorMessage: "Did not find the UC Visualization page"
					});
				},

				iShouldSeeReceiptInformation: function () {
					return this.waitFor({
						id: "nfDisplay",
						viewName: sViewName,
						success: function () {
							return this.waitFor({
								id: "identificadorDisplay",
								viewName: sViewName,
								success: function () {
									Opa5.assert.ok(true, "Receipt information is displayed");
								}
							});
						},
						errorMessage: "Receipt information is not displayed"
					});
				},

				iShouldSeeUCList: function () {
					return this.waitFor({
						id: "ucList",
						viewName: sViewName,
						success: function () {
							Opa5.assert.ok(true, "UC list is displayed");
						},
						errorMessage: "UC list is not displayed"
					});
				},

				iShouldSeeUCCount: function (iExpectedCount) {
					return this.waitFor({
						id: "ucList",
						viewName: sViewName,
						matchers: new AggregationLengthEquals({
							name: "items",
							length: iExpectedCount
						}),
						success: function () {
							Opa5.assert.ok(true, "UC list contains " + iExpectedCount + " items");
						},
						errorMessage: "UC list does not contain expected number of items"
					});
				},

				iShouldSeeUCWithStatus: function (sUC, sStatus) {
					return this.waitFor({
						controlType: "sap.m.StandardListItem",
						viewName: sViewName,
						matchers: function (oItem) {
							return oItem.getTitle().indexOf(sUC) > -1 &&
								   oItem.getDescription().indexOf(sStatus) > -1;
						},
						success: function () {
							Opa5.assert.ok(true, "UC " + sUC + " with status " + sStatus + " is displayed");
						},
						errorMessage: "UC with expected status not found"
					});
				},

				iShouldSeeActionButtons: function () {
					var aButtonIds = ["inicioButton", "montarUCButton", "finalizarRecebimentoButton"];
					
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