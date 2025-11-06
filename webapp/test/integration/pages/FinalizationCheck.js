sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/actions/Press",
	"sap/ui/test/matchers/Properties",
	"sap/ui/test/matchers/AggregationLengthEquals"
], function (Opa5, Press, Properties, AggregationLengthEquals) {
	"use strict";

	var sViewName = "FinalizationCheck";

	Opa5.createPageObjects({
		onTheFinalizationCheckPage: {
			actions: {
				iPressVoltarButton: function () {
					return this.waitFor({
						id: "voltarButton",
						viewName: sViewName,
						actions: new Press(),
						errorMessage: "Could not press Voltar button"
					});
				},

				iPressConcluirButton: function () {
					return this.waitFor({
						id: "concluirButton",
						viewName: sViewName,
						actions: new Press(),
						errorMessage: "Could not press Concluir button"
					});
				}
			},

			assertions: {
				iShouldSeeTheFinalizationCheckPage: function () {
					return this.waitFor({
						id: "page",
						viewName: sViewName,
						success: function () {
							Opa5.assert.ok(true, "The Finalization Check page is displayed");
						},
						errorMessage: "Did not find the Finalization Check page"
					});
				},

				iShouldSeeReceiptInformation: function () {
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
									Opa5.assert.ok(true, "Receipt information is displayed as read-only");
								}
							});
						},
						errorMessage: "Receipt information is not properly displayed"
					});
				},

				iShouldSeeScannedItemsList: function () {
					return this.waitFor({
						id: "scannedItemsList",
						viewName: sViewName,
						success: function () {
							Opa5.assert.ok(true, "Scanned items list is displayed");
						},
						errorMessage: "Scanned items list is not displayed"
					});
				},

				iShouldSeeScannedItemsCount: function (iExpectedCount) {
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

				iShouldSeeSummaryPanel: function () {
					return this.waitFor({
						id: "summaryPanel",
						viewName: sViewName,
						success: function () {
							Opa5.assert.ok(true, "Summary panel is displayed");
						},
						errorMessage: "Summary panel is not displayed"
					});
				},

				iShouldSeeSummaryValues: function (iTotalItems, iTotalUCs, iTotalQuantity) {
					return this.waitFor({
						id: "totalItemsText",
						viewName: sViewName,
						matchers: new Properties({
							number: iTotalItems.toString()
						}),
						success: function () {
							return this.waitFor({
								id: "totalUCsText",
								viewName: sViewName,
								matchers: new Properties({
									number: iTotalUCs.toString()
								}),
								success: function () {
									return this.waitFor({
										id: "totalQuantityText",
										viewName: sViewName,
										matchers: new Properties({
											number: iTotalQuantity.toString()
										}),
										success: function () {
											Opa5.assert.ok(true, "Summary values are correct");
										}
									});
								}
							});
						},
						errorMessage: "Summary values are not correct"
					});
				},

				iShouldSeeProgressIndicator: function (bVisible) {
					return this.waitFor({
						id: "progressContainer",
						viewName: sViewName,
						matchers: new Properties({
							visible: bVisible
						}),
						success: function () {
							Opa5.assert.ok(true, "Progress indicator visibility is correct: " + bVisible);
						},
						errorMessage: "Progress indicator visibility is incorrect"
					});
				},

				iShouldSeeActionButtons: function () {
					return this.waitFor({
						id: "voltarButton",
						viewName: sViewName,
						success: function () {
							return this.waitFor({
								id: "concluirButton",
								viewName: sViewName,
								success: function () {
									Opa5.assert.ok(true, "Both action buttons are visible");
								}
							});
						},
						errorMessage: "Action buttons are not visible"
					});
				}
			}
		}
	});
});