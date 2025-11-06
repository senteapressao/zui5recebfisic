sap.ui.define([
	"sap/ui/test/Opa5",
	"./arrangements/Startup",
	"./NavigationJourney",
	"./CompleteReceiptJourney",
	"./ErrorHandlingJourney",
	"./MobileInteractionJourney",
	"./DataPersistenceJourney",
	"./BackendIntegrationJourney"
], function (Opa5, Startup) {
	"use strict";

	Opa5.extendConfig({
		arrangements: new Startup(),
		viewNamespace: "zui5recebfisic.view.",
		autoWait: true
	});
});
