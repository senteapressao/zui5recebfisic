sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, MessageBox) {
    "use strict";

    return BaseController.extend("zui5recebfisic.controller.CreateUC", {

        onInit: function () {
            // Initialize the create UC screen
            this._initializeLocalModel();
            this._initializeMatEmbModel();
            this._attachRouteMatched();
        },

        /**
         * Initialize local model for receipt context
         * @private
         */
        _initializeLocalModel: function () {
            this.getOrCreateLocalModel("receiptContext", {
                nf: "",
                identificador: "",
                materialEmbalagem: "",
                isValidatingMaterial: false
            });
        },

        /**
         * Initialize MatEmb model for combobox data
         * @private
         */
        _initializeMatEmbModel: function () {
            var oMatEmbModel = new JSONModel({
                MatEmbSet: []
            });
            this.getView().setModel(oMatEmbModel, "matEmbModel");
        },

        /**
         * Load MatEmb data from OData service
         * @private
         */
        _loadMatEmbData: function () {
            var oModel = this.getModel();
            var oMatEmbModel = this.getView().getModel("matEmbModel");
            
            
            if (oModel) {
                oModel.read("/MatEmbSet", {
                    success: function (oData) {
                        
                        // Verificar diferentes estruturas possíveis de resposta
                        var aResults = null;
                        if (oData.results) {
                            aResults = oData.results;
                        } else if (oData.d && oData.d.results) {
                            aResults = oData.d.results;
                        } else if (Array.isArray(oData)) {
                            aResults = oData;
                        } else {
                        }
                        
                        if (aResults && Array.isArray(aResults)) {
                            oMatEmbModel.setProperty("/MatEmbSet", aResults);
                            
                            // Forçar atualização do binding do ComboBox
                            this._refreshComboBoxBinding();
                        } else {
                            //console.error("Nenhum array de dados encontrado na resposta");
                            oMatEmbModel.setProperty("/MatEmbSet", []);
                        }
                    }.bind(this),
                    error: function (oError) {
                        //console.error("Erro ao carregar dados MatEmb:", oError);
                        this.showErrorMessage("Erro ao carregar materiais de embalagem: " + (oError.message || "Erro desconhecido"));
                    }.bind(this)
                });
            } else {
                //console.error("Modelo OData não disponível");
                this.showErrorMessage("Serviço de dados não disponível");
            }
        },

        /**
         * Refresh ComboBox binding after data is loaded
         * @private
         */
        _refreshComboBoxBinding: function () {
            var oCombo = this.byId("materialEmbalagemCombo");
            if (oCombo) {
                
                // Forçar refresh do binding
                var oBinding = oCombo.getBinding("items");
                if (oBinding) {
                    oBinding.refresh();
                } else {
                    // Se não há binding, tentar recriar
                    oCombo.bindItems({
                        path: "matEmbModel>/MatEmbSet",
                        template: new sap.ui.core.Item({
                            key: "{matEmbModel>Matnr}",
                            text: "{matEmbModel>Descr}"
                        })
                    });
                }
                
                setTimeout(function() {
                }, 100);
            } else {
                //console.error("ComboBox não encontrado para atualização");
            }
        },

        /**
         * Attach route matched event
         * @private
         */
        _attachRouteMatched: function () {
            var oRouter = this.getRouter();
            oRouter.getRoute("RouteCreateUC").attachPatternMatched(this._onRouteMatched, this);
        },

        /**
         * Handle route matched event
         * @private
         * @param {sap.ui.base.Event} oEvent route matched event
         */
        _onRouteMatched: function (oEvent) {
            this._loadReceiptContext();
            this._loadMatEmbData();
        },

        /**
         * Load receipt context from global model or navigation parameters
         * @private
         */
        _loadReceiptContext: function () {
            var oReceiptModel = this.getModel("receiptContext");
            
            // Try to get data from global context first
            var oGlobalModel = this.getOwnerComponent().getModel("globalContext");
            var oGlobalData = null;
            
            if (oGlobalModel) {
                oGlobalData = oGlobalModel.getData();
            }
            
            // If no global context, try to get from component's receiptContext model
            if (!oGlobalData || (!oGlobalData.nf && !oGlobalData.identificador)) {
                var oComponentReceiptModel = this.getOwnerComponent().getModel("receiptContext");
                if (oComponentReceiptModel) {
                    oGlobalData = oComponentReceiptModel.getData();
                }
            }
            
            // Update local model with the data, but always start with empty materialEmbalagem
            if (oGlobalData) {
                oReceiptModel.setData({
                    nf: oGlobalData.nf || "",
                    identificador: oGlobalData.identificador || "",
                    materialEmbalagem: "", // Always start with empty material
                    isValidatingMaterial: false
                });
            }
            
            // Update display fields directly to ensure they show the values
            var sNf = oGlobalData ? (oGlobalData.nf || "") : "";
            var sIdentificador = oGlobalData ? (oGlobalData.identificador || "") : "";
            
            if (this.byId("nfDisplay")) {
                this.byId("nfDisplay").setValue(sNf);
            }
            if (this.byId("identificadorDisplay")) {
                this.byId("identificadorDisplay").setValue(sIdentificador);
            }
        },

        /**
         * Navigate back to main menu
         * @public
         */
        onInicioPress: function () {
            // Clear any partial UC data when returning to main menu
            this.clearReceiptContext(['materialEmbalagem', 'uc']);
            this.navToMainMenu();
        },

        /**
         * Validate packaging material and create UC LxC with enhanced error handling
         * @public
         */
        onMontarUCLxCPress: function () {
            var that = this;
            var oReceiptModel = this.getModel("receiptContext");
            var oReceiptData = oReceiptModel.getData();
            
            // Get material embalagem from both model and control
            var sMaterialEmbalagem = oReceiptData.materialEmbalagem;
            var oCombo = this.byId("materialEmbalagemCombo");
            var sSelectedKey = oCombo ? oCombo.getSelectedKey() : "";
            
            // Use control value if model value is empty
            if (!sMaterialEmbalagem && sSelectedKey) {
                sMaterialEmbalagem = sSelectedKey;
                oReceiptModel.setProperty("/materialEmbalagem", sSelectedKey);
            }
            

            // Clear previous validation states
            this.clearInputValidation("materialEmbalagemCombo");

            // Validate required fields with enhanced feedback
            if (!this._validateRequiredFields()) {
                this._highlightRequiredFields();
                return;
            }

            // Validate material format with detailed feedback
            var oMaterialValidation = this._validateMaterialFormat(sMaterialEmbalagem);
            if (!oMaterialValidation.isValid) {
                this.setInputError("materialEmbalagemCombo", oMaterialValidation.message);
                this.showErrorMessage(oMaterialValidation.message);
                
                // Add visual feedback for mobile
                if (this.isMobileDevice && this.isMobileDevice()) {
                    this._addMaterialInputShake();
                }
                return;
            }

            // Show success validation state
            this.setInputSuccess("materialEmbalagemCombo", "Material válido");

            // Check if container status is CONCLUIDO before creating UC
            this.showBusyIndicator("Validando status do container...");
            this._validateContainerStatus(oReceiptData.nf, oReceiptData.identificador)
                .then(function (bCanCreateUC) {
                    that.hideBusyIndicator();
                    
                    if (!bCanCreateUC) {
                        sap.m.MessageBox.warning("O container já está com status CONCLUÍDO. Não é possível criar novas UCs.", {
                            title: "Operação não permitida",
                            actions: [sap.m.MessageBox.Action.OK]
                        });
                        return;
                    }
                    
                    // Set loading state with progress indication
                    oReceiptModel.setProperty("/isValidatingMaterial", true);
                    that.showProgressDialog("Criando UC LxC", "Validando material de embalagem...");

                    // Create UC with enhanced error handling
                    that._createUC(oReceiptData.nf, oReceiptData.identificador, oMaterialValidation.cleanMaterial)
                        .then(function (oUCResult) {
                            that.updateProgressDialog("UC LxC criada com sucesso!");
                            
                            // Update global context with UC information FIRST
                            that._updateGlobalContext(oUCResult);
                            
                            // Get current receipt context and add UC
                            var oReceiptModel = that.getModel("receiptContext");
                            var oReceiptContext = oReceiptModel.getData();
                            oReceiptContext.uc = oUCResult.uc;
                            
                            // Show success with action
                            that.showSuccessMessageWithAction(
                                "UC LxC '" + oUCResult.uc + "' criada com sucesso",
                                "Continuar",
                                function () {
                                    that.navToAssembleUCLxC(oReceiptContext);
                                }
                            );
                            
                            // Auto-navigate after short delay
                            setTimeout(function () {
                                that.navToAssembleUCLxC(oReceiptContext);
                            }, 1500);
                            
                        })
                        .catch(function (oError) {
                            that._handleUCCreationError(oError);
                        })
                        .finally(function () {
                            // Clear loading state
                            oReceiptModel.setProperty("/isValidatingMaterial", false);
                            that.hideProgressDialog();
                        });
                })
                .catch(function (oError) {
                    that.hideBusyIndicator();
                    that.handleServiceError(oError, {
                        defaultMessage: "Erro ao validar status do container"
                    });
                });
        },

        /**
         * Validate packaging material and create UC with enhanced error handling
         * @public
         */
        onMontarUCPress: function () {
            var that = this;
            var oReceiptModel = this.getModel("receiptContext");
            var oReceiptData = oReceiptModel.getData();
            
            // Get material embalagem from both model and control
            var sMaterialEmbalagem = oReceiptData.materialEmbalagem;
            var oCombo = this.byId("materialEmbalagemCombo");
            var sSelectedKey = oCombo ? oCombo.getSelectedKey() : "";
            
            // Use control value if model value is empty
            if (!sMaterialEmbalagem && sSelectedKey) {
                sMaterialEmbalagem = sSelectedKey;
                oReceiptModel.setProperty("/materialEmbalagem", sSelectedKey);
            }
            

            // Clear previous validation states
            this.clearInputValidation("materialEmbalagemCombo");

            // Validate required fields with enhanced feedback
            if (!this._validateRequiredFields()) {
                this._highlightRequiredFields();
                return;
            }

            // Validate material format with detailed feedback
            var oMaterialValidation = this._validateMaterialFormat(sMaterialEmbalagem);
            if (!oMaterialValidation.isValid) {
                this.setInputError("materialEmbalagemCombo", oMaterialValidation.message);
                this.showErrorMessage(oMaterialValidation.message);
                
                // Add visual feedback for mobile
                if (this.isMobileDevice && this.isMobileDevice()) {
                    this._addMaterialInputShake();
                }
                return;
            }

            // Show success validation state
            this.setInputSuccess("materialEmbalagemCombo", "Material válido");

            // Check if container status is CONCLUIDO before creating UC
            this.showBusyIndicator("Validando status do container...");
            this._validateContainerStatus(oReceiptData.nf, oReceiptData.identificador)
                .then(function (bCanCreateUC) {
                    that.hideBusyIndicator();
                    
                    if (!bCanCreateUC) {
                        sap.m.MessageBox.warning("O container já está com status CONCLUÍDO. Não é possível criar novas UCs.", {
                            title: "Operação não permitida",
                            actions: [sap.m.MessageBox.Action.OK]
                        });
                        return;
                    }
                    
                    // Set loading state with progress indication
                    oReceiptModel.setProperty("/isValidatingMaterial", true);
                    that.showProgressDialog("Criando UC", "Validando material de embalagem...");

                    // Create UC with enhanced error handling
                    that._createUC(oReceiptData.nf, oReceiptData.identificador, oMaterialValidation.cleanMaterial)
                        .then(function (oUCResult) {
                            that.updateProgressDialog("UC criada com sucesso!");
                            
                            // Update global context with UC information FIRST
                            that._updateGlobalContext(oUCResult);
                            
                            // Get current receipt context and add UC
                            var oReceiptModel = that.getModel("receiptContext");
                            var oReceiptContext = oReceiptModel.getData();
                            oReceiptContext.uc = oUCResult.uc;
                            
                            // Show success with action
                            that.showSuccessMessageWithAction(
                                "UC '" + oUCResult.uc + "' criada com sucesso",
                                "Continuar",
                                function () {
                                    that.navToAssembleUC(oReceiptContext);
                                }
                            );
                            
                            // Auto-navigate after short delay
                            setTimeout(function () {
                                that.navToAssembleUC(oReceiptContext);
                            }, 1500);
                            
                        })
                        .catch(function (oError) {
                            that._handleUCCreationError(oError);
                        })
                        .finally(function () {
                            // Clear loading state
                            oReceiptModel.setProperty("/isValidatingMaterial", false);
                            that.hideProgressDialog();
                        });
                })
                .catch(function (oError) {
                    that.hideBusyIndicator();
                    that.handleServiceError(oError, {
                        defaultMessage: "Erro ao validar status do container"
                    });
                });
        },

        /**
         * Handle UC creation errors with detailed feedback
         * @private
         * @param {object} oError the error object
         */
        _handleUCCreationError: function (oError) {
            var sErrorMessage = "Erro ao criar UC";
            var bShowRetry = false;
            
            // Analyze error type for specific handling
            if (oError && oError.message) {
                if (oError.message.indexOf("não cadastrado") !== -1 || 
                    oError.message.indexOf("não encontrado") !== -1 ||
                    oError.message.indexOf("Material") !== -1) {
                    sErrorMessage = "Material de embalagem não cadastrado no SAP";
                    this.setInputError("materialEmbalagemCombo", sErrorMessage);
                } else if (oError.message.indexOf("timeout") !== -1 ||
                          oError.message.indexOf("network") !== -1) {
                    sErrorMessage = "Erro de conexão. Verifique sua rede e tente novamente.";
                    bShowRetry = true;
                } else {
                    sErrorMessage = oError.message;
                }
            }
            
            // Show error with retry option if applicable
            this.handleServiceError(oError, {
                defaultMessage: sErrorMessage,
                showRetry: bShowRetry,
                onRetry: this.onMontarUCPress.bind(this),
                context: "UC Creation"
            });
        },

        /**
         * Add shake animation to material input for mobile feedback
         * @private
         */
        _addMaterialInputShake: function () {
            var oCombo = this.byId("materialEmbalagemCombo");
            if (oCombo) {
                oCombo.addStyleClass("inputError");
                setTimeout(function () {
                    oCombo.removeStyleClass("inputError");
                }, 300);
                
                // Add haptic feedback if available
                if (this.addHapticFeedback) {
                    this.addHapticFeedback("error");
                }
            }
        },

        /**
         * Highlight required fields that are empty
         * @private
         */
        _highlightRequiredFields: function () {
            var sMaterial = this.byId("materialEmbalagemCombo").getValue();
            
            if (!sMaterial || sMaterial.trim() === "") {
                this.setInputError("materialEmbalagemCombo", "Material de embalagem é obrigatório");
                this._addMaterialInputShake();
            }
        },

        /**
         * Handle material combobox selection change to clear validation states
         * @public
         * @param {sap.ui.base.Event} oEvent the selection change event
         */
        onMaterialSelectionChange: function (oEvent) {
            var oCombo = oEvent.getSource();
            var oSelectedItem = oEvent.getParameter("selectedItem");
            var sKey = oSelectedItem ? oSelectedItem.getKey() : "";
            var sText = oSelectedItem ? oSelectedItem.getText() : "";
            
            
            // Clear validation state when user makes a selection
            if (oCombo.getValueState() === "Error") {
                oCombo.setValueState("None");
                oCombo.setValueStateText("");
            }
            
            // Update model with the KEY (Matnr), not the text
            var oReceiptModel = this.getModel("receiptContext");
            oReceiptModel.setProperty("/materialEmbalagem", sKey);
            
            // Forçar o ComboBox a mostrar o texto, mas manter a chave no modelo
            if (oSelectedItem) {
                oCombo.setValue(sText); // Mostra o texto para o usuário
            }
            
        },

        /**
         * Validate required fields
         * @private
         * @returns {boolean} true if all required fields are valid
         */
        _validateRequiredFields: function () {
            var aRequiredFields = [
                {
                    id: "materialEmbalagemCombo",
                    label: "Material de Embalagem"
                }
            ];

            return this.validateRequiredFields(aRequiredFields);
        },

        /**
         * Validate material format
         * @private
         * @param {string} sMaterial the material code to validate
         * @returns {object} validation result with isValid and message
         */
        _validateMaterialFormat: function (sMaterial) {
            if (!sMaterial || typeof sMaterial !== "string") {
                return {
                    isValid: false,
                    message: "Material de embalagem é obrigatório"
                };
            }

            var sCleanMaterial = sMaterial.trim();
            
            if (sCleanMaterial.length === 0) {
                return {
                    isValid: false,
                    message: "Material de embalagem é obrigatório"
                };
            }

            return {
                isValid: true,
                message: "",
                cleanMaterial: sCleanMaterial
            };
        },



        /**
         * Create UC using backend function
         * @private
         * @param {string} sNf the invoice number
         * @param {string} sIdentificador the container/truck identifier
         * @param {string} sMaterialEmbalagem the packaging material code
         * @returns {Promise} promise that resolves with UC creation result
         */
        _createUC: function (sNf, sIdentificador, sMaterialEmbalagem) {
            // Use the new service method from BaseController
            return this.createUC(sMaterialEmbalagem, sNf, sIdentificador);
        },

        /**
         * Validate container status before UC creation
         * @param {string} sNf - Invoice number
         * @param {string} sIdentificador - Container identifier
         * @returns {Promise} Promise that resolves with boolean indicating if UC can be created
         * @private
         */
        _validateContainerStatus: function (sNf, sIdentificador) {
            var oModel = this.getModel();
            
            return new Promise(function (resolve, reject) {
                // Read Header entity to check StatusReceb
                var sHeaderPath = "/HeaderSet(Nf='" + sNf + "',Identificador='" + sIdentificador + "')";
                
                oModel.read(sHeaderPath, {
                    success: function (oData) {
                        // Check if StatusReceb is CONCLUIDO
                        if (oData.StatusReceb === "CONCLUIDO") {
                            resolve(false); // Cannot create UC
                        } else {
                            resolve(true); // Can create UC
                        }
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },

        /**
         * Update global context with UC information
         * @private
         * @param {object} oUCResult the UC creation result
         */
        _updateGlobalContext: function (oUCResult) {
            var oGlobalModel = this.getOwnerComponent().getModel("globalContext");
            if (!oGlobalModel) {
                oGlobalModel = new JSONModel({});
                this.getOwnerComponent().setModel(oGlobalModel, "globalContext");
            }

            // Get current receipt context to preserve NF, Identificador, etc.
            var oReceiptModel = this.getModel("receiptContext");
            var oReceiptData = oReceiptModel.getData();
            
            // Update global context with all receipt data plus new UC
            var oGlobalData = {
                nf: oReceiptData.nf || "",
                identificador: oReceiptData.identificador || "",
                uc: oUCResult.uc,
                operacao: oReceiptData.operacao || "",
                statusReceb: oReceiptData.statusReceb || "",
                statusContainer: oReceiptData.statusContainer || "",
                currentStep: "AssembleUC"
            };
            
            oGlobalModel.setData(oGlobalData);
            
            // Also update component-level receipt context
            var oComponentReceiptModel = this.getOwnerComponent().getModel("receiptContext");
            if (oComponentReceiptModel) {
                oComponentReceiptModel.setData(oGlobalData);
            }
            
        }
    });
});