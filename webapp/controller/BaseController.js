sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/json/JSONModel",
    "./ServiceIntegrationHelper"
], function (Controller, MessageToast, MessageBox, History, BusyIndicator, JSONModel, ServiceIntegrationHelper) {
    "use strict";
    let Impressora;
    return Controller.extend("zui5recebfisic.controller.BaseController", {

        /**
         * Initialize the controller
         * @public
         */
        onInit: function () {
            // Initialize service integration helper
            this._oServiceHelper = new ServiceIntegrationHelper(this);
        },

        /**
         * Get service integration helper
         * @public
         * @returns {ServiceIntegrationHelper} the service helper instance
         */
        getServiceHelper: function () {
            if (!this._oServiceHelper) {
                this._oServiceHelper = new ServiceIntegrationHelper(this);
            }
            return this._oServiceHelper;
        },

        /**
         * Convenience method for accessing the router in every controller of the application.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },

        /**
         * Convenience method for getting the view model by name in every controller of the application.
         * @public
         * @param {string} sName the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel: function (sName) {
            // Validate that sName is either undefined or a string
            if (sName !== undefined && typeof sName !== "string") {
                console.error("getModel: sModelName must be a string or omitted. Received:", typeof sName, sName);
                return null;
            }
            
            // If no name is provided, try to get the default model from component first
            if (!sName) {
                var oComponentModel = this.getOwnerComponent().getModel();
                if (oComponentModel) {
                    return oComponentModel;
                }
            }
            return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model in every controller of the application.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel: function (oModel, sName) {
            // Validate that sName is either undefined or a string
            if (sName !== undefined && typeof sName !== "string") {
                console.error("setModel: sModelName must be a string or omitted. Received:", typeof sName, sName);
                return this.getView();
            }
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Convenience method for getting the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * Get user context from component
         * @public
         * @returns {object} user context object
         */
        getUserContext: function () {
            return this.getOwnerComponent().getUserContext();
        },

        /**
         * Check if current user is authorized
         * @public
         * @returns {boolean} true if user is authorized
         */
        isUserAuthorized: function () {
            return this.getOwnerComponent().isUserAuthorized();
        },

        /**
         * Get current user's centro
         * @public
         * @returns {string} centro code
         */
        getUserCentro: function () {
            return this.getOwnerComponent().getUserCentro();
        },

        /**
         * Get current user ID
         * @public
         * @returns {string} user ID
         */
        getCurrentUser: function () {
            return this.getOwnerComponent().getCurrentUser();
        },

        /**
         * Navigate to a specific route
         * @public
         * @param {string} sRouteName the name of the route to navigate to
         * @param {object} oParameters optional parameters for the route
         */
        navTo: function (sRouteName, oParameters) {
            this.getRouter().navTo(sRouteName, oParameters);
        },

        /**
         * Navigate to the main menu
         * @public
         */
        navToMainMenu: function () {
            this.navTo("RouteMainMenu");
        },

        /**
         * Navigate to physical receipt screen
         * @public
         */
        navToPhysicalReceipt: function () {
            this.navTo("RoutePhysicalReceipt");
        },

        /**
         * Navigate to create UC screen
         * @public
         */
        navToCreateUC: function () {
            this.navTo("RouteCreateUC");
        },

        /**
         * Navigate to assemble UC screen
         * @public
         * @param {object} oReceiptContext optional receipt context data
         */
        navToAssembleUC: function (oReceiptContext) {
            // If receipt context is provided, store it in a global model
            if (oReceiptContext) {
                this._setGlobalReceiptContext(oReceiptContext);
            }

            this.navTo("RouteAssembleUC");
        },

        /**
         * Navigate to assemble UC LxC screen
         * @public
         * @param {object} oReceiptContext optional receipt context data
         */
        navToAssembleUCLxC: function (oReceiptContext) {
            // If receipt context is provided, store it in a global model
            if (oReceiptContext) {
                this._setGlobalReceiptContext(oReceiptContext);
            }

            this.navTo("RouteAssembleUCLxC");
        },

        /**
         * Set global receipt context for sharing between controllers
         * @private
         * @param {object} oReceiptContext the receipt context data
         */
        _setGlobalReceiptContext: function (oReceiptContext) {
            var oComponent = this.getOwnerComponent();
            var oGlobalModel = oComponent.getModel("globalContext");

            if (!oGlobalModel) {
                oGlobalModel = new JSONModel({});
                oComponent.setModel(oGlobalModel, "globalContext");
            }

            // Update the global context with receipt data
            var oGlobalData = oGlobalModel.getData();
            Object.assign(oGlobalData, oReceiptContext);
            oGlobalModel.setData(oGlobalData);
        },

        /**
         * Get global receipt context
         * @public
         * @returns {object} the receipt context data
         */
        getGlobalReceiptContext: function () {
            var oComponent = this.getOwnerComponent();
            var oGlobalModel = oComponent.getModel("globalContext");

            if (oGlobalModel) {
                return oGlobalModel.getData();
            }

            return {};
        },

        /**
         * Navigate to UC visualization screen
         * @public
         */
        navToUCVisualization: function () {
            this.navTo("RouteUCVisualization");
        },

        /**
         * Navigate to Concluir NF screen
         * @public
         */
        navToConcluirNF: function () {
            this.navTo("RouteConcluirNF");
        },

        /**
         * Navigate to FinalizarRecebimentoNF screen
         * @public
         */
        navToFinalizarRecebimentoNF: function () {
            this.navTo("RouteFinalizarRecebimentoNF");
        },

        /**
         * Navigate to finalization check screen
         * @public
         * @param {object} oReceiptContext optional receipt context data
         */
        navToFinalizationCheck: function (oReceiptContext) {
            // If receipt context is provided, store it in a global model
            if (oReceiptContext) {
                this._setGlobalReceiptContext(oReceiptContext);
            } else {
                // Try to get current receipt context from global model
                var oGlobalModel = this.getOwnerComponent().getModel("globalContext");
                if (oGlobalModel) {
                    var oGlobalData = oGlobalModel.getData();
                    if (oGlobalData && oGlobalData.nf && oGlobalData.identificador) {
                        // Data already available in global context
                    } else {
                        // Try to get from component's receiptContext model
                        var oComponentReceiptModel = this.getOwnerComponent().getModel("receiptContext");
                        if (oComponentReceiptModel) {
                            var oReceiptData = oComponentReceiptModel.getData();
                            if (oReceiptData && oReceiptData.nf && oReceiptData.identificador) {
                                this._setGlobalReceiptContext(oReceiptData);
                            }
                        }
                    }
                }
            }

            this.navTo("RouteFinalizationCheck");
        },

        /**
         * Navigate to armazenar UC screen
         * @public
         */
        navToArmazenarUC: function () {
            this.navTo("RouteArmazenarUC");
        },

        /**
         * Navigate to TO_CONFIRM screen
         * @public
         */
        navToToConfirm: function (sUC, sSuggestedPosition, sTanum) {
            this.navTo("RouteToConfirm", {
                UC: sUC,
                SuggestedPosition: sSuggestedPosition,
                Tanum: sTanum
            });
        },

        /**
         * Navigate to OCORRENCIA screen
         * @public
         * @param {string} sDivergenceNF optional divergence NF parameter
         */
        navToOcorrencia: function (sDivergenceNF) {
            var oParameters = {};
            if (sDivergenceNF) {
                oParameters.divergenceNF = sDivergenceNF;
            }
            this.navTo("RouteOcorrencia", oParameters);
        },

        /**
         * Navigate to OCORRENCIA_SEGREGACAO screen
         * @public
         */
        navToOcorrenciaSegregacao: function () {
            this.navTo("RouteOcorrenciaSegregacao");
        },

        /**
         * Navigate back in browser history, if the entry was created by this app.
         * If not, it navigates to the main menu.
         * @public
         */
        onNavBack: function () {
            var sPreviousHash = History.getInstance().getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.navToMainMenu();
            }
        },

        /**
         * Display a success message
         * @public
         * @param {string} sMessage the message to display
         */
        showSuccessMessage: function (sMessage) {
            MessageToast.show(sMessage, {
                duration: 3000,
                width: "15em"
            });
        },

        /**
         * Display an error message
         * @public
         * @param {string} sMessage the message to display
         */
        showErrorMessage: function (sMessage) {
            MessageBox.error(sMessage);
        },

        /**
         * Display a warning message
         * @public
         * @param {string} sMessage the message to display
         */
        showWarningMessage: function (sMessage) {
            MessageBox.warning(sMessage);
        },

        /**
         * Display an information message
         * @public
         * @param {string} sMessage the message to display
         */
        showInfoMessage: function (sMessage) {
            MessageBox.information(sMessage);
        },

        /**
         * Show confirmation dialog
         * @public
         * @param {string} sMessage the confirmation message
         * @param {function} fnOnConfirm callback function when confirmed
         * @param {function} fnOnCancel callback function when cancelled (optional)
         */
        showConfirmDialog: function (sMessage, fnOnConfirm, fnOnCancel) {
            MessageBox.confirm(sMessage, {
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK && fnOnConfirm) {
                        fnOnConfirm();
                    } else if (oAction === MessageBox.Action.CANCEL && fnOnCancel) {
                        fnOnCancel();
                    }
                }
            });
        },

        /**
         * Handle service errors consistently
         * @public
         * @param {object} oError the error object from service call
         */
        handleServiceError: function (oError) {
            var sMessage = "Erro no processamento";

            if (oError && oError.responseText) {
                try {
                    var oErrorData = JSON.parse(oError.responseText);
                    if (oErrorData.error && oErrorData.error.message && oErrorData.error.message.value) {
                        sMessage = oErrorData.error.message.value;
                    }
                } catch (e) {
                    // Use default message if parsing fails
                }
            } else if (oError && oError.message) {
                sMessage = oError.message;
            }

            this.showErrorMessage(sMessage);
        },

        /**
         * Call OData function import with retry logic
         * @public
         * @param {string} sFunctionName the name of the function import
         * @param {object} oParameters the parameters for the function
         * @param {object} oOptions optional configuration (maxRetries, showBusy, etc.)
         * @returns {Promise} promise that resolves with the result
         */
        callFunctionImport: function (sFunctionName, oParameters, oOptions) {
            var that = this;
            var oConfig = Object.assign({
                maxRetries: 2,
                retryDelay: 1000,
                showBusy: true,
                handleError: true
            }, oOptions || {});

            return this._executeWithRetry(function () {
                return new Promise(function (resolve, reject) {
                    if (oConfig.showBusy) {
                        BusyIndicator.show();
                    }

                    that.getModel().callFunction("/" + sFunctionName, {
                        method: "POST",
                        urlParameters: oParameters || {},
                        success: function (oData) {
                            if (oConfig.showBusy) {
                                BusyIndicator.hide();
                            }
                            resolve(oData);
                        },
                        error: function (oError) {
                            if (oConfig.showBusy) {
                                BusyIndicator.hide();
                            }
                            if (oConfig.handleError) {
                                that.handleServiceError(oError);
                            }
                            reject(oError);
                        }
                    });
                });
            }, oConfig.maxRetries, oConfig.retryDelay);
        },

        /**
         * Create OData entity with retry logic
         * @public
         * @param {string} sEntitySet the entity set name
         * @param {object} oData the data to create
         * @param {object} oOptions optional configuration
         * @returns {Promise} promise that resolves with the result
         */
        createEntity: function (sEntitySet, oData, oOptions) {
            var that = this;
            var oConfig = Object.assign({
                maxRetries: 2,
                retryDelay: 1000,
                showBusy: true,
                handleError: true
            }, oOptions || {});

            return this._executeWithRetry(function () {
                return new Promise(function (resolve, reject) {
                    if (oConfig.showBusy) {
                        BusyIndicator.show();
                    }

                    that.getModel().create("/" + sEntitySet, oData, {
                        success: function (oCreatedData) {
                            if (oConfig.showBusy) {
                                BusyIndicator.hide();
                            }
                            resolve(oCreatedData);
                        },
                        error: function (oError) {
                            if (oConfig.showBusy) {
                                BusyIndicator.hide();
                            }
                            if (oConfig.handleError) {
                                that.handleServiceError(oError);
                            }
                            reject(oError);
                        }
                    });
                });
            }, oConfig.maxRetries, oConfig.retryDelay);
        },

        /**
         * Update OData entity with retry logic
         * @public
         * @param {string} sPath the entity path
         * @param {object} oData the data to update
         * @param {object} oOptions optional configuration
         * @returns {Promise} promise that resolves with the result
         */
        updateEntity: function (sPath, oData, oOptions) {
            var that = this;
            var oConfig = Object.assign({
                maxRetries: 2,
                retryDelay: 1000,
                showBusy: true,
                handleError: true
            }, oOptions || {});

            return this._executeWithRetry(function () {
                return new Promise(function (resolve, reject) {
                    if (oConfig.showBusy) {
                        BusyIndicator.show();
                    }

                    var oUpdateOptions = {
                        success: function () {
                            if (oConfig.showBusy) {
                                BusyIndicator.hide();
                            }
                            resolve();
                        },
                        error: function (oError) {
                            if (oConfig.showBusy) {
                                BusyIndicator.hide();
                            }
                            if (oConfig.handleError) {
                                that.handleServiceError(oError);
                            }
                            reject(oError);
                        }
                    };

                    // Add method option if specified
                    if (oConfig.method) {
                        oUpdateOptions.method = oConfig.method;
                    }

                    that.getModel().update(sPath, oData, oUpdateOptions);
                });
            }, oConfig.maxRetries, oConfig.retryDelay);
        },

        /**
         * Delete OData entity with retry logic
         * @public
         * @param {string} sPath the entity path
         * @param {object} oOptions optional configuration
         * @returns {Promise} promise that resolves with the result
         */
        deleteEntity: function (sPath, oOptions) {
            var that = this;
            var oConfig = Object.assign({
                maxRetries: 2,
                retryDelay: 1000,
                showBusy: true,
                handleError: true
            }, oOptions || {});

            return this._executeWithRetry(function () {
                return new Promise(function (resolve, reject) {
                    if (oConfig.showBusy) {
                        BusyIndicator.show();
                    }

                    that.getModel().remove(sPath, {
                        success: function () {
                            if (oConfig.showBusy) {
                                BusyIndicator.hide();
                            }
                            resolve();
                        },
                        error: function (oError) {
                            if (oConfig.showBusy) {
                                BusyIndicator.hide();
                            }
                            if (oConfig.handleError) {
                                that.handleServiceError(oError);
                            }
                            reject(oError);
                        }
                    });
                });
            }, oConfig.maxRetries, oConfig.retryDelay);
        },

        /**
         * Read OData entity with retry logic
         * @public
         * @param {string} sPath the entity path
         * @param {object} oOptions optional configuration
         * @returns {Promise} promise that resolves with the result
         */
        readEntity: function (sPath, oOptions) {
            var that = this;
            var oConfig = Object.assign({
                maxRetries: 2,
                retryDelay: 1000,
                showBusy: false,
                handleError: true,
                urlParameters: {}
            }, oOptions || {});

            return this._executeWithRetry(function () {
                return new Promise(function (resolve, reject) {
                    if (oConfig.showBusy) {
                        BusyIndicator.show();
                    }

                    that.getModel().read(sPath, {
                        urlParameters: oConfig.urlParameters,
                        success: function (oData) {
                            if (oConfig.showBusy) {
                                BusyIndicator.hide();
                            }
                            resolve(oData);
                        },
                        error: function (oError) {
                            if (oConfig.showBusy) {
                                BusyIndicator.hide();
                            }
                            if (oConfig.handleError) {
                                that.handleServiceError(oError);
                            }
                            reject(oError);
                        }
                    });
                });
            }, oConfig.maxRetries, oConfig.retryDelay);
        },

        /**
         * Execute function with retry logic
         * @private
         * @param {function} fnOperation the operation to execute
         * @param {number} iMaxRetries maximum number of retries
         * @param {number} iDelay delay between retries in milliseconds
         * @returns {Promise} promise that resolves with the result
         */
        _executeWithRetry: function (fnOperation, iMaxRetries, iDelay) {
            var that = this;
            var iAttempts = 0;

            function attempt() {
                return fnOperation().catch(function (oError) {
                    iAttempts++;

                    // Check if error is retryable (network errors, timeouts, 5xx server errors)
                    var bRetryable = that._isRetryableError(oError);

                    if (iAttempts <= iMaxRetries && bRetryable) {
                        return new Promise(function (resolve) {
                            setTimeout(function () {
                                resolve(attempt());
                            }, iDelay * iAttempts); // Exponential backoff
                        });
                    } else {
                        throw oError;
                    }
                });
            }

            return attempt();
        },

        /**
         * Check if error is retryable
         * @private
         * @param {object} oError the error object
         * @returns {boolean} true if error is retryable
         */
        _isRetryableError: function (oError) {
            if (!oError) {
                return false;
            }

            // Network errors
            if (oError.statusCode === 0 || oError.statusCode >= 500) {
                return true;
            }

            // Timeout errors
            if (oError.statusText === "timeout" || oError.message && oError.message.indexOf("timeout") !== -1) {
                return true;
            }

            // Connection errors
            if (oError.message && (
                oError.message.indexOf("Network Error") !== -1 ||
                oError.message.indexOf("Failed to fetch") !== -1 ||
                oError.message.indexOf("Connection") !== -1
            )) {
                return true;
            }

            return false;
        },

        /**
         * Enhanced error handling with detailed error analysis
         * @public
         * @param {object} oError the error object from service call
         * @param {object} oOptions optional configuration for error handling
         */
        handleServiceError: function (oError, oOptions) {
            var oConfig = Object.assign({
                showDialog: true,
                logError: true,
                defaultMessage: "Erro no processamento",
                showRetry: false,
                onRetry: null,
                context: ""
            }, oOptions || {});

            var sMessage = oConfig.defaultMessage;
            var sDetails = "";
            var sErrorType = "UNKNOWN";

            if (oConfig.logError) {
                //console.error("Service Error" + (oConfig.context ? " (" + oConfig.context + ")" : "") + ":", oError);
            }

            // Parse OData error response
            if (oError && oError.responseText) {
                try {
                    var oErrorData = JSON.parse(oError.responseText);
                    if (oErrorData.error) {
                        if (oErrorData.error.message && oErrorData.error.message.value) {
                            sMessage = oErrorData.error.message.value;
                        }
                        if (oErrorData.error.innererror && oErrorData.error.innererror.errordetails) {
                            sDetails = oErrorData.error.innererror.errordetails.map(function (detail) {
                                return detail.message;
                            }).join("\n");
                        }
                        sErrorType = "ODATA";
                    }
                } catch (e) {
                    // Fallback for non-JSON error responses
                    if (oError.responseText.indexOf("error") !== -1) {
                        sMessage = oError.responseText;
                        sErrorType = "HTTP";
                    }
                }
            } else if (oError && oError.message) {
                sMessage = oError.message;
                sErrorType = "JAVASCRIPT";
            }

            // Handle specific HTTP status codes with user-friendly messages
            if (oError && oError.statusCode) {
                sErrorType = "HTTP_" + oError.statusCode;
                switch (oError.statusCode) {
                    case 401:
                        sMessage = "Usuário não autorizado. Faça login novamente.";
                        break;
                    case 403:
                        sMessage = "Acesso negado. Você não tem permissão para esta operação.";
                        break;
                    case 404:
                        sMessage = "Recurso não encontrado.";
                        break;
                    case 408:
                        sMessage = "Tempo limite excedido. Tente novamente.";
                        oConfig.showRetry = true;
                        break;
                    case 500:
                        sMessage = "Erro interno do servidor. Contate o administrador.";
                        break;
                    case 502:
                        sMessage = "Erro de comunicação com o servidor. Verifique sua conexão.";
                        oConfig.showRetry = true;
                        break;
                    case 503:
                        sMessage = "Serviço temporariamente indisponível. Tente novamente em alguns minutos.";
                        oConfig.showRetry = true;
                        break;
                    case 504:
                        sMessage = "Tempo limite do servidor excedido. Tente novamente.";
                        oConfig.showRetry = true;
                        break;
                }
            }

            // Show error dialog with enhanced options
            if (oConfig.showDialog) {
                this._showEnhancedErrorDialog(sMessage, sDetails, oConfig);
            }

            return {
                message: sMessage,
                details: sDetails,
                errorType: sErrorType,
                originalError: oError
            };
        },

        /**
         * Show enhanced error dialog with retry and additional options
         * @private
         * @param {string} sMessage the error message
         * @param {string} sDetails the error details
         * @param {object} oConfig the error handling configuration
         */
        _showEnhancedErrorDialog: function (sMessage, sDetails, oConfig) {
            var aActions = [MessageBox.Action.OK];

            // Add retry action if applicable
            if (oConfig.showRetry && oConfig.onRetry) {
                aActions.unshift(MessageBox.Action.RETRY);
            }

            var oDialogOptions = {
                actions: aActions,
                emphasizedAction: oConfig.showRetry ? MessageBox.Action.RETRY : MessageBox.Action.OK,
                styleClass: "sapUiSizeCompact",
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.RETRY && oConfig.onRetry) {
                        oConfig.onRetry();
                    }
                }
            };

            // Add details if available
            if (sDetails) {
                oDialogOptions.details = sDetails;
            }

            MessageBox.error(sMessage, oDialogOptions);
        },

        /**
         * Validate required fields
         * @public
         * @param {array} aFields array of field objects with id and label
         * @returns {boolean} true if all fields are valid
         */
        validateRequiredFields: function (aFields) {
            var bValid = true;
            var aEmptyFields = [];

            aFields.forEach(function (oField) {
                var oControl = this.byId(oField.id);
                if (oControl) {
                    var sValue = "";

                    // Handle different control types
                    if (oControl.getSelectedKey) {
                        // For ComboBox, Select, etc.
                        sValue = oControl.getSelectedKey() || "";
                    } else if (oControl.getValue) {
                        // For Input, TextArea, etc.
                        sValue = oControl.getValue() || "";
                    }


                    if (!sValue || sValue.trim() === "") {
                        bValid = false;
                        aEmptyFields.push(oField.label || oField.id);
                        oControl.setValueState("Error");
                        oControl.setValueStateText("Campo obrigatório");
                    } else {
                        oControl.setValueState("None");
                    }
                }
            }.bind(this));

            if (!bValid) {
                var sMessage = "Os seguintes campos são obrigatórios:\n" + aEmptyFields.join(", ");
                this.showErrorMessage(sMessage);
            }

            return bValid;
        },

        /**
         * Clear validation states from controls
         * @public
         * @param {array} aControlIds array of control IDs to clear
         */
        clearValidationStates: function (aControlIds) {
            aControlIds.forEach(function (sId) {
                var oControl = this.byId(sId);
                if (oControl && oControl.setValueState) {
                    oControl.setValueState("None");
                    oControl.setValueStateText("");
                }
            }.bind(this));
        },

        /**
         * Sanitize input to prevent XSS and other security issues
         * @public
         * @param {string} sInput the input string to sanitize
         * @returns {string} sanitized string
         */
        sanitizeInput: function (sInput) {
            if (!sInput || typeof sInput !== "string") {
                return "";
            }

            // Remove HTML tags and script content
            var sClean = sInput.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
            sClean = sClean.replace(/<[^>]*>/g, "");

            // Encode special characters
            sClean = sClean.replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#x27;");

            return sClean.trim();
        },

        /**
         * Validate barcode format (any length allowed)
         * @public
         * @param {string} sBarcode the barcode to validate
         * @returns {object} validation result with isValid and message
         */
        validateBarcode: function (sBarcode) {
            if (!sBarcode || typeof sBarcode !== "string") {
                return {
                    isValid: false,
                    message: "Código de barras é obrigatório"
                };
            }

            var sCleanBarcode = sBarcode.trim();

            // Remove length validation - allow materials with any length
            if (sCleanBarcode.length === 0) {
                return {
                    isValid: false,
                    message: "Código de barras não pode estar vazio"
                };
            }

            return {
                isValid: true,
                message: "",
                cleanBarcode: sCleanBarcode
            };
        },

        /**
         * Validate invoice number format
         * @public
         * @param {string} sInvoice the invoice number to validate
         * @returns {Promise} promise that resolves with validation result
         */
        validateInvoiceNumber: function (sInvoice) {
            var that = this;

            // Handle different input formats
            var sInvoiceValue = "";
            if (typeof sInvoice === "string") {
                sInvoiceValue = sInvoice;
            } else if (sInvoice && sInvoice.mParameters && sInvoice.mParameters.value) {
                sInvoiceValue = sInvoice.mParameters.value;
            } else if (sInvoice && sInvoice.getParameter) {
                sInvoiceValue = sInvoice.getParameter("value");
            }

            // Basic validation
            if (!sInvoiceValue || typeof sInvoiceValue !== "string") {
                return Promise.resolve({
                    isValid: false,
                    message: "Número da nota fiscal é obrigatório"
                });
            }

            var sCleanInvoice = sInvoiceValue.trim();

            // Basic format validation
            if (sCleanInvoice.length === 0) {
                return Promise.resolve({
                    isValid: false,
                    message: "Número da nota fiscal é obrigatório"
                });
            }

            if (sCleanInvoice.length > 20) {
                return Promise.resolve({
                    isValid: false,
                    message: "Número da nota fiscal muito longo"
                });
            }

            // Call backend validation
            var oParameters = {
                Nf: sCleanInvoice
            };

            return new Promise(function (resolve, reject) {
                that.getModel().callFunction("/ValidaNF", {
                    method: "POST",
                    urlParameters: oParameters,
                    success: function (oData) {
                        resolve({
                            isValid: true,
                            message: "Nota fiscal válida",
                            cleanInvoice: sCleanInvoice,
                            data: oData
                        });
                    },
                    error: function (oError) {
                        // Handle specific validation errors from backend
                        var sErrorMessage = "Nota fiscal inválida";
                        // Show error message to user
                        that.showErrorMessage(sErrorMessage);

                        resolve({
                            isValid: false,
                            message: sErrorMessage,
                            cleanInvoice: sCleanInvoice,
                            error: oError
                        });
                    }
                });
            });
        },

        /**
         * Validate quantity input
         * @public
         * @param {string} sQuantity the quantity to validate
         * @returns {object} validation result with isValid, message, and numericValue
         */
        validateQuantity: function (sQuantity) {
            if (!sQuantity || typeof sQuantity !== "string") {
                return {
                    isValid: false,
                    message: "Quantidade é obrigatória"
                };
            }

            var sCleanQuantity = sQuantity.trim();
            var fQuantity = parseFloat(sCleanQuantity);

            if (isNaN(fQuantity)) {
                return {
                    isValid: false,
                    message: "Quantidade deve ser um número válido"
                };
            }

            if (fQuantity <= 0) {
                return {
                    isValid: false,
                    message: "Quantidade deve ser maior que zero"
                };
            }

            if (fQuantity > 999999) {
                return {
                    isValid: false,
                    message: "Quantidade muito alta"
                };
            }

            return {
                isValid: true,
                message: "",
                numericValue: fQuantity
            };
        },

        /**
         * Show loading indicator
         * @public
         * @param {string} sMessage optional loading message
         */
        showBusyIndicator: function (sMessage) {
            BusyIndicator.show(0);
            // Note: BusyIndicator doesn't support custom text messages
            // The message parameter is kept for API compatibility but not used
        },

        /**
         * Hide loading indicator
         * @public
         */
        hideBusyIndicator: function () {
            BusyIndicator.hide();
        },

        /**
         * Show enhanced confirmation dialog for destructive actions
         * @public
         * @param {string} sTitle the dialog title
         * @param {string} sMessage the confirmation message
         * @param {function} fnOnConfirm callback function when confirmed
         * @param {function} fnOnCancel callback function when cancelled (optional)
         * @param {object} oOptions additional options for the dialog
         */
        showDestructiveConfirmDialog: function (sTitle, sMessage, fnOnConfirm, fnOnCancel, oOptions) {
            var oConfig = Object.assign({
                emphasizedAction: MessageBox.Action.DELETE,
                icon: MessageBox.Icon.WARNING,
                styleClass: "sapUiSizeCompact"
            }, oOptions || {});

            MessageBox.confirm(sMessage, {
                title: sTitle,
                actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
                emphasizedAction: oConfig.emphasizedAction,
                icon: oConfig.icon,
                styleClass: oConfig.styleClass,
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.DELETE && fnOnConfirm) {
                        fnOnConfirm();
                    } else if (oAction === MessageBox.Action.CANCEL && fnOnCancel) {
                        fnOnCancel();
                    }
                }
            });
        },

        /**
         * Show progress dialog for long-running operations
         * @public
         * @param {string} sTitle the dialog title
         * @param {string} sMessage the initial message
         * @returns {object} progress dialog control
         */
        showProgressDialog: function (sTitle, sMessage) {
            if (!this._oProgressDialog) {
                this._oProgressDialog = new sap.m.BusyDialog({
                    title: sTitle || "Processando...",
                    text: sMessage || "Aguarde...",
                    showCancelButton: false
                });
            } else {
                this._oProgressDialog.setTitle(sTitle || "Processando...");
                this._oProgressDialog.setText(sMessage || "Aguarde...");
            }

            this._oProgressDialog.open();
            return this._oProgressDialog;
        },

        /**
         * Update progress dialog message
         * @public
         * @param {string} sMessage the new message
         */
        updateProgressDialog: function (sMessage) {
            if (this._oProgressDialog) {
                this._oProgressDialog.setText(sMessage);
            }
        },

        /**
         * Hide progress dialog
         * @public
         */
        hideProgressDialog: function () {
            if (this._oProgressDialog) {
                this._oProgressDialog.close();
            }
        },

        /**
         * Set validation error state on input control
         * @public
         * @param {string} sControlId the control ID
         * @param {string} sErrorMessage the error message
         */
        setInputError: function (sControlId, sErrorMessage) {
            var oControl = this.byId(sControlId);
            if (oControl && oControl.setValueState) {
                oControl.setValueState("Error");
                oControl.setValueStateText(sErrorMessage || "Campo inválido");

                // Add visual emphasis for mobile
                if (this.isMobileDevice && this.isMobileDevice()) {
                    oControl.addStyleClass("inputError");

                    // Add haptic feedback if available
                    if (this.addHapticFeedback) {
                        this.addHapticFeedback("error");
                    }
                }
            }
        },

        /**
         * Set validation success state on input control
         * @public
         * @param {string} sControlId the control ID
         * @param {string} sSuccessMessage optional success message
         */
        setInputSuccess: function (sControlId, sSuccessMessage) {
            var oControl = this.byId(sControlId);
            if (oControl && oControl.setValueState) {
                oControl.setValueState("Success");
                oControl.setValueStateText(sSuccessMessage || "");

                // Remove error styling
                if (this.isMobileDevice && this.isMobileDevice()) {
                    oControl.removeStyleClass("inputError");
                }
            }
        },

        /**
         * Clear validation state on input control
         * @public
         * @param {string} sControlId the control ID
         */
        clearInputValidation: function (sControlId) {
            var oControl = this.byId(sControlId);
            if (oControl && oControl.setValueState) {
                oControl.setValueState("None");
                oControl.setValueStateText("");

                // Remove error styling
                if (this.isMobileDevice && this.isMobileDevice()) {
                    oControl.removeStyleClass("inputError");
                }
            }
        },

        /**
         * Show validation summary for multiple field errors
         * @public
         * @param {array} aErrors array of error objects with field and message
         */
        showValidationSummary: function (aErrors) {
            if (!aErrors || aErrors.length === 0) {
                return;
            }

            var sMessage = "Por favor, corrija os seguintes erros:\n\n";
            aErrors.forEach(function (oError, index) {
                sMessage += (index + 1) + ". " + (oError.field || "Campo") + ": " + oError.message + "\n";
            });

            this.showErrorMessage(sMessage);
        },

        /**
         * Handle navigation with unsaved changes warning
         * @public
         * @param {function} fnNavigate the navigation function to execute
         * @param {boolean} bHasUnsavedChanges whether there are unsaved changes
         * @param {string} sWarningMessage optional custom warning message
         */
        handleNavigationWithWarning: function (fnNavigate, bHasUnsavedChanges, sWarningMessage) {
            if (bHasUnsavedChanges) {
                var sMessage = sWarningMessage ||
                    "Você tem alterações não salvas. Deseja continuar e perder essas alterações?";

                this.showConfirmDialog(sMessage, function () {
                    if (fnNavigate) {
                        fnNavigate();
                    }
                });
            } else {
                if (fnNavigate) {
                    fnNavigate();
                }
            }
        },

        /**
         * Show success message with action button
         * @public
         * @param {string} sMessage the success message
         * @param {string} sActionText the action button text
         * @param {function} fnAction the action callback
         */
        showSuccessMessageWithAction: function (sMessage, sActionText, fnAction) {
            MessageBox.success(sMessage, {
                actions: [sActionText],
                emphasizedAction: sActionText,
                onClose: function (oAction) {
                    if (oAction === sActionText && fnAction) {
                        fnAction();
                    }
                }
            });
        },

        /**
         * Show operation result message based on success/failure
         * @public
         * @param {boolean} bSuccess whether the operation was successful
         * @param {string} sSuccessMessage the success message
         * @param {string} sErrorMessage the error message
         * @param {function} fnOnSuccess optional success callback
         * @param {function} fnOnError optional error callback
         */
        showOperationResult: function (bSuccess, sSuccessMessage, sErrorMessage, fnOnSuccess, fnOnError) {
            if (bSuccess) {
                this.showSuccessMessage(sSuccessMessage);
                if (fnOnSuccess) {
                    fnOnSuccess();
                }
            } else {
                this.showErrorMessage(sErrorMessage);
                if (fnOnError) {
                    fnOnError();
                }
            }
        },

        /**
         * Hide loading indicator
         * @public
         */
        hideBusyIndicator: function () {
            BusyIndicator.hide();
        },

        /**
         * Show mobile-friendly loading overlay
         * @public
         * @param {string} sMessage loading message
         * @param {number} iProgress optional progress percentage (0-100)
         */
        showMobileLoading: function (sMessage, iProgress) {
            var oView = this.getView();
            var sLoadingId = oView.getId() + "--mobileLoadingOverlay";

            // Remove existing overlay if present
            this.hideMobileLoading();

            var sProgressHtml = "";
            if (typeof iProgress === "number" && iProgress >= 0 && iProgress <= 100) {
                sProgressHtml = '<div class="progressContainer">' +
                    '<div class="progressBar" style="width: ' + iProgress + '%"></div>' +
                    '</div>';
            }

            var sLoadingHtml = '<div id="' + sLoadingId + '" class="loadingOverlay">' +
                '<div class="loadingSpinner"></div>' +
                '<div class="loadingText">' + (sMessage || "Carregando...") + '</div>' +
                sProgressHtml +
                '</div>';

            jQuery("body").append(sLoadingHtml);
        },

        /**
         * Hide mobile loading overlay
         * @public
         */
        hideMobileLoading: function () {
            var oView = this.getView();
            var sLoadingId = oView.getId() + "--mobileLoadingOverlay";
            jQuery("#" + sLoadingId).remove();
        },

        /**
         * Update mobile loading progress
         * @public
         * @param {number} iProgress progress percentage (0-100)
         * @param {string} sMessage optional message update
         */
        updateMobileLoadingProgress: function (iProgress, sMessage) {
            var oView = this.getView();
            var sLoadingId = oView.getId() + "--mobileLoadingOverlay";
            var oOverlay = jQuery("#" + sLoadingId);

            if (oOverlay.length > 0) {
                if (typeof iProgress === "number") {
                    oOverlay.find(".progressBar").css("width", iProgress + "%");
                }
                if (sMessage) {
                    oOverlay.find(".loadingText").text(sMessage);
                }
            }
        },

        /**
         * Show button loading state
         * @public
         * @param {string} sButtonId the button ID
         * @param {boolean} bLoading true to show loading, false to hide
         */
        setButtonLoading: function (sButtonId, bLoading) {
            var oButton = this.byId(sButtonId);
            if (oButton) {
                if (bLoading) {
                    oButton.addStyleClass("buttonLoading");
                    oButton.setEnabled(false);
                } else {
                    oButton.removeStyleClass("buttonLoading");
                    oButton.setEnabled(true);
                }
            }
        },



        /**
         * Add haptic feedback for touch interactions
         * @public
         * @param {string} sType feedback type ('light', 'medium', 'heavy')
         */
        addHapticFeedback: function (sType) {
            // Vibration API for haptic feedback
            if (navigator.vibrate) {
                var iDuration;
                switch (sType) {
                    case 'light':
                        iDuration = 50;
                        break;
                    case 'medium':
                        iDuration = 100;
                        break;
                    case 'heavy':
                        iDuration = 200;
                        break;
                    default:
                        iDuration = 100;
                }
                navigator.vibrate(iDuration);
            }
        },

        /**
         * Add visual haptic feedback animation
         * @public
         * @param {sap.ui.core.Control} oControl the control to animate
         */
        addVisualHapticFeedback: function (oControl) {
            if (oControl && oControl.addStyleClass) {
                oControl.addStyleClass("hapticFeedback");
                setTimeout(function () {
                    oControl.removeStyleClass("hapticFeedback");
                }, 100);
            }
        },

        /**
         * Check if device is in landscape orientation
         * @public
         * @returns {boolean} true if landscape
         */
        isLandscape: function () {
            return window.innerWidth > window.innerHeight;
        },

        /**
         * Check if device is mobile
         * @public
         * @returns {boolean} true if mobile device
         */
        isMobileDevice: function () {
            return sap.ui.Device.system.phone || sap.ui.Device.system.tablet;
        },

        /**
         * Get optimal input type for mobile
         * @public
         * @param {string} sFieldType field type ('number', 'email', 'tel', etc.)
         * @returns {string} optimal input type
         */
        getOptimalInputType: function (sFieldType) {
            if (!this.isMobileDevice()) {
                return "Text";
            }

            switch (sFieldType) {
                case 'number':
                case 'quantity':
                    return "Number";
                case 'email':
                    return "Email";
                case 'phone':
                case 'tel':
                    return "Tel";
                case 'url':
                    return "Url";
                case 'barcode':
                    return "Text"; // Use text with pattern for barcode
                default:
                    return "Text";
            }
        },

        /**
         * Optimize form for mobile input
         * @public
         * @param {array} aInputIds array of input control IDs
         */
        optimizeFormForMobile: function (aInputIds) {
            var that = this;

            aInputIds.forEach(function (sInputId) {
                var oInput = that.byId(sInputId);
                if (oInput) {
                    // Prevent zoom on iOS
                    if (sap.ui.Device.os.ios) {
                        oInput.addStyleClass("ios-no-zoom");
                    }

                    // Add touch-friendly styling
                    oInput.addStyleClass("mobileOptimized");

                    // Add autocomplete attributes
                    var oDomRef = oInput.getDomRef("inner");
                    if (oDomRef) {
                        oDomRef.setAttribute("autocomplete", "off");
                        oDomRef.setAttribute("autocorrect", "off");
                        oDomRef.setAttribute("autocapitalize", "off");
                        oDomRef.setAttribute("spellcheck", "false");
                    }
                }
            });
        },

        /**
         * Hide loading indicator
         * @public
         */
        hideBusyIndicator: function () {
            BusyIndicator.hide();
        },

        /**
         * Create and set a local JSON model
         * @public
         * @param {object} oData the data for the model
         * @param {string} sModelName the name of the model
         * @returns {sap.ui.model.json.JSONModel} the created model
         */
        createLocalModel: function (oData, sModelName) {
            var oModel = new JSONModel(oData || {});
            this.setModel(oModel, sModelName);
            return oModel;
        },

        /**
         * Get or create a local model
         * @public
         * @param {string} sModelName the name of the model
         * @param {object} oDefaultData default data if model doesn't exist
         * @returns {sap.ui.model.json.JSONModel} the model
         */
        getOrCreateLocalModel: function (sModelName, oDefaultData) {
            var oModel = this.getModel(sModelName);
            if (!oModel) {
                oModel = this.createLocalModel(oDefaultData || {}, sModelName);
            }
            return oModel;
        },

        /**
         * Reset form controls to initial state
         * @public
         * @param {array} aControlIds array of control IDs to reset
         */
        resetFormControls: function (aControlIds) {
            aControlIds.forEach(function (sId) {
                var oControl = this.byId(sId);
                if (oControl) {
                    if (oControl.setValue) {
                        oControl.setValue("");
                    }
                    if (oControl.setSelectedKey) {
                        oControl.setSelectedKey("");
                    }
                    if (oControl.setValueState) {
                        oControl.setValueState("None");
                        oControl.setValueStateText("");
                    }
                }
            }.bind(this));
        },

        // ========================================
        // Backend Service Integration Methods
        // ========================================

        /**
         * Validate user authorization for the current center
         * @public
         * @param {string} sUsuario the user ID to validate
         * @returns {Promise} promise that resolves with centro data or rejects with error
         */
        validateUserCenter: function (sUsuario) {
            if (!sUsuario || typeof sUsuario !== "string" || sUsuario.trim() === "") {
                return Promise.reject({
                    message: "Usuário é obrigatório para validação"
                });
            }

            return this.callFunctionImport("ValidarUsuarioCentro", {
                Usuario: sUsuario.trim()
            }, {
                showBusy: true,
                handleError: false // We'll handle errors specifically for user validation
            }).then(function (oData) {
                if (oData && oData.Werks) {
                    return {
                        centro: oData.Werks,
                        isValid: true,
                        message: "Usuário autorizado"
                    };
                } else {
                    throw {
                        message: "Usuário não autorizado para este centro",
                        statusCode: 403
                    };
                }
            }).catch(function (oError) {
                // Handle specific authorization errors
                var sMessage = "Erro na validação do usuário";

                if (oError.statusCode === 401 || oError.statusCode === 403) {
                    sMessage = "Usuário não autorizado. Verifique suas credenciais.";
                } else if (oError.message) {
                    sMessage = oError.message;
                }

                throw {
                    message: sMessage,
                    originalError: oError,
                    isAuthError: true
                };
            });
        },

        /**
         * Create a new UC (Unit of Commerce)
         * @public
         * @param {string} sMatEmbalagem packaging material code
         * @param {string} sNf invoice number
         * @param {string} sIdentificador container/truck identifier
         * @returns {Promise} promise that resolves with UC data or rejects with error
         */
        createUC: function (sMatEmbalagem, sNf, sIdentificador) {
            var that = this;

            // Validate required parameters
            var aValidationErrors = [];

            if (!sMatEmbalagem || sMatEmbalagem.trim() === "") {
                aValidationErrors.push("Material de embalagem é obrigatório");
            }
            if (!sNf || sNf.trim() === "") {
                aValidationErrors.push("Número da nota fiscal é obrigatório");
            }
            if (!sIdentificador || sIdentificador.trim() === "") {
                aValidationErrors.push("Identificador é obrigatório");
            }

            if (aValidationErrors.length > 0) {
                return Promise.reject({
                    message: aValidationErrors.join(", "),
                    validationErrors: aValidationErrors
                });
            }

            var oParameter = {
                MatEmbalagem: sMatEmbalagem.trim(),
                Nf: sNf.trim(),
                Identificador: sIdentificador.trim()
            };

            return new Promise(function (resolve, reject) {
                that.getModel().callFunction("/CriarUC", {
                    method: "POST",
                    urlParameters: oParameter,
                    success: function (oData) {
                        if (oData && oData.Uc) {
                            resolve({
                                uc: oData.Uc,
                                success: true,
                                message: "UC '" + oData.Uc + "' criada com sucesso"
                            });
                        } else {
                            reject({
                                message: "Erro na criação da UC - resposta inválida do servidor"
                            });
                        }
                    },
                    error: function (oError) {
                        var sMessage = "Erro na criação da UC";

                        // Handle specific business errors
                        if (oError.responseText && oError.responseText.indexOf("Material de embalagem não cadastrado") !== -1) {
                            sMessage = "Material de embalagem não cadastrado no SAP";
                        } else if (oError.message) {
                            sMessage = oError.message;
                        }

                        reject({
                            message: sMessage,
                            originalError: oError,
                            isBusinessError: true
                        });
                    }
                });
            });
        },

        /**
         * Complete/finalize a UC
         * @public
         * @param {string} sUc UC number to complete
         * @param {string} sNf invoice number
         * @param {string} sIdentificador container/truck identifier
         * @returns {Promise} promise that resolves with completion data or rejects with error
         */
        completeUC: function (sUc, sNf, sIdentificador) {
            // Validate required parameters
            var aValidationErrors = [];

            if (!sUc || sUc.trim() === "") {
                aValidationErrors.push("UC é obrigatória");
            }
            if (!sNf || sNf.trim() === "") {
                aValidationErrors.push("Número da nota fiscal é obrigatório");
            }
            if (!sIdentificador || sIdentificador.trim() === "") {
                aValidationErrors.push("Identificador é obrigatório");
            }

            if (aValidationErrors.length > 0) {
                return Promise.reject({
                    message: aValidationErrors.join(", "),
                    validationErrors: aValidationErrors
                });
            }

            return this.callFunctionImport("ConcluirUC", {
                Uc: sUc.trim(),
                Nf: sNf.trim(),
                Identificador: sIdentificador.trim()
            }, {
                showBusy: true,
                handleError: false
            }).then(function (oData) {
                return {
                    uc: sUc,
                    success: true,
                    message: "UC '" + sUc + "' concluída com sucesso",
                    data: oData
                };
            }).catch(function (oError) {
                var sMessage = "Erro ao concluir UC";

                // Handle specific business errors
                if (oError.responseText && oError.responseText.indexOf("UC não encontrada") !== -1) {
                    sMessage = "UC não encontrada ou já foi concluída";
                } else if (oError.responseText && oError.responseText.indexOf("UC sem itens") !== -1) {
                    sMessage = "UC não pode ser concluída - nenhum item foi adicionado";
                } else if (oError.message) {
                    sMessage = oError.message;
                }

                throw {
                    message: sMessage,
                    originalError: oError,
                    isBusinessError: true
                };
            });
        },

        /**
         * Delete a UC
         * @public
         * @param {string} sUc UC number to delete
         * @returns {Promise} promise that resolves with deletion confirmation or rejects with error
         */
        deleteUC: function (sUc) {
            if (!sUc || sUc.trim() === "") {
                return Promise.reject({
                    message: "UC é obrigatória para exclusão",
                    validationErrors: ["UC é obrigatória"]
                });
            }

            return this.callFunctionImport("DeletarUC", {
                Uc: sUc.trim()
            }, {
                showBusy: true,
                handleError: false
            }).then(function (oData) {
                return {
                    uc: sUc,
                    success: true,
                    message: "UC '" + sUc + "' excluída com sucesso",
                    data: oData
                };
            }).catch(function (oError) {
                var sMessage = "Erro ao excluir UC";

                // Handle specific business errors
                if (oError.responseText && oError.responseText.indexOf("UC não encontrada") !== -1) {
                    sMessage = "UC não encontrada";
                } else if (oError.responseText && oError.responseText.indexOf("UC já concluída") !== -1) {
                    sMessage = "UC não pode ser excluída - já foi concluída";
                } else if (oError.responseText && oError.responseText.indexOf("UC possui itens") !== -1) {
                    sMessage = "UC não pode ser excluída - possui itens associados";
                } else if (oError.message) {
                    sMessage = oError.message;
                }

                throw {
                    message: sMessage,
                    originalError: oError,
                    isBusinessError: true
                };
            });
        },

        /**
         * Check if invoice exists in the system
         * @public
         * @param {string} sNf invoice number to check
         * @returns {Promise} promise that resolves with invoice validation result
         */
        validateInvoiceExists: function (sNf) {
            if (!sNf || sNf.trim() === "") {
                return Promise.reject({
                    message: "Número da nota fiscal é obrigatório"
                });
            }

            // Use OData read to check if invoice exists in J_1BNFDOC equivalent
            // This would typically be done through a custom function import or entity read
            // For now, we'll simulate this check through HeaderSet
            var sPath = "/HeaderSet";
            var oFilters = {
                "$filter": "Nf eq '" + sNf.trim() + "'"
            };

            return this.readEntity(sPath, {
                urlParameters: oFilters,
                showBusy: false,
                handleError: false
            }).then(function (oData) {
                return {
                    exists: oData && oData.results && oData.results.length > 0,
                    invoice: sNf,
                    message: oData && oData.results && oData.results.length > 0 ?
                        "Nota fiscal encontrada" : "Nota fiscal não encontrada"
                };
            }).catch(function (oError) {
                // If it's a 404, the invoice doesn't exist
                if (oError.statusCode === 404) {
                    return {
                        exists: false,
                        invoice: sNf,
                        message: "Nota fiscal não encontrada"
                    };
                }

                throw {
                    message: "Erro ao validar nota fiscal",
                    originalError: oError
                };
            });
        },

        /**
         * Check receipt status for NF + Identificador combination
         * @public
         * @param {string} sNf invoice number
         * @param {string} sIdentificador container/truck identifier
         * @returns {Promise} promise that resolves with receipt status information
         */
        checkReceiptStatus: function (sNf, sIdentificador) {
            if (!sNf || sNf.trim() === "" || !sIdentificador || sIdentificador.trim() === "") {
                return Promise.reject({
                    message: "NF e Identificador são obrigatórios"
                });
            }

            var sPath = "/HeaderSet(Nf='" + sNf.trim() + "',Identificador='" + sIdentificador.trim() + "')";

            return this.readEntity(sPath, {
                showBusy: false,
                handleError: false
            }).then(function (oData) {
                if (oData) {
                    return {
                        exists: true,
                        statusReceb: oData.StatusReceb,
                        statusContainer: oData.StatusContainer,
                        operacao: oData.Operacao,
                        isCompleted: oData.StatusReceb === "CONCLUIDO",
                        message: oData.StatusReceb === "CONCLUIDO" ?
                            "Recebimento já foi concluído" : "Recebimento em andamento"
                    };
                } else {
                    return {
                        exists: false,
                        message: "Combinação NF + Identificador não encontrada"
                    };
                }
            }).catch(function (oError) {
                if (oError.statusCode === 404) {
                    return {
                        exists: false,
                        message: "Combinação NF + Identificador não encontrada"
                    };
                }

                throw {
                    message: "Erro ao verificar status do recebimento",
                    originalError: oError
                };
            });
        },

        /**
         * Get UCs for a specific NF + Identificador combination
         * @public
         * @param {string} sNf invoice number
         * @param {string} sIdentificador container/truck identifier
         * @returns {Promise} promise that resolves with UC list
         */
        getUCsForReceipt: function (sNf, sIdentificador) {
            if (!sNf || sNf.trim() === "" || !sIdentificador || sIdentificador.trim() === "") {
                return Promise.reject({
                    message: "NF e Identificador são obrigatórios"
                });
            }

            var sPath = "/StatusUCSet";
            var oFilters = {
                "$filter": "Nf eq '" + sNf.trim() + "' and Identificador eq '" + sIdentificador.trim() + "'"
            };

            return this.readEntity(sPath, {
                urlParameters: oFilters,
                showBusy: false,
                handleError: true
            }).then(function (oData) {
                var aUCs = oData && oData.results ? oData.results : [];

                return {
                    ucs: aUCs,
                    count: aUCs.length,
                    hasOpenUC: aUCs.some(function (oUC) {
                        return oUC.Status === "EM ABERTO";
                    }),
                    openUC: aUCs.find(function (oUC) {
                        return oUC.Status === "EM ABERTO";
                    })
                };
            });
        },

        /**
         * Get items for a specific UC
         * @public
         * @param {string} sNf invoice number
         * @param {string} sIdentificador container/truck identifier
         * @param {string} sUc UC number
         * @returns {Promise} promise that resolves with items list
         */
        getItemsForUC: function (sNf, sIdentificador, sUc) {
            if (!sNf || !sIdentificador || !sUc) {
                return Promise.reject({
                    message: "NF, Identificador e UC são obrigatórios"
                });
            }

            var sPath = "/ItemsSet";
            var oFilters = {
                "$filter": "Nf eq '" + sNf.trim() + "' and Identificador eq '" + sIdentificador.trim() + "' and Uc eq '" + sUc.trim() + "'"
            };

            return this.readEntity(sPath, {
                urlParameters: oFilters,
                showBusy: false,
                handleError: true
            }).then(function (oData) {
                var aItems = oData && oData.results ? oData.results : [];

                return {
                    items: aItems,
                    count: aItems.length
                };
            });
        },

        /**
         * Get all items for a receipt (all UCs)
         * @public
         * @param {string} sNf invoice number
         * @param {string} sIdentificador container/truck identifier
         * @returns {Promise} promise that resolves with all items for the receipt
         */
        getAllItemsForReceipt: function (sNf, sIdentificador) {
            if (!sNf || sNf.trim() === "" || !sIdentificador || sIdentificador.trim() === "") {
                return Promise.reject({
                    message: "NF e Identificador são obrigatórios"
                });
            }

            var sPath = "/ItemsSet";
            var oFilters = {
                "$filter": "Nf eq '" + sNf.trim() + "' and Identificador eq '" + sIdentificador.trim() + "'"
            };

            return this.readEntity(sPath, {
                urlParameters: oFilters,
                showBusy: false,
                handleError: true
            }).then(function (oData) {
                var aItems = oData && oData.results ? oData.results : [];

                // Group items by UC for better organization
                var oGroupedItems = {};
                aItems.forEach(function (oItem) {
                    if (!oGroupedItems[oItem.Uc]) {
                        oGroupedItems[oItem.Uc] = [];
                    }
                    oGroupedItems[oItem.Uc].push(oItem);
                });

                return {
                    items: aItems,
                    groupedByUC: oGroupedItems,
                    totalCount: aItems.length,
                    ucCount: Object.keys(oGroupedItems).length
                };
            });
        },

        /**
         * Enhanced service error handling with business logic awareness
         * @public
         * @param {object} oError the error object from service call
         * @param {object} oOptions optional configuration for error handling
         * @returns {object} processed error information
         */
        handleServiceError: function (oError, oOptions) {
            var oConfig = Object.assign({
                showDialog: true,
                logError: true,
                defaultMessage: "Erro no processamento",
                context: ""
            }, oOptions || {});

            var sMessage = oConfig.defaultMessage;
            var sDetails = "";
            var sErrorType = "general";

            if (oConfig.logError) {
                //console.error("Service Error" + (oConfig.context ? " (" + oConfig.context + ")" : "") + ":", oError);
            }

            // Handle authorization errors
            if (oError && (oError.isAuthError || oError.statusCode === 401 || oError.statusCode === 403)) {
                sErrorType = "authorization";
                sMessage = "Usuário não autorizado. Verifique suas credenciais e tente novamente.";
            }
            // Handle business logic errors
            else if (oError && oError.isBusinessError) {
                sErrorType = "business";
                sMessage = oError.message || "Erro de validação de negócio";
            }
            // Handle validation errors
            else if (oError && oError.validationErrors) {
                sErrorType = "validation";
                sMessage = "Erro de validação: " + oError.message;
                sDetails = oError.validationErrors.join("\n");
            }
            // Parse OData error response
            else if (oError && oError.responseText) {
                try {
                    var oErrorData = JSON.parse(oError.responseText);
                    if (oErrorData.error) {
                        if (oErrorData.error.message && oErrorData.error.message.value) {
                            sMessage = oErrorData.error.message.value;
                        }
                        if (oErrorData.error.innererror && oErrorData.error.innererror.errordetails) {
                            sDetails = oErrorData.error.innererror.errordetails.map(function (detail) {
                                return detail.message;
                            }).join("\n");
                        }
                    }
                } catch (e) {
                    // Fallback for non-JSON error responses
                    if (oError.responseText.indexOf("error") !== -1) {
                        sMessage = oError.responseText;
                    }
                }
            } else if (oError && oError.message) {
                sMessage = oError.message;
            }

            // Handle specific HTTP status codes
            if (oError && oError.statusCode) {
                switch (oError.statusCode) {
                    case 401:
                        sErrorType = "authorization";
                        sMessage = "Usuário não autorizado. Faça login novamente.";
                        break;
                    case 403:
                        sErrorType = "authorization";
                        sMessage = "Acesso negado. Você não tem permissão para esta operação.";
                        break;
                    case 404:
                        sErrorType = "notFound";
                        sMessage = "Recurso não encontrado.";
                        break;
                    case 408:
                        sErrorType = "timeout";
                        sMessage = "Tempo limite excedido. Tente novamente.";
                        break;
                    case 500:
                        sErrorType = "server";
                        sMessage = "Erro interno do servidor. Contate o administrador.";
                        break;
                    case 503:
                        sErrorType = "server";
                        sMessage = "Serviço temporariamente indisponível. Tente novamente em alguns minutos.";
                        break;
                }
            }

            if (oConfig.showDialog) {
                if (sDetails) {
                    MessageBox.error(sMessage, {
                        details: sDetails,
                        styleClass: "sapUiSizeCompact"
                    });
                } else {
                    this.showErrorMessage(sMessage);
                }
            }

            return {
                message: sMessage,
                details: sDetails,
                errorType: sErrorType,
                originalError: oError
            };
        },

        // ========================================
        // Service Integration Usage Examples
        // ========================================

        /**
         * Example method showing how to use the new service integration methods
         * This method demonstrates proper error handling and user feedback
         * @public
         * @param {string} sNf invoice number
         * @param {string} sIdentificador container identifier
         * @param {string} sMaterialEmbalagem packaging material
         * @returns {Promise} promise that resolves with complete workflow result
         */
        executeCompleteUCWorkflow: function (sNf, sIdentificador, sMaterialEmbalagem) {
            var that = this;

            // Step 1: Validate user authorization
            return this.validateUserCenter(this.getCurrentUser())
                .then(function (oUserValidation) {
                    // Step 2: Check receipt status
                    return that.checkReceiptStatus(sNf, sIdentificador);
                })
                .then(function (oReceiptStatus) {
                    if (oReceiptStatus.isCompleted) {
                        throw {
                            message: "Recebimento já foi concluído",
                            isBusinessError: true
                        };
                    }

                    // Step 3: Create UC
                    return that.createUC(sMaterialEmbalagem, sNf, sIdentificador);
                })
                .then(function (oUCResult) {
                    // Step 4: Show success message and return result
                    that.showSuccessMessage(oUCResult.message);

                    return {
                        success: true,
                        uc: oUCResult.uc,
                        message: "Fluxo de criação de UC concluído com sucesso"
                    };
                })
                .catch(function (oError) {
                    // Centralized error handling
                    that.handleServiceError(oError, {
                        context: "UC Workflow",
                        showDialog: true
                    });

                    throw oError;
                });
        },

        /**
         * Example method for handling UC completion workflow
         * @public
         * @param {string} sNf invoice number
         * @param {string} sIdentificador container identifier
         * @param {string} sUc UC number
         * @returns {Promise} promise that resolves with completion result
         */
        executeUCCompletionWorkflow: function (sNf, sIdentificador, sUc) {
            var that = this;

            return this.completeUC(sUc, sNf, sIdentificador)
                .then(function (oCompletionResult) {
                    // Update local models or UI state as needed
                    that.showSuccessMessage(oCompletionResult.message);

                    return oCompletionResult;
                })
                .catch(function (oError) {
                    that.handleServiceError(oError, {
                        context: "UC Completion",
                        showDialog: true
                    });

                    throw oError;
                });
        },

        /**
         * Utility method to check if user is authorized before performing operations
         * @public
         * @returns {Promise} promise that resolves if user is authorized
         */
        ensureUserAuthorization: function () {
            if (!this.isUserAuthorized()) {
                return this.validateUserCenter(this.getCurrentUser())
                    .then(function (oValidationResult) {
                        return oValidationResult;
                    });
            } else {
                return Promise.resolve({
                    centro: this.getUserCentro(),
                    isValid: true,
                    message: "Usuário já autorizado"
                });
            }
        },

        // ========================================
        // Enhanced Service Integration Methods
        // ========================================

        /**
         * Enhanced user validation with comprehensive error handling
         * @public
         * @param {string} sUsuario user ID to validate (optional, uses current user if not provided)
         * @returns {Promise} promise that resolves with enhanced validation result
         */
        validateUserAuthorizationEnhanced: function (sUsuario) {
            var sUser = sUsuario || this.getCurrentUser();
            return this.getServiceHelper().validateUserAuthorization(sUser);
        },

        /**
         * Create UC with enhanced validation and error handling
         * @public
         * @param {object} oUCData UC creation data
         * @returns {Promise} promise that resolves with UC creation result
         */
        createUCEnhanced: function (oUCData) {
            return this.getServiceHelper().createUCEnhanced(oUCData);
        },

        /**
         * Complete UC with enhanced validation and error handling
         * @public
         * @param {object} oCompletionData UC completion data
         * @returns {Promise} promise that resolves with completion result
         */
        completeUCEnhanced: function (oCompletionData) {
            return this.getServiceHelper().completeUCEnhanced(oCompletionData);
        },

        /**
         * Delete UC with confirmation and enhanced error handling
         * @public
         * @param {string} sUc UC number to delete
         * @param {boolean} bConfirmed whether deletion is already confirmed
         * @returns {Promise} promise that resolves with deletion result
         */
        deleteUCEnhanced: function (sUc, bConfirmed) {
            return this.getServiceHelper().deleteUCEnhanced(sUc, bConfirmed);
        },

        /**
         * Execute multiple service operations in batch
         * @public
         * @param {array} aOperations array of operation objects
         * @returns {Promise} promise that resolves with batch results
         */
        executeBatchServiceOperations: function (aOperations) {
            return this.getServiceHelper().executeBatchOperations(aOperations);
        },

        /**
         * Validate material exists in SAP system
         * @public
         * @param {string} sMaterial material code to validate
         * @returns {Promise} promise that resolves with material validation result
         */
        validateMaterial: function (sMaterial) {
            if (!sMaterial || sMaterial.trim() === "") {
                return Promise.reject({
                    message: "Código do material é obrigatório",
                    errorType: "validation"
                });
            }

            // This would typically call a backend function to validate material
            // For now, we'll simulate the validation
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    // Simulate material validation logic
                    if (sMaterial.trim().length < 3) {
                        reject({
                            message: "Código do material muito curto",
                            errorType: "validation"
                        });
                    } else {
                        resolve({
                            material: sMaterial.trim(),
                            isValid: true,
                            message: "Material válido"
                        });
                    }
                }, 100);
            });
        },

        /**
         * Check service connectivity and health
         * @public
         * @returns {Promise} promise that resolves with service health status
         */
        checkServiceHealth: function () {
            var that = this;

            return new Promise(function (resolve, reject) {
                // Try to read a simple entity to check connectivity
                that.readEntity("/CentroSet", {
                    urlParameters: { "$top": "1" },
                    showBusy: false,
                    handleError: false
                }).then(function () {
                    resolve({
                        isHealthy: true,
                        message: "Serviço disponível",
                        timestamp: new Date().toISOString()
                    });
                }).catch(function (oError) {
                    reject({
                        isHealthy: false,
                        message: "Serviço indisponível",
                        error: oError,
                        timestamp: new Date().toISOString()
                    });
                });
            });
        },

        /**
         * Get service configuration and metadata information
         * @public
         * @returns {object} service configuration information
         */
        getServiceConfiguration: function () {
            var oModel = this.getModel();
            var oMetadata = oModel.getServiceMetadata();

            return {
                serviceUrl: oModel.sServiceUrl,
                version: oMetadata ? oMetadata.version : "unknown",
                entitySets: oMetadata && oMetadata.dataServices ?
                    oMetadata.dataServices.schema[0].entityContainer[0].entitySet.map(function (es) {
                        return es.name;
                    }) : [],
                functionImports: oMetadata && oMetadata.dataServices ?
                    oMetadata.dataServices.schema[0].entityContainer[0].functionImport.map(function (fi) {
                        return fi.name;
                    }) : []
            };
        },

        /**
         * Log service operation for monitoring and debugging
         * @public
         * @param {string} sOperation operation name
         * @param {object} oData operation data
         * @param {string} sResult operation result (success/error)
         * @param {object} oError error object if operation failed
         */
        logServiceOperation: function (sOperation, oData, sResult, oError) {
            var oLogEntry = {
                timestamp: new Date().toISOString(),
                operation: sOperation,
                user: this.getCurrentUser(),
                centro: this.getUserCentro(),
                data: oData,
                result: sResult,
                error: oError ? {
                    message: oError.message,
                    statusCode: oError.statusCode,
                    errorType: oError.errorType
                } : null
            };

            // Log to console for development

            // In production, you might want to send this to a logging service
            // this._sendToLoggingService(oLogEntry);
        },

        /**
         * Handle service operation with automatic logging and error handling
         * @public
         * @param {string} sOperationName operation name for logging
         * @param {fun   
     /**
         * Handle service operation with automatic logging and error handling
         * @public
         * @param {string} sOperationName operation name for logging
         * @param {function} fnOperation function that returns a promise
         * @param {object} oOperationData data for the operation
         * @returns {Promise} promise that resolves with operation result
         */
        executeServiceOperationWithLogging: function (sOperationName, fnOperation, oOperationData) {
            var that = this;
            var oStartTime = new Date();

            this.logServiceOperation(sOperationName, oOperationData, "started");

            return fnOperation()
                .then(function (oResult) {
                    var iDuration = new Date() - oStartTime;
                    that.logServiceOperation(sOperationName, oOperationData, "success", null, iDuration);
                    return oResult;
                })
                .catch(function (oError) {
                    var iDuration = new Date() - oStartTime;
                    that.logServiceOperation(sOperationName, oOperationData, "error", oError, iDuration);
                    throw oError;
                });
        },

        /**
         * Get comprehensive service status including all function imports
         * @public
         * @returns {Promise} promise that resolves with service status
         */
        getServiceStatus: function () {
            var that = this;
            var aStatusChecks = [];

            // Check ValidarUsuarioCentro
            aStatusChecks.push(
                this.validateUserCenter(this.getCurrentUser())
                    .then(function () {
                        return { function: "ValidarUsuarioCentro", status: "available" };
                    })
                    .catch(function () {
                        return { function: "ValidarUsuarioCentro", status: "unavailable" };
                    })
            );

            // Check service health
            aStatusChecks.push(
                this.checkServiceHealth()
                    .then(function (oHealth) {
                        return { function: "ServiceHealth", status: oHealth.isHealthy ? "healthy" : "unhealthy" };
                    })
                    .catch(function () {
                        return { function: "ServiceHealth", status: "error" };
                    })
            );

            return Promise.all(aStatusChecks).then(function (aResults) {
                return {
                    timestamp: new Date().toISOString(),
                    user: that.getCurrentUser(),
                    centro: that.getUserCentro(),
                    functionStatus: aResults,
                    overallStatus: aResults.every(function (oResult) {
                        return oResult.status === "available" || oResult.status === "healthy";
                    }) ? "operational" : "degraded"
                };
            });
        },

        // ========================================
        // Data Cleanup Methods
        // ========================================

        /**
         * Clear all global context data to prevent interference between processes
         * @public
         */
        clearGlobalContext: function () {
            var oComponent = this.getOwnerComponent();

            // Clear global context model
            var oGlobalModel = oComponent.getModel("globalContext");
            if (oGlobalModel) {
                oGlobalModel.setData({});
            }

            // Clear component-level receipt context model
            var oComponentReceiptModel = oComponent.getModel("receiptContext");
            if (oComponentReceiptModel) {
                oComponentReceiptModel.setData({});
            }

        },

        /**
         * Clear specific receipt context data while preserving other data
         * @public
         * @param {array} aFieldsToClear array of field names to clear (optional, clears all if not provided)
         */
        clearReceiptContext: function (aFieldsToClear) {
            var oComponent = this.getOwnerComponent();

            // Clear global context model
            var oGlobalModel = oComponent.getModel("globalContext");
            if (oGlobalModel) {
                var oGlobalData = oGlobalModel.getData();
                if (aFieldsToClear && aFieldsToClear.length > 0) {
                    // Clear only specific fields
                    aFieldsToClear.forEach(function (sField) {
                        delete oGlobalData[sField];
                    });
                    oGlobalModel.setData(oGlobalData);
                } else {
                    // Clear all data
                    oGlobalModel.setData({});
                }
            }

            // Clear component-level receipt context model
            var oComponentReceiptModel = oComponent.getModel("receiptContext");
            if (oComponentReceiptModel) {
                var oReceiptData = oComponentReceiptModel.getData();
                if (aFieldsToClear && aFieldsToClear.length > 0) {
                    // Clear only specific fields
                    aFieldsToClear.forEach(function (sField) {
                        delete oReceiptData[sField];
                    });
                    oComponentReceiptModel.setData(oReceiptData);
                } else {
                    // Clear all data
                    oComponentReceiptModel.setData({});
                }
            }

        },

        /**
         * Clear UC-specific data after UC completion
         * @public
         */
        clearUCData: function () {
            // Clear UC-specific fields that should not persist between processes
            var aUCFieldsToClear = [
                'uc', 'materialEmbalagem', 'currentStep', 'sourceScreen',
                'firstMaterialSKU', 'firstExpirationDate', 'scannedItems'
            ];

            this.clearReceiptContext(aUCFieldsToClear);

        },

        /**
         * Clear all process data after finalization
         * @public
         */
        clearAllProcessData: function () {
            // Clear all global context data
            this.clearGlobalContext();

        },

        /**
         * Clear all navigation data - comprehensive cleanup for fresh start
         * @public
         */
        clearAllNavigationData: function () {
            var oComponent = this.getOwnerComponent();

            // Clear receipt context model
            var oReceiptModel = oComponent.getModel("receiptContext");
            if (oReceiptModel) {
                oReceiptModel.setData({
                    nf: "",
                    identificador: "",
                    uc: "",
                    operacao: "",
                    statusReceb: "",
                    statusContainer: "",
                    items: []
                });
            }

            // Clear global context model
            var oGlobalModel = oComponent.getModel("globalContext");
            if (oGlobalModel) {
                oGlobalModel.setData({});
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

        gravaImpressora: function (sImpressora) {
            Impressora = sImpressora
        },

        retornaImrpressora: function () {
            return Impressora
        }
    })
})
