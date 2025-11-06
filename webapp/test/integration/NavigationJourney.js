/*global QUnit*/

sap.ui.define([
	"sap/ui/test/opaQunit",
	"./pages/App",
	"./pages/View1",
	"./pages/MainMenu",
	"./pages/PhysicalReceipt",
	"./pages/CreateUC",
	"./pages/AssembleUC",
	"./pages/UCVisualization",
	"./pages/FinalizationCheck"
], function (opaTest) {
	"use strict";

	QUnit.module("Navigation Journey");

	opaTest("Should see the initial page of the app", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Assertions
		Then.onTheAppPage.iShouldSeeTheApp();
      	Then.onTheViewPage.iShouldSeeThePageView();

		//Cleanup
		Then.iTeardownMyApp();
	});

	opaTest("Should navigate through all main screens", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Test Main Menu navigation
		Then.onTheMainMenuPage.iShouldSeeTheMainMenu();
		When.onTheMainMenuPage.iPressRecebimentoButton();

		// Test Physical Receipt screen
		Then.onThePhysicalReceiptPage.iShouldSeeThePhysicalReceiptPage();
		When.onThePhysicalReceiptPage.iPressInicioButton();

		// Should return to Main Menu
		Then.onTheMainMenuPage.iShouldSeeTheMainMenu();

		//Cleanup
		Then.iTeardownMyApp();
	});

	opaTest("Should navigate to UC Visualization", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Navigate to Physical Receipt and then UC Visualization
		When.onTheMainMenuPage.iPressRecebimentoButton();
		When.onThePhysicalReceiptPage.iEnterNF("NAV123");
		When.onThePhysicalReceiptPage.iEnterIdentificador("NAV_CONTAINER");
		When.onThePhysicalReceiptPage.iPressVisualizarUCsButton();

		// Should be on UC Visualization page
		Then.onTheUCVisualizationPage.iShouldSeeTheUCVisualizationPage();
		Then.onTheUCVisualizationPage.iShouldSeeReceiptInformation();

		// Navigate back
		When.onTheUCVisualizationPage.iPressInicioButton();
		Then.onTheMainMenuPage.iShouldSeeTheMainMenu();

		//Cleanup
		Then.iTeardownMyApp();
	});

	opaTest("Should navigate through UC creation workflow", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Navigate through UC creation workflow
		When.onTheMainMenuPage.iPressRecebimentoButton();
		When.onThePhysicalReceiptPage.iEnterNF("CREATE123");
		When.onThePhysicalReceiptPage.iEnterIdentificador("CREATE_CONTAINER");
		When.onThePhysicalReceiptPage.iPressMontarUCButton();

		// Should be on Create UC page
		Then.onTheCreateUCPage.iShouldSeeTheCreateUCPage();
		Then.onTheCreateUCPage.iShouldSeeReadOnlyFields();

		// Navigate back to main menu
		When.onTheCreateUCPage.iPressInicioButton();
		Then.onTheMainMenuPage.iShouldSeeTheMainMenu();

		//Cleanup
		Then.iTeardownMyApp();
	});
});
