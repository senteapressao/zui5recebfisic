sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("zui5recebfisic.controller.PhysicalReceipt", {

        onInit: function () {
            // Setup route matched handler to clear data when navigating to this screen
            this.getRouter().getRoute("RoutePhysicalReceipt").attachPatternMatched(this._onRouteMatched, this);
        },
        
        onAfterRendering: function () {
            // Set focus to identificador input after view is rendered
            this._setFocusToIdentificadorInput();
        },

        /**
         * Handle route matched event - clear data when navigating to this screen
         * @private
         */
        _onRouteMatched: function () {
            // Initialize the physical receipt screen
            this._initializeReceiptModel();
            this._initializeMobileFeatures();
            // Clear all navigation data when entering this screen
            // Use setTimeout to ensure binding is established before clearing
            setTimeout(function () {
                this._clearAllNavigationData();

                // Additional check to ensure field is cleared
                setTimeout(function () {
                    var oIdentificadorInput = this.byId("identificadorInput");
                    if (oIdentificadorInput && oIdentificadorInput.getValue()) {
                        oIdentificadorInput.setValue("");
                    }
                }.bind(this), 100);
            }.bind(this), 0);
        },

        /**
         * Initialize the receipt context model
         * @private
         */
        _initializeReceiptModel: function () {
            var oReceiptData = {
                nf: "", // NF será obtida via ValidIdentificador
                identificador: "",
                doca: "",
                impressora: "",
                uc: "",
                operacao: "",
                statusReceb: "",
                statusContainer: "",
                recebEmb: "", // RecebEmb obtained from DeterminarOP
                items: []
            };

            // Create local model for this view
            this.createLocalModel(oReceiptData, "receiptContext");

            // Also create/update component-level model for sharing between views
            var oComponent = this.getOwnerComponent();
            var oComponentReceiptModel = oComponent.getModel("receiptContext");

            if (!oComponentReceiptModel) {
                oComponentReceiptModel = new JSONModel(oReceiptData);
                oComponent.setModel(oComponentReceiptModel, "receiptContext");
            }
        },

        /**
         * Setup input validation for form fields
         * @private
         */


        /**
         * Initialize mobile-specific features
         * @private
         */
        _initializeMobileFeatures: function () {
            // Optimize form inputs for mobile
            this.optimizeFormForMobile([
                "identificadorInput"
            ]);

            // Add haptic feedback to buttons if on mobile device
            if (this.isMobileDevice()) {
                this._addHapticFeedbackToButtons();
            }

            // Add loading states for service calls
            this._setupLoadingStates();
        },

        /**
         * Set focus to identificador input field
         * @private
         */
        _setFocusToIdentificadorInput: function () {
            var that = this;
            // Use multiple attempts with increasing delays to override default focus behavior
            var delays = [100, 300, 500];
            
            delays.forEach(function (delay) {
                setTimeout(function () {
                    var oIdentificadorInput = that.byId("identificadorInput");
                    if (oIdentificadorInput && oIdentificadorInput.getDomRef()) {
                        oIdentificadorInput.focus();
                    }
                }, delay);
            });
        },

        /**
         * Add haptic feedback to action buttons
         * @private
         */
        _addHapticFeedbackToButtons: function () {
            var that = this;
            var aButtonIds = [
                "ocorrenciaButton",
                "visualizarUCsButton",
                "inicioButtonPhysical",
                "concluirButton",
                "montarUCButtonPhysical"
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
         * Setup loading states for service calls
         * @private
         */
        _setupLoadingStates: function () {
            // Prevent multiple overrides by checking if already set up
            if (this._loadingStatesSetup) {
                return;
            }

            // Override the validation methods to show loading states
            var that = this;

            // Store original methods only if not already stored
            if (!this._originalPerformReceiptValidation) {
                this._originalPerformReceiptValidation = this._performReceiptValidation;
            }

            // Override with loading state management
            this._performReceiptValidation = function (oInputValues, sAction) {
                // Show mobile loading
                that.showMobileLoading("Validando recebimento...", 0);

                // Update progress
                setTimeout(function () {
                    that.updateMobileLoadingProgress(25, "Verificando nota fiscal...");
                }, 500);

                return that._originalPerformReceiptValidation.call(that, oInputValues, sAction)
                    .finally(function () {
                        that.hideMobileLoading();
                    });
            };

            // Mark as setup to prevent multiple overrides
            this._loadingStatesSetup = true;
        },


        /**
         * Handle Identificador input change - convert to uppercase and update model
         * @private
         * @param {sap.ui.base.Event} oEvent the input change event
         */
        _onIdentificadorInputChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var sValue = oInput.getValue();

            // Convert to uppercase automatically
            var sUpperCaseValue = sValue.toUpperCase();

            // Update input field with uppercase value if it changed
            if (sValue !== sUpperCaseValue) {
                oInput.setValue(sUpperCaseValue);
            }

            // Update model with uppercase identificador
            this.getModel("receiptContext").setProperty("/identificador", sUpperCaseValue);

            this.buscaDoca(sUpperCaseValue)
        },

        /**
         * Handle Identificador input submit (Enter key) - validate and move focus to Doca
         * @public
         * @param {sap.ui.base.Event} oEvent the submit event
         */
        onIdentificadorSubmit: function (oEvent) {
            var that = this;
            var sIdentificador = oEvent.getParameter("value");
            
            if (!sIdentificador || sIdentificador.trim().length === 0) {
                this.setInputError("identificadorInput", "Identificador é obrigatório");
                this.showErrorMessage("Identificador é obrigatório");
                return;
            }

            // Validate identificador format
            var oValidation = this._validateIdentificadorFormat(sIdentificador);
            if (!oValidation.isValid) {
                this.setInputError("identificadorInput", oValidation.message);
                this.showErrorMessage(oValidation.message);
                return;
            }

            // If validation passes, move focus to Doca input
            setTimeout(function () {
                var oDocaInput = that.byId("DocaInput");
                if (oDocaInput && oDocaInput.getDomRef()) {
                    oDocaInput.focus();
                }
            }, 100);
        },

        onChangeImpressora: function () {
            this.buscaImpressora()
        },

        buscaImpressora: function () {
            let that = this
            let impressora = this.getView().byId("ImpressoraInput").getValue()
            impressora = impressora.toUpperCase()
            if (!impressora) {
                that.setInputError("ImpressoraInput", "Informe a Impressora");
                that.showErrorMessage("Informe a impressora");
                return
            } else {
                this.setInputSuccess("DocaInput", "Doca encontrada");
            }
            let oModel = this.getModel()
            let oFilter = new sap.ui.model.Filter(
                {
                    path: "PADEST",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: impressora
                }
            )

            oModel.read("/ImpressoraSet", {
                filters: [oFilter],
                async: true,
                success: function (oData) {
                    if (oData.results.length == 0) {
                        that.setInputError("ImpressoraInput", "Impressora não encontrada");
                        that.showErrorMessage("Impressora não encontrada. Verifique a Impressora informada.");
                        that.gravaImpressora("")
                    } else {
                        that.setInputSuccess("ImpressoraInput", "Impressora encontrada");
                        that.gravaImpressora(impressora)
                    }

                },
                error: function (oError) {
                    that.setInputError("ImpressoraInput", "Impressora não encontrada");
                    that.showErrorMessage("Impressora não encontrada. Verifique a Impressora informada.");
                    that.gravaImpressora("")
                }
            })


        },

        onChangeDoca: function () {
            let that = this
            let sDoca = this.getView().byId("DocaInput").getValue()
            

            if (!sDoca) {
                that.setInputError("DocaInput", "Informe a Doca");
                that.showErrorMessage("Informe a Doca");
                return
            } else {
                sDoca = sDoca.toUpperCase()
                this.setInputSuccess("DocaInput", "Doca encontrada");
            }
            let oModel = this.getModel()
            let oFilter = new sap.ui.model.Filter(
                {
                    path: "LGPLA",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: sDoca
                }
            )


            oModel.read("/DocaSet", {
                filters: [oFilter],
                success: function (oData) {
                    if (oData.results.length == 0) {
                        that.setInputError("DocaInput", "Doca não encontrado");
                        that.showErrorMessage("Doca não encontrado. Verifique a Doca informada.");
                    }
                },
                error: function (oError) {
                    that.setInputError("DocaInput", "Doca não encontrado");
                    that.showErrorMessage("Doca não encontrado. Verifique a Doca informada.");
                }
            })
        },

        buscaDoca: function (sUpperCaseValue) {
            let DocaInput = this.getView().byId("DocaInput")
            let mReceiptContext = this.getModel("receiptContext")
            let oModel = this.getModel()
            let oFilter = new sap.ui.model.Filter(
                {
                    path: "Identificador",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: sUpperCaseValue
                }
            )
            oModel.read("/HeaderSet", {
                filters: [oFilter],
                async: true,
                success: function (oData) {
                    let response = oData.results
                    // Filtrar apenas registros onde StatusContainer for diferente de 'CONCLUÍDO'
                    let registrosAtivos = response.filter(function(registro) {
                        return registro.StatusContainer !== 'CONCLUÍDO'
                    })
                    
                    if (registrosAtivos.length > 0) {
                        if (!registrosAtivos[0].Doca) {
                            mReceiptContext.getData().doca = ''
                            DocaInput.setEditable(true)
                        } else {
                            mReceiptContext.getData().doca = registrosAtivos[0].Doca
                            DocaInput.setEditable(false)
                        }
                    } else {
                        mReceiptContext.getData().doca = ""
                        DocaInput.setEditable(true)
                    }
                    mReceiptContext.refresh()
                }
            })
        },

        /**
         * Validate identificador and get NF - called by buttons
         * @private
         * @returns {Promise<boolean>} promise that resolves to true if validation succeeds
         */
        _validateIdentificadorAndGetNF: function () {
            let mReceiptContext = this.getModel("receiptContext")
            var that = this;

            var sIdentificador = mReceiptContext.getData().identificador.trim();
            let sDoca = mReceiptContext.getData().doca.trim()
            let sImpressora = mReceiptContext.getData().impressora.trim()

            // Clear previous validation state
            this.clearInputValidation("identificadorInput");
            this.clearInputValidation("DocaInput");

            // Validate identificador format
            if (sIdentificador.length === 0) {
                this.setInputError("identificadorInput", "Identificador é obrigatório");
                this.showErrorMessage("Identificador é obrigatório");
                return Promise.resolve(false);
            }

            if (sDoca.length === 0) {
                this.setInputError("DocaInput", "Doca é obrigatório");
                this.showErrorMessage("Doca é obrigatório");
                return Promise.resolve(false);
            }

            var oValidation = this._validateIdentificadorFormat(sIdentificador);
            if (!oValidation.isValid) {
                this.setInputError("identificadorInput", oValidation.message);
                this.showErrorMessage(oValidation.message);
                return Promise.resolve(false);
            }

            // Show loading state
            this.setInputSuccess("identificadorInput", "Validando identificador...");

            // Validate doca value in backend before proceeding
            return this._validateDocaValue(sDoca)
                .then(function (bDocaValid) {
                    if (!bDocaValid) {
                        // Doca validation failed - error already shown
                        return false;
                    }

                    // Doca is valid, continue with identificador validation
                    // Call ValidIdentificador function
                    return that._callValidIdentificador(sIdentificador)
                        .then(function (sNf) {
                            if (sNf && sNf.trim().length > 0) {
                                // NF found - update model and show success
                                that.getModel("receiptContext").setProperty("/nf", sNf);
                                that.setInputSuccess("identificadorInput", "Identificador válido - NF: " + sNf);
                                return true;
                            } else {
                                // No NF returned - show error
                                that.setInputError("identificadorInput", "Identificador não encontrado");
                                that.showErrorMessage("Identificador não encontrado. Verifique o identificador informado.");
                                return false;
                            }
                        })
                        .catch(function (oError) {
                            // Error calling ValidIdentificador
                            that.setInputError("identificadorInput", "Erro ao validar identificador");
                            that.showErrorMessage("Erro ao validar identificador: " + (oError.message || "Erro desconhecido"));
                            return false;
                        });
                })
                .catch(function (oError) {
                    // Error validating doca
                    that.setInputError("DocaInput", "Erro ao validar doca");
                    that.showErrorMessage("Erro ao validar doca: " + (oError.message || "Erro desconhecido"));
                    return false;
                });
        },

        /**
         * Validate doca value against backend DocaSet
         * @private
         * @param {string} sDoca the doca value to validate
         * @returns {Promise<boolean>} promise that resolves to true if doca is valid
         */
        _validateDocaValue: function (sDoca) {
            var that = this;
            
            return new Promise(function (resolve, reject) {
                if (!sDoca || sDoca.trim().length === 0) {
                    that.setInputError("DocaInput", "Doca é obrigatório");
                    that.showErrorMessage("Doca é obrigatório");
                    resolve(false);
                    return;
                }

                var sDocaUpperCase = sDoca.trim().toUpperCase();
                var oModel = that.getModel();
                var oFilter = new sap.ui.model.Filter({
                    path: "LGPLA",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: sDocaUpperCase
                });

                oModel.read("/DocaSet", {
                    filters: [oFilter],
                    success: function (oData) {
                        if (oData.results && oData.results.length > 0) {
                            // Doca found - valid
                            that.setInputSuccess("DocaInput", "Doca válida");
                            resolve(true);
                        } else {
                            // Doca not found
                            that.setInputError("DocaInput", "Doca não encontrada");
                            that.showErrorMessage("Doca não encontrada. Verifique a doca informada.");
                            resolve(false);
                        }
                    },
                    error: function (oError) {
                        // Error reading from backend
                        that.setInputError("DocaInput", "Doca não encontrada");
                        that.showErrorMessage("Doca não encontrada. Verifique a doca informada.");
                        resolve(false);
                    }
                });
            });
        },

        /**
         * Call ValidIdentificador function to get NF from identificador
         * @private
         * @param {string} sIdentificador the identificador to validate
         * @returns {Promise<string>} promise that resolves to NF or empty string
         */
        _callValidIdentificador: function (sIdentificador) {
            var that = this;
            return new Promise(function (resolve, reject) {
                // Get the OData model
                var oModel = that.getModel();

                if (!oModel) {
                    reject(new Error("OData model not available"));
                    return;
                }

                // Call ValidIdentificador function import with GET method
                var oParameters = {
                    Identificador: sIdentificador.trim()
                };

                oModel.callFunction("/ValidIdentificador", {
                    method: "GET",
                    urlParameters: oParameters,
                    success: function (oData) {
                        // Extract NF from response
                        var sNf = "";

                        if (oData && oData.Nf) {
                            sNf = oData.Nf;
                        } else if (oData && oData.d && oData.d.Nf) {
                            sNf = oData.d.Nf;
                        } else if (oData && oData.results && oData.results.length > 0 && oData.results[0].Nf) {
                            sNf = oData.results[0].Nf;
                        } else if (typeof oData === "string") {
                            // If the function returns a string directly
                            sNf = oData;
                        }

                        resolve(sNf || "");
                    },
                    error: function (oError) {
                        // Log error for debugging
                        console.error("DEBUG: ValidIdentificador error:", oError);

                        // If 404 or no data found, resolve with empty string
                        if (oError.statusCode === 404 || oError.statusCode === 400) {
                            resolve("");
                        } else {
                            reject(oError);
                        }
                    }
                });
            });
        },

        /**
         * Validate identificador format
         * @private
         * @param {string} sIdentificador the identificador to validate
         * @returns {object} validation result with isValid and message
         */
        _validateIdentificadorFormat: function (sIdentificador) {
            if (!sIdentificador || typeof sIdentificador !== "string") {
                return {
                    isValid: false,
                    message: "Identificador é obrigatório"
                };
            }

            var sCleanIdentificador = sIdentificador.trim();

            if (sCleanIdentificador.length === 0) {
                return {
                    isValid: false,
                    message: "Identificador é obrigatório"
                };
            }

            if (sCleanIdentificador.length > 50) {
                return {
                    isValid: false,
                    message: "Identificador muito longo (máximo 50 caracteres)"
                };
            }

            return {
                isValid: true,
                message: "",
                cleanIdentificador: sCleanIdentificador
            };
        },

        /**
         * Clear validation states from all inputs
         * @private
         */
        _clearValidationStates: function () {
            this.clearValidationStates(["identificadorInput"]);
        },

        /**
         * Validate business rules before processing
         * @private
         * @param {object} oInputValues the input values to validate
         * @returns {object} validation result
         */
        _validateBusinessRules: function (oInputValues) {
            var aErrors = [];

            // Validate NF exists (obtained from ValidIdentificador)
            if (!oInputValues.nf || oInputValues.nf.trim().length === 0) {
                aErrors.push({
                    field: "NF",
                    message: "NF não encontrada para o identificador informado"
                });
            }

            // Validate Identificador format
            var oIdentificadorValidation = this._validateIdentificadorFormat(oInputValues.identificador);
            if (!oIdentificadorValidation.isValid) {
                aErrors.push({
                    field: "Identificador",
                    message: oIdentificadorValidation.message
                });
            }

            return {
                isValid: aErrors.length === 0,
                errors: aErrors
            };
        },

        /**
         * Show validation errors to user
         * @private
         * @param {object} oValidationResult the validation result
         */
        _showValidationErrors: function (oValidationResult) {
            if (oValidationResult.errors && oValidationResult.errors.length > 0) {
                this.showValidationSummary(oValidationResult.errors);

                // Highlight individual fields
                oValidationResult.errors.forEach(function (oError) {
                    if (oError.field === "NF") {
                        this.setInputError("identificadorInput", oError.message);
                    } else if (oError.field === "Identificador") {
                        this.setInputError("identificadorInput", oError.message);
                    }
                }.bind(this));
            }
        },

        /**
         * Highlight invalid fields with visual feedback
         * @private
         * @param {array} aFields array of field objects to check
         */
        _highlightInvalidFields: function (aFields) {
            var that = this;

            aFields.forEach(function (oField) {
                var oControl = that.byId(oField.id);
                if (oControl) {
                    var sValue = oControl.getValue ? oControl.getValue() : oControl.getSelectedKey();
                    if (!sValue || sValue.trim() === "") {
                        that.setInputError(oField.id, "Campo obrigatório");

                        // Add shake animation for mobile
                        oControl.addStyleClass("inputError");
                        setTimeout(function () {
                            oControl.removeStyleClass("inputError");
                        }, 300);
                    }
                }
            });
        },

        /**
         * Get current input values
         * @private
         * @returns {object} object with nf and identificador values
         */
        _getCurrentInputValues: function () {
            let oModel = this.getView().getModel("receiptContext")
            let oData = oModel.getData()

            var oReceiptModel = this.getModel("receiptContext");
            var sNf = oReceiptModel.getProperty("/nf") || "";
            var sIdentificador = oData.identificador.trim();
            let sDoca = oData.doca.trim().toUpperCase();
            let sImpressora = oData.impressora.trim().toUpperCase();

            var oResult = {
                nf: this.sanitizeInput(sNf),
                identificador: this.sanitizeInput(sIdentificador),
                doca: this.sanitizeInput(sDoca),
                impressora: this.sanitizeInput(sImpressora),
            };
            return oResult;
        },

        /**
         * Save data to global context for navigation between pages
         * @private
         * @param {object} oInputValues the input values to save
         */
        _saveToGlobalContext: function (oInputValues) {
            var oComponent = this.getOwnerComponent();

            // Create or get global context model
            var oGlobalModel = oComponent.getModel("globalContext");
            if (!oGlobalModel) {
                oGlobalModel = new JSONModel({});
                oComponent.setModel(oGlobalModel, "globalContext");
            }

            // Update global context with current values
            var oGlobalData = oGlobalModel.getData();
            oGlobalData.nf = oInputValues.nf;
            oGlobalData.identificador = oInputValues.identificador;
            oGlobalData.recebEmb = oInputValues.recebEmb || "";
            oGlobalData.impressora = oInputValues.impressora || "";
            oGlobalData.doca = oInputValues.doca || "";
            oGlobalData.currentStep = "CreateUC";

            oGlobalModel.setData(oGlobalData);

            // Also save to component level receiptContext model for backup
            var oComponentReceiptModel = oComponent.getModel("receiptContext");
            if (!oComponentReceiptModel) {
                oComponentReceiptModel = new JSONModel({});
                oComponent.setModel(oComponentReceiptModel, "receiptContext");
            }

            oComponentReceiptModel.setData({
                nf: oInputValues.nf,
                identificador: oInputValues.identificador,
                recebEmb: oInputValues.recebEmb || "",
                impressora: oInputValues.impressora || "",
                doca: oInputValues.doca || "",
                currentStep: "CreateUC"
            });
        },

        /**
         * Navigate to occurrence registration
         * @public
         */
        onOcorrenciaPress: function () {

            // Validate identificador and get NF
            this._validateIdentificadorAndGetNF()
                .then(function (bValid) {
                    if (bValid) {
                        // Get current input values
                        var oInputValues = this._getCurrentInputValues();

                        // Save data to global context for navigation
                        this._saveToGlobalContext(oInputValues);

                        // Navigate to occurrence registration screen
                        this.navToOcorrencia();
                    }
                }.bind(this));
        },

        /**
         * Navigate to UC visualization screen
         * @public
         */
        onVisualizarUCsPress: function () {

            // Validate identificador and get NF
            this._validateIdentificadorAndGetNF()
                .then(function (bValid) {
                    if (bValid) {
                        // Get current input values
                        var oInputValues = this._getCurrentInputValues();

                        // Save data to global context for navigation
                        this._saveToGlobalContext(oInputValues);

                        this.navToUCVisualization();
                    }
                }.bind(this));
        },

        /**
         * Navigate back to main menu
         * @public
         */
        onInicioPress: function () {
            // Clear any partial data when returning to main menu
            this.clearReceiptContext(['nf', 'identificador']);
            this.navToMainMenu();
        },

        /**
         * Handle conclude receipt action
         * @public
         */
        onConcluirPress: function () {

            // Validate identificador and get NF
            this._validateIdentificadorAndGetNF()
                .then(function (bValid) {
                    if (bValid) {
                        // Get current input values
                        var oInputValues = this._getCurrentInputValues();

                        // Save data to global context for navigation
                        this._saveToGlobalContext(oInputValues);

                        // Perform invoice validation and receipt status checking
                        this._performReceiptValidation(oInputValues, "CONCLUIR");
                    }
                }.bind(this));
        },

        /**
         * Navigate to UC assembly/creation
         * @public
         */
        onMontarUCPress: function () {

            // Validate identificador and get NF
            this._validateIdentificadorAndGetNF()
                .then(function (bValid) {
                    if (bValid) {
                        // Get current input values
                        var oInputValues = this._getCurrentInputValues();

                        // Save data to global context for navigation
                        this._saveToGlobalContext(oInputValues);

                        // Perform invoice validation and receipt status checking (this calls DeterminarOP)
                        this._performReceiptValidation(oInputValues, "MONTAR_UC");
                    }
                }.bind(this));
        },

        /**
         * Check container status before allowing UC creation
         * @private
         * @param {object} oInputValues object with nf and identificador
         */
        _checkContainerStatusBeforeMontarUC: function (oInputValues) {
            let that = this;
            let oModel = this.getModel()
            let aFilter = []
            let oFilter = new sap.ui.model.Filter(
                {
                    path: "Nf",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: oInputValues.nf
                }
            )
            aFilter.push(oFilter)
            oFilter = new sap.ui.model.Filter(
                {
                    path: "Identificador",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: oInputValues.identificador
                }
            )
            aFilter.push(oFilter)

            oModel.read("/HeaderSet", {
                filters: aFilter,
                success: function (oData) {

                    that._clearValidationStates();
                    let oBusinessValidation = that._validateBusinessRules(oInputValues);

                    if (!oBusinessValidation.isValid) {
                        that._showValidationErrors(oBusinessValidation);
                    }

                    that._logValidationActivity("MONTAR_UC", oInputValues, "Starting validation");


                    if (oData.results.length > 0) {
                        if (oData.results[0].StatusContainer === "CONCLUÍDO") {
                            that.showErrorMessage("Container já está concluído.");
                            that._logValidationActivity("MONTAR_UC", oInputValues,
                                "Navigation blocked - container status is CONCLUIDO");
                            return;
                        } else {
                            that._logValidationActivity("MONTAR_UC", oInputValues,
                                "Container status is " + oData.results[0].StatusContainer + " - proceeding with navigation");
                            that._saveToGlobalContext(oInputValues);
                            //that._performReceiptValidation(oInputValues, "MONTAR_UC");
                            that._handleExistingHeader(oData.results[0], "MONTAR_UC");
                        }
                    } else {
                        //that._logValidationActivity("MONTAR_UC", oInputValues,
                        //    "Header does not exist - proceeding with new container creation");
                        that._saveToGlobalContext(oInputValues);
                        that._handleNewHeader(oInputValues, "MONTAR_UC");
                        //that._performReceiptValidation(oInputValues, "MONTAR_UC");
                    }

                }
            })
            /*this._checkHeaderCombination(oInputValues.nf, oInputValues.identificador)
                .then(function (oHeaderResult) {

                    if (oHeaderResult && oHeaderResult.exists && oHeaderResult.data) {
                        // Header exists - check StatusContainer
                        var sStatusContainer = oHeaderResult.data.StatusContainer;

                        if (sStatusContainer === "CONCLUÍDO") {
                            // Container is completed - show message and prevent navigation
                            that.showErrorMessage("Container já está concluído.");
                            that._logValidationActivity("MONTAR_UC", oInputValues,
                                "Navigation blocked - container status is CONCLUIDO");
                            return;
                        } else {
                            // Container is not completed - proceed with normal flow
                            that._logValidationActivity("MONTAR_UC", oInputValues,
                                "Container status is " + sStatusContainer + " - proceeding with navigation");

                            // Save data to global context for navigation
                            that._saveToGlobalContext(oInputValues);

                            // Perform invoice validation and receipt status checking
                            that._performReceiptValidation(oInputValues, "MONTAR_UC");
                        }
                    } else {
                        // Header doesn't exist - proceed with normal flow (new container)
                        that._logValidationActivity("MONTAR_UC", oInputValues,
                            "Header does not exist - proceeding with new container creation");

                        // Save data to global context for navigation
                        that._saveToGlobalContext(oInputValues);

                        // Perform invoice validation and receipt status checking
                        that._performReceiptValidation(oInputValues, "MONTAR_UC");
                    }
                })
                .catch(function (oError) {
                    // Error checking header - show error and prevent navigation
                    that.showErrorMessage("Erro ao verificar status do container: " + (oError.message || "Erro desconhecido"));
                    that._logValidationActivity("MONTAR_UC", oInputValues,
                        "Error checking container status: " + (oError.message || "Unknown error"));
                });*/
        },

        /**
         * Perform comprehensive receipt validation
         * @private
         * @param {object} oInputValues object with nf and identificador
         * @param {string} sAction the action being performed (CONCLUIR or MONTAR_UC)
         * @returns {Promise} promise that resolves when validation is complete
         */
        _performReceiptValidation: function (oInputValues, sAction) {
            var that = this;

            // Clear any previous validation states
            this._clearValidationStates();

            // Step 0: Validate business rules
            var oBusinessValidation = this._validateBusinessRules(oInputValues);
            if (!oBusinessValidation.isValid) {
                this._showValidationErrors(oBusinessValidation);
                this._logValidationActivity(sAction, oInputValues, "Business rules validation failed");
                return Promise.reject(new Error("Business rules validation failed"));
            }

            // Log validation start
            this._logValidationActivity(sAction, oInputValues, "Starting validation");

            // Step 1: Validate invoice existence
            return this._validateInvoiceExistence(oInputValues.nf)
                .then(function (bInvoiceExists) {
                    if (!bInvoiceExists) {
                        that.showErrorMessage("Nota não encontrada");
                        that._logValidationActivity(sAction, oInputValues, "Invoice not found");
                        throw new Error("Invoice not found");
                    }

                    that._logValidationActivity(sAction, oInputValues, "Invoice exists - checking header");

                    // Step 2: Check Header table for NF+Identificador combination
                    return that._checkHeaderCombination(oInputValues.nf, oInputValues.identificador);
                })
                .then(function (oHeaderResult) {
                    if (!oHeaderResult) {
                        throw new Error("Header check failed");
                    }

                    if (oHeaderResult.exists) {
                        // Header exists - check receipt status
                        that._logValidationActivity(sAction, oInputValues, "Header exists - checking status");
                        return that._handleExistingHeader(oHeaderResult.data, sAction);
                    } else {
                        // Header doesn't exist - create new header and proceed
                        that._logValidationActivity(sAction, oInputValues, "Header does not exist - creating new");
                        return that._handleNewHeader(oInputValues, sAction);
                    }
                })
                .catch(function (oError) {
                    that._logValidationActivity(sAction, oInputValues, "Validation error: " + (oError.message || "Unknown error"));
                    that.handleServiceError(oError);
                    throw oError;
                });
        },

        /**
         * Validate invoice existence in J_1BNFDOC table
         * @private
         * @param {string} sNf the invoice number
         * @returns {Promise<boolean>} promise that resolves to true if invoice exists
         */
        _validateInvoiceExistence: function (sNf) {
            var that = this;

            // In a real implementation, this would call a backend function import
            // to validate against J_1BNFDOC table using DOCNUM field
            // For now, we'll implement a basic validation and assume the invoice exists
            // if it meets basic format requirements

            return new Promise(function (resolve, reject) {
                // Basic validation - invoice number should not be empty
                if (!sNf || sNf.trim().length === 0) {
                    resolve(false);
                    return;
                }

                var sCleanNf = sNf.trim();

                // In production, this would be:
                // that.callFunctionImport("ValidarNotaFiscal", { Nf: sCleanNf })
                //     .then(function(oResult) {
                //         resolve(oResult.Exists === "X");
                //     })
                //     .catch(function(oError) {
                //         reject(oError);
                //     });

                // For now, assume invoice exists if format is valid
                resolve(true);
            });
        },

        /**
         * Check if NF+Identificador combination exists in Header table
         * @private
         * @param {string} sNf the invoice number
         * @param {string} sIdentificador the container/truck identifier
         * @returns {Promise<object>} promise that resolves to header check result
         */
        _checkHeaderCombination: function (sNf, sIdentificador) {
            var that = this;
            var sPath = "/HeaderSet(Nf='" + encodeURIComponent(sNf) + "',Identificador='" + encodeURIComponent(sIdentificador) + "')";

            return this.readEntity(sPath, {
                handleError: false,
                showBusy: true
            })
                .then(function (oData) {
                    return {
                        exists: true,
                        data: oData
                    };
                })
                .catch(function (oError) {
                    if (oError.statusCode === "400") {
                        // Header doesn't exist - this is expected for new receipts
                        return {
                            exists: false,
                            data: null
                        };
                    } else {
                        // Other errors should be handled
                        throw oError;
                    }
                });
        },

        /**
         * Handle existing header validation and status checking
         * @private
         * @param {object} oHeaderData the existing header data
         * @param {string} sAction the action being performed
         * @returns {Promise} promise for handling completion
         */
        _handleExistingHeader: function (oHeaderData, sAction) {
            var that = this;

            // Check if receipt is already completed
            if (oHeaderData.StatusReceb === "CONCLUIDO") {
                this.showErrorMessage("Recebimento concluído");
                return Promise.resolve();
            }

            // Check if container is already completed (for MONTAR_UC action)
            if (sAction === "MONTAR_UC" && oHeaderData.StatusContainer === "CONCLUIDO") {
                this.showErrorMessage("Container já está concluído. Não é possível montar UC.");
                return Promise.resolve();
            }

            // Always call DeterminarOP to get updated RecebEmb, even for existing headers
            return that._determineOperationType(oHeaderData.Nf, oHeaderData.Identificador)
                .then(function (oOperationResult) {
                    
                    // Update the header data with the latest RecebEmb
                    oHeaderData.recebEmb = oOperationResult.recebEmb || "";
                    
                    // Check for existing UCs with "EM ABERTO" status
                    return that._checkOpenUCStatus(oHeaderData.Nf, oHeaderData.Identificador);
                })
                .then(function (oUCResult) {
                    if (oUCResult.hasOpenUC) {
                        // Navigate to AssembleUC with existing UC
                        var oReceiptModel = that.getModel("receiptContext");
                        oReceiptModel.setProperty("/uc", oUCResult.openUC);
                        oReceiptModel.setProperty("/operacao", oHeaderData.Operacao);
                        oReceiptModel.setProperty("/statusReceb", oHeaderData.StatusReceb);
                        oReceiptModel.setProperty("/statusContainer", oHeaderData.StatusContainer);
                        oReceiptModel.setProperty("/recebEmb", oHeaderData.recebEmb);

                        // Get the complete receipt context
                        var oReceiptContext = oReceiptModel.getData();

                        // Navigate to AssembleUC with context data
                        that.navToAssembleUC(oReceiptContext);
                    } else {
                        // No open UC - proceed based on action
                        if (sAction === "CONCLUIR") {
                            that.navToMainMenu();
                        } else {
                            that.navToCreateUC();
                        }
                    }
                });
        },

        /**
         * Handle new header creation and navigation
         * @private
         * @param {object} oInputValues the input values
         * @param {string} sAction the action being performed
         * @returns {Promise} promise for handling completion
         */
        _handleNewHeader: function (oInputValues, sAction) {
            var that = this;

            // Validate action parameter
            if (sAction !== "CONCLUIR" && sAction !== "MONTAR_UC") {
                return Promise.reject(new Error("Invalid action: " + sAction));
            }

            // Determine operation type (Importação vs Normal) and get RecebEmb
            return this._determineOperationType(oInputValues.nf, oInputValues.identificador)
                .then(function (oOperationResult) {
                    var sOperationType = oOperationResult.operationType;
                    var sRecebEmb = oOperationResult.recebEmb || "";
                    
                    // Validate operation type
                    if (sOperationType !== "Importação" && sOperationType !== "Normal") {
                        throw new Error("Invalid operation type determined: " + sOperationType);
                    }

                    // Store RecebEmb in input values for later use
                    oInputValues.recebEmb = sRecebEmb;

                    // Create header record with validated data
                    var oHeaderData = {
                        Nf: oInputValues.nf,
                        Identificador: oInputValues.identificador,
                        Operacao: sOperationType,
                        Doca: oInputValues.doca,
                        StatusReceb: "Inicial",
                        StatusContainer: "Inicial"
                    };

                    that._logValidationActivity("NEW_HEADER", oInputValues,
                        "Creating header with operation type: " + sOperationType + ", RecebEmb: " + sRecebEmb);

                    return that._createHeaderRecord(oHeaderData);
                })
                .then(function (oResult) {
                    // Log successful header creation
                    that._logValidationActivity("NEW_HEADER", oInputValues,
                        "Header created successfully, navigating based on action: " + sAction);

                    // Save RecebEmb to global context before navigation
                    that._saveToGlobalContext(oInputValues);

                    // Navigate based on action with proper validation
                    if (sAction === "CONCLUIR") {
                        // Show success message before navigation
                        that.showSuccessMessage("Recebimento registrado com sucesso");
                        that.navToMainMenu();
                    } else if (sAction === "MONTAR_UC") {
                        that.navToCreateUC();
                    }

                    return oResult;
                })
                .catch(function (oError) {
                    // Enhanced error handling for header creation
                    that._logValidationActivity("NEW_HEADER", oInputValues,
                        "Header creation failed: " + (oError.message || "Unknown error"));

                    // Show user-friendly error message
                    var sErrorMessage = "Erro ao criar registro de recebimento";
                    if (oError.message && oError.message.indexOf("operation type") !== -1) {
                        sErrorMessage = "Erro na classificação do tipo de operação";
                    } else if (oError.message && oError.message.indexOf("Invalid action") !== -1) {
                        sErrorMessage = "Ação inválida solicitada";
                    }

                    that.showErrorMessage(sErrorMessage);
                    throw oError;
                });
        },

        /**
         * Check for UCs with "EM ABERTO" status
         * @private
         * @param {string} sNf the invoice number
         * @param {string} sIdentificador the container identifier
         * @returns {Promise<object>} promise that resolves to UC status result
         */
        _checkOpenUCStatus: function (sNf, sIdentificador) {
            var that = this;
            var sFilter = "$filter=Nf eq '" + encodeURIComponent(sNf) + "' and Identificador eq '" + encodeURIComponent(sIdentificador) + "' and Status eq 'EM ABERTO'";

            return this.readEntity("/StatusUCSet", {
                urlParameters: {
                    "$filter": "Nf eq '" + encodeURIComponent(sNf) + "' and Identificador eq '" + encodeURIComponent(sIdentificador) + "' and Status eq 'EM ABERTO'"
                },
                handleError: false,
                showBusy: false
            })
                .then(function (oData) {
                    if (oData.results && oData.results.length > 0) {
                        return {
                            hasOpenUC: true,
                            openUC: oData.results[0].Uc
                        };
                    } else {
                        return {
                            hasOpenUC: false,
                            openUC: null
                        };
                    }
                })
                .catch(function (oError) {
                    // If error occurs, assume no open UC
                    return {
                        hasOpenUC: false,
                        openUC: null
                    };
                });
        },

        /**
         * Determine operation type (Importação vs Normal) and RecebEmb
         * @private
         * @param {string} sNf the invoice number
         * @param {string} sIdentificador the container identifier
         * @returns {Promise<object>} promise that resolves to object with operationType and recebEmb
         */
        _determineOperationType: function (sNf, sIdentificador) {
            var that = this;

            return new Promise(function (resolve, reject) {
                // Check if NF+Identificador combination exists in NF-Container mapping table
                // This determines if it's an "Importação" or "Normal" operation
                that._checkNFContainerMapping(sNf, sIdentificador)
                    .then(function (oResult) {
                        var sOperationType = oResult.isImportacao ? "Importação" : "Normal";
                        resolve({
                            operationType: sOperationType,
                            recebEmb: oResult.recebEmb || ""
                        });
                    })
                    .catch(function (oError) {
                        // If error occurs checking mapping, default to Normal
                        console.warn("Error checking NF-Container mapping, defaulting to Normal:", oError);
                        resolve({
                            operationType: "Normal",
                            recebEmb: ""
                        });
                    });
            });
        },

        /**
         * Check if NF+Identificador combination exists in NF-Container mapping table using DeterminarOP function
         * @private
         * @param {string} sNf the invoice number
         * @param {string} sIdentificador the container identifier
         * @returns {Promise<object>} promise that resolves to object with isImportacao and recebEmb
         */
        _checkNFContainerMapping: function (sNf, sIdentificador) {
            var that = this;

            return new Promise(function (resolve, reject) {
                // Call DeterminarOP function import to determine operation type
                var oParameters = {
                    Identificador: sIdentificador.trim(),
                    Nf: sNf.trim()
                };

                that.callFunctionImport("DeterminarOP", oParameters, {
                    showBusy: false,
                    handleError: false
                })
                    .then(function (oData) {
                        // Log the result for debugging
                        that._logValidationActivity("DETERMINAR_OP", oParameters,
                            "DeterminarOP returned: " + JSON.stringify(oData));

                        // Extract RecebEmb parameter from response
                        var sRecebEmb = "";
                        if (oData && oData.RecebEmb) {
                            sRecebEmb = oData.RecebEmb;
                        } else if (oData && oData.d && oData.d.RecebEmb) {
                            sRecebEmb = oData.d.RecebEmb;
                        } else if (oData && oData.results && oData.results.length > 0 && oData.results[0].RecebEmb) {
                            sRecebEmb = oData.results[0].RecebEmb;
                        }

                        // If function returns data/records, it's Importação (true)
                        // If no data/records returned, it's Normal (false)
                        var bIsImportacao = !!(oData && (
                            (oData.results && oData.results.length > 0) ||
                            (oData.d && oData.d.results && oData.d.results.length > 0) ||
                            Object.keys(oData).length > 0
                        ));

                        resolve({
                            isImportacao: bIsImportacao,
                            recebEmb: sRecebEmb
                        });
                    })
                    .catch(function (oError) {
                        // Log the error for debugging
                        that._logValidationActivity("DETERMINAR_OP", oParameters,
                            "DeterminarOP error: " + (oError.message || "Unknown error"));

                        // If error occurs (like 404 - no records found), assume Normal operation
                        if (oError.statusCode === "404" || oError.statusCode === "400") {
                            resolve({
                                isImportacao: false,
                                recebEmb: ""
                            }); // Normal operation
                        } else {
                            // For other errors, default to Normal but log the issue
                            console.warn("Error calling DeterminarOP, defaulting to Normal operation:", oError);
                            resolve({
                                isImportacao: false,
                                recebEmb: ""
                            });
                        }
                    });
            });
        },

        /**
         * Create header record
         * @private
         * @param {object} oHeaderData the header data to create
         * @returns {Promise} promise for header creation
         */
        _createHeaderRecord: function (oHeaderData) {
            var that = this;

            return new Promise(function (resolve, reject) {
                // Log header creation attempt
                that._logValidationActivity("CREATE_HEADER", oHeaderData, "Attempting to create header record");

                // Try to create header using OData create operation first
                that._createHeaderViaOData(oHeaderData)
                    .then(function (oResult) {
                        // Success - update local model with created header data
                        that._updateLocalModelWithHeader(oHeaderData);
                        that._logValidationActivity("CREATE_HEADER", oHeaderData, "Header created successfully via OData");
                        resolve(oResult);
                    })
                    .catch(function (oError) {
                        // If OData create fails, try function import approach
                        that._logValidationActivity("CREATE_HEADER", oHeaderData, "OData create failed, trying function import");

                        that._createHeaderViaFunctionImport(oHeaderData)
                            .then(function (oResult) {
                                that._updateLocalModelWithHeader(oHeaderData);
                                that._logValidationActivity("CREATE_HEADER", oHeaderData, "Header created successfully via function import");
                                resolve(oResult);
                            })
                            .catch(function (oFunctionError) {
                                // Both methods failed - log and reject
                                that._logValidationActivity("CREATE_HEADER", oHeaderData, "Both OData and function import failed");
                                reject(oFunctionError);
                            });
                    });
            });
        },

        /**
         * Create header record via OData create operation
         * @private
         * @param {object} oHeaderData the header data to create
         * @returns {Promise} promise for header creation
         */
        _createHeaderViaOData: function (oHeaderData) {
            var that = this;

            return new Promise(function (resolve, reject) {
                // Attempt to create header record directly via OData
                var oModel = that.getModel();

                oModel.create("/HeaderSet", oHeaderData, {
                    success: function (oData, oResponse) {
                        resolve(oData);
                    },
                    error: function (oError) {
                        // Check if error is due to entity not being creatable
                        if (oError.statusCode === 405 ||
                            (oError.responseText && oError.responseText.indexOf("not supported") !== -1)) {
                            // Method not allowed - entity is not creatable
                            var oNotCreatableError = new Error("HeaderSet entity is not creatable via OData");
                            oNotCreatableError.statusCode = 405;
                            reject(oNotCreatableError);
                        } else {
                            reject(oError);
                        }
                    }
                });
            });
        },

        /**
         * Create header record via function import
         * @private
         * @param {object} oHeaderData the header data to create
         * @returns {Promise} promise for header creation
         */
        _createHeaderViaFunctionImport: function (oHeaderData) {
            var that = this;

            return new Promise(function (resolve, reject) {
                // Use function import to create header
                var oParameters = {
                    Nf: oHeaderData.Nf,
                    Identificador: oHeaderData.Identificador,
                    Operacao: oHeaderData.Operacao,
                    StatusReceb: oHeaderData.StatusReceb,
                    StatusContainer: oHeaderData.StatusContainer
                };

                that.callFunctionImport("CriarHeader", oParameters)
                    .then(function (oResult) {
                        resolve(oResult);
                    })
                    .catch(function (oError) {
                        // If function import doesn't exist, fall back to local model update
                        if (oError.statusCode === 404 ||
                            (oError.responseText && oError.responseText.indexOf("not found") !== -1)) {
                            // Function import not found - use local model as fallback
                            console.warn("CriarHeader function import not found, using local model fallback");
                            resolve({ success: true, fallback: true });
                        } else {
                            reject(oError);
                        }
                    });
            });
        },

        /**
         * Update local model with header data
         * @private
         * @param {object} oHeaderData the header data
         */
        _updateLocalModelWithHeader: function (oHeaderData) {
            var oReceiptModel = this.getModel("receiptContext");
            oReceiptModel.setProperty("/operacao", oHeaderData.Operacao);
            oReceiptModel.setProperty("/statusReceb", oHeaderData.StatusReceb);
            oReceiptModel.setProperty("/statusContainer", oHeaderData.StatusContainer);

            // Log the operation type determination for debugging
            this._logValidationActivity("OPERATION_TYPE", oHeaderData,
                "Operation classified as: " + oHeaderData.Operacao +
                " for NF: " + oHeaderData.Nf +
                ", Identificador: " + oHeaderData.Identificador);
        },

        /**
         * Enhanced input validation with specific business rules
         * @private
         * @param {object} oInputValues the input values to validate
         * @returns {object} validation result with details
         */
        _validateBusinessRules: function (oInputValues) {
            var aErrors = [];

            // Validate NF exists (obtained from ValidIdentificador)
            if (!oInputValues.nf || oInputValues.nf.trim().length === 0) {
                aErrors.push("NF: Não encontrada para o identificador informado");
            }

            // Validate Identificador format
            if (!oInputValues.identificador || oInputValues.identificador.length === 0) {
                aErrors.push("Identificador: Campo obrigatório");
            } else if (oInputValues.identificador.length > 50) {
                aErrors.push("Identificador: Muito longo (máximo 50 caracteres)");
            }

            var oResult = {
                isValid: aErrors.length === 0,
                errors: aErrors,
                message: aErrors.length > 0 ? aErrors.join("\n") : ""
            };
            return oResult;
        },

        /**
         * Show validation errors with field highlighting
         * @private
         * @param {object} oValidationResult the validation result
         */
        _showValidationErrors: function (oValidationResult) {
            if (!oValidationResult.isValid) {
                // Highlight fields with errors
                if (oValidationResult.message.indexOf("NF:") !== -1 || oValidationResult.message.indexOf("Identificador:") !== -1) {
                    var oIdentificadorInput = this.byId("identificadorInput");
                    if (oIdentificadorInput) {
                        oIdentificadorInput.setValueState("Error");
                        oIdentificadorInput.setValueStateText("Erro na validação");
                    }
                }

                this.showErrorMessage(oValidationResult.message);
            }
        },

        /**
         * Clear all validation states
         * @private
         */
        _clearValidationStates: function () {
            this.clearValidationStates(["identificadorInput"]);
        },

        /**
         * Log validation activity for debugging
         * @private
         * @param {string} sAction the action being performed
         * @param {object} oInputValues the input values
         * @param {string} sResult the result of validation
         */
        _logValidationActivity: function (sAction, oInputValues, sResult) {
            //}
        },

        /**
         * Clear all navigation data when entering PhysicalReceipt screen
         * @private
         */
        _clearAllNavigationData: function () {
            // Use the centralized method from BaseController
            this.clearAllNavigationData();

            // Force clear the input field and its binding
            var oIdentificadorInput = this.byId("identificadorInput");
            if (oIdentificadorInput) {
                oIdentificadorInput.setValue("");
                oIdentificadorInput.setValueState("None");
                oIdentificadorInput.setValueStateText("");

                // Force refresh the binding to ensure the field is cleared
                oIdentificadorInput.bindValue({
                    path: "receiptContext>/identificador",
                    mode: "OneWay"
                });
            }

            // Clear any validation states
            this._clearValidationStates();

            // Force refresh the model to ensure UI is updated
            var oReceiptModel = this.getModel("receiptContext");
            if (oReceiptModel) {
                oReceiptModel.refresh(true);
            }

        }
    });
});