sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("zui5recebfisic.controller.OcorrenciaSegregacao", {

        onInit: function () {
            // Initialize the occurrence segregation screen
            this._initializeSegregationModel();
            this._initializeDepositosModel();
            this._initializeMobileFeatures();
        },

        /**
         * Initialize the segregation context model
         * @private
         */
        _initializeSegregationModel: function () {
            var oSegregationData = {
                nf: "",
                identificador: "",
                uc: "",
                material: "",
                quantidade: "",
                tipoOcorrencia: "",
                descricao: "",
                deposito: "",
                tipoOcorrenciaDesc: "",
                scannedItems: [],
                scannedItemsCount: 0
            };

            // Create local model for this view
            this.createLocalModel(oSegregationData, "occurrenceContext");

            // Load data from global context
            this._loadFromGlobalContext();
        },

        /**
         * Initialize the depositos model and load data
         * @private
         */
        _initializeDepositosModel: function () {
            var oDepositosData = {
                DepositosSet: []
            };

            // Create local model for depositos
            this.createLocalModel(oDepositosData, "depositosModel");

            // Load depositos data from OData service
            this._loadDepositosData();
        },

        /**
         * Load depositos data from OData service
         * @private
         */
        _loadDepositosData: function () {
            var oModel = this.getModel();
            var oDepositosModel = this.getModel("depositosModel");
            
            if (oModel && oDepositosModel) {
                oModel.read("/DepositosSet", {
                    success: function (oData) {
                        
                        var aResults = null;
                        if (oData.results) {
                            aResults = oData.results;
                        } else if (oData.d && oData.d.results) {
                            aResults = oData.d.results;
                        } else if (Array.isArray(oData)) {
                            aResults = oData;
                        }
                        
                        if (aResults && Array.isArray(aResults)) {
                            oDepositosModel.setProperty("/DepositosSet", aResults);
                        } else {
                            console.error("No depositos data found in response");
                            oDepositosModel.setProperty("/DepositosSet", []);
                        }
                    }.bind(this),
                    error: function (oError) {
                        console.error("Error loading depositos data:", oError);
                        this.showErrorMessage("Erro ao carregar depósitos: " + (oError.message || "Erro desconhecido"));
                        oDepositosModel.setProperty("/DepositosSet", []);
                    }.bind(this)
                });
            } else {
                console.error("OData model or depositos model not available");
                this.showErrorMessage("Serviço de dados não disponível");
            }
        },

        /**
         * Load data from global context
         * @private
         */
        _loadFromGlobalContext: function () {
            var oComponent = this.getOwnerComponent();
            var oGlobalModel = oComponent.getModel("globalContext");
            var oReceiptModel = oComponent.getModel("receiptContext");

            if (oGlobalModel && oGlobalModel.getData().occurrenceData) {
                var oOccurrenceData = oGlobalModel.getData().occurrenceData;
                var oSegregationModel = this.getModel("occurrenceContext");
                
                // Load occurrence data
                oSegregationModel.setProperty("/nf", oOccurrenceData.nf || "");
                oSegregationModel.setProperty("/identificador", oOccurrenceData.identificador || "");
                oSegregationModel.setProperty("/tipoOcorrencia", oOccurrenceData.tipoOcorrencia || "");
                oSegregationModel.setProperty("/tipoOcorrenciaDesc", oOccurrenceData.tipoOcorrenciaDesc || "");
                oSegregationModel.setProperty("/descricao", oOccurrenceData.descricao || "");
                oSegregationModel.setProperty("/uc", oOccurrenceData.uc || "");
                oSegregationModel.setProperty("/sourceScreen", oOccurrenceData.sourceScreen || "");
                
                // Initialize segregation-specific fields
                oSegregationModel.setProperty("/material", "");
                oSegregationModel.setProperty("/quantidade", "");
                oSegregationModel.setProperty("/deposito", "");
            }

            // Load UC data and scanned items from receipt context
            if (oReceiptModel) {
                var oReceiptData = oReceiptModel.getData();
                var oSegregationModel = this.getModel("occurrenceContext");
                
                if (oReceiptData.nf && oReceiptData.identificador && oReceiptData.uc) {
                    oSegregationModel.setProperty("/nf", oReceiptData.nf);
                    oSegregationModel.setProperty("/identificador", oReceiptData.identificador);
                    oSegregationModel.setProperty("/uc", oReceiptData.uc);
                    
                    // Load scanned items if available
                    if (oReceiptData.scannedItems && Array.isArray(oReceiptData.scannedItems)) {
                        oSegregationModel.setProperty("/scannedItems", oReceiptData.scannedItems);
                        oSegregationModel.setProperty("/scannedItemsCount", oReceiptData.scannedItems.length);
                    }
                }
            }
        },

        /**
         * Initialize mobile-specific features
         * @private
         */
        _initializeMobileFeatures: function () {
            // Optimize form inputs for mobile
            this.optimizeFormForMobile([
                "depositoComboBox"
            ]);

            // Add haptic feedback to buttons if on mobile device
            if (this.isMobileDevice()) {
                this._addHapticFeedbackToButtons();
            }
        },

        /**
         * Add haptic feedback to action buttons
         * @private
         */
        _addHapticFeedbackToButtons: function () {
            var that = this;
            var aButtonIds = [
                "segregacaoVoltarButton",
                "segregacaoConcluirButton"
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
         * Handle deposito combobox selection change
         * @private
         * @param {sap.ui.base.Event} oEvent the selection change event
         */
        _onDepositoChange: function (oEvent) {
            var oComboBox = oEvent.getSource();
            var sSelectedKey = oComboBox.getSelectedKey();
            
            var oSegregationModel = this.getModel("occurrenceContext");
            oSegregationModel.setProperty("/deposito", sSelectedKey);

            // Clear any previous validation states
            this.clearInputValidation("depositoComboBox");
        },

        /**
         * Validate form fields
         * @private
         * @returns {boolean} true if validation passes
         */
        _validateForm: function () {
            var oSegregationModel = this.getModel("occurrenceContext");
            var sDeposito = oSegregationModel.getProperty("/deposito");
            
            var bIsValid = true;

            // Clear previous validation states
            this.clearInputValidation("depositoComboBox");

            // Validate deposito
            if (!sDeposito || sDeposito.trim().length === 0) {
                this.setInputError("depositoComboBox", "Depósito é obrigatório");
                bIsValid = false;
            }

            return bIsValid;
        },

        /**
         * Call CriarOcorrencia function with segregation parameters
         * @private
         * @param {object} oOccurrenceData the occurrence data
         * @returns {Promise} promise for the function call
         */
        _callCriarOcorrenciaWithSegregation: function (oOccurrenceData) {
            var that = this;
            
            return new Promise(function (resolve, reject) {
                // Get the OData model
                var oModel = that.getModel();
                
                if (!oModel) {
                    reject(new Error("OData model not available"));
                    return;
                }

                // Call CriarOcorrencia function import with POST method
                var oParameters = {
                    Nf: oOccurrenceData.nf,
                    Identificador: oOccurrenceData.identificador,
                    Uc: oOccurrenceData.uc || "", // UC might be empty for new occurrences
                    Material: "", // Material will be handled by the scanned items
                    Quantidade: "", // Quantidade will be handled by the scanned items
                    TipoOco: oOccurrenceData.tipoOcorrencia,
                    Descr: oOccurrenceData.descricao,
                    Deposito: oOccurrenceData.deposito // Add deposito field
                };

                oModel.callFunction("/CriarOcorrencia", {
                    method: "POST",
                    urlParameters: oParameters,
                    success: function (oData) {
                        // Check if Message parameter is filled, indicating an error
                        if (oData && oData.Message && oData.Message.trim() !== "") {
                            // Function returned success but with error message
                            var oError = new Error(oData.Message);
                            oError.responseData = oData;
                            reject(oError);
                        } else {
                            // True success - no error message
                            resolve(oData);
                        }
                    },
                    error: function (oError) {
                        console.error("Error calling CriarOcorrencia with segregation:", oError);
                        reject(oError);
                    }
                });
            });
        },

        /**
         * Navigate back to previous screen
         * @public
         */
        onVoltarPress: function () {
            this.navToOcorrencia();
        },

        /**
         * Handle conclude occurrence with segregation action
         * @public
         */
        onConcluirPress: function () {
            
            // Validate form
            if (!this._validateForm()) {
                this.showErrorMessage("Por favor, preencha todos os campos obrigatórios");
                return;
            }

            var oSegregationModel = this.getModel("occurrenceContext");
            var oOccurrenceData = oSegregationModel.getData();

            // Show loading state
            this.showMobileLoading("Processando ocorrência com segregação...", 0);

            // Call CriarOcorrencia function with segregation parameters
            this._callCriarOcorrenciaWithSegregation(oOccurrenceData)
                .then(function (oResult) {
                    this.hideMobileLoading();
                    
                    // Update StatusUC to CONCLUIDO (same as AssembleUC)
                    return this._updateStatusUCTableSafely(oOccurrenceData, "CONCLUIDO");
                }.bind(this))
                .then(function () {
                    // Call ImprimirEtiqueta function in background
                    this._callImprimirEtiquetaInBackground(oOccurrenceData.uc);
                    
                    // Show success dialog similar to AssembleUC
                    this._showOccurrenceSuccessDialog(oOccurrenceData);
                }.bind(this))
                .catch(function (oError) {
                    this.hideMobileLoading();
                    // Show error dialog with the same structure as success dialog
                    this._showOccurrenceErrorDialog(oError, oOccurrenceData);
                }.bind(this));
        },

        /**
         * Handle modify items button press - navigate back to AssembleUC
         * @public
         */
        onModificarItensPress: function () {
            this.navToAssembleUC();
        },

        /**
         * Show success dialog similar to AssembleUC
         * @private
         * @param {object} oOccurrenceData the occurrence data
         */
        _showOccurrenceSuccessDialog: function (oOccurrenceData) {
            var that = this;
            
            // Create success dialog similar to AssembleUC
            if (!this._occurrenceSuccessDialog) {
                this._occurrenceSuccessDialog = new sap.m.Dialog({
                    title: "UC Concluída",
                    icon: "sap-icon://message-success",
                    state: "Success",
                    contentWidth: "80%",
                    content: [
                        new sap.m.VBox({
                            alignItems: "Center",
                            width: "80%",
                            items: [
                                new sap.m.Text({
                                    text: "",
                                    textAlign: "Center"
                                }).addStyleClass("sapUiSmallMarginBottom"),
                                new sap.m.Text({
                                    text: "StatusUC: CONCLUIDO",
                                    textAlign: "Center"
                                }).addStyleClass("sapUiTinyMarginBottom"),
                                new sap.m.Text({
                                    text: "StatusContainer: EM ANDAMENTO",
                                    textAlign: "Center"
                                }).addStyleClass("sapUiMediumMarginBottom"),
                                new sap.m.Text({
                                    text: "O que deseja fazer agora?",
                                    textAlign: "Center"
                                }).addStyleClass("sapUiMediumMarginTop sapUiMediumMarginBottom"),
                                // Botões como parte do conteúdo para ficarem sempre visíveis
                                new sap.m.Button({
                                    text: "Criar Nova UC",
                                    icon: "sap-icon://add",
                                    type: "Emphasized",
                                    width: "100%",
                                    press: function () {
                                        that._occurrenceSuccessDialog.close();
                                        that._prepareDataForNewUC();
                                        that.navToCreateUC();
                                    }
                                }).addStyleClass("sapUiTinyMarginBottom"),
                                new sap.m.Button({
                                    text: "Voltar ao Início",
                                    icon: "sap-icon://home",
                                    width: "100%",
                                    press: function () {
                                        that._occurrenceSuccessDialog.close();
                                        that._clearAllNavigationData();
                                        that.navToMainMenu();
                                    }
                                }).addStyleClass("sapUiTinyMarginBottom"),
                                new sap.m.Button({
                                    text: "Finalizar Recebimento",
                                    icon: "sap-icon://accept",
                                    type: "Accept",
                                    width: "100%",
                                    press: function () {
                                        that._occurrenceSuccessDialog.close();
                                        that._clearAllNavigationData();
                                        that.navToFinalizarRecebimentoNF();
                                    }
                                })
                            ]
                        }).addStyleClass("sapUiMediumMargin")
                    ]
                });
                this.getView().addDependent(this._occurrenceSuccessDialog);
            }

            // Update the UC number in the first text
            var aContent = this._occurrenceSuccessDialog.getContent()[0].getItems();
            aContent[0].setText("UC " + oOccurrenceData.uc + " foi concluída com sucesso!");

            // Open the dialog
            this._occurrenceSuccessDialog.open();
        },

        /**
         * Show error dialog similar to AssembleUC but with error message
         * @private
         * @param {object} oError the error object
         * @param {object} oOccurrenceData the occurrence data
         */
        _showOccurrenceErrorDialog: function (oError, oOccurrenceData) {
            var that = this;
            var sErrorMessage = "Erro ao concluir UC";
            
            // Extract error message
            if (oError && oError.message) {
                sErrorMessage = oError.message;
            }
            
            // Create error dialog similar to success dialog but with error message
            if (!this._occurrenceErrorDialog) {
                this._occurrenceErrorDialog = new sap.m.Dialog({
                    title: "UC com Erro",
                    icon: "sap-icon://message-error",
                    state: "Error",
                    contentWidth: "80%",
                    content: [
                        new sap.m.VBox({
                            alignItems: "Center",
                            width: "80%",
                            items: [
                                new sap.m.Text({
                                    text: "",
                                    textAlign: "Center"
                                }).addStyleClass("sapUiSmallMarginBottom"),
                                new sap.m.Text({
                                    text: "StatusUC: EM ANDAMENTO",
                                    textAlign: "Center"
                                }).addStyleClass("sapUiTinyMarginBottom"),
                                new sap.m.Text({
                                    text: "StatusContainer: EM ANDAMENTO",
                                    textAlign: "Center"
                                }).addStyleClass("sapUiMediumMarginBottom"),
                                new sap.m.Text({
                                    text: "O que deseja fazer agora?",
                                    textAlign: "Center"
                                }).addStyleClass("sapUiMediumMarginTop sapUiMediumMarginBottom"),
                                // Botões como parte do conteúdo para ficarem sempre visíveis
                                new sap.m.Button({
                                    text: "Criar Nova UC",
                                    icon: "sap-icon://add",
                                    type: "Emphasized",
                                    width: "100%",
                                    press: function () {
                                        that._occurrenceErrorDialog.close();
                                        that._prepareDataForNewUC();
                                        that.navToCreateUC();
                                    }
                                }).addStyleClass("sapUiTinyMarginBottom"),
                                new sap.m.Button({
                                    text: "Voltar ao Início",
                                    icon: "sap-icon://home",
                                    width: "100%",
                                    press: function () {
                                        that._occurrenceErrorDialog.close();
                                        that._clearAllNavigationData();
                                        that.navToMainMenu();
                                    }
                                }).addStyleClass("sapUiTinyMarginBottom"),
                                new sap.m.Button({
                                    text: "Finalizar Recebimento",
                                    icon: "sap-icon://accept",
                                    type: "Accept",
                                    width: "100%",
                                    press: function () {
                                        that._occurrenceErrorDialog.close();
                                        that._clearAllNavigationData();
                                        that.navToFinalizarRecebimentoNF();
                                    }
                                })
                            ]
                        }).addStyleClass("sapUiMediumMargin")
                    ]
                });
                this.getView().addDependent(this._occurrenceErrorDialog);
            }

            // Update the error message in the first text
            var aContent = this._occurrenceErrorDialog.getContent()[0].getItems();
            aContent[0].setText("UC " + oOccurrenceData.uc + " - " + sErrorMessage);

            // Open the dialog
            this._occurrenceErrorDialog.open();
        },

        /**
         * Safely update StatusUC table - doesn't fail if update is not possible
         * @param {object} oOccurrenceData - Occurrence data with NF, UC, Identificador
         * @param {string} sStatus - New status value
         * @returns {Promise} Promise that resolves when update is complete or skipped
         * @private
         */
        _updateStatusUCTableSafely: function (oOccurrenceData, sStatus) {
            var that = this;

            // Clean the UC value by removing trailing spaces
            var sCleanUc = oOccurrenceData.uc ? oOccurrenceData.uc.trim() : oOccurrenceData.uc;

            // First, try to read the current StatusUC record to verify it exists and check current status
            var sEntityPath = "/StatusUCSet(Nf='" + oOccurrenceData.nf +
                "',Identificador='" + oOccurrenceData.identificador +
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
                    // Status updated successfully
                });
            }).catch(function (oError) {
                // If read or update fails, check the error type
                if (oError && oError.statusCode === 404) {
                    // StatusUC record doesn't exist - this is not critical for segregation
                } else if (oError && oError.statusCode === 400) {
                    // Bad request - this is not critical for segregation
                } else {
                    console.warn("StatusUC operation failed:", oError);
                }
                // Return resolved promise to continue the chain
                return Promise.resolve();
            });
        },

        /**
         * Call ImprimirEtiqueta function in background after occurrence success
         * @param {string} sUC - The UC number to print label for
         * @private
         */
        _callImprimirEtiquetaInBackground: function (sUC) {
            var that = this;
            
            // Debug: Log all available contexts
            console.log("=== DEBUG IMPRESSORA ===");
            console.log("1. retornaImrpressora():", this.retornaImrpressora());
            
            var oReceiptModel = this.getModel("receiptContext");
            if (oReceiptModel) {
                console.log("2. receiptContext data:", oReceiptModel.getData());
            } else {
                console.log("2. receiptContext model not found");
            }
            
            var oComponent = this.getOwnerComponent();
            var oGlobalModel = oComponent.getModel("globalContext");
            if (oGlobalModel) {
                console.log("3. globalContext data:", oGlobalModel.getData());
            } else {
                console.log("3. globalContext model not found");
            }
            
            // Try to get impressora from multiple sources
            let impressora = this.retornaImrpressora();
            console.log("4. Initial impressora:", impressora);
            
            // If impressora is undefined, try to get from receipt context
            if (!impressora || impressora === undefined) {
                if (oReceiptModel && oReceiptModel.getData().impressora) {
                    impressora = oReceiptModel.getData().impressora;
                    console.log("5. Got impressora from receiptContext:", impressora);
                }
            }
            
            // If still undefined, try to get from global context
            if (!impressora || impressora === undefined) {
                if (oGlobalModel && oGlobalModel.getData().impressora && oGlobalModel.getData().impressora.trim() !== '') {
                    impressora = oGlobalModel.getData().impressora;
                    console.log("6. Got impressora from globalContext:", impressora);
                }
            }
            
            // If still undefined, use a default value or skip the call
            if (!impressora || impressora === undefined) {
                console.warn("Impressora not found, skipping ImprimirEtiqueta call for UC:", sUC);
                console.log("=== END DEBUG IMPRESSORA ===");
                return;
            }

            console.log("7. Final impressora value:", impressora);
            console.log("=== END DEBUG IMPRESSORA ===");

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
                // Success - no user feedback needed
                console.log("ImprimirEtiqueta success for UC:", sCleanUc);
            }).catch(function (oError) {
                // Log error but don't show to user as this is a background operation
                console.warn("ImprimirEtiqueta failed for UC:", sCleanUc, oError);
            });
        },

        /**
         * Prepare data for new UC creation - preserve essential data
         * @private
         */
        _prepareDataForNewUC: function () {
            var oComponent = this.getOwnerComponent();
            var oGlobalModel = oComponent.getModel("globalContext");
            var oReceiptModel = oComponent.getModel("receiptContext");
            
            // Get current data
            var sNf = "";
            var sIdentificador = "";
            var sRecebEmb = "";
            var sImpressora = "";
            var sDoca = "";
            
            // Try to get from global context first
            if (oGlobalModel) {
                var oGlobalData = oGlobalModel.getData();
                sNf = oGlobalData.nf || "";
                sIdentificador = oGlobalData.identificador || "";
                sRecebEmb = oGlobalData.recebEmb || "";
                sImpressora = oGlobalData.impressora || "";
                sDoca = oGlobalData.doca || "";
            }
            
            // Try to get from receipt context if global is empty
            if ((!sNf || !sIdentificador) && oReceiptModel) {
                var oReceiptData = oReceiptModel.getData();
                sNf = sNf || oReceiptData.nf || "";
                sIdentificador = sIdentificador || oReceiptData.identificador || "";
                sRecebEmb = sRecebEmb || oReceiptData.recebEmb || "";
                sImpressora = sImpressora || oReceiptData.impressora || "";
                sDoca = sDoca || oReceiptData.doca || "";
            }
            
            // Clear all navigation data first
            this._clearAllNavigationData();
            
            // Recreate global context with essential data preserved
            if (!oGlobalModel) {
                var JSONModel = sap.ui.model.json.JSONModel;
                oGlobalModel = new JSONModel({});
                oComponent.setModel(oGlobalModel, "globalContext");
            }
            
            // Set essential data for new UC creation
            oGlobalModel.setData({
                nf: sNf,
                identificador: sIdentificador,
                recebEmb: sRecebEmb,
                impressora: sImpressora,
                doca: sDoca,
                currentStep: "CreateUC",
                sourceScreen: "OcorrenciaSegregacao"
            });
            
            // Also set receipt context
            if (!oReceiptModel) {
                var JSONModel = sap.ui.model.json.JSONModel;
                oReceiptModel = new JSONModel({});
                oComponent.setModel(oReceiptModel, "receiptContext");
            }
            
            oReceiptModel.setData({
                nf: sNf,
                identificador: sIdentificador,
                recebEmb: sRecebEmb,
                impressora: sImpressora,
                doca: sDoca,
                currentStep: "CreateUC",
                sourceScreen: "OcorrenciaSegregacao"
            });
        },

        /**
         * Clear all navigation data
         * @private
         */
        _clearAllNavigationData: function () {
            var oComponent = this.getOwnerComponent();
            var oGlobalModel = oComponent.getModel("globalContext");
            var oReceiptModel = oComponent.getModel("receiptContext");
            
            if (oGlobalModel) {
                oGlobalModel.setData({});
            }
            
            if (oReceiptModel) {
                oReceiptModel.setData({});
            }
        },

        /**
         * Navigate back to occurrence screen
         * @public
         */
        onNavBack: function () {
            this.navToOcorrencia();
        }
    });
});
