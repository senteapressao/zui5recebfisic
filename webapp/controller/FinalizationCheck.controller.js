sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, MessageBox) {
    "use strict";

    return BaseController.extend("zui5recebfisic.controller.FinalizationCheck", {

        onInit: function () {
            // Initialize the finalization check screen
            this._initializeFinalizationModel();
            this._initializeMobileFeatures();
            
            // Attach route matched handler to load data when navigating to this view
            this.getRouter().getRoute("RouteFinalizationCheck").attachPatternMatched(this._onRouteMatched, this);
        },

        /**
         * Initialize the finalization model
         * @private
         */
        _initializeFinalizationModel: function () {
            var oFinalizationModel = new JSONModel({
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
            this.setModel(oFinalizationModel, "finalizationModel");
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
            
            // Setup enhanced progress indicators for mobile
            this._setupMobileProgressIndicators();
        },

        /**
         * Add haptic feedback to action buttons
         * @private
         */
        _addHapticFeedbackToButtons: function () {
            var that = this;
            var aButtonIds = [
                "finalizationVoltarButton",
                "finalizationConcluirButton"
            ];
            
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
         * Setup mobile-friendly progress indicators
         * @private
         */
        _setupMobileProgressIndicators: function () {
            // Override the finalization execution to show mobile progress
            var that = this;
            
            // Store original method
            this._originalExecuteFinalization = this._executeFinalization;
            
            // Override with mobile progress indicators
            this._executeFinalization = function () {
                that._showMobileFinalizationProgress();
                return that._originalExecuteFinalization.call(that);
            };
        },

        /**
         * Show mobile-friendly finalization progress
         * @private
         */
        _showMobileFinalizationProgress: function () {
            var oModel = this.getModel("finalizationModel");
            
            // Show progress container
            oModel.setProperty("/progress/visible", true);
            oModel.setProperty("/progress/value", 0);
            oModel.setProperty("/progress/text", "Iniciando finalização...");
            oModel.setProperty("/isProcessing", true);
            
            // Simulate progress updates
            this._updateFinalizationProgress(10, "Validando dados...");
            
            setTimeout(function () {
                this._updateFinalizationProgress(30, "Preparando transferência...");
            }.bind(this), 500);
            
            setTimeout(function () {
                this._updateFinalizationProgress(60, "Executando transferência...");
            }.bind(this), 1500);
            
            setTimeout(function () {
                this._updateFinalizationProgress(90, "Atualizando status...");
            }.bind(this), 3000);
        },

        /**
         * Update finalization progress
         * @param {number} iProgress - Progress percentage (0-100)
         * @param {string} sText - Progress text
         * @private
         */
        _updateFinalizationProgress: function (iProgress, sText) {
            var oModel = this.getModel("finalizationModel");
            var oProgressIndicator = this.byId("transferProgress");
            
            if (oModel) {
                oModel.setProperty("/progress/value", iProgress);
                oModel.setProperty("/progress/text", sText);
            }
            
            if (oProgressIndicator) {
                oProgressIndicator.setPercentValue(iProgress);
                oProgressIndicator.setDisplayValue(sText);
            }
        },

        /**
         * Hide finalization progress
         * @private
         */
        _hideFinalizationProgress: function () {
            var oModel = this.getModel("finalizationModel");
            
            if (oModel) {
                oModel.setProperty("/progress/visible", false);
                oModel.setProperty("/isProcessing", false);
            }
        },

        /**
         * Handle route matched event
         * @param {sap.ui.base.Event} oEvent - Route matched event
         * @private
         */
        _onRouteMatched: function (oEvent) {
            // Load receipt data and scanned items
            this._loadReceiptData();
        },

        /**
         * Load receipt data and scanned items for finalization review
         * @private
         */
        _loadReceiptData: function () {
            var that = this;
            
            // Get current receipt context (in real implementation, this would come from route parameters or shared model)
            var oReceiptContext = this._getReceiptContext();
            
            // Update display fields
            this.byId("finalizationNfDisplay").setValue(oReceiptContext.nf);
            this.byId("finalizationIdentificadorDisplay").setValue(oReceiptContext.identificador);
            
            // Update model with receipt context
            var oFinalizationModel = this.getModel("finalizationModel");
            oFinalizationModel.setProperty("/receiptContext", oReceiptContext);
            
            // Load scanned items from backend
            this._loadScannedItems(oReceiptContext)
                .then(function (aScannedItems) {
                    // Process and aggregate the scanned items data
                    var oProcessedData = that._processScannedItemsData(aScannedItems);
                    
                    // Update model with processed data
                    oFinalizationModel.setProperty("/scannedItems", oProcessedData.items);
                    oFinalizationModel.setProperty("/summary", oProcessedData.summary);
                })
                .catch(function (oError) {
                    that.handleServiceError(oError, {
                        defaultMessage: "Erro ao carregar dados do recebimento"
                    });
                });
        },

        /**
         * Get current receipt context (NF, Identificador)
         * Gets data from global context or component models
         * @returns {object} Receipt context object
         * @private
         */
        _getReceiptContext: function () {
            // First try to get from global context
            var oGlobalModel = this.getOwnerComponent().getModel("globalContext");
            if (oGlobalModel) {
                var oGlobalData = oGlobalModel.getData();
                if (oGlobalData && oGlobalData.nf && oGlobalData.identificador) {
                    return {
                        nf: oGlobalData.nf,
                        identificador: oGlobalData.identificador
                    };
                }
            }
            
            // Fallback: try to get from component's receiptContext model
            var oComponentReceiptModel = this.getOwnerComponent().getModel("receiptContext");
            if (oComponentReceiptModel) {
                var oReceiptData = oComponentReceiptModel.getData();
                if (oReceiptData && oReceiptData.nf && oReceiptData.identificador) {
                    return {
                        nf: oReceiptData.nf,
                        identificador: oReceiptData.identificador
                    };
                }
            }
            
            // Try to get from route parameters as last resort
            var oArgs = this.getView().getBindingContext()?.getObject();
            if (oArgs && oArgs.nf && oArgs.identificador) {
                return {
                    nf: oArgs.nf,
                    identificador: oArgs.identificador
                };
            }
            
            // If no data found, show error
            this.showErrorMessage("Dados do recebimento não encontrados. Por favor, navegue novamente para esta tela.");
            return {
                nf: "",
                identificador: ""
            };
        },

        /**
         * Load scanned items from backend ItemsSet
         * @param {object} oReceiptContext - Receipt context with NF and Identificador
         * @returns {Promise} Promise that resolves with scanned items array
         * @private
         */
        _loadScannedItems: function (oReceiptContext) {
            var that = this;
            
            // Check if we should use real backend or mock data
            var bUseMockData = false; // Using real backend integration
            
            if (bUseMockData) {
                return new Promise(function (resolve) {
                    // Mock scanned items data for development/testing
                    setTimeout(function () {
                        var aMockItems = that._getMockScannedItems(oReceiptContext);
                        resolve(aMockItems);
                    }, 500); // Simulate network delay
                });
            } else {
                // Real backend integration
                return this._loadScannedItemsFromBackend(oReceiptContext);
            }
        },

        /**
         * Load scanned items from backend using OData service
         * @param {object} oReceiptContext - Receipt context with NF and Identificador
         * @returns {Promise} Promise that resolves with scanned items array
         * @private
         */
        _loadScannedItemsFromBackend: function (oReceiptContext) {
            var oModel = this.getModel();
            
            return new Promise(function (resolve, reject) {
                // Read ItemsSet entity using the same filter pattern as _validateContainerStatus
                oModel.read("/ItemsSet", {
                    filters: [
                        new sap.ui.model.Filter("Nf", sap.ui.model.FilterOperator.EQ, oReceiptContext.nf),
                        new sap.ui.model.Filter("Identificador", sap.ui.model.FilterOperator.EQ, oReceiptContext.identificador)
                    ],
                    sorters: [
                        new sap.ui.model.Sorter("Uc"),
                        new sap.ui.model.Sorter("ItemUc")
                    ],
                    expand: "StatusUCSet", // Expand to get UC status information
                    success: function (oData) {
                        var aResults = oData.results || [];
                        resolve(aResults);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },

        /**
         * Get mock scanned items for development/testing
         * @param {object} oReceiptContext - Receipt context
         * @returns {array} Array of mock scanned items
         * @private
         */
   
        /**
         * Process and aggregate scanned items data for display
         * @param {array} aScannedItems - Raw scanned items from backend
         * @returns {object} Processed data with items and summary
         * @private
         */
        _processScannedItemsData: function (aScannedItems) {
            var aProcessedItems = [];
            var oUCSet = new Set();
            var fTotalQuantity = 0;
            let fTotalVolumes = 0 
            
            // Debug: Log raw data
            
            // Group items by UC and Material
            var oGroupedData = {};
            
            // First pass: group items by UC and Material
            aScannedItems.forEach(function (oItem) {
                var sUC = oItem.Uc;
                var sMaterialCode = this._formatMaterialCode(oItem);
                var sKey = sUC + "_" + sMaterialCode;
                
                // Debug: Log each item processing
                
                if (!oGroupedData[sKey]) {
                    oGroupedData[sKey] = {
                        uc: sUC,
                        material: oItem.Material,
                        materialCode: sMaterialCode,
                        quantidadeTotal: 0,
                        quantidadeVolumes: 0,
                        dataValidade: oItem.DataValidade,
                        statusUc: oItem.StatusUc
                    };
                }
                
                // Accumulate quantities
                oGroupedData[sKey].quantidadeTotal += parseFloat(oItem.Quantidade || 0);
                oGroupedData[sKey].quantidadeVolumes += 1;
                
                // Collect data for summary
                oUCSet.add(sUC);
                fTotalQuantity += parseFloat(oItem.Quantidade || 0);
                fTotalVolumes += 1
            }.bind(this));
            
            // Debug: Log grouped data
            
            // Second pass: create display items from grouped data
            Object.keys(oGroupedData).forEach(function (sKey) {
                var oGroup = oGroupedData[sKey];
                
                // Debug: Log each group being processed
                
                // Create display item with grouped information
                var oDisplayItem = {
                    // Original data
                    uc: oGroup.uc,
                    material: oGroup.material,
                    materialCode: oGroup.materialCode,
                    quantidadeTotal: oGroup.quantidadeTotal,
                    quantidadeVolumes: oGroup.quantidadeVolumes,
                    dataValidade: oGroup.dataValidade,
                    statusUc: oGroup.statusUc,
                    
                    // Formatted display properties
                    materialDescription: this._generateMaterialDescription({
                        Material: oGroup.material,
                        Material13: oGroup.materialCode.includes("13") ? oGroup.materialCode : null,
                        Material14: oGroup.materialCode.includes("14") ? oGroup.materialCode : null
                    }),
                    ucFormatted: "UC: " + (oGroup.uc || "N/A"),
                    volumesFormatted: "Qtd Volumes: " + oGroup.quantidadeVolumes,
                    materialFormatted: "Qtd mat: " + this._formatQuantity(oGroup.quantidadeTotal.toString())
                };
                
                aProcessedItems.push(oDisplayItem);
            }.bind(this));
            
            // Sort by UC, then by Material Code
            aProcessedItems.sort(function (a, b) {
                if (a.uc !== b.uc) {
                    return a.uc.localeCompare(b.uc);
                }
                return a.materialCode.localeCompare(b.materialCode);
            });
            
            // Debug: Log final processed items
            
            // Create summary data
            var oSummary = {
                totalItems: aProcessedItems.length,
                totalUCs: oUCSet.size,
                totalQuantity: this._formatQuantity(fTotalQuantity.toString()),
                totalVolume: fTotalVolumes
            };
            
            return {
                items: aProcessedItems,
                summary: oSummary
            };
        },

        /**
         * Format material code for display (prioritize 13-digit, then 14-digit, then SAP material)
         * @param {object} oItem - Item data
         * @returns {string} Formatted material code
         * @private
         */
        _formatMaterialCode: function (oItem) {
            if (oItem.Material13) {
                return oItem.Material13;
            } else if (oItem.Material14) {
                return oItem.Material14;
            } else {
                return oItem.Material || "";
            }
        },

        /**
         * Generate material description for display
         * @param {object} oItem - Item data
         * @returns {string} Material description
         * @private
         */
        _generateMaterialDescription: function (oItem) {
            var sMaterialCode = this._formatMaterialCode(oItem);
            var sDescription = "Material: " + (oItem.Material || "N/A");
            
            if (sMaterialCode !== oItem.Material) {
                sDescription += " (Código: " + sMaterialCode + ")";
            }
            
            return sDescription;
        },

        /**
         * Format quantity for display
         * @param {string} sQuantity - Quantity string
         * @returns {string} Formatted quantity
         * @private
         */
        _formatQuantity: function (sQuantity) {
            var fQuantity = parseFloat(sQuantity || 0);
            
            // Format with appropriate decimal places
            if (fQuantity % 1 === 0) {
                // Integer quantity
                return fQuantity.toString();
            } else {
                // Decimal quantity - show up to 3 decimal places
                return fQuantity.toFixed(3).replace(/\.?0+$/, "");
            }
        },

        /**
         * Handle "Voltar" button press - navigate back to PhysicalReceipt screen
         * @public
         */
        onVoltarPress: function () {
            this.navToPhysicalReceipt();
        },

        /**
         * Handle "Concluir" button press - execute goods transfer and finalization with enhanced confirmation
         * @public
         */
        onConcluirPress: function () {
            var that = this;
            var oFinalizationModel = this.getModel("finalizationModel");
            var oSummary = oFinalizationModel.getProperty("/summary");
            
            // Check if there are items to finalize
            if (!oSummary || oSummary.totalItems === 0) {
                this.showWarningMessage("Não há itens para finalizar o recebimento.");
                return;
            }
            
            var sTitle = "Confirmar Finalização";
            var sMessage = "Tem certeza que deseja finalizar o recebimento?\n\n" +
                          "Resumo:\n" +
                          "• " + oSummary.totalItems + " itens escaneados\n" +
                          "• " + oSummary.totalUCs + " UCs processadas\n" +
                          "• Quantidade total: " + oSummary.totalQuantity + "\n\n" +
                          "Esta ação irá:\n" +
                          "• Atualizar o status do container para CONCLUÍDO\n" +
                          "• Não poderá ser desfeita";
            
            // Show enhanced confirmation dialog
            MessageBox.confirm(sMessage, {
                title: sTitle,
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        // User confirmed, proceed with finalization
                        that._executeFinalization();
                    }
                    // If cancel, do nothing
                },
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK
            });
        },

        /**
         * Execute the finalization process - update status to CONCLUIDO
         * @private
         */
        _executeFinalization: function () {
            var that = this;
            var oReceiptContext = this._getReceiptContext();
            
            this.showBusyIndicator("Atualizando status...");
            
            // Update StatusContainer to CONCLUIDO
            var sHeaderPath = "/HeaderSet(Nf='" + oReceiptContext.nf + "',Identificador='" + oReceiptContext.identificador + "')";
            
            var oUpdateData = {
                StatusContainer: "CONCLUIDO"
            };
            
            this.updateEntity(sHeaderPath, oUpdateData, {
                showBusy: false,
                handleError: false
            })
                .then(function () {
                    // Status update successful
                    that.hideBusyIndicator();
                    that._showFinalizationSuccess();
                })
                .catch(function (oError) {
                    // Handle finalization errors
                    that.hideBusyIndicator();
                    that._handleFinalizationError(oError, oReceiptContext);
                });
        },

        /**
         * Validate container status before finalization
         * @param {object} oReceiptContext - Receipt context with NF and Identificador
         * @returns {Promise} Promise that resolves if validation passes
         * @private
         */
        _validateContainerStatus: function (oReceiptContext) {
            var oModel = this.getModel();
            
            return new Promise(function (resolve, reject) {
                // Read Header entity using the same filter pattern as _checkUCStatus
                oModel.read("/HeaderSet", {
                    filters: [
                        new sap.ui.model.Filter("Nf", sap.ui.model.FilterOperator.EQ, oReceiptContext.nf),
                        new sap.ui.model.Filter("Identificador", sap.ui.model.FilterOperator.EQ, oReceiptContext.identificador)
                    ],
                    success: function (oData) {
                        var aResults = oData.results || [];
                        
                        if (aResults.length === 0) {
                            reject(new Error("Container não encontrado na base de dados"));
                            return;
                        }
                        
                        var oHeader = aResults[0];
                        var sStatusContainer = oHeader.StatusContainer;
                        
                        if (sStatusContainer !== "EM ANDAMENTO") {
                            reject(new Error("Container não se encontra mais em aberto"));
                            return;
                        }
                        
                        // Validation passed
                        resolve(true);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },

        /**
         * Call FinalizaReceb function import
         * @param {object} oReceiptContext - Receipt context with NF and Identificador
         * @returns {Promise} Promise that resolves with function result
         * @private
         */
        _callFinalizaRecebFunction: function (oReceiptContext) {
            var that = this;
            
            // Prepare parameters for FinalizaReceb function import
            var oParameters = {
                Nf: oReceiptContext.nf,
                Identificador: oReceiptContext.identificador
            };
            
            
            // Call FinalizaReceb function import
            return this.callFunctionImport("FinalizaReceb", oParameters, {
                showBusy: false, // We're already showing busy indicator
                handleError: false // We'll handle errors in the calling method
            }).then(function (oResult) {
                // Check if function returned success or error based on Tipo parameter
                if (oResult.Message) {
                    // Error case - Tipo is 'E', show error message
                    throw new Error(oResult.Message || "Erro na finalização do recebimento");
                } else {
                    // Success case - Tipo is 'S', continue processing
                    return oResult;
                } 
            });
        },

        /**
         * Execute goods transfer using BAPI_GOODSMVT_CREATE
         * @param {object} oReceiptContext - Receipt context
         * @returns {Promise} Promise that resolves with transfer result
         * @private
         */
       

        /**
         * Update header status after goods transfer
         * @param {object} oReceiptContext - Receipt context
         * @param {string} sStatusContainer - New container status
         * @param {string} sStatusNaoValorado - New non-valued status
         * @param {boolean|string} bUpdateRecebStatus - Whether to update StatusReceb (true for CONCLUIDO, string for custom value)
         * @returns {Promise} Promise that resolves when update is complete
         * @private
         */
        _updateHeaderStatus: function (oReceiptContext, sStatusContainer, sStatusNaoValorado, bUpdateRecebStatus) {
            var sHeaderPath = "/HeaderSet(Nf='" + oReceiptContext.nf + "',Identificador='" + oReceiptContext.identificador + "')";
            
            var oUpdateData = {
                StatusContainer: sStatusContainer
            };
            
            // Update StatusReceb if requested
            if (bUpdateRecebStatus === true) {
                oUpdateData.StatusReceb = "CONCLUIDO";
            } else if (typeof bUpdateRecebStatus === 'string') {
                oUpdateData.StatusReceb = bUpdateRecebStatus;
            }
            
            return this.updateEntity(sHeaderPath, oUpdateData, {
                showBusy: false, // We're already showing busy indicator
                handleError: false // We'll handle errors in the calling method
            });
        },

        /**
         * Show finalization success message and navigate to main menu
         * @private
         */
        _showFinalizationSuccess: function () {
            var that = this;
            
            // Clear all process data after successful finalization
            this.clearAllProcessData();
            
            // Clear all navigation data
            this._clearAllNavigationData();
            
            MessageBox.success("Recebimento finalizado com sucesso!", {
                title: "Sucesso",
                actions: [MessageBox.Action.OK],
                onClose: function () {
                    // Navigate back to main menu after success
                    that.navToMainMenu();
                }
            });
        },

        /**
         * Handle finalization errors
         * @param {object} oError - Error object
         * @param {object} oReceiptContext - Receipt context
         * @private
         */
        _handleFinalizationError: function (oError, oReceiptContext) {
            var that = this;
            var sErrorMessage = "Erro ao atualizar status do recebimento";
            
            // Extract error message
            if (oError && oError.message) {
                sErrorMessage = oError.message;
            }
            
            // Show error message with option to retry
            MessageBox.error(sErrorMessage, {
                title: "Erro na Finalização",
                actions: [MessageBox.Action.RETRY, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.RETRY,
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.RETRY) {
                        // Retry finalization
                        that._executeFinalization();
                    } else {
                        // Navigate back to main menu
                        that.navToMainMenu();
                    }
                }
            });
        },

        /**
         * Handle navigation back
         * @public
         */
        onNavBack: function () {
            // Navigate back to PhysicalReceipt screen
            this.navToPhysicalReceipt();
        },

        /**
         * Clear all navigation data
         * @private
         */
        _clearAllNavigationData: function () {
            // Use the centralized method from BaseController
            this.clearAllNavigationData();

        }
    });
});