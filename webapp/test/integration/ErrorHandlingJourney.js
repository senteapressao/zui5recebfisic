/*global QUnit*/

sap.ui.define([
	"sap/ui/test/opaQunit",
	"./pages/MainMenu",
	"./pages/PhysicalReceipt",
	"./pages/CreateUC",
	"./pages/AssembleUC"
], function (opaTest) {
	"use strict";

	QUnit.module("Error Handling Journey");

	opaTest("Should handle validation errors gracefully", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Navigate to Physical Receipt
		When.onTheMainMenuPage.iPressRecebimentoButton();
		Then.onThePhysicalReceiptPage.iShouldSeeThePhysicalReceiptPage();

		// Try to proceed without entering required fields
		When.onThePhysicalReceiptPage.iPressConcluirButton();
		// Should show validation error (handled by controller)

		// Enter only NF, leave Identificador empty
		When.onThePhysicalReceiptPage.iEnterNF("123456");
		When.onThePhysicalReceiptPage.iPressConcluirButton();
		// Should show validation error for missing Identificador

		// Enter both fields with valid data
		When.onThePhysicalReceiptPage.iEnterIdentificador("TEST001");
		Then.onThePhysicalReceiptPage.iShouldSeeNFValue("123456");
		Then.onThePhysicalReceiptPage.iShouldSeeIdentificadorValue("TEST001");

		//Cleanup
		Then.iTeardownMyApp();
	});

	opaTest("Should handle material validation errors in UC creation", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Navigate to Create UC screen
		When.onTheMainMenuPage.iPressRecebimentoButton();
		When.onThePhysicalReceiptPage.iEnterNF("123456");
		When.onThePhysicalReceiptPage.iEnterIdentificador("TEST001");
		When.onThePhysicalReceiptPage.iPressMontarUCButton();

		Then.onTheCreateUCPage.iShouldSeeTheCreateUCPage();

		// Try to create UC without material
		When.onTheCreateUCPage.iPressMontarUCButton();
		// Should show validation error

		// Enter invalid material
		When.onTheCreateUCPage.iEnterMaterialEmbalagem("INVALID_MAT");
		When.onTheCreateUCPage.iPressMontarUCButton();
		// Should show material validation error

		//Cleanup
		Then.iTeardownMyApp();
	});

	opaTest("Should handle barcode validation errors in UC assembly", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Navigate to Assemble UC screen
		When.onTheMainMenuPage.iPressRecebimentoButton();
		When.onThePhysicalReceiptPage.iEnterNF("123456");
		When.onThePhysicalReceiptPage.iEnterIdentificador("TEST001");
		When.onThePhysicalReceiptPage.iPressMontarUCButton();
		When.onTheCreateUCPage.iEnterMaterialEmbalagem("MAT001");
		When.onTheCreateUCPage.iPressMontarUCButton();

		Then.onTheAssembleUCPage.iShouldSeeTheAssembleUCPage();

		// Try to add item without material
		When.onTheAssembleUCPage.iPressAdicionarItemButton();
		// Should show validation error

		// Enter invalid barcode (too short)
		When.onTheAssembleUCPage.iEnterMaterial("12345");
		When.onTheAssembleUCPage.iEnterQuantidade("10");
		When.onTheAssembleUCPage.iPressAdicionarItemButton();
		// Should show barcode validation error

		// Enter invalid barcode (too long)
		When.onTheAssembleUCPage.iEnterMaterial("123456789012345");
		When.onTheAssembleUCPage.iPressAdicionarItemButton();
		// Should show barcode validation error

		// Enter valid barcode but no quantity
		When.onTheAssembleUCPage.iEnterMaterial("1234567890123");
		When.onTheAssembleUCPage.iEnterQuantidade("");
		When.onTheAssembleUCPage.iPressAdicionarItemButton();
		// Should show quantity validation error

		//Cleanup
		Then.iTeardownMyApp();
	});
});