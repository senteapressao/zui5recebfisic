sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/actions/Press",
	"sap/ui/test/actions/EnterText",
	"sap/ui/test/matchers/Properties"
], function (Opa5, Press, EnterText, Properties) {
	"use strict";

	var sViewName = "CreateUC";

	Opa5.createPageObjects({
		onTheCreateUCPage: {
			actions: {
				iEnterMaterialEmbalagem: function (sMaterial) {
					return this.waitFor({
						id: "materialEmbalagemInput",
						viewName: sViewName,
						actions: new EnterText({
							text: sMaterial
						}),
						errorMessage: "Could not enter Material Embalagem"
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
				iShouldSeeTheCreateUCPage: function () {
					return this.waitFor({
						id: "page",
						viewName: sViewName,
						success: function () {
							Opa5.assert.ok(true, "The Create UC page is displayed");
						},
						errorMessage: "Did not find the Create UC page"
					});
				},

				iShouldSeeReadOnlyFields: function () {
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
									Opa5.assert.ok(true, "Read-only fields are properly configured");
								}
							});
						},
						errorMessage: "Read-only fields are not properly configured"
					});
				},

				iShouldSeeMaterialEmbalagemInput: function () {
					return this.waitFor({
						id: "materialEmbalagemInput",
						viewName: sViewName,
						success: function () {
							Opa5.assert.ok(true, "Material Embalagem input field is visible");
						},
						errorMessage: "Material Embalagem input field is not visible"
					});
				},

				iShouldSeeValidationInProgress: function () {
					return this.waitFor({
						controlType: "sap.m.BusyIndicator",
						viewName: sViewName,
						success: function () {
							Opa5.assert.ok(true, "Material validation is in progress");
						},
						errorMessage: "Material validation indicator not found"
					});
				},

				iShouldSeeButtonsEnabled: function () {
					return this.waitFor({
						id: "montarUCButton",
						viewName: sViewName,
						matchers: new Properties({
							enabled: true
						}),
						success: function () {
							return this.waitFor({
								id: "inicioButton",
								viewName: sViewName,
								matchers: new Properties({
									enabled: true
								}),
								success: function () {
									Opa5.assert.ok(true, "Action buttons are enabled");
								}
							});
						},
						errorMessage: "Action buttons are not enabled"
					});
				}
			}
		}
	});
});