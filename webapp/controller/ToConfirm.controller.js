sap.ui.define([
    "./BaseController",
    "sap/m/MessageBox"
], function (BaseController, MessageBox) {
    "use strict";

    return BaseController.extend("zui5recebfisic.controller.ToConfirm", {

        onInit: function () {
            // Initialize the TO_CONFIRM screen
            this._initializeLocalModel();
            this._initializeMobileFeatures();
            
            // Attach route matched handler to load parameters when navigating to this view
            this.getRouter().getRoute("RouteToConfirm").attachPatternMatched(this._onRouteMatched, this);
            
            // Attach after rendering handler to set focus
            this.getView().attachAfterRendering(this._onAfterRendering, this);
        },

        /**
         * Initialize local model for TO_CONFIRM state
         * @private
         */
        _initializeLocalModel: function () {
            this.createLocalModel({
                UC: "",
                SuggestedPosition: "",
                SelectedPosition: "",
                isProcessing: false,
                errorMessage: "",
                successMessage: ""
            }, "toConfirm");
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
            var aButtonIds = [
                "toConfirmInicioButton",
                "toConfirmOcorrenciaButton",
                "toConfirmConcluirButton"
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
         * Enhance buttons for touch interaction
         * @private
         */
        _enhanceButtonsForTouch: function () {
            var that = this;
            var aButtonIds = [
                "toConfirmInicioButton",
                "toConfirmOcorrenciaButton",
                "toConfirmConcluirButton"
            ];
            
            aButtonIds.forEach(function (sButtonId) {
                var oButton = that.byId(sButtonId);
                if (oButton) {
                    oButton.addStyleClass("mobileActionButton");
                }
            });
        },

        /**
         * Handle route matched event to load parameters
         * @param {sap.ui.base.Event} oEvent - Route matched event
         * @private
         */
        _onRouteMatched: function (oEvent) {
            var oModel = this.getModel("toConfirm");
            var oComponent = this.getOwnerComponent();
            var oGlobalModel = oComponent.getModel("globalContext");
            
            
            // Get data from global model
            var oToConfirmData = null;
            if (oGlobalModel) {
                oToConfirmData = oGlobalModel.getProperty("/toConfirmData");
            }
            
            if (oToConfirmData) {
                var sUC = oToConfirmData.UC || "";
                var sSuggestedPosition = oToConfirmData.SuggestedPosition || "";
                
                
                oModel.setProperty("/UC", sUC);
                oModel.setProperty("/SuggestedPosition", sSuggestedPosition);
                
            } else {
            }
            
            // Set focus to the selected position input field
            this._setFocusToSelectedPositionField();
        },

        /**
         * Handle after rendering event to set focus
         * @private
         */
        _onAfterRendering: function () {
            // Set focus after rendering - this will be called every time the view is rendered
            this._setFocusToSelectedPositionField();
        },

        /**
         * Set focus to the selected position input field
         * @private
         */
        _setFocusToSelectedPositionField: function () {
            var that = this;
            
            // Try multiple times with different delays to ensure the field is available
            var attempts = [50, 150, 300, 500];
            var currentAttempt = 0;
            
            function tryFocus() {
                if (currentAttempt >= attempts.length) {
                    console.warn("ToConfirm - Failed to set focus after all attempts");
                    return;
                }
                
                setTimeout(function () {
                    var oSelectedPositionInput = that.byId("selectedPositionInput");
                    if (oSelectedPositionInput && oSelectedPositionInput.getDomRef()) {
                        oSelectedPositionInput.focus();
                    } else {
                        currentAttempt++;
                        tryFocus();
                    }
                }, attempts[currentAttempt]);
            }
            
            tryFocus();
        },

        /**
         * Handle selected position change
         * @public
         */
        onSelectedPositionChange: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oModel = this.getModel("toConfirm");
            
            if (oModel) {
                oModel.setProperty("/SelectedPosition", sValue);
                oModel.setProperty("/errorMessage", "");
                oModel.setProperty("/successMessage", "");
                
                // Hide messages
                this._hideMessages();
            }
        },

        /**
         * Handle Enter key press on selected position input
         * Executes the same action as the "Concluir" button
         * @public
         */
        onSelectedPositionSubmit: function (oEvent) {
            // Check if position is different from suggested and show confirmation dialog
            this._checkPositionAndConfirm();
        },

        /**
         * Navigate back to main menu
         * @public
         */
        onNavBack: function () {
            this.getRouter().navTo("RouteMainMenu");
        },

        /**
         * Navigate to inicio (main menu)
         * @public
         */
        onInicioPress: function () {
            this.getRouter().navTo("RouteMainMenu");
        },

        /**
         * Navigate to occurrence registration
         * @public
         */
        onOcorrenciaPress: function () {
            
            // Get current toConfirm data
            var oToConfirmModel = this.getModel("toConfirm");
            var oComponent = this.getOwnerComponent();
            var oGlobalModel = oComponent.getModel("globalContext");
            
            if (!oToConfirmModel) {
                this.showErrorMessage("Dados da tela não encontrados");
                return;
            }

            var oToConfirmData = oToConfirmModel.getData();
            
            // Get additional context data from global model
            var oGlobalToConfirmData = null;
            if (oGlobalModel) {
                oGlobalToConfirmData = oGlobalModel.getProperty("/toConfirmData");
            }
            
            // Validate required data
            var sNF = "";
            var sIdentificador = "";
            var sUC = oToConfirmData.UC;
            
            if (oGlobalToConfirmData) {
                sNF = oGlobalToConfirmData.NF || "";
                sIdentificador = oGlobalToConfirmData.Identificador || "";
            }
            
            if (!sNF || !sIdentificador || !sUC) {
                this.showErrorMessage("Dados incompletos para registrar ocorrência. NF, Identificador e UC são obrigatórios.");
                return;
            }

            // Save data to global context for occurrence screen
            this._saveToGlobalContextForOccurrence(sNF, sIdentificador, sUC);

            // Navigate to occurrence registration screen
            this.navToOcorrencia();
        },

        /**
         * Save toConfirm context data to global context for occurrence screen
         * @private
         * @param {string} sNF the invoice number
         * @param {string} sIdentificador the container identifier
         * @param {string} sUC the unit of consumption
         */
        _saveToGlobalContextForOccurrence: function (sNF, sIdentificador, sUC) {
            var oComponent = this.getOwnerComponent();

            // Create or get global context model
            var oGlobalModel = oComponent.getModel("globalContext");
            if (!oGlobalModel) {
                var JSONModel = sap.ui.model.json.JSONModel;
                oGlobalModel = new JSONModel({});
                oComponent.setModel(oGlobalModel, "globalContext");
            }

            // Update global context with current toConfirm data
            var oGlobalData = oGlobalModel.getData();
            oGlobalData.nf = sNF;
            oGlobalData.identificador = sIdentificador;
            oGlobalData.uc = sUC; // UC is specific to ToConfirm context
            oGlobalData.currentStep = "Ocorrencia";
            oGlobalData.sourceScreen = "ToConfirm"; // Track source screen

            oGlobalModel.setData(oGlobalData);

            // Also save to component level receiptContext model for backup
            var oComponentReceiptModel = oComponent.getModel("receiptContext");
            if (!oComponentReceiptModel) {
                var JSONModel = sap.ui.model.json.JSONModel;
                oComponentReceiptModel = new JSONModel({});
                oComponent.setModel(oComponentReceiptModel, "receiptContext");
            }

            oComponentReceiptModel.setData({
                nf: sNF,
                identificador: sIdentificador,
                uc: sUC,
                currentStep: "Ocorrencia",
                sourceScreen: "ToConfirm"
            });
        },

        /**
         * Conclude the TO_CONFIRM process
         * @public
         */
        onConcluirPress: function () {
            // Check if position is different from suggested and show confirmation dialog
            this._checkPositionAndConfirm();
        },

        /**
         * Check if position is different from suggested and show confirmation dialog
         * @private
         */
        _checkPositionAndConfirm: function () {
            var oModel = this.getModel("toConfirm");
            var sSelectedPosition = oModel.getProperty("/SelectedPosition");
            var sSuggestedPosition = oModel.getProperty("/SuggestedPosition");
            
            // Validate required fields
            if (!sSelectedPosition || sSelectedPosition.trim() === "") {
                this.showErrorMessage("Por favor, informe a posição selecionada");
                return;
            }
            
            // Check if position is different from suggested
            if (sSuggestedPosition && sSelectedPosition.trim() !== sSuggestedPosition.trim()) {
                // Show confirmation dialog
                this._showPositionConfirmationDialog(sSelectedPosition, sSuggestedPosition);
            } else {
                // Position is the same as suggested or no suggested position, proceed directly
                this._startConfirmationProcess(sSelectedPosition, sSuggestedPosition);
            }
        },

        /**
         * Show confirmation dialog when position is different from suggested
         * @private
         * @param {string} sSelectedPosition the selected position
         * @param {string} sSuggestedPosition the suggested position
         */
        _showPositionConfirmationDialog: function (sSelectedPosition, sSuggestedPosition) {
            var that = this;
            var sMessage = "A posição selecionada (" + sSelectedPosition + ") é diferente da posição sugerida (" + sSuggestedPosition + ").\n\nDeseja continuar com a posição selecionada?";
            
            MessageBox.confirm(sMessage, {
                title: "Confirmação de Posição",
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        that._showPositionOccurrenceDialog(sSelectedPosition, sSuggestedPosition);
                    } else {
                        // Do nothing, user cancelled
                    }
                }
            });
        },

        /**
         * Show position occurrence dialog with combobox for occurrence types
         * @private
         * @param {string} sSelectedPosition the selected position
         * @param {string} sSuggestedPosition the suggested position
         */
        _showPositionOccurrenceDialog: function (sSelectedPosition, sSuggestedPosition) {
            var that = this;
            
            // Create combobox first to get a reference
            var oComboBox = new sap.m.ComboBox({
                placeholder: "Selecione o tipo de ocorrência",
                width: "100%",
                selectionChange: function (oEvent) {
                    var oSelectedItem = oEvent.getParameter("selectedItem");
                    if (oSelectedItem) {
                        that._sSelectedOccurrenceType = oSelectedItem.getKey();
                    }
                }
            });

            // Create dialog content with proper spacing using addStyleClass
            var oDialogContent = new sap.m.VBox({
                items: [
                    new sap.m.Label({
                        text: "Indicar motivo para utilização de outra posição"
                    }),
                    oComboBox
                ]
            });

            // Add spacing classes after creation
            oDialogContent.addStyleClass("sapUiMediumMargin");
            var oLabel = oDialogContent.getItems()[0];
            oLabel.addStyleClass("sapUiMediumMarginBottom");
            oComboBox.addStyleClass("sapUiMediumMarginBottom");

            // Create dialog with better sizing
            var oDialog = new sap.m.Dialog({
                title: "Ocorrência de Mudança de Posição",
                content: oDialogContent,
                contentWidth: "400px",
                contentHeight: "auto",
                resizable: false,
                draggable: false,
                beginButton: new sap.m.Button({
                    text: "OK",
                    type: "Emphasized",
                    press: function () {
                        if (that._sSelectedOccurrenceType) {
                            oDialog.close();
                            that._createPositionOccurrence(sSelectedPosition, sSuggestedPosition);
                        } else {
                            MessageBox.alert("Por favor, selecione um tipo de ocorrência.");
                        }
                    }
                }),
                endButton: new sap.m.Button({
                    text: "Cancelar",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            // Add dialog to view
            this.getView().addDependent(oDialog);

            // Load occurrence types and open dialog
            this._loadPositionOccurrenceTypes(oComboBox)
                .then(function () {
                    oDialog.open();
                })
                .catch(function (oError) {
                    console.error("Error loading occurrence types:", oError);
                    MessageBox.alert("Erro ao carregar tipos de ocorrência.");
                });
        },

        /**
         * Load occurrence types for position differences from backend
         * @private
         * @param {sap.m.ComboBox} oComboBox the combobox reference to populate
         * @returns {Promise} promise for loading occurrence types
         */
        _loadPositionOccurrenceTypes: function (oComboBox) {
            var that = this;
            var oModel = this.getModel();
            
            return new Promise(function (resolve, reject) {
                
                // Query TipoOcorrencia with PosDif filter from backend
                oModel.read("/TipoOcorrenciaSet", {
                    filters: [
                        new sap.ui.model.Filter("PosDif", sap.ui.model.FilterOperator.EQ, "X")
                    ],
                    success: function (oData) {
                        
                        var aFilteredTypes = oData.results;
                        
                        if (oComboBox) {
                            if (aFilteredTypes.length > 0) {
                                // Clear existing items first
                                oComboBox.removeAllItems();
                                
                                // Add items manually to ensure they are displayed
                                aFilteredTypes.forEach(function (oType) {
                                    var oItem = new sap.ui.core.ListItem({
                                        key: oType.Tipo,
                                        text: oType.Tipo + " - " + oType.Descr
                                    });
                                    oComboBox.addItem(oItem);
                                });
                                
                            } else {
                                MessageBox.alert("Nenhum tipo de ocorrência encontrado para posições diferentes.");
                            }
                        } else {
                            console.error("ComboBox reference is null!");
                        }
                        
                        resolve(aFilteredTypes);
                    },
                    error: function (oError) {
                        console.error("Error loading TipoOcorrencia:", oError);
                        reject(oError);
                    }
                });
            });
        },

        /**
         * Create occurrence for position difference
         * @private
         * @param {string} sSelectedPosition the selected position
         * @param {string} sSuggestedPosition the suggested position
         */
        _createPositionOccurrence: function (sSelectedPosition, sSuggestedPosition) {
            var that = this;
            var oModel = this.getModel("toConfirm");
            var sUC = oModel.getProperty("/UC");
            
            // Get NF and Identificador from global model
            var oComponent = this.getOwnerComponent();
            var oGlobalModel = oComponent.getModel("globalContext");
            var sNF = "";
            var sIdentificador = "";
            
            if (oGlobalModel) {
                var oToConfirmData = oGlobalModel.getProperty("/toConfirmData");
                if (oToConfirmData) {
                    sNF = oToConfirmData.NF || "";
                    sIdentificador = oToConfirmData.Identificador || "";
                }
            }
            
            if (!sNF || !sIdentificador || !sUC || !this._sSelectedOccurrenceType) {
                MessageBox.alert("Dados incompletos para criar ocorrência.");
                return;
            }
            
            // Show loading
            this.showMobileLoading("Criando ocorrência...", 0);
            
            // Prepare occurrence data
            var oOccurrenceData = {
                Nf: sNF,
                Identificador: sIdentificador,
                Uc: sUC,
                Material: "", // Empty as per requirement
                Quantidade: "", // Empty as per requirement
                TipoOco: this._sSelectedOccurrenceType,
                Descr: "Posição divergente da indicada – " + sSelectedPosition, // Use the required format
                Deposito: "" // Empty as per requirement
            };
            
            // Call CriarOcorrencia function
            this._callCriarOcorrencia(oOccurrenceData)
                .then(function (oResult) {
                    that.hideMobileLoading();
                    that.showSuccessMessage("Ocorrência criada com sucesso");
                    
                    // Clear selected occurrence type
                    that._sSelectedOccurrenceType = null;
                    
                    // Continue with normal confirmation process
                    that._startConfirmationProcess(sSelectedPosition, sSuggestedPosition);
                })
                .catch(function (oError) {
                    that.hideMobileLoading();
                    console.error("Error creating occurrence:", oError);
                    MessageBox.alert("Erro ao criar ocorrência: " + (oError.message || "Erro desconhecido"));
                });
        },

        /**
         * Call CriarOcorrencia function
         * @private
         * @param {object} oOccurrenceData the occurrence data
         * @returns {Promise} promise for the function call
         */
        _callCriarOcorrencia: function (oOccurrenceData) {
            var that = this;
            var oModel = this.getModel();
            
            return new Promise(function (resolve, reject) {
                
                oModel.callFunction("/CriarOco", {
                    method: "POST",
                    urlParameters: {
                        Nf: oOccurrenceData.Nf,
                        Identificador: oOccurrenceData.Identificador,
                        Uc: oOccurrenceData.Uc,
                        Material: oOccurrenceData.Material,
                        Quantidade: oOccurrenceData.Quantidade,
                        TipoOco: oOccurrenceData.TipoOco,
                        Descr: oOccurrenceData.Descr,
                        Deposito: oOccurrenceData.Deposito
                    },
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
                        console.error("ToConfirm - Error calling CriarOcorrencia:", oError);
                        reject(oError);
                    }
                });
            });
        },

        /**
         * Start the confirmation process
         * @private
         */
        _startConfirmationProcess: function (sSelectedPosition, sSuggestedPosition) {
            var that = this;
            var oModel = this.getModel("toConfirm");
            var sUC = oModel.getProperty("/UC");
            
            // Show loading
            oModel.setProperty("/isProcessing", true);
            this._showLoading(true);
            this._hideMessages();
            
            // Determine exception code
            var sExceptionCode = "";
            if (sSelectedPosition !== sSuggestedPosition) {
                sExceptionCode = "CHBD"; // Exception code for different positions
            }
            
            // Call backend to confirm the task
            this._confirmTask(sSelectedPosition, sExceptionCode, sUC)
                .then(function (oResult) {
                    return that._updateStatusUC();
                })
                .then(function () {
                    // Clear data from both screens before navigating
                    that._clearAllScreenData();
                    
                    // Show success message in popup and navigate to main menu when OK is clicked
                    that.showSuccessMessageWithAction(
                        "Movimentação realizada com sucesso",
                        "OK",
                        function () {
                            that.getRouter().navTo("RouteMainMenu");
                        }
                    );
                })
                .catch(function (oError) {
                    that._handleConfirmationError(oError);
                })
                .finally(function () {
                    oModel.setProperty("/isProcessing", false);
                    that._showLoading(false);
                });
        },

        /**
         * Confirm the task via backend
         * @private
         */
        _confirmTask: function (sSelectedPosition, sExceptionCode, sUC) {
            var oModel = this.getModel();
            var that = this;
            
            return new Promise(function (resolve, reject) {
                
                oModel.callFunction("/ConfirmToConfirm", {
                    method: "POST",
                    urlParameters: {
                        SelectedPosition: sSelectedPosition,
                        ExceptionCode: sExceptionCode,
                        UC: sUC
                    },
                    success: function (oData) {
                        
                        // Check if the operation was successful
                        if (oData && oData.Success === 'X') {
                            resolve(oData);
                        } else {
                            // Operation failed - show error message on screen
                            var sErrorMessage = oData && oData.Message ? oData.Message : "Erro ao confirmar tarefa";
                            console.error("ToConfirm - Task confirmation failed:", sErrorMessage);
                            
                            // Show error message on screen (not popup)
                            that._showErrorMessage(sErrorMessage);
                            reject({
                                message: sErrorMessage,
                                responseData: oData
                            });
                        }
                    },
                    error: function (oError) {
                        console.error("ToConfirm - Error confirming task:", oError);
                        
                        // Show error message to user on screen (not popup)
                        var sErrorMessage = "Erro ao confirmar tarefa";
                        
                        // Parse error message from backend
                        if (oError && oError.responseText) {
                            try {
                                var oErrorData = JSON.parse(oError.responseText);
                                if (oErrorData.error && oErrorData.error.message && oErrorData.error.message.value) {
                                    sErrorMessage = oErrorData.error.message.value;
                                }
                            } catch (e) {
                                // Use default message if parsing fails
                            }
                        } else if (oError && oError.message) {
                            sErrorMessage = oError.message;
                        }
                        
                        that._showErrorMessage(sErrorMessage);
                        reject(oError);
                    }
                });
            });
        },

        /**
         * Update StatusUC to mark ConfTd2 as completed
         * @private
         */
        _updateStatusUC: function () {
            var oModel = this.getModel("toConfirm");
            var sUC = oModel.getProperty("/UC");
            
            // Get NF and Identificador from the global model
            var oComponent = this.getOwnerComponent();
            var oGlobalModel = oComponent.getModel("globalContext");
            var sNF = "";
            var sIdentificador = "";
            
            if (oGlobalModel) {
                var oToConfirmData = oGlobalModel.getProperty("/toConfirmData");
                if (oToConfirmData) {
                    sNF = oToConfirmData.NF || "";
                    sIdentificador = oToConfirmData.Identificador || "";
                }
            }
            
            
            if (!sNF || !sIdentificador) {
                return Promise.reject({
                    message: "NF ou Identificador não encontrados para atualizar StatusUC"
                });
            }
            
            return this._updateStatusUCMultipleFields(sUC, sNF, sIdentificador, {
                Td1: "X",
                Td2: "X", 
                ConfTd2: "X"
            });
        },

        /**
         * Update StatusUC entity with multiple fields
         * @private
         */
        _updateStatusUCMultipleFields: function (sUC, sNF, sIdentificador, oFields) {
            var oModel = this.getModel();
            
            return new Promise(function (resolve, reject) {
                // Update the StatusUC entity with multiple fields
                var sPath = "/StatusUCSet(Uc='" + sUC + "',Nf='" + sNF + "',Identificador='" + sIdentificador + "')";
                
                
                oModel.update(sPath, oFields, {
                    success: function () {
                        resolve();
                    },
                    error: function (oError) {
                        console.error("ToConfirm - Error updating StatusUC:", oError);
                        reject(oError);
                    }
                });
            });
        },

        /**
         * Update StatusUC entity field (legacy method - kept for compatibility)
         * @private
         */
        _updateStatusUCField: function (sUC, sNF, sIdentificador, sField, sValue) {
            var oModel = this.getModel();
            
            return new Promise(function (resolve, reject) {
                // Update the StatusUC entity
                var sPath = "/StatusUCSet(Uc='" + sUC + "',Nf='" + sNF + "',Identificador='" + sIdentificador + "')";
                var oData = {};
                oData[sField] = sValue;
                
                oModel.update(sPath, oData, {
                    success: function () {
                        resolve();
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },

        /**
         * Show loading indicator
         * @private
         */
        _showLoading: function (bShow) {
            var oLoadingIndicator = this.byId("toConfirmLoadingIndicator");
            if (oLoadingIndicator) {
                oLoadingIndicator.setVisible(bShow);
            }
        },

        /**
         * Show error message
         * @private
         */
        _showErrorMessage: function (sMessage) {
            var oErrorStrip = this.byId("toConfirmErrorMessage");
            if (oErrorStrip) {
                oErrorStrip.setText(sMessage);
                oErrorStrip.setVisible(true);
            }
            var oSuccessStrip = this.byId("toConfirmSuccessMessage");
            if (oSuccessStrip) {
                oSuccessStrip.setVisible(false);
            }
        },

        /**
         * Show success message
         * @private
         */
        _showSuccessMessage: function (sMessage) {
            var oSuccessStrip = this.byId("toConfirmSuccessMessage");
            if (oSuccessStrip) {
                oSuccessStrip.setText(sMessage);
                oSuccessStrip.setVisible(true);
            }
            var oErrorStrip = this.byId("toConfirmErrorMessage");
            if (oErrorStrip) {
                oErrorStrip.setVisible(false);
            }
        },

        /**
         * Hide all messages
         * @private
         */
        _hideMessages: function () {
            var oErrorStrip = this.byId("toConfirmErrorMessage");
            if (oErrorStrip) {
                oErrorStrip.setVisible(false);
            }
            var oSuccessStrip = this.byId("toConfirmSuccessMessage");
            if (oSuccessStrip) {
                oSuccessStrip.setVisible(false);
            }
        },

        /**
         * Handle confirmation process errors
         * @private
         */
        _handleConfirmationError: function (oError) {
            var sErrorMessage = "Erro na confirmação da tarefa";
            
            // Handle OData error response
            if (oError && oError.responseText) {
                try {
                    var oErrorData = JSON.parse(oError.responseText);
                    if (oErrorData.error && oErrorData.error.message && oErrorData.error.message.value) {
                        sErrorMessage = oErrorData.error.message.value;
                    }
                } catch (e) {
                    // Use default message if parsing fails
                }
            } else if (oError && oError.message) {
                sErrorMessage = oError.message;
            }
            
            this._showErrorMessage(sErrorMessage);
        },

        /**
         * Clear all data from ToConfirm screen
         * @public
         */
        clearScreenData: function () {
            var oModel = this.getModel("toConfirm");
            
            if (oModel) {
                // Reset model to initial state
                oModel.setProperty("/UC", "");
                oModel.setProperty("/SuggestedPosition", "");
                oModel.setProperty("/SelectedPosition", "");
                oModel.setProperty("/isProcessing", false);
                oModel.setProperty("/errorMessage", "");
                oModel.setProperty("/successMessage", "");
            }
            
            // Clear the selected position input field
            var oSelectedPositionInput = this.byId("selectedPositionInput");
            if (oSelectedPositionInput) {
                oSelectedPositionInput.setValue("");
            }
            
            // Clear global context data
            var oComponent = this.getOwnerComponent();
            var oGlobalModel = oComponent.getModel("globalContext");
            if (oGlobalModel) {
                oGlobalModel.setProperty("/toConfirmData", null);
            }
            
            // Hide loading indicator
            this._showLoading(false);
            
            // Hide messages
            this._hideMessages();
            
        },

        /**
         * Clear data from both ArmazenarUC and ToConfirm screens
         * @private
         */
        _clearAllScreenData: function () {
            // Clear ToConfirm screen data
            this.clearScreenData();

            /* Alterado por Mafra - Inicio
            Para limpeza da tela, criei o object matched na rota do armazenarUC.

            // Clear ArmazenarUC screen data
            var oComponent = this.getOwnerComponent();
            //var oArmazenarUCController = oComponent.getController("ArmazenarUC");
            var oArmazenarUCView = oComponent.getRootControl().byId("ArmazenarUC");
            if (oArmazenarUCController && oArmazenarUCController.clearScreenData) {
                oArmazenarUCController.clearScreenData();
            }
            
            Alterado por Mafra - Fim
            */
            
        }
    });
});
