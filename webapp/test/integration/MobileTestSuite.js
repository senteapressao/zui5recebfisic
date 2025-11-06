sap.ui.define([
	"sap/ui/test/Opa5",
	"./arrangements/Startup"
], function (Opa5, Startup) {
	"use strict";

	// Mobile-specific configuration for OPA5 tests
	Opa5.extendConfig({
		arrangements: new Startup(),
		viewNamespace: "zui5recebfisic.view.",
		autoWait: true,
		// Mobile-specific settings
		timeout: 15, // Longer timeout for mobile devices
		pollingInterval: 400, // Slower polling for mobile
		// Simulate mobile device characteristics
		actions: {
			// Add touch-specific action configurations
			press: {
				// Simulate touch press with longer duration
				duration: 200
			}
		}
	});

	// Configure for mobile viewport simulation
	if (window.innerWidth < 768) {
		Opa5.extendConfig({
			timeout: 20, // Even longer timeout for small screens
			pollingInterval: 500
		});
	}
});