sap.ui.define([
	"sap/ui/test/Opa5"
], function (Opa5) {
	"use strict";

	/**
	 * Test Runner for Physical Receipt System Integration Tests
	 * Provides utilities for running comprehensive test suites
	 */
	return {
		/**
		 * Configure OPA5 for different test environments
		 * @param {string} sEnvironment - Test environment (desktop, tablet, phone)
		 */
		configureForEnvironment: function (sEnvironment) {
			var oConfig = {
				autoWait: true,
				timeout: 15,
				pollingInterval: 400
			};

			switch (sEnvironment) {
				case "phone":
					oConfig.timeout = 20;
					oConfig.pollingInterval = 500;
					break;
				case "tablet":
					oConfig.timeout = 18;
					oConfig.pollingInterval = 450;
					break;
				case "desktop":
				default:
					oConfig.timeout = 15;
					oConfig.pollingInterval = 400;
					break;
			}

			Opa5.extendConfig(oConfig);
		},

		/**
		 * Configure OPA5 for mock vs real backend testing
		 * @param {boolean} bUseMockData - Whether to use mock data
		 */
		configureBackend: function (bUseMockData) {
			if (bUseMockData) {
				// Configure for mock server testing
				Opa5.extendConfig({
					timeout: 10, // Faster for mock data
					pollingInterval: 200
				});
			} else {
				// Configure for real backend testing
				Opa5.extendConfig({
					timeout: 30, // Longer for real service calls
					pollingInterval: 1000
				});
			}
		},

		/**
		 * Get test suite configuration based on requirements
		 * @param {string} sTestType - Type of test suite to run
		 * @returns {object} Test configuration
		 */
		getTestSuiteConfig: function (sTestType) {
			var oConfigs = {
				"smoke": {
					description: "Quick smoke tests for basic functionality",
					journeys: ["NavigationJourney"],
					timeout: 5
				},
				"full": {
					description: "Complete test suite covering all requirements",
					journeys: [
						"NavigationJourney",
						"CompleteReceiptJourney", 
						"ErrorHandlingJourney",
						"MobileInteractionJourney",
						"DataPersistenceJourney",
						"BackendIntegrationJourney"
					],
					timeout: 30
				},
				"mobile": {
					description: "Mobile-specific tests for touch interactions",
					journeys: ["MobileInteractionJourney", "NavigationJourney"],
					timeout: 20
				},
				"backend": {
					description: "Backend integration and service tests",
					journeys: ["BackendIntegrationJourney", "DataPersistenceJourney"],
					timeout: 25
				}
			};

			return oConfigs[sTestType] || oConfigs["full"];
		},

		/**
		 * Log test execution details
		 * @param {string} sMessage - Log message
		 * @param {string} sLevel - Log level (info, warn, error)
		 */
		log: function (sMessage, sLevel) {
			sLevel = sLevel || "info";
			var sTimestamp = new Date().toISOString();
			console[sLevel]("[" + sTimestamp + "] OPA5 Test Runner: " + sMessage);
		}
	};
});