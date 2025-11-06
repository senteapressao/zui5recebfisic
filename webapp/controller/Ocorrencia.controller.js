sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("zui5recebfisic.controller.Ocorrencia", {

        onInit: function () {
            // Initialize the occurrence screen
            this._initializeOccurrenceModel();
            this._initializeMobileFeatures();
            
            // Get router and attach route matched event
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteOcorrencia").attachPatternMatched(this._onRouteMatched, this);
        },

        /**
         * Handle route matched event to get parameters
         * @private
         * @param {sap.ui.base.Event} oEvent the route matched event
         */
        _onRouteMatched: function (oEvent) {
            // Check if this is a divergence case from global context
            this._checkDivergenceFromContext();
        },

        /**
         * Initialize the occurrence context model
         * @private
         */
        _initializeOccurrenceModel: function () {
            var that = this;
            var oOccurrenceData = {
                nf: "",
                identificador: "",
                uc: "", // UC from AssembleUC context
                tipoOcorrencia: "",
                descricao: "",
                segreMat: false, // Will be set based on TipoOcorrencia selection
                tipoOcorrenciaDesc: "",
                sourceScreen: "" // Track which screen we came from
            };

            // Create local model for this view
            this.createLocalModel(oOccurrenceData, "occurrenceContext");

            // Load data from global context if available
            this._loadFromGlobalContext();
        },

        /**
         * Load data from global context
         * @private
         */
        _loadFromGlobalContext: function () {
            var oComponent = this.getOwnerComponent();
            var oGlobalModel = oComponent.getModel("globalContext");
            var oReceiptModel = oComponent.getModel("receiptContext");


            if (oGlobalModel) {
                var oGlobalData = oGlobalModel.getData();
                var oOccurrenceModel = this.getModel("occurrenceContext");
                
                if (oGlobalData.nf && oGlobalData.identificador) {
                    oOccurrenceModel.setProperty("/nf", oGlobalData.nf);
                    oOccurrenceModel.setProperty("/identificador", oGlobalData.identificador);
                    
                    // Load UC if coming from AssembleUC
                    if (oGlobalData.uc) {
                        oOccurrenceModel.setProperty("/uc", oGlobalData.uc);
                    }
                    
                    // Store source screen for navigation back
                    if (oGlobalData.sourceScreen) {
                        oOccurrenceModel.setProperty("/sourceScreen", oGlobalData.sourceScreen);
                    }
                    
                    // Check if this is a divergence NF case
                    if (oGlobalData.divergences) {
                        // Generate description based on divergences
                        var sDescription = this._generateDivergenceDescription(oGlobalData.divergences);
                        oOccurrenceModel.setProperty("/descricao", sDescription);
                        
                        // Keep the text area enabled so user can edit the description
                        var oTextArea = this.byId("descricaoTextArea");
                        if (oTextArea) {
                            oTextArea.setEnabled(true);
                            // Add a placeholder to indicate it's pre-filled but editable
                            //oTextArea.setPlaceholder("Descrição gerada automaticamente - você pode editar");
                        }
                    }
                }
            }

            // Also check receipt context
            if (oReceiptModel) {
                var oReceiptData = oReceiptModel.getData();
                var oOccurrenceModel = this.getModel("occurrenceContext");
                
                if (oReceiptData.nf && oReceiptData.identificador) {
                    oOccurrenceModel.setProperty("/nf", oReceiptData.nf);
                    oOccurrenceModel.setProperty("/identificador", oReceiptData.identificador);
                    
                    // Load UC if available
                    if (oReceiptData.uc) {
                        oOccurrenceModel.setProperty("/uc", oReceiptData.uc);
                    }
                    
                    // Store source screen for navigation back
                    if (oReceiptData.sourceScreen) {
                        oOccurrenceModel.setProperty("/sourceScreen", oReceiptData.sourceScreen);
                    }
                }
            }
        },


        /**
         * Check if this is a divergence case from global context
         * @private
         */
        _checkDivergenceFromContext: function () {
            var oComponent = this.getOwnerComponent();
            var oGlobalModel = oComponent.getModel("globalContext");
            
            if (oGlobalModel) {
                var oGlobalData = oGlobalModel.getData();
                if (oGlobalData.divergenceNF === true) {
                    // Apply filter for NF divergence
                    this._applyDivergenceFilter();
                }
            }
        },

        /**
         * Apply filter to combo box for NF divergence
         * @private
         */
        _applyDivergenceFilter: function () {
            var oComboBox = this.byId("tipoOcorrenciaComboBox");
            if (oComboBox) {
                oComboBox.bindItems({
                    path: '/TipoOcorrenciaSet',
                    filters: [
                        new sap.ui.model.Filter("DivergenciaNf", "EQ", "X")
                    ],
                    template: new sap.ui.core.Item({
                        key: "{Tipo}",
                        text: "{Descr}"
                    })
                });
            }
        },


        /**
         * Initialize mobile-specific features
         * @private
         */
        _initializeMobileFeatures: function () {
            // Optimize form inputs for mobile
            this.optimizeFormForMobile([
                "tipoOcorrenciaComboBox",
                "descricaoTextArea"
            ]);

            // Add haptic feedback to buttons if on mobile device
            if (this.isMobileDevice()) {
                this._addHapticFeedbackToButtons();
            }
        },


        /**
         * Generate description for divergence case
         * @private
         * @param {array} aDivergences array of divergence objects
         * @returns {string} generated description
         */
        _generateDivergenceDescription: function (aDivergences) {
            var sDescription = "Divergência de quantidades entre recebimento e Nota Fiscal:\n\n";
            
            aDivergences.forEach(function (oDivergence) {
                sDescription += "Material: " + oDivergence.material + "\n";
                sDescription += "Quantidade NF: " + oDivergence.nfQty + "\n";
                sDescription += "Quantidade Recebida: " + oDivergence.receivedQty + "\n";
                sDescription += "Diferença: " + oDivergence.difference + "\n\n";
            });
            
            return sDescription;
        },

        /**
         * Add haptic feedback to action buttons
         * @private
         */
        _addHapticFeedbackToButtons: function () {
            var that = this;
            var aButtonIds = [
                "voltarButton",
                "concluirButton"
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
         * Handle tipo ocorrência selection change
         * @private
         * @param {sap.ui.base.Event} oEvent the selection change event
         */
        _onTipoOcorrenciaChange: function (oEvent) {
            var oComboBox = oEvent.getSource();
            var sSelectedKey = oComboBox.getSelectedKey();
            var oSelectedItem = oComboBox.getSelectedItem();
            
            var oOccurrenceModel = this.getModel("occurrenceContext");
            oOccurrenceModel.setProperty("/tipoOcorrencia", sSelectedKey);
            
            if (oSelectedItem) {
                var oBindingContext = oSelectedItem.getBindingContext();
                if (oBindingContext) {
                    var oData = oBindingContext.getObject();
                    oOccurrenceModel.setProperty("/tipoOcorrenciaDesc", oData.Descr);
                    oOccurrenceModel.setProperty("/segreMat", oData.SegreMat === 'X');
                    
                    // Show/hide buttons based on SegreMat
                    this._updateButtonVisibility(oData.SegreMat === 'X');
                }
            }

            // Clear any previous validation states
            this.clearInputValidation("tipoOcorrenciaComboBox");
        },

        /**
         * Handle descrição change
         * @private
         * @param {sap.ui.base.Event} oEvent the live change event
         */
        _onDescricaoChange: function (oEvent) {
            var oTextArea = oEvent.getSource();
            var sValue = oTextArea.getValue();
            
            var oOccurrenceModel = this.getModel("occurrenceContext");
            oOccurrenceModel.setProperty("/descricao", sValue);

            // Clear any previous validation states
            this.clearInputValidation("descricaoTextArea");
        },

        /**
         * Validate form fields
         * @private
         * @returns {boolean} true if validation passes
         */
        _validateForm: function () {
            var oOccurrenceModel = this.getModel("occurrenceContext");
            var sTipoOcorrencia = oOccurrenceModel.getProperty("/tipoOcorrencia");
            var sDescricao = oOccurrenceModel.getProperty("/descricao");
            
            var bIsValid = true;

            // Clear previous validation states
            this.clearInputValidation("tipoOcorrenciaComboBox");
            this.clearInputValidation("descricaoTextArea");

            // Validate tipo ocorrência
            if (!sTipoOcorrencia || sTipoOcorrencia.trim().length === 0) {
                this.setInputError("tipoOcorrenciaComboBox", "Tipo de ocorrência é obrigatório");
                bIsValid = false;
            }

            // Validate descrição
            if (!sDescricao || sDescricao.trim().length === 0) {
                this.setInputError("descricaoTextArea", "Descrição é obrigatória");
                bIsValid = false;
            } else if (sDescricao.trim().length < 10) {
                this.setInputError("descricaoTextArea", "Descrição deve ter pelo menos 10 caracteres");
                bIsValid = false;
            }

            return bIsValid;
        },

        /**
         * Call CriarOcorrencia function
         * @private
         * @param {object} oOccurrenceData the occurrence data
         * @returns {Promise} promise for the function call
         */
        _callCriarOcorrencia: function (oOccurrenceData) {
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
                    TipoOco: oOccurrenceData.tipoOcorrencia,
                    Descr: oOccurrenceData.descricao,
                    Identificador: '',
                    Quantidade: oOccurrenceData.quantidade || '',
                    Material: oOccurrenceData.material || '',
                    Uc: oOccurrenceData.uc || '', // Include UC if available (from AssembleUC)
                    Deposito: oOccurrenceData.deposito || '' // Include Deposito if available (from OcorrenciaSegregacao)
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
                        console.error("Error calling CriarOcorrencia:", oError);
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
            var oOccurrenceModel = this.getModel("occurrenceContext");
            var sSourceScreen = oOccurrenceModel.getProperty("/sourceScreen");
            
            // Navigate back to the appropriate screen based on source
            if (sSourceScreen === "AssembleUC") {
                this.navToAssembleUC();
            } else if (sSourceScreen === "ToConfirm") {
                this.navToToConfirm();
            } else {
                this.navToPhysicalReceipt();
            }
        },

        /**
         * Handle conclude occurrence action
         * @public
         */
        onConcluirPress: function () {
            
            // Validate form
            if (!this._validateForm()) {
                this.showErrorMessage("Por favor, preencha todos os campos obrigatórios");
                return;
            }

            var oOccurrenceModel = this.getModel("occurrenceContext");
            var oOccurrenceData = oOccurrenceModel.getData();

            // Check if SegreMat is set (requires segregation screen)
            if (oOccurrenceData.segreMat) {
                // Navigate to segregation screen
                this._navigateToSegregationScreen(oOccurrenceData);
            } else {
                // Call CriarOcorrencia directly
                this._processOccurrenceWithoutSegregation(oOccurrenceData);
            }
        },

        /**
         * Navigate to segregation screen
         * @private
         * @param {object} oOccurrenceData the occurrence data
         */
        _navigateToSegregationScreen: function (oOccurrenceData) {
            // Save occurrence data to global context for segregation screen
            var oComponent = this.getOwnerComponent();
            var oGlobalModel = oComponent.getModel("globalContext");
            
            if (!oGlobalModel) {
                oGlobalModel = new JSONModel({});
                oComponent.setModel(oGlobalModel, "globalContext");
            }

            // Update global context with occurrence data
            var oGlobalData = oGlobalModel.getData();
            oGlobalData.occurrenceData = oOccurrenceData;
            oGlobalData.currentStep = "OcorrenciaSegregacao";
            
            oGlobalModel.setData(oGlobalData);

            // Navigate to segregation screen
            this.navToOcorrenciaSegregacao();
        },

        /**
         * Process occurrence without segregation
         * @private
         * @param {object} oOccurrenceData the occurrence data
         */
        _processOccurrenceWithoutSegregation: function (oOccurrenceData) {
            var that = this;

            // Check if this is a multiple occurrence case (divergence with multiple materials)
            var oGlobalModel = this.getOwnerComponent().getModel("globalContext");
            if (oGlobalModel) {
                var oGlobalData = oGlobalModel.getData();
                if (oGlobalData.multipleOccurrences && oGlobalData.divergences && oGlobalData.divergences.length > 0) {
                    // Process multiple occurrences for each divergent material
                    this._processMultipleOccurrences(oOccurrenceData, oGlobalData.divergences);
                    return;
                }
            }

            // Single occurrence case
            this.showMobileLoading("Processando ocorrência...", 0);

            // Call CriarOcorrencia function
            this._callCriarOcorrencia(oOccurrenceData)
                .then(function (oResult) {
                    that.hideMobileLoading();
                    that.showSuccessMessage("Ocorrência registrada com sucesso");
                    
                    // Navigate back to main menu
                    setTimeout(function () {
                        that.navToMainMenu();
                    }, 1500);
                })
                .catch(function (oError) {
                    that.hideMobileLoading();
                    that.showErrorMessage("Erro ao registrar ocorrência: " + (oError.message || "Erro desconhecido"));
                });
        },

        /**
         * Process multiple occurrences for divergent materials
         * @private
         * @param {object} oOccurrenceData the base occurrence data
         * @param {array} aDivergences array of divergence objects
         */
        _processMultipleOccurrences: function (oOccurrenceData, aDivergences) {
            var that = this;
            var iTotalOccurrences = aDivergences.length;
            var iCurrentIndex = 0;
            var iSuccessfulOccurrences = 0;
            var aErrors = [];


            // Show loading state
            this.showMobileLoading("Processando 1/" + iTotalOccurrences + " ocorrências...", 0);

            // Process occurrences sequentially to avoid OData changeset conflicts
            function processNextOccurrence() {
                if (iCurrentIndex >= aDivergences.length) {
                    // All occurrences processed
                    that.hideMobileLoading();
                    
                    // Show final result
                    if (iSuccessfulOccurrences === iTotalOccurrences) {
                        that.showSuccessMessage(iSuccessfulOccurrences + " ocorrências registradas com sucesso");
                    } else if (iSuccessfulOccurrences > 0) {
                        var sMessage = iSuccessfulOccurrences + " ocorrências registradas com sucesso";
                        if (aErrors.length > 0) {
                            sMessage += "\n\nErros em " + aErrors.length + " materiais:";
                            aErrors.forEach(function (oError) {
                                sMessage += "\n- " + oError.material + ": " + oError.error;
                            });
                        }
                        that.showWarningMessage(sMessage);
                    } else {
                        that.showErrorMessage("Erro ao registrar ocorrências: " + (aErrors[0] ? aErrors[0].error : "Erro desconhecido"));
                    }
                    
                    // Navigate back to main menu
                    setTimeout(function () {
                        that.navToMainMenu();
                    }, 2000);
                    return;
                }

                var oDivergence = aDivergences[iCurrentIndex];
                var iCurrentOccurrence = iCurrentIndex + 1;

                // Create occurrence data for this specific material
                var oMaterialOccurrenceData = {
                    nf: oOccurrenceData.nf,
                    tipoOcorrencia: oOccurrenceData.tipoOcorrencia,
                    descricao: oOccurrenceData.descricao, // Use only user's description
                    material: oDivergence.material,
                    quantidade: Math.abs(oDivergence.difference), // Absolute value of difference
                    uc: oOccurrenceData.uc || '',
                    deposito: oOccurrenceData.deposito || ''
                };


                // Update loading message
                that.showMobileLoading("Processando " + iCurrentOccurrence + "/" + iTotalOccurrences + " ocorrências...", 0);

                // Call CriarOcorrencia for this material
                that._callCriarOcorrencia(oMaterialOccurrenceData)
                    .then(function (oResult) {
                        iSuccessfulOccurrences++;
                    })
                    .catch(function (oError) {
                        aErrors.push({
                            material: oDivergence.material,
                            error: oError.message || "Erro desconhecido"
                        });
                        console.error("DEBUG: Error creating occurrence for material", oDivergence.material, oError);
                    })
                    .finally(function () {
                        iCurrentIndex++;
                        // Process next occurrence after a short delay to avoid overwhelming the server
                        setTimeout(processNextOccurrence, 500);
                    });
            }

            // Start processing
            processNextOccurrence();
        },


        /**
         * Update button visibility based on SegreMat flag
         * @private
         * @param {boolean} bRequiresSegregation whether segregation is required
         */
        _updateButtonVisibility: function (bRequiresSegregation) {
            var oConcluirButton = this.byId("ocorrenciaConcluirButton");
            var oProximoButton = this.byId("ocorrenciaProximoButton");
            
            if (bRequiresSegregation) {
                // Hide Concluir button, show Próximo button
                if (oConcluirButton) oConcluirButton.setVisible(false);
                if (oProximoButton) oProximoButton.setVisible(true);
            } else {
                // Show Concluir button, hide Próximo button
                if (oConcluirButton) oConcluirButton.setVisible(true);
                if (oProximoButton) oProximoButton.setVisible(false);
            }
        },

        /**
         * Handle próximo button press (for segregation cases)
         * @public
         */
        onProximoPress: function () {
            // Validate form
            if (!this._validateForm()) {
                this.showErrorMessage("Por favor, preencha todos os campos obrigatórios");
                return;
            }

            var oOccurrenceModel = this.getModel("occurrenceContext");
            var oOccurrenceData = oOccurrenceModel.getData();

            // Navigate to segregation screen
            this._navigateToSegregationScreen(oOccurrenceData);
        },

        /**
         * Navigate back to appropriate screen
         * @public
         */
        onNavBack: function () {
            var oOccurrenceModel = this.getModel("occurrenceContext");
            var sSourceScreen = oOccurrenceModel.getProperty("/sourceScreen");
            
            // Navigate back to the appropriate screen based on source
            if (sSourceScreen === "AssembleUC") {
                this.navToAssembleUC();
            } else if (sSourceScreen === "ToConfirm") {
                this.navToToConfirm();
            } else {
                this.navToPhysicalReceipt();
            }
        }
    });
});
