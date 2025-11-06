sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/ActionSheet",
    "sap/m/Button",
    "sap/ui/core/Item",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/VBox",
    "sap/m/Text"
], function (BaseController, JSONModel, ActionSheet, Button, Item, MessageBox, Dialog, VBox, Text) {
    "use strict";

    return BaseController.extend("zui5recebfisic.controller.AssembleUC", {

        onInit: function () {
            // Initialize the assemble UC screen
            this._populateYearSelect();
            this._initializeScannedItemsModel();
            this._initializeMobileFeatures();

            // Initialize Material SKU tracking for validation
            this._firstMaterialSKU = null;

            // Initialize expiration date tracking - stores the first expiration date set for this UC
            this._firstExpirationDate = null;

            // Initialize RecebEmb tracking - determines validation method
            this._recebEmb = "";

            // Attach route matched handler
            this.getRouter().getRoute("RouteAssembleUC").attachPatternMatched(this._onRouteMatched, this);
        },
        
        onAfterRendering: function () {
            // Set focus to material input after view is rendered
            this._setFocusToMaterialInput();
        },

        /**
         * Handle route matched event to populate fields with context data
         * @param {sap.ui.base.Event} oEvent - The route matched event
         * @private
         */
        _onRouteMatched: function (oEvent) {

            // Small delay to ensure models are loaded and global context is updated
            setTimeout(function () {
                this._loadReceiptContext();
                // Always update scanned items list when navigating to AssembleUC page
                this._updateScannedItemsOnPageLoad();
            }.bind(this), 500);
        },

        /**
         * Load receipt context data and populate the display fields
         * @private
         */
        _loadReceiptContext: function () {
            var that = this;
            var oReceiptData = null;
            var oComponent = this.getOwnerComponent();

            // Try multiple sources for receipt context data

            // 1. FIRST: Try to get data from component-level receiptContext model (where PhysicalReceipt saves UC)
            var oComponentReceiptModel = oComponent.getModel("receiptContext");
            if (oComponentReceiptModel) {
                oReceiptData = oComponentReceiptModel.getData();
            }

            // 2. If no data or missing fields, try global context
            if (!oReceiptData || !oReceiptData.nf || !oReceiptData.uc) {
                var oGlobalModel = oComponent.getModel("globalContext");
                if (oGlobalModel) {
                    var oGlobalData = oGlobalModel.getData();

                    // Merge global context with receiptContext if needed
                    if (oReceiptData) {
                        // Merge: global context has priority for recebEmb and other critical fields
                        oReceiptData = Object.assign({}, oReceiptData, oGlobalData);
                    } else {
                        oReceiptData = oGlobalData;
                    }
                }
            }

            if (oReceiptData && oReceiptData.nf) {
                // Load RecebEmb from context
                this._recebEmb = oReceiptData.recebEmb || "";
                
                this._populateDisplayFields(oReceiptData);

                // Create local receiptContext model for this view
                this.createLocalModel(oReceiptData, "receiptContext");
            } else {
                // If no context data is available, show error and navigate back
                //console.error("No receipt context data found");
                this.showErrorMessage("Dados do recebimento não encontrados. Retornando ao menu principal.");
                setTimeout(function () {
                    that.navToMainMenu();
                }, 2000);
            }
        },

        /**
         * Set focus to material input field
         * @private
         */
        _setFocusToMaterialInput: function () {
            var that = this;
            // Use multiple attempts with increasing delays to override default focus behavior
            var delays = [100, 300, 500];
            
            delays.forEach(function (delay) {
                setTimeout(function () {
                    var oMaterialInput = that.byId("assembleUCMaterialInput");
                    if (oMaterialInput && oMaterialInput.getDomRef()) {
                        oMaterialInput.focus();
                    }
                }, delay);
            });
        },

        /**
         * Set focus to quantity input field (for SKU mode)
         * @private
         */
        _focusQuantityField: function () {
            var that = this;
            // Use multiple attempts with increasing delays to ensure field is visible and focused
            var delays = [100, 300, 500];
            
            delays.forEach(function (delay) {
                setTimeout(function () {
                    var oQuantityInput = that.byId("assembleUCQuantidadeInput");
                    if (oQuantityInput && oQuantityInput.getDomRef()) {
                        oQuantityInput.focus();
                    }
                }, delay);
            });
        },

        /**
         * Populate display fields with receipt context data
         * @param {object} oReceiptData - The receipt context data
         * @private
         */
        _populateDisplayFields: function (oReceiptData) {
            if (!oReceiptData) {
                return;
            }

            // Populate read-only display fields
            if (oReceiptData.nf) {
                this.byId("assembleUCNfDisplay").setValue(oReceiptData.nf);
            }

            if (oReceiptData.identificador) {
                this.byId("assembleUCIdentificadorDisplay").setValue(oReceiptData.identificador);
            }

            if (oReceiptData.uc) {
                this.byId("assembleUCUcDisplay").setValue(oReceiptData.uc);
            }

            // Store receipt context for later use
            this._receiptContext = {
                nf: oReceiptData.nf || "",
                identificador: oReceiptData.identificador || "",
                uc: oReceiptData.uc || "",
                operacao: oReceiptData.operacao || "",
                statusReceb: oReceiptData.statusReceb || "",
                statusContainer: oReceiptData.statusContainer || "",
                recebEmb: oReceiptData.recebEmb || ""
            };

            // Note: Loading existing items is now handled by _updateScannedItemsOnPageLoad
        },

        /**
         * Update scanned items list when page is loaded
         * This method ensures the list is always refreshed when navigating to AssembleUC
         * @private
         */
        _updateScannedItemsOnPageLoad: function () {
            var that = this;
            
            // Wait a bit more to ensure receipt context is fully loaded
            setTimeout(function () {
                // Check if we have the necessary context data
                var oReceiptContext = that._getReceiptContext();
                
                if (oReceiptContext && oReceiptContext.nf && oReceiptContext.identificador && oReceiptContext.uc) {
                    // Clear current scanned items first
                    var oModel = that.getView().getModel();
                    oModel.setProperty("/scannedItems", []);
                    that._updateScannedItemsCount();
                    
                    // Load existing items for this UC
                    that._loadExistingItems();
                } else {
                    // If no context data, clear the list
                    var oModel = that.getView().getModel();
                    oModel.setProperty("/scannedItems", []);
                    that._updateScannedItemsCount();
                }
            }, 200);
        },

        /**
         * Load existing items for the current UC
         * @private
         */
        _loadExistingItems: function () {
            var that = this;

            // Get current receipt context (try multiple sources)
            var oReceiptContext = this._getReceiptContext();
            
            if (!oReceiptContext || !oReceiptContext.uc) {
                return;
            }

            // Get items for this UC from backend
            this.getItemsForUC(
                oReceiptContext.nf,
                oReceiptContext.identificador,
                oReceiptContext.uc
            ).then(function (oItemsResult) {
                if (oItemsResult && oItemsResult.items && oItemsResult.items.length > 0) {
                    // Convert backend items to display format
                    var aDisplayItems = oItemsResult.items.map(function (oItem, index) {
                        return {
                            itemIndex: index,
                            material: oItem.Material,
                            quantidade: oItem.Quantidade,
                            dataValidade: oItem.DataValidade || null,
                            materialDescription: "Material: " + oItem.Material,
                            barcode: oItem.Material13 || oItem.Material14,
                            // Backend fields
                            Nf: oItem.Nf,
                            Uc: oItem.Uc,
                            ItemUc: oItem.ItemUc,
                            Identificador: oItem.Identificador,
                            Material13: oItem.Material13,
                            Material14: oItem.Material14,
                            Material: oItem.Material,
                            Quantidade: oItem.Quantidade,
                            DataValidade: oItem.DataValidade,
                            StatusUc: oItem.StatusUc
                        };
                    });

                    // Update the scanned items model
                    var oModel = that.getView().getModel();
                    oModel.setProperty("/scannedItems", aDisplayItems);
                    that._updateScannedItemsCount();

                    // Set the first Material SKU based on the first existing item
                    if (aDisplayItems.length > 0) {
                        that._firstMaterialSKU = aDisplayItems[0].Material || aDisplayItems[0].material;
                    }

                    // Debug: Log the updated model

                    that.showInfoMessage("Carregados " + aDisplayItems.length + " itens existentes da UC");
                }
            }).catch(function (oError) {
                //console.error("Error loading existing items:", oError);
                // Don't show error to user as this is not critical
            });
        },

        /**
         * Initialize the scanned items model
         * @private
         */
        _initializeScannedItemsModel: function () {
            var oScannedItemsModel = new JSONModel({
                scannedItems: [],
                scannedItemsCount: 0
            });
            this.getView().setModel(oScannedItemsModel);

            // Debug: Log model initialization
        },

        /**
         * Update the scanned items count
         * @private
         */
        _updateScannedItemsCount: function () {
            var oModel = this.getView().getModel();
            var aScannedItems = oModel.getProperty("/scannedItems") || [];
            oModel.setProperty("/scannedItemsCount", aScannedItems.length);
        },

        /**
         * Initialize mobile-specific features
         * @private
         */
        _initializeMobileFeatures: function () {

        },

        /**
         * Add haptic feedback to action buttons
         * @private
         */
        _addHapticFeedbackToButtons: function () {
            var that = this;
            var aButtonIds = [
                "adicionarItemButton",
                "concluirUCButton",
                "finalizarRecebimentoButton",
                "scanButton"
            ];

            aButtonIds.forEach(function (sButtonId) {
                var oButton = that.byId(sButtonId);
                if (oButton) {
                    oButton.attachPress(function () {
                        that.addHapticFeedback("medium");
                    });
                }
            });
        },

        /**
         * Populate year select with current and future years
         * @private
         */
        _populateYearSelect: function () {
            var oYearSelect = this.byId("assembleUCAnoSelect");
            var iCurrentYear = new Date().getFullYear();

            for (var i = iCurrentYear; i <= iCurrentYear + 10; i++) {
                oYearSelect.addItem(new Item({
                    key: i.toString(),
                    text: i.toString()
                }));
            }
        },

        /**
         * Handle material input submit (Enter key press)
         * @param {sap.ui.base.Event} oEvent - The submit event
         * @public
         */
        onMaterialInputSubmit: function (oEvent) {
            var that = this;
            var oInput = oEvent.getSource();
            var sValue = oInput.getValue();

            // If no value, show error
            if (!sValue || sValue.length === 0) {
                this.showErrorMessage("Digite ou escaneie um código de barras");
                return;
            }

            // Clear previous validation state
            oInput.setValueState("None");
            oInput.setValueStateText("");

            // Perform complete barcode validation with backend
            this._validateBarcodeWithABAPForSubmit(sValue, oInput)
                .then(function (oMaterialData) {
                    // Check if material requires expiration date and show container if needed
                    that._checkMaterialExpirationRequirement(oMaterialData);

                    // Handle different modes after successful validation
                    if (that._recebEmb === "X") {
                        // For SKU mode, focus on quantity field for manual input
                        that._focusQuantityField();
                    } else {
                        // For barcode mode, check if we can proceed with add item
                        if (that._canProceedWithAddItem(oMaterialData)) {
                            // All validations passed, proceed with adding item
                            that.onAdicionarItemPress();
                        } else {
                            // User needs to fill expiration date first
                            that.showInfoMessage("Por favor, preencha a data de validade antes de adicionar o item");
                        }
                    }
                })
                .catch(function () {
                    // Validation failed - error message already shown by validation function
                });
        },

        /**
         * Handle quantity input submit (Enter key press)
         * @param {sap.ui.base.Event} oEvent - The submit event
         * @public
         */
        onQuantidadeInputSubmit: function (oEvent) {
            var sQuantidade = oEvent.getSource().getValue();
            
            // If quantity is provided, proceed to add item
            if (sQuantidade && sQuantidade.trim().length > 0) {
                this.onAdicionarItemPress();
            } else {
                this.showErrorMessage("Digite a quantidade");
            }
        },

        /**
         * Handle material input change for barcode validation
         * @param {sap.ui.base.Event} oEvent - The input change event
         * @public
         */
        onMaterialInputChange: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oInput = oEvent.getSource();

            // Clear previous validation state
            oInput.setValueState("None");
            oInput.setValueStateText("");

            if (sValue.length === 0) {
                this.byId("assembleUCValidadeContainer").setVisible(false);
                return;
            }

            // Validate barcode using existing ABAP logic
            this._validateBarcodeWithABAP(sValue, oInput);
        },

        /**
         * Validate barcode using existing ABAP logic for 13/14 character codes with enhanced error handling
         * @param {string} sBarcode - The barcode or SKU to validate
         * @param {sap.m.Input} oInput - The input control
         * @private
         */
        _validateBarcodeWithABAP: function (sBarcode, oInput) {
            var that = this;

            // Clear previous validation state
            this.clearInputValidation("materialInput");

            // Check if RecebEmb='X' to skip barcode format validation
            var oValidation;
            if (this._recebEmb === "X") {
                // For SKU mode, just validate that input is not empty
                oValidation = {
                    isValid: sBarcode && sBarcode.trim().length > 0,
                    cleanBarcode: sBarcode.trim(),
                    message: sBarcode && sBarcode.trim().length > 0 ? "" : "Material SKU é obrigatório"
                };
                
                if (!oValidation.isValid) {
                    this.setInputError("assembleUCMaterialInput", oValidation.message);
                    this.byId("assembleUCValidadeContainer").setVisible(false);
                    
                    if (this.isMobileDevice && this.isMobileDevice()) {
                        this._addBarcodeInputShake();
                    }
                    return;
                }
            } else {
                // For barcode mode, perform standard barcode validation
                oValidation = this.validateBarcode(sBarcode);
                if (!oValidation.isValid) {
                    this.setInputError("assembleUCMaterialInput", oValidation.message);
                    this.byId("assembleUCValidadeContainer").setVisible(false);

                    // Add visual feedback for mobile
                    if (this.isMobileDevice && this.isMobileDevice()) {
                        this._addBarcodeInputShake();
                    }
                    return;
                }
            }

            // Show loading state during validation
            oInput.setValueState("Information");
            oInput.setValueStateText(this._recebEmb === "X" ? "Validando Material SKU..." : "Validando código de barras...");

            // Call backend for ABAP barcode/SKU validation and material lookup
            this._performMaterialLookup(oValidation.cleanBarcode)
                .then(function (oMaterialData) {
                    // Material is valid, update UI with material information
                    that.setInputSuccess("materialInput", "Material válido: " + oMaterialData.materialDescription);

                    // Store material data for later use
                    that._currentMaterialData = oMaterialData;

                    // Check if material requires expiration date and handle quantity visibility
                    that._checkMaterialExpirationRequirement(oMaterialData);

                    // Handle quantity field based on RecebEmb
                    if (that._recebEmb === "X") {
                        // For SKU mode, show quantity input and DON'T auto-fill
                        that.byId("assembleUCQuantidadeContainer").setVisible(true);
                        // Clear any previously auto-filled value
                        that.byId("assembleUCQuantidadeInput").setValue("");
                    } else {
                        // For barcode mode, show quantity input and auto-fill from backend
                        that.byId("assembleUCQuantidadeContainer").setVisible(true);
                        if (oMaterialData.quantity && oMaterialData.quantity !== "" && !isNaN(oMaterialData.quantity)) {
                            that.byId("assembleUCQuantidadeInput").setValue(oMaterialData.quantity);
                        }
                    }

                    // Auto-fill Material SKU field with MaterialSKU value from backend
                    if (oMaterialData.materialSKU && oMaterialData.materialSKU !== "") {
                        that.byId("assembleUCMaterialSKUContainer").setVisible(true);
                        that.byId("assembleUCMaterialSKUInput").setValue(oMaterialData.materialSKU);
                    }

                    // Add success haptic feedback
                    if (that.addHapticFeedback) {
                        that.addHapticFeedback("success");
                    }
                })
                .catch(function (oError) {
                    that._handleBarcodeValidationError(oError, sBarcode);
                });
        },

        /**
         * Validate barcode for submit action - returns a Promise
         * @param {string} sBarcode - The barcode or SKU to validate
         * @param {sap.m.Input} oInput - The input control
         * @returns {Promise} Promise that resolves when validation is complete
         * @private
         */
        _validateBarcodeWithABAPForSubmit: function (sBarcode, oInput) {
            var that = this;

            // Clear previous validation state
            this.clearInputValidation("materialInput");

            // Check if RecebEmb='X' to skip barcode format validation
            var oValidation;
            if (this._recebEmb === "X") {
                // For SKU mode, just validate that input is not empty
                oValidation = {
                    isValid: sBarcode && sBarcode.trim().length > 0,
                    cleanBarcode: sBarcode.trim(),
                    message: sBarcode && sBarcode.trim().length > 0 ? "" : "Material SKU é obrigatório"
                };
                
                if (!oValidation.isValid) {
                    this.setInputError("assembleUCMaterialInput", oValidation.message);
                    this.byId("assembleUCValidadeContainer").setVisible(false);
                    
                    if (this.isMobileDevice && this.isMobileDevice()) {
                        this._addBarcodeInputShake();
                    }
                    return Promise.reject(new Error(oValidation.message));
                }
            } else {
                // For barcode mode, perform standard barcode validation
                oValidation = this.validateBarcode(sBarcode);
                if (!oValidation.isValid) {
                    this.setInputError("assembleUCMaterialInput", oValidation.message);
                    this.byId("assembleUCValidadeContainer").setVisible(false);

                    // Add visual feedback for mobile
                    if (this.isMobileDevice && this.isMobileDevice()) {
                        this._addBarcodeInputShake();
                    }
                    return Promise.reject(new Error(oValidation.message));
                }
            }

            // Show loading state during validation
            oInput.setValueState("Information");
            oInput.setValueStateText(this._recebEmb === "X" ? "Validando Material SKU..." : "Validando código de barras...");

            // Call backend for ABAP barcode/SKU validation and material lookup
            return this._performMaterialLookup(oValidation.cleanBarcode)
                .then(function (oMaterialData) {
                    // Material is valid, update UI with material information
                    that.setInputSuccess("materialInput", "Material válido: " + oMaterialData.materialDescription);

                    // Store material data for later use
                    that._currentMaterialData = oMaterialData;

                    // Handle quantity field based on RecebEmb
                    if (that._recebEmb === "X") {
                        // For SKU mode, show quantity input and DON'T auto-fill
                        that.byId("assembleUCQuantidadeContainer").setVisible(true);
                        // Clear any previously auto-filled value
                        that.byId("assembleUCQuantidadeInput").setValue("");
                    } else {
                        // For barcode mode, show quantity input and auto-fill from backend
                        that.byId("assembleUCQuantidadeContainer").setVisible(true);
                        if (oMaterialData.quantity && oMaterialData.quantity !== "" && !isNaN(oMaterialData.quantity)) {
                            that.byId("assembleUCQuantidadeInput").setValue(oMaterialData.quantity);
                        }
                    }

                    // Auto-fill Material SKU field with MaterialSKU value from backend
                    if (oMaterialData.materialSKU && oMaterialData.materialSKU !== "") {
                        that.byId("assembleUCMaterialSKUContainer").setVisible(true);
                        that.byId("assembleUCMaterialSKUInput").setValue(oMaterialData.materialSKU);
                    }

                    // Add success haptic feedback
                    if (that.addHapticFeedback) {
                        that.addHapticFeedback("success");
                    }

                    // Return the material data for success
                    return oMaterialData;
                })
                .catch(function (oError) {
                    that._handleBarcodeValidationError(oError, sBarcode);
                    // Re-throw the error so the calling function knows validation failed
                    throw oError;
                });
        },

        /**
         * Check if we can proceed with adding item after material validation
         * @param {object} oMaterialData - The validated material data
         * @returns {boolean} True if can proceed, false otherwise
         * @private
         */
        _canProceedWithAddItem: function (oMaterialData) {
            // If material doesn't require expiration date, we can proceed
            if (!oMaterialData || !oMaterialData.requiresExpiration) {
                return true;
            }

            // If material requires expiration date, check if fields are filled
            var sMes = this.byId("assembleUCMesSelect").getSelectedKey();
            var sAno = this.byId("assembleUCAnoSelect").getSelectedKey();

            // If expiration date fields are not filled, don't proceed
            if (!sMes || !sAno) {
                return false;
            }

            // If expiration date fields are filled, validate them
            var oExpirationValidation = this._validateExpirationDate(sMes, sAno);
            return oExpirationValidation.isValid;
        },

        /**
         * Handle barcode validation errors with specific feedback
         * @private
         * @param {object} oError the error object
         * @param {string} sBarcode the barcode that failed validation
         */
        _handleBarcodeValidationError: function (oError, sBarcode) {
            var sErrorMessage = "Material não encontrado ou código inválido";

            // Analyze error for specific feedback
            if (oError && oError.message) {
                if (oError.message.indexOf("não encontrado") !== -1 ||
                    oError.message.indexOf("not found") !== -1) {
                    sErrorMessage = "Material não encontrado no sistema SAP";
                } else if (oError.message.indexOf("inválido") !== -1 ||
                    oError.message.indexOf("invalid") !== -1) {
                    sErrorMessage = "Código de barras inválido: " + sBarcode;
                } else if (oError.message.indexOf("timeout") !== -1 ||
                    oError.message.indexOf("network") !== -1) {
                    sErrorMessage = "Erro de conexão. Verifique sua rede e tente novamente.";
                } else {
                    sErrorMessage = oError.message;
                }
            }

            // Set error state and hide expiration container
            this.setInputError("assembleUCMaterialInput", sErrorMessage);
            this.byId("assembleUCValidadeContainer").setVisible(false);
            this._currentMaterialData = null;

            // Add visual and haptic feedback for mobile
            if (this.isMobileDevice && this.isMobileDevice()) {
                this._addBarcodeInputShake();
                if (this.addHapticFeedback) {
                    this.addHapticFeedback("error");
                }
            }

            // Show detailed error message
            this.showErrorMessage(sErrorMessage);
        },

        /**
         * Add shake animation to barcode input for mobile feedback
         * @private
         */
        _addBarcodeInputShake: function () {
            var oInput = this.byId("assembleUCMaterialInput");
            if (oInput) {
                oInput.addStyleClass("inputError");
                setTimeout(function () {
                    oInput.removeStyleClass("inputError");
                }, 300);
            }
        },

        /**
         * Perform material master data lookup and SKU conversion
         * @param {string} sBarcode - The validated barcode or SKU code
         * @returns {Promise} Promise that resolves with material data
         * @private
         */
        _performMaterialLookup: function (sBarcode) {
            var that = this;

            // Check RecebEmb to determine which validation method to use
            if (this._recebEmb === "X") {
                // Use SKU validation via ValidarMatnr
                return this._performSKULookup(sBarcode);
            } else {
                // Use barcode validation via ValidarCodigoBarras (default behavior)
                return this._performRealMaterialLookup(sBarcode);
            }

        },

        /**
         * Perform real material lookup using backend ABAP function imports
         * @param {string} sBarcode - The validated barcode
         * @returns {Promise} Promise that resolves with material data
         * @private
         */
        _performRealMaterialLookup: function (sBarcode) {
            var that = this;

            // Call backend function import for barcode validation and material lookup
            // This would integrate with existing ABAP barcode validation logic
            return this.callFunctionImport("ValidarCodigoBarras", {
                CodigoBarras: sBarcode
            }, {
                showBusy: true,
                handleError: false
            }).then(function (oResult) {
                // Process backend response and convert to standard format
                return that._processMaterialLookupResult(oResult, sBarcode);
            }).catch(function (oError) {
                // Handle specific backend errors
                throw new Error("Erro na validação do código de barras: " + (oError.message || "Erro desconhecido"));
            });
        },

        /**
         * Perform SKU lookup using ValidarMatnr function import
         * @param {string} sMatnr - The material SKU code
         * @returns {Promise} Promise that resolves with material data
         * @private
         */
        _performSKULookup: function (sMatnr) {
            var that = this;

            // Call backend function import for SKU validation and material lookup
            return this.callFunctionImport("ValidarMatnr", {
                Matnr: sMatnr
            }, {
                showBusy: true,
                handleError: false
            }).then(function (oResult) {
                // Process backend response and convert to standard format
                // ValidarMatnr returns the same structure as ValidarCodigoBarras
                return that._processMaterialLookupResult(oResult, sMatnr);
            }).catch(function (oError) {
                // Handle specific backend errors
                throw new Error("Material de embalagem não existe no centro");
            });
        },

        /**
         * Process material lookup result from backend
         * @param {object} oResult - Backend function import result
         * @param {string} sBarcode - Original barcode
         * @returns {object} Processed material data
         * @private
         */
        _processMaterialLookupResult: function (oResult, sBarcode) {
            // Process the backend result and convert to standard format
            // This would depend on the actual structure returned by the ABAP function

            // Handle both direct results and results wrapped in 'd.results' array
            var oMaterialData = oResult;
            if (oResult && oResult.d && oResult.d.results && oResult.d.results.length > 0) {
                oMaterialData = oResult.d.results[0];
            }

            // The actual structure will depend on what your backend returns
            // For now, we'll use a flexible approach that can handle different response formats
            var sMaterialSKU = oMaterialData.MaterialSKU || oMaterialData.Material || oMaterialData.Matnr || "";
            var sMaterialDescription = oMaterialData.MaterialDescription || oMaterialData.Maktx || oMaterialData.Description || "";
            var bRequiresExpiration = oMaterialData.RequiresExpiration === "X" || oMaterialData.RequiresExpiration === true ||
                oMaterialData.ExpirationRequired === "X" || oMaterialData.ExpirationRequired === true;

            if (!sMaterialSKU) {
                throw new Error("Material não encontrado no sistema SAP");
            }

            return {
                barcode: sBarcode,
                materialSKU: sMaterialSKU,
                materialDescription: sMaterialDescription || "Material: " + sMaterialSKU,
                requiresExpiration: bRequiresExpiration,
                material13: sBarcode.length === 13 ? sBarcode : "",
                material14: sBarcode.length === 14 ? sBarcode : "",
                // Additional fields from backend (if available)
                materialGroup: oMaterialData.MaterialGroup || oMaterialData.Matkl || "",
                baseUnit: oMaterialData.BaseUnit || oMaterialData.Meins || "",
                validationStatus: oMaterialData.ValidationStatus || "VALID",
                // Quantity field from backend - clean and convert to number
                quantity: oMaterialData.Qtd ? parseFloat(oMaterialData.Qtd.toString().trim()) || "" : ""
            };
        },

        /**
         * Mock material lookup for development/testing
         * In production, this would be replaced with actual backend calls
         * @param {string} sBarcode - The barcode to lookup
         * @returns {object} Material data object
         * @private
         */
        _mockMaterialLookup: function (sBarcode) {
            // Mock material master data lookup
            var sMaterialSKU = "";
            var sMaterialDescription = "";
            var bRequiresExpiration = false;

            // Convert barcode to SAP material number (SKU) - support any length
            if (sBarcode.length === 13) {
                // EAN-13 conversion logic
                sMaterialSKU = "MAT" + sBarcode.substring(0, 10);
                sMaterialDescription = "Material EAN-13: " + sBarcode;
                bRequiresExpiration = sBarcode.startsWith("789"); // Example: products starting with 789 require expiration
            } else if (sBarcode.length === 14) {
                // EAN-14 conversion logic
                sMaterialSKU = "MAT" + sBarcode.substring(1, 11);
                sMaterialDescription = "Material EAN-14: " + sBarcode;
                bRequiresExpiration = sBarcode.startsWith("1789"); // Example: products starting with 1789 require expiration
            } else {
                // Handle other lengths - use the barcode as material SKU
                sMaterialSKU = sBarcode;
                sMaterialDescription = "Material: " + sBarcode;
                bRequiresExpiration = false; // Default for non-standard codes
            }

            // Simulate material not found for certain patterns
            if (sBarcode.includes("0000000000")) {
                throw new Error("Material não encontrado no sistema SAP");
            }

            return {
                barcode: sBarcode,
                materialSKU: sMaterialSKU,
                materialDescription: sMaterialDescription,
                requiresExpiration: bRequiresExpiration,
                material13: sBarcode.length === 13 ? sBarcode : "",
                material14: sBarcode.length === 14 ? sBarcode : ""
            };
        },

        /**
         * Check if material requires expiration date based on material parameter table
         * @param {object} oMaterialData - The material data object
         * @private
         */
        _checkMaterialExpirationRequirement: function (oMaterialData) {
            var oValidadeContainer = this.byId("assembleUCValidadeContainer");

            if (oMaterialData && oMaterialData.requiresExpiration) {
                // If we already have a first expiration date set, use it automatically
                if (this._firstExpirationDate) {
                    oValidadeContainer.setVisible(true);

                    // Auto-fill the expiration date fields with the first date
                    this.byId("assembleUCMesSelect").setSelectedKey(this._firstExpirationDate.mes);
                    this.byId("assembleUCAnoSelect").setSelectedKey(this._firstExpirationDate.ano);

                    // Show popup only for the first two items (count < 2 means items 0 and 1)
                    if (this.getView().getModel().getData().scannedItemsCount < 2) {
                        this.showInfoMessage("Data de validade reutilizada da primeira definição: " +
                            this._firstExpirationDate.mes + "/" + this._firstExpirationDate.ano);
                    }

                    this._firstExpirationDate = ""
                } else {
                    oValidadeContainer.setVisible(true);
                    
                    // Show popup only for the first two items (count < 2 means items 0 and 1)
                    if (this.getView().getModel().getData().scannedItemsCount < 2) {
                        this.showInfoMessage("Este material requer data de validade");
                    }
                }
            } else {
                oValidadeContainer.setVisible(false);
            }
        },

        /**
         * Add scanned item to the list
         * @public
         */
        onAdicionarItemPress: function () {
            var that = this;
            var sMaterial = this.byId("assembleUCMaterialInput").getValue();
            var sQuantidade = this.byId("assembleUCQuantidadeInput").getValue();
            var sMes = this.byId("assembleUCMesSelect").getSelectedKey();
            var sAno = this.byId("assembleUCAnoSelect").getSelectedKey();

            // If material is not validated yet, validate it first
            if (!this._currentMaterialData || this._currentMaterialData.barcode !== sMaterial) {
                if (!sMaterial || sMaterial.length === 0) {
                    this.showErrorMessage("Digite ou escaneie um código de barras");
                    return;
                }

                // Validate barcode with backend first
                var oInput = this.byId("assembleUCMaterialInput");
                this._validateBarcodeWithABAPForSubmit(sMaterial, oInput)
                    .then(function (oMaterialData) {
                        // Check if material requires expiration date and show container if needed
                        that._checkMaterialExpirationRequirement(oMaterialData);

                        // After validation, try to add item again
                        setTimeout(function () {
                            that.onAdicionarItemPress();
                        }, 300);
                    })
                    .catch(function () {
                        // Validation failed - error already shown
                    });
                return;
            }

            // Validate inputs
            if (!this._validateItemInputs(sMaterial, sQuantidade)) {
                return;
            }

            // Validate Material SKU consistency
            if (!this._validateMaterialSKUConsistency()) {
                return;
            }

            // Create expiration date only if material requires it and values are provided
            var sDataValidade = null;
            if (this._currentMaterialData && this._currentMaterialData.requiresExpiration && sMes && sAno) {
                sDataValidade = sMes + sAno;

                // Store the first expiration date if this is the first time it's being set
                if (!this._firstExpirationDate) {
                    this._firstExpirationDate = {
                        mes: sMes,
                        ano: sAno
                    };
                }
            }

            // Add item to scanned items list
            this._addScannedItem(sMaterial, sQuantidade, sDataValidade);

            // Clear inputs for next item
            this._clearInputs();
        },

        /**
         * Validate Material SKU consistency - after first material, all subsequent materials must have the same SKU
         * @returns {boolean} - Validation result
         * @private
         */
        _validateMaterialSKUConsistency: function () {
            // Check if we have current material data
            if (!this._currentMaterialData || !this._currentMaterialData.materialSKU) {
                this.showErrorMessage("Material SKU não encontrado. Verifique se o material foi validado corretamente.");
                return false;
            }

            var sCurrentMaterialSKU = this._currentMaterialData.materialSKU;

            // If this is the first material, store its SKU
            if (this._firstMaterialSKU === null) {
                this._firstMaterialSKU = sCurrentMaterialSKU;
                return true;
            }

            // For subsequent materials, check if SKU matches the first one
            if (this._firstMaterialSKU !== sCurrentMaterialSKU) {
                this.showErrorMessage(
                    "Material SKU diferente detectado!\n\n" +
                    "Material SKU UC: " + this._firstMaterialSKU + "\n" +
                    "Material SKU Lido: " + sCurrentMaterialSKU + "\n\n" +
                    "Todos os materiais da UC devem ter o mesmo Material SKU. "
                );
                return false;
            }

            return true;
        },

        /**
         * Validate item inputs with enhanced validation
         * @param {string} sMaterial - Material code
         * @param {string} sQuantidade - Quantity
         * @returns {boolean} - Validation result
         * @private
         */
        _validateItemInputs: function (sMaterial, sQuantidade) {
            // Validate material based on RecebEmb mode
            if (this._recebEmb === "X") {
                // For SKU mode, just validate that material is not empty
                if (!sMaterial || sMaterial.trim().length === 0) {
                    this.showErrorMessage("Material SKU é obrigatório");
                    return false;
                }
            } else {
                // For barcode mode, validate barcode format
                var oBarcodeValidation = this.validateBarcode(sMaterial);
                if (!oBarcodeValidation.isValid) {
                    this.showErrorMessage(oBarcodeValidation.message);
                    return false;
                }
            }

            // Check if material data was loaded from lookup
            if (!this._currentMaterialData) {
                this.showErrorMessage("Material não foi validado. Aguarde a validação ou digite novamente.");
                return false;
            }

            // Validate quantity
            var oQuantityValidation = this.validateQuantity(sQuantidade);
            if (!oQuantityValidation.isValid) {
                this.showErrorMessage(oQuantityValidation.message);
                return false;
            }

            // For RecebEmb='X' mode, ensure quantity was manually entered (not empty)
            if (this._recebEmb === "X") {
                if (!sQuantidade || sQuantidade.trim().length === 0) {
                    this.showErrorMessage("Quantidade é obrigatória. Por favor, informe a quantidade manualmente.");
                    return false;
                }
            }

            // Validate expiration date if required
            if (this._currentMaterialData.requiresExpiration) {
                var sMes = this.byId("assembleUCMesSelect").getSelectedKey();
                var sAno = this.byId("assembleUCAnoSelect").getSelectedKey();

                if (!sMes || !sAno) {
                    this.showErrorMessage("Este material requer data de validade (mês e ano)");
                    return false;
                }

                // Validate expiration date is in the future
                var oExpirationValidation = this._validateExpirationDate(sMes, sAno);
                if (!oExpirationValidation.isValid) {
                    this.showErrorMessage(oExpirationValidation.message);
                    return false;
                }
            }

            return true;
        },

        /**
         * Validate expiration date based on material parameter table
         * @param {string} sMes - Month (1-12)
         * @param {string} sAno - Year (YYYY)
         * @returns {object} Validation result
         * @private
         */
        _validateExpirationDate: function (sMes, sAno) {
            var iMes = parseInt(sMes);
            var iAno = parseInt(sAno);
            var oCurrentDate = new Date();
            var iCurrentYear = oCurrentDate.getFullYear();
            var iCurrentMonth = oCurrentDate.getMonth() + 1; // getMonth() returns 0-11

            // Basic validation
            if (iMes < 1 || iMes > 12) {
                return {
                    isValid: false,
                    message: "Mês deve estar entre 1 e 12"
                };
            }

            if (iAno < iCurrentYear) {
                return {
                    isValid: false,
                    message: "Ano de validade não pode ser no passado"
                };
            }

            // Check if expiration date is not in the past
            if (iAno === iCurrentYear && iMes < iCurrentMonth) {
                return {
                    isValid: false,
                    message: "Data de validade não pode ser no passado"
                };
            }

            // Check if expiration date is not too far in the future (10 years)
            if (iAno > iCurrentYear + 10) {
                return {
                    isValid: false,
                    message: "Data de validade muito distante (máximo 10 anos)"
                };
            }

            return {
                isValid: true,
                message: ""
            };
        },

        /**
         * Add item to scanned items model and create Items table record
         * @param {string} sMaterial - Material code
         * @param {string} sQuantidade - Quantity
         * @param {string} sDataValidade - Expiration date
         * @private
         */
        _addScannedItem: function (sMaterial, sQuantidade, sDataValidade) {
            var that = this;
            var oModel = this.getView().getModel();
            var aScannedItems = oModel.getProperty("/scannedItems");

            // Get current receipt context (NF, Identificador, UC)
            var oReceiptContext = this._getReceiptContext();

            // Create item record with all required fields for Items table
            // ItemUc will be generated by the backend
            var oNewItem = {
                // Local UI properties
                itemIndex: aScannedItems.length,

                // Items table fields (matching OData entity structure)
                Nf: oReceiptContext.nf,
                Uc: oReceiptContext.uc,
                ItemUc: "", // Will be filled by backend
                Identificador: oReceiptContext.identificador,
                DataValidade: sDataValidade,
                Material13: this._currentMaterialData.material13,
                Material14: this._currentMaterialData.material14,
                Material: this._currentMaterialData.materialSKU, // SAP SKU from material lookup
                Quantidade: sQuantidade,
                //StatusUc: "EM ABERTO", // Initial status

                // Display properties for UI (lowercase to match view binding)
                material: this._currentMaterialData.materialSKU, // For display in list
                quantidade: sQuantidade, // For display in list
                dataValidade: sDataValidade, // For display in list description
                materialDescription: this._currentMaterialData.materialDescription,
                barcode: this._currentMaterialData.barcode
            };

            // Add to local model first
            aScannedItems.push(oNewItem);
            oModel.setProperty("/scannedItems", aScannedItems);
            this._updateScannedItemsCount();

            // Debug: Log the item being added

            // Create record in backend Items table
            this._createItemsTableRecord(oNewItem)
                .then(function (oData) {
                    // Update the local item with the ItemUc returned from backend
                    var aUpdatedItems = oModel.getProperty("/scannedItems");
                    var oLastItem = aUpdatedItems[aUpdatedItems.length - 1];
                    if (oData && oData.ItemUc) {
                        oLastItem.ItemUc = oData.ItemUc;
                        oModel.setProperty("/scannedItems", aUpdatedItems);
                    }
                    that.showSuccessMessage("Item adicionado e salvo com sucesso");
                })
                .catch(function (oError) {
                    // Remove from local model if backend creation fails
                    var aUpdatedItems = oModel.getProperty("/scannedItems");
                    aUpdatedItems.pop(); // Remove the last added item
                    oModel.setProperty("/scannedItems", aUpdatedItems);
                    that._updateScannedItemsCount();

                    that.handleServiceError(oError, {
                        defaultMessage: "Erro ao salvar item no sistema"
                    });
                });
        },

        /**
         * Get current receipt context (NF, Identificador, UC)
         * @returns {object} Receipt context object
         * @private
         */
        _getReceiptContext: function () {
            // First try to get from stored context
            if (this._receiptContext) {
                return this._receiptContext;
            }

            // Try to get from receipt model
            var oReceiptModel = this.getModel("receiptContext");
            if (oReceiptModel) {
                var oReceiptData = oReceiptModel.getData();
                if (oReceiptData && (oReceiptData.nf || oReceiptData.identificador || oReceiptData.uc)) {
                    return {
                        nf: oReceiptData.nf || "",
                        identificador: oReceiptData.identificador || "",
                        uc: oReceiptData.uc || "",
                        operacao: oReceiptData.operacao || "",
                        statusReceb: oReceiptData.statusReceb || "",
                        statusContainer: oReceiptData.statusContainer || "",
                        impressora: oReceiptModel.impressora || "",
                        doca: oReceiptModel.doca || "",
                    };
                }
            }

            // Fallback: try to get from display fields
            var oDisplayContext = {
                nf: this.byId("assembleUCNfDisplay").getValue() || "",
                identificador: this.byId("assembleUCIdentificadorDisplay").getValue() || "",
                uc: this.byId("assembleUCUcDisplay").getValue() || ""
            };

            return oDisplayContext;
        },

        /**
         * Create Items table record in backend
         * @param {object} oItemData - Item data to create
         * @returns {Promise} Promise that resolves with the created record data (including backend-generated ItemUc)
         * @private
         */
        _createItemsTableRecord: function (oItemData) {
            var that = this;

            // Prepare data for OData entity creation
            // ItemUc is not sent - it will be generated by the backend
            var oEntityData = {
                Nf: oItemData.Nf,
                Uc: oItemData.Uc,
                Identificador: oItemData.Identificador,
                DataValidade: oItemData.DataValidade,
                Material13: oItemData.Material13,
                Material14: oItemData.Material14,
                Material: oItemData.Material,
                Quantidade: oItemData.Quantidade,
                //StatusUc: oItemData.StatusUc
            };

            // Create entity in ItemsSet and return the response data
            return this.createEntity("ItemsSet", oEntityData, {
                showBusy: true,
                handleError: false // We'll handle errors in the calling method
            });
        },

        /**
         * Clear input fields after adding item
         * @private
         */
        _clearInputs: function () {
            this.byId("assembleUCMaterialInput").setValue("");
            this.byId("assembleUCQuantidadeInput").setValue("");
            this.byId("assembleUCMesSelect").setSelectedKey("");
            this.byId("assembleUCAnoSelect").setSelectedKey("");
            this.byId("assembleUCValidadeContainer").setVisible(false);
            this.byId("assembleUCQuantidadeContainer").setVisible(false);
            this.byId("assembleUCMaterialSKUContainer").setVisible(false);

            // Clear material validation state
            this.byId("assembleUCMaterialInput").setValueState("None");
            this.byId("assembleUCMaterialInput").setValueStateText("");

            // Clear current material data
            this._currentMaterialData = null;

            // Focus back to material input for next scan
            this.byId("assembleUCMaterialInput").focus();
        },

        /**
         * Reset Material SKU validation when all items are removed
         * @private
         */
        _resetMaterialSKUValidation: function () {
            this._firstMaterialSKU = null;
            this._firstExpirationDate = null;
        },

        /**
         * Handle item press in scanned items list
         * @param {sap.ui.base.Event} oEvent - The press event
         * @public
         */
        onItemPress: function (oEvent) {
            var oItem = oEvent.getSource();
            var iItemIndex = parseInt(oItem.getCustomData()[0].getValue());

            this._showItemActionSheet(iItemIndex);
        },

        /**
         * Show action sheet for item operations
         * @param {number} iItemIndex - Index of the item
         * @private
         */
        _showItemActionSheet: function (iItemIndex) {
            var that = this;

            if (!this._oItemActionSheet) {
                this._oItemActionSheet = new ActionSheet({
                    buttons: [
                        new Button({
                            text: "Remover Item",
                            type: "Reject",
                            press: function () {
                                that._removeScannedItem(that._currentItemIndex);
                                that._oItemActionSheet.close();
                            }
                        })
                    ]
                });
                this.getView().addDependent(this._oItemActionSheet);
            }

            this._currentItemIndex = iItemIndex;
            this._oItemActionSheet.openBy(this.byId("assembleUCScannedItemsList").getItems()[iItemIndex]);
        },

        /**
         * Remove item from scanned items list and backend
         * @param {number} iItemIndex - Index of the item to remove
         * @private
         */
        _removeScannedItem: function (iItemIndex) {
            var that = this;
            var oModel = this.getView().getModel();
            var aScannedItems = oModel.getProperty("/scannedItems");
            var oItemToRemove = aScannedItems[iItemIndex];

            // Show confirmation dialog
            this.showConfirmDialog(
                "Tem certeza que deseja remover este item?\n" +
                "Material: " + oItemToRemove.materialDescription + "\n" +
                "Quantidade: " + oItemToRemove.Quantidade,
                function () {
                    // User confirmed, proceed with removal
                    that._performItemRemoval(iItemIndex, oItemToRemove);
                }
            );
        },

        /**
         * Perform the actual item removal from local model and backend
         * @param {number} iItemIndex - Index of the item to remove
         * @param {object} oItemToRemove - Item data to remove
         * @private
         */
        _performItemRemoval: function (iItemIndex, oItemToRemove) {
            var that = this;
            var oModel = this.getView().getModel();
            var aScannedItems = oModel.getProperty("/scannedItems");

            // Remove from backend first
            this._deleteItemsTableRecord(oItemToRemove)
                .then(function () {
                    // Backend deletion successful, update local model
                    aScannedItems.splice(iItemIndex, 1);

                    // Update local itemIndex for UI purposes only
                    // ItemUc is managed by backend and should not be changed
                    aScannedItems.forEach(function (oItem, index) {
                        oItem.itemIndex = index;
                    });

                    // Update local model
                    oModel.setProperty("/scannedItems", aScannedItems);
                    that._updateScannedItemsCount();

                    // If no items left, reset Material SKU validation
                    if (aScannedItems.length === 0) {
                        that._resetMaterialSKUValidation();
                    }

                    that.showSuccessMessage("Item removido com sucesso");
                })
                .catch(function (oError) {
                    that.handleServiceError(oError, {
                        defaultMessage: "Erro ao remover item do sistema"
                    });
                });
        },

        /**
         * Delete Items table record from backend
         * @param {object} oItemData - Item data to delete
         * @returns {Promise} Promise that resolves when record is deleted
         * @private
         */
        _deleteItemsTableRecord: function (oItemData) {
            // Clean the UC value by removing trailing spaces
            var sCleanUc = oItemData.Uc ? oItemData.Uc.trim() : oItemData.Uc;

            // Construct the entity path for deletion
            var sEntityPath = "/ItemsSet(Nf='" + oItemData.Nf +
                "',Uc='" + sCleanUc +
                "',ItemUc='" + oItemData.ItemUc +
                "',Identificador='" + oItemData.Identificador + "')";

            return this.deleteEntity(sEntityPath, {
                showBusy: true,
                handleError: false // We'll handle errors in the calling method
            });
        },


        /**
         * Navigate to occurrence registration
         * @public
         */
        onOcorrenciaPress: function () {

            // Get current receipt context data
            var oReceiptModel = this.getModel("receiptContext");
            if (!oReceiptModel) {
                this.showErrorMessage("Dados do recebimento não encontrados");
                return;
            }

            var oReceiptData = oReceiptModel.getData();

            // Validate required data
            if (!oReceiptData.nf || !oReceiptData.identificador || !oReceiptData.uc) {
                this.showErrorMessage("Dados incompletos para registrar ocorrência. NF, Identificador e UC são obrigatórios.");
                return;
            }

            // Save data to global context for occurrence screen
            this._saveToGlobalContextForOccurrence(oReceiptData);

            // Navigate to occurrence registration screen
            this.navToOcorrencia();
        },

        /**
         * Save receipt context data to global context for occurrence screen
         * @private
         * @param {object} oReceiptData the receipt context data
         */
        _saveToGlobalContextForOccurrence: function (oReceiptData) {
            var oComponent = this.getOwnerComponent();
            var oModel = this.getView().getModel();
            var aScannedItems = oModel.getProperty("/scannedItems") || [];

            // Create or get global context model
            var oGlobalModel = oComponent.getModel("globalContext");
            if (!oGlobalModel) {
                oGlobalModel = new JSONModel({});
                oComponent.setModel(oGlobalModel, "globalContext");
            }

            // Update global context with current receipt data
            var oGlobalData = oGlobalModel.getData();
            oGlobalData.nf = oReceiptData.nf;
            oGlobalData.identificador = oReceiptData.identificador;
            oGlobalData.uc = oReceiptData.uc; // UC is specific to AssembleUC context
            oGlobalData.currentStep = "Ocorrencia";
            oGlobalData.sourceScreen = "AssembleUC"; // Track source screen
            // Preserve impressora and doca from global context
            if (oGlobalData.impressora) {
                oGlobalData.impressora = oGlobalData.impressora;
            }
            if (oGlobalData.doca) {
                oGlobalData.doca = oGlobalData.doca;
            }

            oGlobalModel.setData(oGlobalData);

            // Also save to component level receiptContext model for backup
            var oComponentReceiptModel = oComponent.getModel("receiptContext");
            if (!oComponentReceiptModel) {
                oComponentReceiptModel = new JSONModel({});
                oComponent.setModel(oComponentReceiptModel, "receiptContext");
            }

            oComponentReceiptModel.setData({
                nf: oReceiptData.nf,
                identificador: oReceiptData.identificador,
                uc: oReceiptData.uc,
                currentStep: "Ocorrencia",
                sourceScreen: "AssembleUC",
                scannedItems: aScannedItems,
                scannedItemsCount: aScannedItems.length,
                impressora: oGlobalData.impressora || "",
                doca: oGlobalData.doca || ""
            });
        },

        /**
         * Navigate back to main menu
         * @public
         */
        onInicioPress: function () {
            // Clear UC-specific data when returning to main menu
            this.clearUCData();
            this.navToMainMenu();
        },

        /**
         * Handle UC completion with confirmation popup
         * @public
         */
        onConcluirUCPress: function () {
            var that = this;
            var oReceiptContext = this._getReceiptContext();
            var oModel = this.getView().getModel();
            var aScannedItems = oModel.getProperty("/scannedItems") || [];


            // Validate UC is present
            if (!oReceiptContext.uc || oReceiptContext.uc.trim() === "") {
                this.showErrorMessage("Erro de validação: UC é obrigatória");
                //console.error("UC is missing or empty:", oReceiptContext.uc);
                return;
            }

            // Validate that there are items to complete
            if (aScannedItems.length === 0) {
                this.showWarningMessage("Não há itens para concluir a UC. Adicione pelo menos um item antes de concluir.");
                return;
            }

            // Show confirmation popup as required by acceptance criteria
            var sConfirmMessage = "Tem certeza que deseja concluir a UC?\n\n" +
                "UC: " + oReceiptContext.uc + "\n" +
                "NF: " + oReceiptContext.nf + "\n" +
                "Identificador: " + oReceiptContext.identificador + "\n" +
                "Total de itens: " + aScannedItems.length + "\n\n" +
                "Esta ação irá:\n" +
                "- Executar a transferência de mercadorias\n" +
                "- Não poderá ser desfeita";

            this.showConfirmDialog(
                sConfirmMessage,
                function () {
                    // User confirmed, proceed with UC completion
                    that._performUCCompletion(oReceiptContext);
                }
            );
        },

        /**
         * Perform UC completion process
         * @param {object} oReceiptContext - Receipt context with NF, UC, Identificador
         * @private
         */
        _performUCCompletion: function (oReceiptContext) {
            var that = this;

            this.showBusyIndicator("Concluindo UC...");

            // Step 1: Call backend ConcluirUC function
            this._callConcluirUCFunction(oReceiptContext)
                .then(function (oResult) {

                    // Step 2: Update Header StatusContainer and StatusReceb
                    return that._updateHeaderStatusContainer(oReceiptContext, "EM ANDAMENTO", "EM ANDAMENTO");
                })
                .then(function () {
                    // Step 3: Call FinalizaReceb function import FIRST
                    that.showBusyIndicator("Executando transferência de mercadorias...");
                    return that._callFinalizaRecebFunction(oReceiptContext);
                })
                .then(function (oResult) {
                    // Step 4: Only update StatusUC to CONCLUIDO if FinalizaReceb was successful
                    that.showBusyIndicator("Atualizando status da UC...");
                    return that._updateStatusUCTableSafely(oReceiptContext, "CONCLUIDO");
                })
                .then(function () {
                    // All operations completed successfully
                    that.hideBusyIndicator();
                    that.showSuccessMessage("UC " + oReceiptContext.uc + " concluída com sucesso!");

                    // Call ImprimirEtiqueta function in background (no user feedback required)
                    that._callImprimirEtiquetaInBackground(oReceiptContext.uc);

                    // Navigate back to main menu or appropriate screen
                    that._handleUCCompletionSuccess(oReceiptContext);
                })
                .catch(function (oError) {
                    that.hideBusyIndicator();
                    //console.error("Error in UC completion process:", oError);
                    that._handleUCCompletionError(oError, oReceiptContext);
                });
        },

        /**
         * Call backend ConcluirUC function import
         * @param {object} oReceiptContext - Receipt context with NF, UC, Identificador
         * @returns {Promise} Promise that resolves with function result
         * @private
         */
        _callConcluirUCFunction: function (oReceiptContext) {
            // Clean the UC value by removing trailing spaces before calling the service
            var sCleanUc = oReceiptContext.uc ? oReceiptContext.uc.trim() : oReceiptContext.uc;


            // Use the new service method from BaseController
            return this.completeUC(sCleanUc, oReceiptContext.nf, oReceiptContext.identificador);
        },

        /**
         * Safely update StatusUC table - doesn't fail if update is not possible
         * @param {object} oReceiptContext - Receipt context with NF, UC, Identificador
         * @param {string} sStatus - New status value
         * @returns {Promise} Promise that resolves when update is complete or skipped
         * @private
         */
        _updateStatusUCTableSafely: function (oReceiptContext, sStatus) {
            var that = this;

            // Clean the UC value by removing trailing spaces
            var sCleanUc = oReceiptContext.uc ? oReceiptContext.uc.trim() : oReceiptContext.uc;

            // First, try to read the current StatusUC record to verify it exists and check current status
            var sEntityPath = "/StatusUCSet(Nf='" + oReceiptContext.nf +
                "',Identificador='" + oReceiptContext.identificador +
                "',Uc='" + sCleanUc + "')";


            return this.readEntity(sEntityPath, {
                showBusy: false,
                handleError: false
            }).then(function (oStatusUCData) {

                // Check if the status is already what we want
                if (oStatusUCData && oStatusUCData.Status === sStatus) {
                    return Promise.resolve();
                }

                // If status is different, try to update it
                var oUpdateData = {
                    Status: sStatus
                };


                return that.updateEntity(sEntityPath, oUpdateData, {
                    showBusy: false,
                    handleError: false
                }).then(function () {
                });
            }).catch(function (oError) {
                // If read or update fails, check the error type
                if (oError && oError.statusCode === 404) {
                } else if (oError && oError.statusCode === 400) {
                } else {
                    //console.warn("StatusUC operation failed:", oError);
                }
                // Return resolved promise to continue the chain
                return Promise.resolve();
            });
        },


        /**
         * Update Header table StatusContainer and StatusReceb fields
         * @param {object} oReceiptContext - Receipt context with NF, Identificador
         * @param {string} sStatusContainer - New StatusContainer value
         * @param {string} sStatusReceb - New StatusReceb value
         * @returns {Promise} Promise that resolves when update is complete
         * @private
         */
        _updateHeaderStatusContainer: function (oReceiptContext, sStatusContainer, sStatusReceb) {
            // Construct the entity path for Header table
            var sEntityPath = "/HeaderSet(Nf='" + oReceiptContext.nf +
                "',Identificador='" + oReceiptContext.identificador + "')";

            var oUpdateData = {
                StatusContainer: sStatusContainer,
                StatusReceb: sStatusReceb
            };

            return this.updateEntity(sEntityPath, oUpdateData, {
                showBusy: false, // We're already showing busy indicator
                handleError: false // We'll handle errors in the calling method
            });
        },

        /**
         * Handle successful UC completion
         * @param {object} oReceiptContext - Receipt context
         * @private
         */
        _handleUCCompletionSuccess: function (oReceiptContext) {
            // Clear the scanned items model since UC is completed
            var oModel = this.getView().getModel();
            oModel.setProperty("/scannedItems", []);
            this._updateScannedItemsCount();

            // Reset Material SKU validation for next UC
            this._resetMaterialSKUValidation();

            // Clear input fields
            this._clearInputs();

            // Clear UC-specific data to prevent interference with next process
            this.clearUCData();

            // Show custom dialog with all 3 options visible
            this._showUCCompletionDialog(oReceiptContext);
        },

        /**
         * Show custom dialog with all 3 options visible (without overflow menu)
         * @param {object} oReceiptContext - Receipt context
         * @private
         */
        _showUCCompletionDialog: function (oReceiptContext) {
            var that = this;

            // Create dialog if it doesn't exist
            if (!this._ucCompletionDialog) {
                this._ucCompletionDialog = new Dialog({
                    title: "UC Concluída",
                    icon: "sap-icon://message-success",
                    state: "Success",
                    contentWidth: "80%",
                    content: [
                        new VBox({
                            alignItems: "Center",
                            width: "80%",
                            items: [
                                new Text({
                                    text: "",
                                    textAlign: "Center"
                                }).addStyleClass("sapUiSmallMarginBottom"),
                                new Text({
                                    text: "StatusUC: CONCLUIDO",
                                    textAlign: "Center"
                                }).addStyleClass("sapUiTinyMarginBottom"),
                                new Text({
                                    text: "StatusContainer: EM ANDAMENTO",
                                    textAlign: "Center"
                                }).addStyleClass("sapUiMediumMarginBottom"),
                                new Text({
                                    text: "O que deseja fazer agora?",
                                    textAlign: "Center"
                                }).addStyleClass("sapUiMediumMarginTop sapUiMediumMarginBottom"),
                                // Botões como parte do conteúdo para ficarem sempre visíveis
                                new Button({
                                    text: "Criar Nova UC",
                                    icon: "sap-icon://add",
                                    type: "Emphasized",
                                    width: "100%",
                                    press: function () {
                                        that._ucCompletionDialog.close();
                                        // Clear only UC-specific data, preserve context
                                        that._clearUCDataOnly();
                                        // Navigate to CreateUC - the new UC will be created and context updated there
                                        that.navToCreateUC();
                                    }
                                }).addStyleClass("sapUiTinyMarginBottom"),
                                new Button({
                                    text: "Voltar ao Início",
                                    icon: "sap-icon://home",
                                    width: "100%",
                                    press: function () {
                                        that._ucCompletionDialog.close();
                                        // Clear all data when going to main menu
                                        that._clearAllNavigationData();
                                        that.navToMainMenu();
                                    }
                                }).addStyleClass("sapUiTinyMarginBottom"),
                                new Button({
                                    text: "Finalizar Recebimento",
                                    icon: "sap-icon://accept",
                                    type: "Accept",
                                    width: "100%",
                                    press: function () {
                                        that._ucCompletionDialog.close();
                                        // Prepare data for finalization without clearing NF and Identificador
                                        that._prepareDataForFinalization();
                                        that.navToFinalizationCheck();
                                    }
                                })
                            ]
                        }).addStyleClass("sapUiMediumMargin")
                    ]
                });
                this.getView().addDependent(this._ucCompletionDialog);
            }

            // Update the UC number in the first text
            var aContent = this._ucCompletionDialog.getContent()[0].getItems();
            aContent[0].setText("UC " + oReceiptContext.uc + " foi concluída com sucesso!");

            // Open the dialog
            this._ucCompletionDialog.open();
        },

        /**
         * Navigate to finalization check screen
         * @public
         */
        onFinalizarRecebimentoPress: function () {
            // Get current receipt context and ensure it's available for finalization
            var oReceiptContext = this._getReceiptContext();

            if (!oReceiptContext.nf || !oReceiptContext.identificador) {
                this.showErrorMessage("Dados do recebimento não encontrados. Por favor, volte ao início e refaça o processo.");
                return;
            }

            // Update global context with current receipt data
            var oGlobalModel = this.getOwnerComponent().getModel("globalContext");
            if (oGlobalModel) {
                var oGlobalData = oGlobalModel.getData();
                oGlobalData.nf = oReceiptContext.nf;
                oGlobalData.identificador = oReceiptContext.identificador;
                oGlobalData.currentStep = "FinalizationCheck";
                oGlobalModel.setData(oGlobalData);
            }

            // Also update component-level receipt context
            var oComponentReceiptModel = this.getOwnerComponent().getModel("receiptContext");
            if (oComponentReceiptModel) {
                var oReceiptData = oComponentReceiptModel.getData();
                oReceiptData.nf = oReceiptContext.nf;
                oReceiptData.identificador = oReceiptContext.identificador;
                oComponentReceiptModel.setData(oReceiptData);
            }

            this.navToFinalizationCheck();
        },


        /**
         * Prepare data for finalization without clearing essential receipt data
         * @private
         */
        _prepareDataForFinalization: function () {
            // Get current receipt context
            var oReceiptContext = this._getReceiptContext();

            if (!oReceiptContext.nf || !oReceiptContext.identificador) {
                this.showErrorMessage("Dados do recebimento não encontrados. Por favor, volte ao início e refaça o processo.");
                return;
            }

            // Update global context with current receipt data
            var oGlobalModel = this.getOwnerComponent().getModel("globalContext");
            if (oGlobalModel) {
                var oGlobalData = oGlobalModel.getData();
                oGlobalData.nf = oReceiptContext.nf;
                oGlobalData.identificador = oReceiptContext.identificador;
                oGlobalData.currentStep = "FinalizationCheck";
                oGlobalModel.setData(oGlobalData);
            }

            // Also update component-level receipt context
            var oComponentReceiptModel = this.getOwnerComponent().getModel("receiptContext");
            if (oComponentReceiptModel) {
                var oReceiptData = oComponentReceiptModel.getData();
                oReceiptData.nf = oReceiptContext.nf;
                oReceiptData.identificador = oReceiptContext.identificador;
                oComponentReceiptModel.setData(oReceiptData);
            }

            // Clear only UC-specific data from finalization model
            var oFinalizationModel = this.getOwnerComponent().getModel("finalizationModel");
            if (oFinalizationModel) {
                oFinalizationModel.setData({
                    receiptContext: {
                        nf: oReceiptContext.nf,
                        identificador: oReceiptContext.identificador
                    },
                    scannedItems: [],
                    summary: {
                        totalItems: 0,
                        totalUCs: 0,
                        totalQuantity: 0
                    }
                });
            }

        },

        /**
         * Clear all navigation data after UC completion
         * @private
         */
        _clearAllNavigationData: function () {
            // Use the centralized method from BaseController
            this.clearAllNavigationData();

        },

        /**
         * Clear only UC-specific data, preserving receipt context (NF, Identificador)
         * @private
         */
        _clearUCDataOnly: function () {
            // Clear only UC-specific fields, preserve NF and Identificador
            var oReceiptModel = this.getModel("receiptContext");
            if (oReceiptModel) {
                // Get current NF and Identificador to preserve them
                var sNf = oReceiptModel.getProperty("/nf") || "";
                var sIdentificador = oReceiptModel.getProperty("/identificador") || "";
                var sOperacao = oReceiptModel.getProperty("/operacao") || "";
                var sStatusReceb = oReceiptModel.getProperty("/statusReceb") || "";
                var sStatusContainer = oReceiptModel.getProperty("/statusContainer") || "";

                // Clear only UC-specific data
                oReceiptModel.setData({
                    nf: sNf,
                    identificador: sIdentificador,
                    uc: "",
                    operacao: sOperacao,
                    statusReceb: sStatusReceb,
                    statusContainer: sStatusContainer,
                    items: []
                });
            }

            // Clear component-level receipt context model with same logic
            var oComponent = this.getOwnerComponent();
            var oComponentReceiptModel = oComponent.getModel("receiptContext");
            if (oComponentReceiptModel) {
                var sNf = oComponentReceiptModel.getProperty("/nf") || "";
                var sIdentificador = oComponentReceiptModel.getProperty("/identificador") || "";
                var sOperacao = oComponentReceiptModel.getProperty("/operacao") || "";
                var sStatusReceb = oComponentReceiptModel.getProperty("/statusReceb") || "";
                var sStatusContainer = oComponentReceiptModel.getProperty("/statusContainer") || "";

                oComponentReceiptModel.setData({
                    nf: sNf,
                    identificador: sIdentificador,
                    uc: "",
                    operacao: sOperacao,
                    statusReceb: sStatusReceb,
                    statusContainer: sStatusContainer,
                    items: []
                });
            }

            // Clear finalization model if it exists
            var oFinalizationModel = oComponent.getModel("finalizationModel");
            if (oFinalizationModel) {
                oFinalizationModel.setData({
                    receiptContext: {
                        nf: "",
                        identificador: ""
                    },
                    scannedItems: [],
                    summary: {
                        totalItems: 0,
                        totalUCs: 0,
                        totalQuantity: 0
                    },
                    isProcessing: false,
                    progress: {
                        visible: false,
                        value: 0,
                        text: ""
                    }
                });
            }

        },

        /**
         * Call FinalizaReceb function import
         * @param {object} oReceiptContext - Receipt context with NF, UC, Identificador
         * @returns {Promise} Promise that resolves with function result
         * @private
         */
        _callFinalizaRecebFunction: function (oReceiptContext) {
            var that = this;
            
            // Prepare parameters for FinalizaReceb function import
            var oParameters = {
                Nf: oReceiptContext.nf,
                Identificador: oReceiptContext.identificador,
                Uc: oReceiptContext.uc
            };
            
            // Call FinalizaReceb function import
            return this.callFunctionImport("FinalizaReceb", oParameters, {
                showBusy: false, // We're already showing busy indicator
                handleError: false // We'll handle errors in the calling method
            }).then(function (oResult) {
                // Check if function returned success or error based on Message parameter
                if (oResult.Message) {
                    // Error case - show error message
                    throw new Error(oResult.Message || "Erro na transferência de mercadorias");
                } else {
                    // Success case - continue processing
                    return oResult;
                } 
            });
        },

        /**
         * Handle UC completion errors with screen display
         * @param {object} oError - Error object
         * @param {object} oReceiptContext - Receipt context
         * @private
         */
        _handleUCCompletionError: function (oError, oReceiptContext) {
            var that = this;
            var sErrorMessage = "Erro ao concluir UC";
            
            // Extract error message
            if (oError && oError.message) {
                sErrorMessage = oError.message;
            }
            
            // Show error message with option to retry or go back
            sap.m.MessageBox.error(sErrorMessage, {
                title: "UC com erro na finalização",
                details: "UC: " + oReceiptContext.uc + "\nNF: " + oReceiptContext.nf + "\nIdentificador: " + oReceiptContext.identificador + "\n\nStatusUC: EM ANDAMENTO\nStatusContainer: EM ANDAMENTO\n\nO que deseja fazer agora?",
                actions: [sap.m.MessageBox.Action.RETRY, "Voltar ao Início"],
                emphasizedAction: sap.m.MessageBox.Action.RETRY,
                onClose: function (oAction) {
                    if (oAction === sap.m.MessageBox.Action.RETRY) {
                        // Retry UC completion
                        that._performUCCompletion(oReceiptContext);
                    } else {
                        // Go back to main menu
                        that._clearAllNavigationData();
                        that.navToMainMenu();
                    }
                }
            });
        },

        /**
         * Call ImprimirEtiqueta function in background after UC completion
         * @param {string} sUC - The UC number to print label for
         * @private
         */
        _callImprimirEtiquetaInBackground: function (sUC) {
            let impressora = this.retornaImrpressora()
            var that = this;

            // Clean the UC value by removing trailing spaces
            var sCleanUc = sUC ? sUC.trim() : sUC;


            // Call the function import in background - no user feedback required
            this.callFunctionImport("ImprimirEtiqueta", {
                UC: sCleanUc,
                Impressora: impressora
            }, {
                showBusy: false,  // Don't show busy indicator
                handleError: false // Don't show error messages to user
            }).then(function (oResult) {
            }).catch(function (oError) {
                // Log error but don't show to user as this is a background operation
                //console.warn("ImprimirEtiqueta failed for UC:", sCleanUc, oError);
            });
        }
    });
});