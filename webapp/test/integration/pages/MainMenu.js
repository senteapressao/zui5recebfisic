sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/actions/Press",
	"sap/ui/test/matchers/Properties"
], function (Opa5, Press, Properties) {
	"use strict";

	var sViewName = "MainMenu";

	Opa5.createPageObjects({
		onTheMainMenuPage: {
			actions: {
				iPressRecebimentoButton: function () {
					return this.waitFor({
						id: "recebimentoButton",
						viewName: sViewName,
						actions: new Press(),
						errorMessage: "Did not find the Recebimento button"
					});
				},

				iPressArmazenarUCButton: function () {
					return this.waitFor({
						id: "armazenarUCButton",
						viewName: sViewName,
						actions: new Press(),
						errorMessage: "Did not find the Armazenar UC button"
					});
				},

				iPressVoltarButton: function () {
					return this.waitFor({
						id: "voltarButton",
						viewName: sViewName,
						actions: new Press(),
						errorMessage: "Did not find the Voltar button"
					});
				}
			},

			assertions: {
				iShouldSeeTheMainMenu: function () {
					return this.waitFor({
						id: "page",
						viewName: sViewName,
						success: function () {
							Opa5.assert.ok(true, "The Main Menu page is displayed");
						},
						errorMessage: "Did not find the Main Menu page"
					});
				},

				iShouldSeeTheTitle: function () {
					return this.waitFor({
						controlType: "sap.m.Title",
						viewName: sViewName,
						matchers: new Properties({
							text: "Sistema de Recebimento Físico"
						}),
						success: function () {
							Opa5.assert.ok(true, "The main title is displayed correctly");
						},
						errorMessage: "Did not find the main title"
					});
				},

				iShouldSeeAllNavigationButtons: function () {
					return this.waitFor({
						id: "recebimentoButton",
						viewName: sViewName,
						success: function () {
							return this.waitFor({
								id: "armazenarUCButton",
								viewName: sViewName,
								success: function () {
									return this.waitFor({
										id: "voltarButton",
										viewName: sViewName,
										success: function () {
											Opa5.assert.ok(true, "All navigation buttons are visible");
										}
									});
								}
							});
						},
						errorMessage: "Not all navigation buttons are visible"
					});
				}
			}
		}
	});
});