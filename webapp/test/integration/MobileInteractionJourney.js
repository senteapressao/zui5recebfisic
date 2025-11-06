/*global QUnit*/

sap.ui.define([
	"sap/ui/test/opaQunit",
	"./pages/MainMenu",
	"./pages/PhysicalReceipt",
	"./pages/AssembleUC"
], function (opaTest) {
	"use strict";

	QUnit.module("Mobile Interaction Journey");

	opaTest("Should handle touch interactions and mobile-specific features", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Test main menu touch interactions
		Then.onTheMainMenuPage.iShouldSeeTheMainMenu();
		Then.onTheMainMenuPage.iShouldSeeAllNavigationButtons();

		// Touch navigation to Physical Receipt
		When.onTheMainMenuPage.iPressRecebimentoButton();
		Then.onThePhysicalReceiptPage.iShouldSeeThePhysicalReceiptPage();

		// Test input field interactions on mobile
		When.onThePhysicalReceiptPage.iEnterNF("MOBILE123");
		When.onThePhysicalReceiptPage.iEnterIdentificador("MOBILE_CONTAINER");

		// Navigate to UC assembly for barcode scanning test
		When.onThePhysicalReceiptPage.iPressMontarUCButton();

		// Skip Create UC for this test (assume UC exists)
		// In real scenario, this would be handled by the application flow

		//Cleanup
		Then.iTeardownMyApp();
	});

	opaTest("Should test barcode scanner integration", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Navigate to Assemble UC screen
		When.onTheMainMenuPage.iPressRecebimentoButton();
		When.onThePhysicalReceiptPage.iEnterNF("SCAN123");
		When.onThePhysicalReceiptPage.iEnterIdentificador("SCAN_CONTAINER");
		When.onThePhysicalReceiptPage.iPressMontarUCButton();

		// Assume we're on Assemble UC page (skipping Create UC for test)
		// Test barcode scanner button
		Then.onTheAssembleUCPage.iShouldSeeMaterialInputWithScanButton();

		// Test scan button press
		When.onTheAssembleUCPage.iPressScanButton();
		// Should trigger camera/scanner functionality

		// Test manual barcode entry
		When.onTheAssembleUCPage.iEnterMaterial("1234567890123");
		When.onTheAssembleUCPage.iEnterQuantidade("5");

		// Test touch interaction for adding item
		When.onTheAssembleUCPage.iPressAdicionarItemButton();

		//Cleanup
		Then.iTeardownMyApp();
	});

	opaTest("Should test responsive design elements", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Test main menu responsive layout
		Then.onTheMainMenuPage.iShouldSeeTheMainMenu();
		Then.onTheMainMenuPage.iShouldSeeAllNavigationButtons();

		// Navigate and test form layout responsiveness
		When.onTheMainMenuPage.iPressRecebimentoButton();
		Then.onThePhysicalReceiptPage.iShouldSeeInputFields();
		Then.onThePhysicalReceiptPage.iShouldSeeAllActionButtons();

		// Test button layout and accessibility
		When.onThePhysicalReceiptPage.iEnterNF("RESPONSIVE123");
		When.onThePhysicalReceiptPage.iEnterIdentificador("RESPONSIVE_TEST");

		// Test navigation back to main menu
		When.onThePhysicalReceiptPage.iPressInicioButton();
		Then.onTheMainMenuPage.iShouldSeeTheMainMenu();

		//Cleanup
		Then.iTeardownMyApp();
	});
});