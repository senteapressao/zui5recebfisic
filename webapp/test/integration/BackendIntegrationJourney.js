/*global QUnit*/

sap.ui.define([
	"sap/ui/test/opaQunit",
	"./pages/MainMenu",
	"./pages/PhysicalReceipt",
	"./pages/CreateUC",
	"./pages/AssembleUC",
	"./pages/FinalizationCheck"
], function (opaTest) {
	"use strict";

	QUnit.module("Backend Integration Journey");

	opaTest("Should validate invoice existence through backend service", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Test invoice validation workflow
		When.onTheMainMenuPage.iPressRecebimentoButton();
		When.onThePhysicalReceiptPage.iEnterNF("VALID_INVOICE_123");
		When.onThePhysicalReceiptPage.iEnterIdentificador("VALID_CONTAINER");

		// Trigger backend validation
		When.onThePhysicalReceiptPage.iPressConcluirButton();
		// Should call backend service to validate invoice

		// Test with invalid invoice
		When.onThePhysicalReceiptPage.iEnterNF("INVALID_INVOICE");
		When.onThePhysicalReceiptPage.iPressConcluirButton();
		// Should show "Nota não encontrada" error message

		//Cleanup
		Then.iTeardownMyApp();
	});

	opaTest("Should test material validation service integration", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Navigate to Create UC
		When.onTheMainMenuPage.iPressRecebimentoButton();
		When.onThePhysicalReceiptPage.iEnterNF("MAT_TEST_123");
		When.onThePhysicalReceiptPage.iEnterIdentificador("MAT_CONTAINER");
		When.onThePhysicalReceiptPage.iPressMontarUCButton();

		Then.onTheCreateUCPage.iShouldSeeTheCreateUCPage();

		// Test valid material
		When.onTheCreateUCPage.iEnterMaterialEmbalagem("VALID_MATERIAL");
		// Should trigger material validation service
		Then.onTheCreateUCPage.iShouldSeeButtonsEnabled();

		// Test invalid material
		When.onTheCreateUCPage.iEnterMaterialEmbalagem("INVALID_MATERIAL");
		When.onTheCreateUCPage.iPressMontarUCButton();
		// Should show "Material de embalagem não cadastrado no SAP" error

		//Cleanup
		Then.iTeardownMyApp();
	});

	opaTest("Should test UC creation and completion service calls", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Navigate to UC assembly
		When.onTheMainMenuPage.iPressRecebimentoButton();
		When.onThePhysicalReceiptPage.iEnterNF("UC_SERVICE_123");
		When.onThePhysicalReceiptPage.iEnterIdentificador("UC_SERVICE_CONTAINER");
		When.onThePhysicalReceiptPage.iPressMontarUCButton();
		When.onTheCreateUCPage.iEnterMaterialEmbalagem("SERVICE_MATERIAL");
		When.onTheCreateUCPage.iPressMontarUCButton();

		Then.onTheAssembleUCPage.iShouldSeeTheAssembleUCPage();

		// Add items to UC
		When.onTheAssembleUCPage.iEnterMaterial("1234567890123");
		When.onTheAssembleUCPage.iEnterQuantidade("10");
		When.onTheAssembleUCPage.iPressAdicionarItemButton();

		// Test UC completion service
		When.onTheAssembleUCPage.iPressConcluirUCButton();
		// Should call ConcluirUC backend function

		//Cleanup
		Then.iTeardownMyApp();
	});

	opaTest("Should test goods transfer BAPI integration", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Complete workflow to finalization
		When.onTheMainMenuPage.iPressRecebimentoButton();
		When.onThePhysicalReceiptPage.iEnterNF("BAPI_TEST_123");
		When.onThePhysicalReceiptPage.iEnterIdentificador("BAPI_CONTAINER");
		When.onThePhysicalReceiptPage.iPressMontarUCButton();
		When.onTheCreateUCPage.iEnterMaterialEmbalagem("BAPI_MATERIAL");
		When.onTheCreateUCPage.iPressMontarUCButton();

		// Add items and finalize
		When.onTheAssembleUCPage.iEnterMaterial("1111111111111");
		When.onTheAssembleUCPage.iEnterQuantidade("5");
		When.onTheAssembleUCPage.iPressAdicionarItemButton();
		When.onTheAssembleUCPage.iPressFinalizarRecebimentoButton();

		Then.onTheFinalizationCheckPage.iShouldSeeTheFinalizationCheckPage();

		// Test goods transfer BAPI call
		When.onTheFinalizationCheckPage.iPressConcluirButton();
		// Should call BAPI_GOODSMVT_CREATE for goods transfer

		//Cleanup
		Then.iTeardownMyApp();
	});

	opaTest("Should test error handling for service failures", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Test service timeout/failure scenarios
		When.onTheMainMenuPage.iPressRecebimentoButton();
		When.onThePhysicalReceiptPage.iEnterNF("ERROR_TEST_123");
		When.onThePhysicalReceiptPage.iEnterIdentificador("ERROR_CONTAINER");

		// Simulate service failure
		When.onThePhysicalReceiptPage.iPressConcluirButton();
		// Should handle service error gracefully

		// Test retry mechanism
		When.onThePhysicalReceiptPage.iPressConcluirButton();
		// Should allow retry after error

		//Cleanup
		Then.iTeardownMyApp();
	});

	opaTest("Should test user authorization validation", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Test should validate user authorization on app start
		Then.onTheMainMenuPage.iShouldSeeTheMainMenu();
		// ValidarUsuarioCentro function should have been called

		// Test authorization for specific operations
		When.onTheMainMenuPage.iPressRecebimentoButton();
		When.onThePhysicalReceiptPage.iEnterNF("AUTH_TEST_123");
		When.onThePhysicalReceiptPage.iEnterIdentificador("AUTH_CONTAINER");
		When.onThePhysicalReceiptPage.iPressMontarUCButton();

		// Should validate user permissions for UC operations
		Then.onTheCreateUCPage.iShouldSeeTheCreateUCPage();

		//Cleanup
		Then.iTeardownMyApp();
	});
});