sap.ui.define([
    "./BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("zui5recebfisic.controller.ArmazenarUC", {

        onInit: function () {
            this.getRouter().getRoute("RouteArmazenarUC").attachPatternMatched(this._onRouteMatched, this);
        },
        
        onAfterRendering: function () {
            // Set focus to UC input after view is rendered
            this._setFocusToUCInput();
        },

        _onRouteMatched: function () {
            let oModel = this.getModel("armazenarUC")
            if (oModel) {
                let oData = oModel.getData()
                oData.ucInput = ""
                oData = {
                    ucInput: "",
                    isValidUC: false,
                    validationInProgress: false,
                    sItem: null,
                    errorMessage: "",
                    successMessage: ""
                }
                oModel.refresh()
            }


            // Initialize the UC Storage screen
            this._initializeLocalModel();
            this._initializeMobileFeatures();
        },

        /**
         * Initialize local model for UC Storage state
         * @private
         */
        _initializeLocalModel: function () {
            this.createLocalModel({
                ucInput: "",
                isValidUC: false,
                validationInProgress: false,
                sItem: null,
                errorMessage: "",
                successMessage: ""
            }, "armazenarUC");
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
         * Set focus to UC input field
         * @private
         */
        _setFocusToUCInput: function () {
            var that = this;
            // Use multiple attempts with increasing delays to override default focus behavior
            var delays = [100, 300, 500];
            
            delays.forEach(function (delay) {
                setTimeout(function () {
                    var oUCInput = that.byId("ucInput");
                    if (oUCInput && oUCInput.getDomRef()) {
                        oUCInput.focus();
                    }
                }, delay);
            });
        },

        /**
         * Add haptic feedback to buttons
         * @private
         */
        _addHapticFeedbackToButtons: function () {
            var that = this;
            var aButtonIds = [
                "armazenarUCInicioButton",
                "armazenarUCOcorrenciaButton",
                "proximoButton"
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
                "armazenarUCInicioButton",
                "armazenarUCOcorrenciaButton",
                "proximoButton"
            ];

            aButtonIds.forEach(function (sButtonId) {
                var oButton = that.byId(sButtonId);
                if (oButton) {
                    oButton.addStyleClass("mobileActionButton");
                }
            });
        },

        /**
         * Handle UC input change
         * @public
         */
        onUCInputChange: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oModel = this.getModel("armazenarUC");

            if (oModel) {
                // Process the input to extract UC number if it's from a label
                var sProcessedValue = this._extractUCFromInput(sValue);

                oModel.setProperty("/ucInput", sProcessedValue);
                oModel.setProperty("/isValidUC", false);
                oModel.setProperty("/errorMessage", "");
                oModel.setProperty("/successMessage", "");

                // Hide messages
                this._hideMessages();

                // Disable próximo button
                var oProximoButton = this.byId("proximoButton");
                if (oProximoButton) {
                    oProximoButton.setEnabled(false);
                }

                // Update the input field with the processed value if it changed
                if (sProcessedValue !== sValue) {
                    var oInput = this.byId("ucInput");
                    if (oInput) {
                        oInput.setValue(sProcessedValue);
                    }
                }
            }
        },

        /**
         * Extract UC number from input (handles both direct UC input and label format)
         * @private
         * @param {string} sInput - The input string (can be UC number or label format)
         * @returns {string} - The extracted UC number
         */
        _extractUCFromInput: function (sInput) {
            if (!sInput || typeof sInput !== 'string') {
                return "";
            }

            var sTrimmedInput = sInput.trim();

            // If input is already a UC number (20 digits), return as is
            if (/^\d{20}$/.test(sTrimmedInput)) {
                return sTrimmedInput;
            }

            // Check if input contains the label format pattern
            // Pattern: '42AFG3502000@                        2,000@@000000@@0000349746@00000000000000800123&'
            // The UC number is the 20-digit sequence before the '&' character
            var ucMatch = sTrimmedInput.match(/(\d{20})(?:&.*)?$/);
            if (ucMatch) {
                return ucMatch[1];
            }

            // Try to find any 20-digit sequence in the input
            var anyUcMatch = sTrimmedInput.match(/(\d{20})/);
            if (anyUcMatch) {
                return anyUcMatch[1];
            }

            // If no UC pattern found, return the original input
            return sTrimmedInput;
        },

        /**
         * Handle UC input submit
         * @public
         */
        onUCSubmit: function (oEvent) {
            var sUC = oEvent.getParameter("value");
            if (sUC && sUC.trim()) {
                // Extract UC number from input (handles both direct input and label format)
                var sProcessedUC = this._extractUCFromInput(sUC.trim());
                this._validateUC(sProcessedUC);
            }
        },

        /**
         * Validate UC by calling backend function
         * @private
         */
        _validateUC: function (sUC) {
            var that = this;
            var oModel = this.getModel("armazenarUC");

            if (oModel) {
                oModel.setProperty("/validationInProgress", true);
                this._showLoading(true);
                this._hideMessages();
            }

            // Call backend function to validate UC
            this._callValidateUCFunction(sUC)
                .then(function (oResult) {
                    that._handleValidationSuccess(oResult, sUC);
                })
                .catch(function (oError) {
                    that._handleValidationError(oError, sUC);
                })
                .finally(function () {
                    var oModel = that.getModel("armazenarUC");
                    if (oModel) {
                        oModel.setProperty("/validationInProgress", false);
                    }
                    that._showLoading(false);
                });
        },

        /**
         * Call backend function to validate UC
         * @private
         */
        _callValidateUCFunction: function (sUC) {
            var oModel = this.getModel();

            // Call function import for UC validation
            return new Promise(function (resolve, reject) {
                oModel.callFunction("/ValidateUC", {
                    method: "GET",
                    urlParameters: {
                        UC: sUC
                    },
                    success: function (oData) {
                        resolve(oData);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },

        /**
         * Handle successful UC validation
         * @private
         */
        _handleValidationSuccess: function (oResult, sUC) {
            var oModel = this.getModel("armazenarUC");

            // Check if we have results from the OData call
            if (oResult.StatusContainer) {
                // UC found in ITEM table
                var aItems = [oResult];

                // Check StatusContainer for all items
                var bAllContainersCompleted = aItems.every(function (oItem) {
                    return oItem.StatusContainer === 'CONCLUIDO';
                });

                if (!oResult.StatusContainer === 'CONCLUIDO') {
                    // Container not completed
                    this._handleValidationError({
                        message: "Não é permitida a armazenagem da UC porque o container não está concluído"
                    }, sUC);
                    return;
                }

                var sItem = this._processItems(aItems);

                if (oModel) {
                    oModel.setProperty("/isValidUC", true);
                    oModel.setProperty("/sItem", sItem);
                    oModel.setProperty("/successMessage", "UC validada com sucesso. " + aItems.length + " item(ns) encontrado(s).");

                    // Store NF and Identificador for later use
                    if (aItems.length > 0) {
                        oModel.setProperty("/nf", aItems[0].Nf || "");
                        oModel.setProperty("/identificador", aItems[0].Identificador || "");
                    }
                }

                this._showSuccessMessage("UC validada com sucesso. " + aItems.length + " item(ns) encontrado(s).");
                var oProximoButton = this.byId("proximoButton");
                if (oProximoButton) {
                    oProximoButton.setEnabled(true);
                }

            } else {
                // UC not found
                this._handleValidationError({
                    message: "UC não criada no app"
                }, sUC);
            }
        },

        /**
         * Process items from validation result
         * @private
         */
        _processItems: function (aItems) {
            var sItem = "";

            aItems.forEach(function (oItem, index) {
                if (index > 0) {
                    sItem += "; ";
                }

                // Add NV_ prefix to material as specified in requirements
                var sMaterial = oItem.Material ? "NV_" + oItem.Material : "";

                sItem += "NF: " + (oItem.Nf || "") +
                    ", Material: " + sMaterial +
                    ", Quantidade: " + (oItem.Quantidade || "") +
                    ", Data Validade: " + (oItem.DataValidade || "N/A") +
                    ", Status Container: " + (oItem.StatusContainer || "N/A");
            });

            return sItem;
        },

        /**
         * Handle UC validation error
         * @private
         */
        _handleValidationError: function (oError, sUC) {
            var oModel = this.getModel("armazenarUC");
            var sErrorMessage = "UC não criada no app";

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

            if (oModel) {
                oModel.setProperty("/isValidUC", false);
                oModel.setProperty("/sItem", null);
                oModel.setProperty("/errorMessage", sErrorMessage);
            }

            this._showErrorMessage(sErrorMessage);
            var oProximoButton = this.byId("proximoButton");
            if (oProximoButton) {
                oProximoButton.setEnabled(false);
            }
        },

        /**
         * Show loading indicator
         * @private
         */
        _showLoading: function (bShow) {
            var oLoadingIndicator = this.byId("loadingIndicator");
            if (oLoadingIndicator) {
                oLoadingIndicator.setVisible(bShow);
            }
        },

        /**
         * Show error message
         * @private
         */
        _showErrorMessage: function (sMessage) {
            var oErrorStrip = this.byId("errorMessage");
            if (oErrorStrip) {
                oErrorStrip.setText(sMessage);
                oErrorStrip.setVisible(true);
            }
            var oSuccessStrip = this.byId("successMessage");
            if (oSuccessStrip) {
                oSuccessStrip.setVisible(false);
            }
        },

        /**
         * Show success message
         * @private
         */
        _showSuccessMessage: function (sMessage) {
            var oSuccessStrip = this.byId("successMessage");
            if (oSuccessStrip) {
                oSuccessStrip.setText(sMessage);
                oSuccessStrip.setVisible(true);
            }
            var oErrorStrip = this.byId("errorMessage");
            if (oErrorStrip) {
                oErrorStrip.setVisible(false);
            }
        },

        /**
         * Hide all messages
         * @private
         */
        _hideMessages: function () {
            var oErrorStrip = this.byId("errorMessage");
            if (oErrorStrip) {
                oErrorStrip.setVisible(false);
            }
            var oSuccessStrip = this.byId("successMessage");
            if (oSuccessStrip) {
                oSuccessStrip.setVisible(false);
            }
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
         * Navigate to ocorrencia screen
         * @public
         */
        onOcorrenciaPress: function () {
            // TODO: Implement navigation to ocorrencia screen when available
            this.showInfoMessage("Funcionalidade Ocorrência será implementada em breve");
        },

        /**
         * Navigate to next screen (proximo)
         * @public
         */
        onProximoPress: function () {
            var oModel = this.getModel("armazenarUC");

            if (oModel && oModel.getProperty("/isValidUC")) {
                // Get UC data from validated items
                var sItem = oModel.getProperty("/sItem");
                var sUC = this.byId("ucInput").getValue();

                // Start the storage process
                this._startStorageProcess(sUC, sItem);
            } else {
                this.showErrorMessage("Por favor, valide uma UC antes de prosseguir");
            }
        },

        /**
         * Start the storage process
         * @private
         */
        _startStorageProcess: function (sUC, sItem) {
            var that = this;

            // Show loading
            this._showLoading(true);
            this._hideMessages();

            // Step 1: Check UC status to determine next step
            this._checkUCStatus(sUC, sItem)
                .then(function (oStatusResult) {
                    return that._determineNextStep(oStatusResult, sUC, sItem);
                })
                .then(function (oNextStep) {
                    return that._executeNextStep(oNextStep, sUC, sItem);
                })
                .catch(function (oError) {
                    that._handleStorageError(oError);
                })
                .finally(function () {
                    that._showLoading(false);
                });
        },

        /**
         * Check UC status from StatusUC table
         * @private
         */
        _checkUCStatus: function (sUC, sItem) {
            var oModel = this.getModel();

            // Parse item data to get NF and Identificador
            var oItemData = this._parseItemData(sItem);

            return new Promise(function (resolve, reject) {
                // Read StatusUC entity
                oModel.read("/StatusUCSet", {
                    filters: [
                        new sap.ui.model.Filter("Uc", sap.ui.model.FilterOperator.EQ, sUC),
                        new sap.ui.model.Filter("Nf", sap.ui.model.FilterOperator.EQ, oItemData.Nf),
                        new sap.ui.model.Filter("Identificador", sap.ui.model.FilterOperator.EQ, oItemData.Identificador)
                    ],
                    success: function (oData) {
                        if (oData && oData.results && oData.results.length > 0) {
                            var oStatusUC = oData.results[0];
                            resolve({
                                Td1: oStatusUC.Td1 || "",
                                Td2: oStatusUC.Td2 || "",
                                ConfTd2: oStatusUC.ConfTd2 || "",
                                Nf: oItemData.Nf,
                                Identificador: oItemData.Identificador,
                                Uc: sUC
                            });
                        } else {
                            // No status found, assume all empty
                            resolve({
                                Td1: "",
                                Td2: "",
                                ConfTd2: "",
                                Nf: oItemData.Nf,
                                Identificador: oItemData.Identificador,
                                Uc: sUC
                            });
                        }
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },

        /**
         * Parse item data to extract NF and Identificador
         * @private
         */
        _parseItemData: function (sItem) {
            var oModel = this.getModel("armazenarUC");
            var oResult = {
                Nf: "",
                Identificador: ""
            };

            // Get NF and Identificador from stored model data
            if (oModel) {
                oResult.Nf = oModel.getProperty("/nf") || "";
                oResult.Identificador = oModel.getProperty("/identificador") || "";
            }

            return oResult;
        },

        /**
         * Determine next step based on status
         * @private
         */
        _determineNextStep: function (oStatusResult, sUC, sItem) {
            var sTd1 = oStatusResult.Td1;
            var sTd2 = oStatusResult.Td2;
            var sConfTd2 = oStatusResult.ConfTd2;

            // Check if all status are filled (UC already stored)
            if (sTd1 && sTd2 && sConfTd2) {
                return {
                    step: "ALREADY_STORED",
                    message: "UC já armazenada pelo app. Para outras movimentações, realizar direto no EWM;"
                };
            }

            // Determine next step based on status
            if (!sTd1 && !sTd2 && !sConfTd2) {
                // All empty - start from beginning
                return {
                    step: "CREATE_TD1",
                    statusResult: oStatusResult
                };
            } else if (sTd1 && !sTd2 && !sConfTd2) {
                // TD1 filled, go to TD2
                return {
                    step: "CREATE_TD2",
                    statusResult: oStatusResult
                };
            } else if (sTd1 && sTd2 && !sConfTd2) {
                // TD1 and TD2 filled, go to CONFIRM
                return {
                    step: "TO_CONFIRM",
                    statusResult: oStatusResult
                };
            }

            // Default case
            return {
                step: "CREATE_TD1",
                statusResult: oStatusResult
            };
        },

        /**
         * Execute the next step
         * @private
         */
        _executeNextStep: function (oNextStep, sUC, sItem) {
            var that = this;

            switch (oNextStep.step) {
                case "ALREADY_STORED":
                    this.showErrorMessage(oNextStep.message);
                    return Promise.resolve();

                case "CREATE_TD1":
                    return this._createTD1(oNextStep.statusResult);

                case "CREATE_TD2":
                    return this._createTD2(oNextStep.statusResult);

                case "TO_CONFIRM":
                    return this._navigateToConfirm(oNextStep.statusResult);

                default:
                    return Promise.reject({
                        message: "Etapa não reconhecida: " + oNextStep.step
                    });
            }
        },

        /**
         * Create TD1 (Task 1)
         * @private
         */
        _createTD1: function (oStatusResult) {
            var that = this;

            return new Promise(function (resolve, reject) {
                that.getModel().callFunction("/CreateTD1", {
                    method: "POST",
                    urlParameters: {
                        UC: oStatusResult.Uc,
                        NF: oStatusResult.Nf,
                        Identificador: oStatusResult.Identificador
                    },
                    success: function (oData) {

                        // Check if the operation was successful
                        if (oData && oData.Success === 'X') {

                            // Mark TD1 as completed
                            that._updateStatusUC(oStatusResult.Uc, oStatusResult.Nf, oStatusResult.Identificador, "Td1", "X")
                                .then(function () {
                                    // Continue to TD2
                                    return that._createTD2(oStatusResult);
                                })
                                .then(resolve)
                                .catch(function (oError) {
                                    console.error("ArmazenarUC - Error updating TD1 status:", oError);
                                    that.handleServiceError(oError, {
                                        context: "TD1 Status Update",
                                        showDialog: true
                                    });
                                    reject(oError);
                                });
                        } else {
                            // Operation failed - show error message on screen
                            var sErrorMessage = oData && oData.Message ? oData.Message : "Erro ao criar TD1";
                            console.error("ArmazenarUC - TD1 creation failed:", sErrorMessage);

                            // Show error message on screen (not popup)
                            that._showErrorMessage(sErrorMessage);
                            reject({
                                message: sErrorMessage,
                                responseData: oData
                            });
                        }
                    },
                    error: function (oError) {
                        console.error("ArmazenarUC - Error creating TD1:", oError);

                        // Show error message to user on screen (not popup)
                        var sErrorMessage = "Erro ao criar TD1";

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
         * Create TD2 (Task 2)
         * @private
         */
        _createTD2: function (oStatusResult) {
            var that = this;

            return new Promise(function (resolve, reject) {

                that.getModel().callFunction("/CreateTD2", {
                    method: "POST",
                    urlParameters: {
                        UC: oStatusResult.Uc,
                        NF: oStatusResult.Nf,
                        Identificador: oStatusResult.Identificador
                    },
                    success: function (oData) {

                        // Check if the operation was successful
                        if (oData && oData.Success === 'X') {

                            // Mark TD1 and TD2 as completed
                            that._updateStatusUCMultipleFields(oStatusResult.Uc, oStatusResult.Nf, oStatusResult.Identificador, {
                                Td1: "X",
                                Td2: "X"
                            })
                                .then(function () {
                                    // Continue to TO_CONFIRM
                                    return that._navigateToConfirm(oStatusResult);
                                })
                                .then(resolve)
                                .catch(function (oError) {
                                    console.error("ArmazenarUC - Error updating TD2 status:", oError);
                                    that.handleServiceError(oError, {
                                        context: "TD2 Status Update",
                                        showDialog: true
                                    });
                                    reject(oError);
                                });
                        } else {
                            // Operation failed - show error message on screen
                            var sErrorMessage = oData && oData.Message ? oData.Message : "Erro ao criar TD2";
                            console.error("ArmazenarUC - TD2 creation failed:", sErrorMessage);

                            // Show error message on screen (not popup)
                            that._showErrorMessage(sErrorMessage);
                            reject({
                                message: sErrorMessage,
                                responseData: oData
                            });
                        }
                    },
                    error: function (oError) {
                        console.error("ArmazenarUC - Error creating TD2:", oError);

                        // Show error message to user on screen (not popup)
                        var sErrorMessage = "Erro ao criar TD2";

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
         * Navigate to TO_CONFIRM screen
         * @private
         */
        _navigateToConfirm: function (oStatusResult) {
            var that = this;

            // Get suggested position
            return new Promise(function (resolve, reject) {
                var oModel = that.getModel("armazenarUC");


                that.getModel().callFunction("/GetSuggestedPosition", {
                    method: "GET",
                    urlParameters: {
                        //Tanum: sTanum,
                        UC: oStatusResult.Uc
                    },
                    success: function (oData) {
                        var sSuggestedPosition = oData.SuggestedPosition || "";

                        if (!sSuggestedPosition) {
                            that.showErrorMessage("Não existe TD de movimentação pendente para a UC.");
                            resolve();
                            return;
                        }

                        // Store data for TO_CONFIRM screen
                        var oModel = that.getModel("armazenarUC");
                        if (oModel) {
                            oModel.setProperty("/suggestedPosition", sSuggestedPosition);
                            oModel.setProperty("/statusResult", oStatusResult);
                        }

                        // Store data in global model for ToConfirm
                        var oComponent = that.getOwnerComponent();
                        var oGlobalModel = oComponent.getModel("globalContext");

                        if (!oGlobalModel) {
                            oGlobalModel = new sap.ui.model.json.JSONModel({});
                            oComponent.setModel(oGlobalModel, "globalContext");
                        }

                        // Get NF and Identificador from current model
                        var oArmazenarUCModel = that.getModel("armazenarUC");
                        var sNF = "";
                        var sIdentificador = "";

                        if (oArmazenarUCModel) {
                            sNF = oArmazenarUCModel.getProperty("/nf") || "";
                            sIdentificador = oArmazenarUCModel.getProperty("/identificador") || "";
                        }

                        // Set ToConfirm data
                        oGlobalModel.setProperty("/toConfirmData", {
                            UC: oStatusResult.Uc,
                            SuggestedPosition: sSuggestedPosition,
                            NF: sNF,
                            Identificador: sIdentificador
                        });


                        // Navigate to TO_CONFIRM screen
                        that.getRouter().navTo("RouteToConfirm");

                        resolve();
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },

        /**
         * Update StatusUC entity
         * @private
         */
        _updateStatusUC: function (sUC, sNF, sIdentificador, sField, sValue, sField2, sValue2) {
            var oModel = this.getModel();

            return new Promise(function (resolve, reject) {
                // Update the StatusUC entity
                var sPath = "/StatusUCSet(Uc='" + sUC + "',Nf='" + sNF + "',Identificador='" + sIdentificador + "')";
                var oData = {};
                oData[sField] = sValue;
                oData[sField2] = sValue2;

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
         * Handle storage process errors
         * @private
         */
        _handleStorageError: function (oError) {
            var sErrorMessage = "Erro no processo de armazenagem";

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
                        //console.error("ArmazenarUC - Error updating StatusUC:", oError);
                        reject(oError);
                    }
                });
            });
        },

        /**
         * Clear all data from ArmazenarUC screen
         * @public
         */
        clearScreenData: function () {
            var oModel = this.getModel("armazenarUC");

            if (oModel) {
                // Reset model to initial state
                oModel.setProperty("/ucInput", "");
                oModel.setProperty("/isValidUC", false);
                oModel.setProperty("/validationInProgress", false);
                oModel.setProperty("/sItem", null);
                oModel.setProperty("/errorMessage", "");
                oModel.setProperty("/successMessage", "");
                oModel.setProperty("/nf", "");
                oModel.setProperty("/identificador", "");
                oModel.setProperty("/suggestedPosition", "");
                oModel.setProperty("/statusResult", null);
            }

            // Clear the input field
            var oUCInput = this.byId("ucInput");
            if (oUCInput) {
                oUCInput.setValue("");
            }

            // Disable próximo button
            var oProximoButton = this.byId("proximoButton");
            if (oProximoButton) {
                oProximoButton.setEnabled(false);
            }

            // Hide loading indicator
            this._showLoading(false);

            // Hide messages
            this._hideMessages();

        }
    });
});
