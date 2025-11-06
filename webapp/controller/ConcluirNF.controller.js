sap.ui.define([
    "./BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("zui5recebfisic.controller.ConcluirNF", {

        onInit: function () {
            // Initialize the Concluir NF screen
            this._initializeConcluirNFModel();
            this._initializeMobileFeatures();
        },

        /**
         * Initialize local model for Concluir NF screen
         * @private
         */
        _initializeConcluirNFModel: function () {
            var oConcluirNFModel = this.createLocalModel({
                nf: "",
                loading: false,
                error: null
            }, "concluirNF");
        },

        /**
         * Initialize mobile-specific features
         * @private
         */
        _initializeMobileFeatures: function () {
            // Add haptic feedback to buttons if on mobile device
            if (this.isMobileDevice()) {
                this._addHapticFeedbackToButtons();
            }
            
            // Add touch-friendly enhancements
            this._enhanceButtonsForTouch();
        },

        /**
         * Add haptic feedback to buttons
         * @private
         */
        _addHapticFeedbackToButtons: function () {
            var that = this;
            var aButtonIds = ["concluirButton"];
            
            aButtonIds.forEach(function (sButtonId) {
                var oButton = that.byId(sButtonId);
                if (oButton) {
                    oButton.attachPress(function () {
                        that.addHapticFeedback("medium");
                        that.addVisualHapticFeedback(oButton);
                    });
                }
            });
        },

        /**
         * Enhance buttons for touch interaction
         * @private
         */
        _enhanceButtonsForTouch: function () {
            var that = this;
            var aButtonIds = ["concluirButton"];
            
            aButtonIds.forEach(function (sButtonId) {
                var oButton = that.byId(sButtonId);
                if (oButton) {
                    oButton.addStyleClass("mobileActionButton");
                    oButton.setTooltip(oButton.getText() + " - Toque para acessar");
                }
            });
        },

        /**
         * Handle back navigation
         * @public
         */
        onNavBack: function () {
            this.navToMainMenu();
        },

        /**
         * Handle NF input change
         * @public
         * @param {sap.ui.base.Event} oEvent the input change event
         */
        onNFInputChange: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oConcluirNFModel = this.getModel("concluirNF");
            
            if (oConcluirNFModel) {
                oConcluirNFModel.setProperty("/nf", sValue);
            }
        },

        /**
         * Handle Concluir button press - validate NF and fetch identifiers
         * @public
         */
        onConcluirPress: function () {
            try {
                // Add visual feedback for mobile
                if (this.isMobileDevice && this.isMobileDevice()) {
                    var oButton = this.byId("concluirButton");
                    if (oButton && this.addVisualHapticFeedback) {
                        this.addVisualHapticFeedback(oButton);
                    }
                }
                
                this._validateNFAndFetchIdentifiers();
            } catch (oError) {
                this.handleServiceError(oError, {
                    defaultMessage: "Erro ao processar NF",
                    context: "Concluir NF Validation"
                });
            }
        },

        /**
         * Validate NF and fetch identifiers from Header entity
         * @private
         */
        _validateNFAndFetchIdentifiers: function () {
            var oConcluirNFModel = this.getModel("concluirNF");
            var sNf = oConcluirNFModel.getProperty("/nf");
            
            // Validate NF input
            if (!sNf || sNf.trim() === "") {
                this.showErrorMessage("Por favor, informe o número da Nota Fiscal");
                return;
            }
            
            // Set loading state
            oConcluirNFModel.setProperty("/loading", true);
            oConcluirNFModel.setProperty("/error", null);
            
            // Fetch identifiers from Header entity using NF as filter
            this._fetchIdentifiersFromHeader(sNf.trim());
        },

        /**
         * Fetch identifiers from Header entity
         * @private
         * @param {string} sNf the invoice number
         */
        _fetchIdentifiersFromHeader: function (sNf) {
            var that = this;
            var oConcluirNFModel = this.getModel("concluirNF");
            
            // Build filter for HeaderSet to get all records for this NF
            var sPath = "/HeaderSet";
            var oFilters = {
                "$filter": "Nf eq '" + encodeURIComponent(sNf) + "'"
            };
            
            this.readEntity(sPath, {
                urlParameters: oFilters,
                showBusy: true,
                handleError: true
            }).then(function (oData) {
                that._processHeaderData(oData, sNf);
            }).catch(function (oError) {
                that._handleHeaderFetchError(oError, sNf);
            }).finally(function () {
                oConcluirNFModel.setProperty("/loading", false);
            });
        },

        /**
         * Process header data and extract identifiers
         * @private
         * @param {object} oData the response data from Header entity
         * @param {string} sNf the invoice number
         */
        _processHeaderData: function (oData, sNf) {
            var aHeaders = oData && oData.results ? oData.results : [];
            
            if (aHeaders.length === 0) {
                this.showErrorMessage("Nenhum identificador encontrado para a NF " + sNf);
                return;
            }
            
            // Extract unique identifiers
            var aIdentificadores = aHeaders.map(function (oHeader) {
                return oHeader.Identificador;
            }).filter(function (sIdentificador, iIndex, aArray) {
                // Remove duplicates
                return aArray.indexOf(sIdentificador) === iIndex;
            });
            
            // Navigate to FinalizarRecebimentoNF screen with NF and identifiers
            this._navigateToFinalizarRecebimento(sNf, aIdentificadores);
        },

        /**
         * Handle error when fetching header data
         * @private
         * @param {object} oError the error object
         * @param {string} sNf the invoice number
         */
        _handleHeaderFetchError: function (oError, sNf) {
            var sErrorMessage = "Erro ao buscar identificadores para a NF " + sNf;
            
            if (oError && oError.message) {
                sErrorMessage += ": " + oError.message;
            }
            
            this.showErrorMessage(sErrorMessage);
        },

        /**
         * Navigate to FinalizarRecebimentoNF screen with NF and identifiers
         * @private
         * @param {string} sNf the invoice number
         * @param {array} aIdentificadores array of identifiers
         */
        _navigateToFinalizarRecebimento: function (sNf, aIdentificadores) {
            // Store NF and identifiers in global context for the next screen
            var oGlobalContext = {
                nf: sNf,
                identificadores: aIdentificadores,
                source: "ConcluirNF"
            };
            
            this._setGlobalReceiptContext(oGlobalContext);
            
            // Navigate to FinalizarRecebimentoNF screen
            this.navTo("RouteFinalizarRecebimentoNF");
        }
    });
});
