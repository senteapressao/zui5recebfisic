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

	QUnit.module("Complete Receipt Journey");

	opaTest("Should complete a full receipt workflow from start to finish", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Navigate from Main Menu to Physical Receipt
		Then.onTheMainMenuPage.iShouldSeeTheMainMenu();
		Then.onTheMainMenuPage.iShouldSeeTheTitle();
		Then.onTheMainMenuPage.iShouldSeeAllNavigationButtons();

		When.onTheMainMenuPage.iPressRecebimentoButton();

		// Enter receipt data
		Then.onThePhysicalReceiptPage.iShouldSeeThePhysicalReceiptPage();
		Then.onThePhysicalReceiptPage.iShouldSeeInputFields();
		Then.onThePhysicalReceiptPage.iShouldSeeAllActionButtons();

		When.onThePhysicalReceiptPage.iEnterNF("123456789");
		When.onThePhysicalReceiptPage.iEnterIdentificador("CONTAINER001");

		Then.onThePhysicalReceiptPage.iShouldSeeNFValue("123456789");
		Then.onThePhysicalReceiptPage.iShouldSeeIdentificadorValue("CONTAINER001");

		// Navigate to UC creation
		When.onThePhysicalReceiptPage.iPressMontarUCButton();

		// Create UC with packaging material
		Then.onTheCreateUCPage.iShouldSeeTheCreateUCPage();
		Then.onTheCreateUCPage.iShouldSeeReadOnlyFields();
		Then.onTheCreateUCPage.iShouldSeeMaterialEmbalagemInput();

		When.onTheCreateUCPage.iEnterMaterialEmbalagem("MAT001");
		When.onTheCreateUCPage.iPressMontarUCButton();

		// Assemble UC with materials
		Then.onTheAssembleUCPage.iShouldSeeTheAssembleUCPage();
		Then.onTheAssembleUCPage.iShouldSeeReadOnlyInformation();
		Then.onTheAssembleUCPage.iShouldSeeMaterialInputWithScanButton();
		Then.onTheAssembleUCPage.iShouldSeeQuantityInput();
		Then.onTheAssembleUCPage.iShouldSeeAllActionButtons();

		// Add first item
		When.onTheAssembleUCPage.iEnterMaterial("1234567890123");
		When.onTheAssembleUCPage.iEnterQuantidade("10");
		When.onTheAssembleUCPage.iPressAdicionarItemButton();

		Then.onTheAssembleUCPage.iShouldSeeScannedItems(1);

		// Add second item
		When.onTheAssembleUCPage.iEnterMaterial("9876543210987");
		When.onTheAssembleUCPage.iEnterQuantidade("5");
		When.onTheAssembleUCPage.iPressAdicionarItemButton();

		Then.onTheAssembleUCPage.iShouldSeeScannedItems(2);

		// Finalize receipt
		When.onTheAssembleUCPage.iPressFinalizarRecebimentoButton();

		// Check finalization screen
		Then.onTheFinalizationCheckPage.iShouldSeeTheFinalizationCheckPage();
		Then.onTheFinalizationCheckPage.iShouldSeeReceiptInformation();
		Then.onTheFinalizationCheckPage.iShouldSeeScannedItemsList();
		Then.onTheFinalizationCheckPage.iShouldSeeSummaryPanel();
		Then.onTheFinalizationCheckPage.iShouldSeeActionButtons();

		// Complete the receipt
		When.onTheFinalizationCheckPage.iPressConcluirButton();

		// Should return to main menu after completion
		Then.onTheMainMenuPage.iShouldSeeTheMainMenu();

		//Cleanup
		Then.iTeardownMyApp();
	});

	opaTest("Should handle UC visualization and management workflow", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Navigate to Physical Receipt
		When.onTheMainMenuPage.iPressRecebimentoButton();

		// Enter receipt data
		When.onThePhysicalReceiptPage.iEnterNF("987654321");
		When.onThePhysicalReceiptPage.iEnterIdentificador("TRUCK002");

		// Navigate to UC visualization
		When.onThePhysicalReceiptPage.iPressVisualizarUCsButton();

		// Check UC visualization page
		Then.onTheUCVisualizationPage.iShouldSeeTheUCVisualizationPage();
		Then.onTheUCVisualizationPage.iShouldSeeReceiptInformation();
		Then.onTheUCVisualizationPage.iShouldSeeUCList();
		Then.onTheUCVisualizationPage.iShouldSeeActionButtons();

		// Navigate to create new UC
		When.onTheUCVisualizationPage.iPressMontarUCButton();

		// Should be on Create UC page
		Then.onTheCreateUCPage.iShouldSeeTheCreateUCPage();

		// Go back to main menu
		When.onTheCreateUCPage.iPressInicioButton();
		Then.onTheMainMenuPage.iShouldSeeTheMainMenu();

		//Cleanup
		Then.iTeardownMyApp();
	});

	opaTest("Should handle navigation back and forth between screens", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Test navigation from main menu
		When.onTheMainMenuPage.iPressRecebimentoButton();
		Then.onThePhysicalReceiptPage.iShouldSeeThePhysicalReceiptPage();

		// Navigate back to main menu
		When.onThePhysicalReceiptPage.iPressInicioButton();
		Then.onTheMainMenuPage.iShouldSeeTheMainMenu();

		// Test Armazenar UC navigation
		When.onTheMainMenuPage.iPressArmazenarUCButton();
		// Note: This would navigate to UC storage screen (not implemented in this test)

		//Cleanup
		Then.iTeardownMyApp();
	});
});