/*global QUnit*/

sap.ui.define([
	"sap/ui/test/opaQunit",
	"./pages/MainMenu",
	"./pages/PhysicalReceipt",
	"./pages/CreateUC",
	"./pages/AssembleUC",
	"./pages/UCVisualization",
	"./pages/FinalizationCheck"
], function (opaTest) {
	"use strict";

	QUnit.module("Data Persistence Journey");

	opaTest("Should persist data across navigation and maintain state", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Enter initial data
		When.onTheMainMenuPage.iPressRecebimentoButton();
		When.onThePhysicalReceiptPage.iEnterNF("PERSIST123");
		When.onThePhysicalReceiptPage.iEnterIdentificador("PERSIST_CONTAINER");

		// Navigate to UC visualization and back
		When.onThePhysicalReceiptPage.iPressVisualizarUCsButton();
		Then.onTheUCVisualizationPage.iShouldSeeTheUCVisualizationPage();
		Then.onTheUCVisualizationPage.iShouldSeeReceiptInformation();

		// Navigate back to Physical Receipt
		When.onTheUCVisualizationPage.iPressInicioButton();
		When.onTheMainMenuPage.iPressRecebimentoButton();

		// Verify data persistence
		Then.onThePhysicalReceiptPage.iShouldSeeNFValue("PERSIST123");
		Then.onThePhysicalReceiptPage.iShouldSeeIdentificadorValue("PERSIST_CONTAINER");

		//Cleanup
		Then.iTeardownMyApp();
	});

	opaTest("Should handle UC creation and data consistency", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Create UC workflow
		When.onTheMainMenuPage.iPressRecebimentoButton();
		When.onThePhysicalReceiptPage.iEnterNF("UC_DATA123");
		When.onThePhysicalReceiptPage.iEnterIdentificador("UC_CONTAINER");
		When.onThePhysicalReceiptPage.iPressMontarUCButton();

		// Create UC with material
		Then.onTheCreateUCPage.iShouldSeeTheCreateUCPage();
		When.onTheCreateUCPage.iEnterMaterialEmbalagem("PERSIST_MAT");
		When.onTheCreateUCPage.iPressMontarUCButton();

		// Verify UC assembly page shows correct data
		Then.onTheAssembleUCPage.iShouldSeeTheAssembleUCPage();
		Then.onTheAssembleUCPage.iShouldSeeReadOnlyInformation();

		// Add items and verify persistence
		When.onTheAssembleUCPage.iEnterMaterial("1111111111111");
		When.onTheAssembleUCPage.iEnterQuantidade("15");
		When.onTheAssembleUCPage.iPressAdicionarItemButton();

		Then.onTheAssembleUCPage.iShouldSeeScannedItems(1);

		// Navigate to finalization and verify data
		When.onTheAssembleUCPage.iPressFinalizarRecebimentoButton();
		Then.onTheFinalizationCheckPage.iShouldSeeTheFinalizationCheckPage();
		Then.onTheFinalizationCheckPage.iShouldSeeReceiptInformation();
		Then.onTheFinalizationCheckPage.iShouldSeeScannedItemsList();

		//Cleanup
		Then.iTeardownMyApp();
	});

	opaTest("Should handle backend integration and service calls", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Test service integration workflow
		When.onTheMainMenuPage.iPressRecebimentoButton();
		When.onThePhysicalReceiptPage.iEnterNF("SERVICE123");
		When.onThePhysicalReceiptPage.iEnterIdentificador("SERVICE_CONTAINER");

		// Test invoice validation service call
		When.onThePhysicalReceiptPage.iPressConcluirButton();
		// Should trigger backend validation

		// Test UC creation service integration
		When.onThePhysicalReceiptPage.iPressMontarUCButton();
		Then.onTheCreateUCPage.iShouldSeeTheCreateUCPage();

		When.onTheCreateUCPage.iEnterMaterialEmbalagem("SERVICE_MAT");
		// Should trigger material validation service
		When.onTheCreateUCPage.iPressMontarUCButton();
		// Should trigger UC creation service

		//Cleanup
		Then.iTeardownMyApp();
	});

	opaTest("Should test UC status management and updates", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Navigate to UC visualization
		When.onTheMainMenuPage.iPressRecebimentoButton();
		When.onThePhysicalReceiptPage.iEnterNF("STATUS123");
		When.onThePhysicalReceiptPage.iEnterIdentificador("STATUS_CONTAINER");
		When.onThePhysicalReceiptPage.iPressVisualizarUCsButton();

		// Check UC list and status
		Then.onTheUCVisualizationPage.iShouldSeeTheUCVisualizationPage();
		Then.onTheUCVisualizationPage.iShouldSeeUCList();

		// Test UC management operations
		When.onTheUCVisualizationPage.iPressMontarUCButton();
		Then.onTheCreateUCPage.iShouldSeeTheCreateUCPage();

		//Cleanup
		Then.iTeardownMyApp();
	});
});