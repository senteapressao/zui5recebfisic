sap.ui.define([
    "./BaseController",
    "sap/m/MessageBox"
], function (BaseController, MessageBox) {
    "use strict";

    return BaseController.extend("zui5recebfisic.controller.FinalizarRecebimentoNF", {

        onInit: function () {
            // Initialize the FinalizarRecebimentoNF screen
            this._initializeFinalizarRecebimentoModel();
            this._initializeMobileFeatures();
            this._loadDataFromGlobalContext();
        },

        /**
         * Initialize local model for FinalizarRecebimentoNF screen
         * @private
         */
        _initializeFinalizarRecebimentoModel: function () {
            var oFinalizarRecebimentoModel = this.createLocalModel({
                nf: "",
                identificadores: [],
                loading: false,
                error: null,
                validationResults: null
            }, "finalizarRecebimento");
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
            var aButtonIds = ["voltarButton", "concluirButton"];
            
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
            var aButtonIds = ["voltarButton", "concluirButton"];
            
            aButtonIds.forEach(function (sButtonId) {
                var oButton = that.byId(sButtonId);
                if (oButton) {
                    oButton.addStyleClass("mobileActionButton");
                    oButton.setTooltip(oButton.getText() + " - Toque para acessar");
                }
            });
        },

        /**
         * Load data from global context
         * @private
         */
        _loadDataFromGlobalContext: function () {
            var oGlobalContext = this.getGlobalReceiptContext();
            var oFinalizarRecebimentoModel = this.getModel("finalizarRecebimento");
            
            
            if (oGlobalContext && oGlobalContext.nf && oGlobalContext.identificadores) {
                
                oFinalizarRecebimentoModel.setProperty("/nf", oGlobalContext.nf);
                oFinalizarRecebimentoModel.setProperty("/identificadores", oGlobalContext.identificadores);
                
                
                // Force binding refresh and manual item creation
                setTimeout(function() {
                    var oList = this.byId("identificadoresList");
                    if (oList) {
                        
                        // Clear existing items
                        oList.removeAllItems();
                        
                        // Manually create items
                        var aIdentificadores = oGlobalContext.identificadores;
                        for (var i = 0; i < aIdentificadores.length; i++) {
                            var oItem = new sap.m.StandardListItem({
                                title: aIdentificadores[i],
                                class: "identificadorItem"
                            });
                            oList.addItem(oItem);
                        }
                        
                    } else {
                        console.error("List not found");
                    }
                }.bind(this), 100);
            } else {
                console.error("Missing data in global context:", oGlobalContext);
                this.showErrorMessage("Dados da NF não encontrados. Por favor, navegue novamente para esta tela.");
                this.navToMainMenu();
            }
        },

        /**
         * Handle back navigation
         * @public
         */
        onNavBack: function () {
            this.navTo("RouteConcluirNF");
        },

        /**
         * Handle Voltar button press
         * @public
         */
        onVoltarPress: function () {
            this.navTo("RouteConcluirNF");
        },

        /**
         * Handle Concluir button press - show confirmation and update status
         * @public
         */
        onConcluirPress: function () {
            var that = this;
            
            try {
                // Add visual feedback for mobile
                if (this.isMobileDevice && this.isMobileDevice()) {
                    var oButton = this.byId("concluirButton");
                    if (oButton && this.addVisualHapticFeedback) {
                        this.addVisualHapticFeedback(oButton);
                    }
                }
                
                // Show confirmation dialog
                var oFinalizarRecebimentoModel = this.getModel("finalizarRecebimento");
                var sNf = oFinalizarRecebimentoModel.getProperty("/nf");
                
                var sConfirmMessage = "Esta ação irá:\n" +
                    "- Atualizar o status do identificador para CONCLUÍDO\n" +
                    "- Não poderá ser desfeita\n\n" +
                    "Deseja continuar?";
                
                MessageBox.confirm(sConfirmMessage, {
                    title: "Confirmar Finalização",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            // User confirmed, proceed with status update
                            that._updateReceiptStatus(sNf);
                        }
                    }
                });
            } catch (oError) {
                this.handleServiceError(oError, {
                    defaultMessage: "Erro ao finalizar recebimento",
                    context: "Finalizar Recebimento NF"
                });
            }
        },

        /**
         * Perform quantity validation between received items and NF
         * @private
         */
        _performQuantityValidation: function () {
            var oFinalizarRecebimentoModel = this.getModel("finalizarRecebimento");
            var sNf = oFinalizarRecebimentoModel.getProperty("/nf");
            
            if (!sNf || sNf.trim() === "") {
                this.showErrorMessage("NF não encontrada para validação");
                return;
            }
            
            // Set loading state
            oFinalizarRecebimentoModel.setProperty("/loading", true);
            oFinalizarRecebimentoModel.setProperty("/error", null);
            
            // Perform validation in parallel
            Promise.all([
                this._fetchReceivedItems(sNf),
                this._fetchNFItems(sNf)
            ]).then(function (aResults) {
                this._processValidationResults(aResults[0], aResults[1], sNf);
            }.bind(this)).catch(function (oError) {
                this._handleValidationError(oError, sNf);
            }.bind(this)).finally(function () {
                oFinalizarRecebimentoModel.setProperty("/loading", false);
            }.bind(this));
        },

        /**
         * Fetch received items from Items entity
         * @private
         * @param {string} sNf the invoice number
         * @returns {Promise} promise that resolves with received items
         */
        _fetchReceivedItems: function (sNf) {
            var sPath = "/ItemsSet";
            var oFilters = {
                "$filter": "Nf eq '" + encodeURIComponent(sNf) + "'"
            };
            
            return this.readEntity(sPath, {
                urlParameters: oFilters,
                showBusy: false,
                handleError: true
            }).then(function (oData) {
                return oData && oData.results ? oData.results : [];
            });
        },

        /**
         * Fetch NF items from ItemsNF entity
         * @private
         * @param {string} sNf the invoice number
         * @returns {Promise} promise that resolves with NF items
         */
        _fetchNFItems: function (sNf) {
            var sPath = "/ItemsNFSet";
            var oFilters = {
                "$filter": "Nf eq '" + encodeURIComponent(sNf) + "'"
            };
            
            return this.readEntity(sPath, {
                urlParameters: oFilters,
                showBusy: false,
                handleError: true
            }).then(function (oData) {
                var aItems = oData && oData.results ? oData.results : [];
                return aItems.map(function (oItem) {
                    return {
                        Nf: oItem.Nf,
                        ItmNum: oItem.ItmNum,
                        Material: oItem.Matnr,
                        Quantidade: oItem.Qtd
                    };
                });
            });
        },

        /**
         * Process validation results and check for quantity differences
         * @private
         * @param {array} aReceivedItems array of received items
         * @param {array} aNFItems array of NF items
         * @param {string} sNf the invoice number
         */
        _processValidationResults: function (aReceivedItems, aNFItems, sNf) {
            // Group quantities by material for received items
            var oReceivedQuantities = this._groupQuantitiesByMaterial(aReceivedItems);
            
            // Group quantities by material for NF items
            var oNFQuantities = this._groupQuantitiesByMaterial(aNFItems);
            
            // Compare quantities and find differences
            var aDifferences = this._compareQuantities(oReceivedQuantities, oNFQuantities);
            
            if (aDifferences.length > 0) {
                // Show divergence dialog
                this._showDivergenceDialog(aDifferences, sNf);
            } else {
                // No differences found, proceed with finalization
                this._proceedWithFinalization(sNf);
            }
        },

        /**
         * Group quantities by material
         * @private
         * @param {array} aItems array of items
         * @returns {object} object with material codes as keys and total quantities as values
         */
        _groupQuantitiesByMaterial: function (aItems) {
            var oGrouped = {};
            
            aItems.forEach(function (oItem) {
                var sMaterial = oItem.Material;
                var fQuantity = parseFloat(oItem.Quantidade) || 0;
                
                if (oGrouped[sMaterial]) {
                    oGrouped[sMaterial] += fQuantity;
                } else {
                    oGrouped[sMaterial] = fQuantity;
                }
            });
            
            return oGrouped;
        },

        /**
         * Compare quantities between received and NF items
         * @private
         * @param {object} oReceivedQuantities grouped received quantities
         * @param {object} oNFQuantities grouped NF quantities
         * @returns {array} array of differences found
         */
        _compareQuantities: function (oReceivedQuantities, oNFQuantities) {
            var aDifferences = [];
            var aAllMaterials = new Set([
                ...Object.keys(oReceivedQuantities),
                ...Object.keys(oNFQuantities)
            ]);
            
            aAllMaterials.forEach(function (sMaterial) {
                var fReceivedQty = oReceivedQuantities[sMaterial] || 0;
                var fNFQty = oNFQuantities[sMaterial] || 0;
                var fDifference = fNFQty - fReceivedQty;
                
                if (Math.abs(fDifference) > 0.01) { // Allow for small rounding differences
                    aDifferences.push({
                        material: sMaterial,
                        receivedQty: fReceivedQty,
                        nfQty: fNFQty,
                        difference: fDifference
                    });
                }
            });
            
            return aDifferences;
        },

        /**
         * Show divergence dialog (print 3)
         * @private
         * @param {array} aDifferences array of quantity differences
         * @param {string} sNf the invoice number
         */
        _showDivergenceDialog: function (aDifferences, sNf) {
            var sMessage = "Existe divergência para este recebimento.\n" +
                          "Ao finalizar será aberta uma ocorrência de divergência\n" +
                          "de quantidades entre Recebimento e NF.";
            
            MessageBox.confirm(sMessage, {
                title: "Atenção",
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        // User chose to continue - proceed with occurrence creation
                        this._proceedWithOccurrenceCreation(aDifferences, sNf);
                    }
                    // User chose to cancel - do nothing
                }.bind(this)
            });
        },

        /**
         * Proceed with occurrence creation for divergence
         * @private
         * @param {array} aDifferences array of quantity differences
         * @param {string} sNf the invoice number
         */
        _proceedWithOccurrenceCreation: function (aDifferences, sNf) {
            // Get identificador from the current model
            var oFinalizarRecebimentoModel = this.getModel("finalizarRecebimento");
            var aIdentificadores = oFinalizarRecebimentoModel.getProperty("/identificadores") || [];
            var sIdentificador = aIdentificadores.length > 0 ? aIdentificadores[0] : "";
            
            // Store divergence data in global context
            var oGlobalContext = {
                nf: sNf,
                identificador: sIdentificador,
                divergences: aDifferences,
                source: "FinalizarRecebimentoNF",
                divergenceNF: true, // Flag to indicate this is a divergence case
                multipleOccurrences: true // Flag to indicate multiple occurrences needed
            };
            
            this._setGlobalReceiptContext(oGlobalContext);
            
            // Navigate to occurrence screen
            this.navTo("RouteOcorrencia");
        },


        /**
         * Proceed with finalization without divergence
         * @private
         * @param {string} sNf the invoice number
         */
        _proceedWithFinalization: function (sNf) {
            var that = this;
            var sMessage = "Recebimento finalizado com sucesso para a NF " + sNf;
            
            // First update the StatusReceb to CONCLUIDO
            this._updateReceiptStatus(sNf)
                .then(function () {
                    // Show success message after status update
                    MessageBox.success(sMessage, {
                        title: "Sucesso",
                        actions: [MessageBox.Action.OK],
                        emphasizedAction: MessageBox.Action.OK,
                        onClose: function (oAction) {
                            if (oAction === MessageBox.Action.OK) {
                                // Navigate to main menu only after user confirms
                                that.navToMainMenu();
                            }
                        }
                    });
                })
                .catch(function (oError) {
                    // Handle error updating status
                    this.showErrorMessage("Erro ao finalizar status do recebimento: " + (oError.message || "Erro desconhecido"));
                }.bind(this));
        },

        /**
         * Update receipt status to CONCLUIDO
         * @private
         * @param {string} sNf the invoice number
         */
        _updateReceiptStatus: function (sNf) {
            var that = this;
            var oGlobalContext = this.getGlobalReceiptContext();
            
            if (!oGlobalContext || !oGlobalContext.identificadores) {
                this.showErrorMessage("Contexto global não encontrado");
                return;
            }
            
            this.showBusyIndicator("Atualizando status...");
            
            // Update all headers for this NF and its identifiers
            var aPromises = oGlobalContext.identificadores.map(function (sIdentificador) {
                var sHeaderPath = "/HeaderSet(Nf='" + sNf + "',Identificador='" + sIdentificador + "')";
                
                var oUpdateData = {
                    StatusReceb: "CONCLUIDO"
                };
                
                return that.updateEntity(sHeaderPath, oUpdateData, {
                    showBusy: false,
                    handleError: true
                });
            });
            
            Promise.all(aPromises)
                .then(function () {
                    that.hideBusyIndicator();
                    
                    // Show success message
                    MessageBox.success("Recebimento finalizado com sucesso!", {
                        title: "Sucesso",
                        actions: [MessageBox.Action.OK],
                        onClose: function () {
                            // Navigate to main menu
                            that.navToMainMenu();
                        }
                    });
                })
                .catch(function (oError) {
                    that.hideBusyIndicator();
                    that.showErrorMessage("Erro ao atualizar status do recebimento: " + (oError.message || "Erro desconhecido"));
                });
        },

        /**
         * Handle validation error
         * @private
         * @param {object} oError the error object
         * @param {string} sNf the invoice number
         */
        _handleValidationError: function (oError, sNf) {
            var sErrorMessage = "Erro ao validar quantidades para a NF " + sNf;
            
            if (oError && oError.message) {
                sErrorMessage += ": " + oError.message;
            }
            
            this.showErrorMessage(sErrorMessage);
        }
    });
});
