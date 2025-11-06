sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator"
], function (BaseObject, MessageBox, BusyIndicator) {
    "use strict";

    /**
     * Service Integration Helper
     * Provides centralized service integration utilities and enhanced error handling
     */
    return BaseObject.extend("zui5recebfisic.controller.ServiceIntegrationHelper", {

        /**
         * Constructor
         * @param {sap.ui.core.mvc.Controller} oController reference to the calling controller
         */
        constructor: function (oController) {
            this._oController = oController;
            this._oModel = oController.getModel();
        },

        /**
         * Enhanced user authorization validation with detailed error handling
         * @public
         * @param {string} sUsuario user ID to validate
         * @returns {Promise} promise that resolves with detailed validation result
         */
        validateUserAuthorization: function (sUsuario) {
            var that = this;

            if (!sUsuario || typeof sUsuario !== "string" || sUsuario.trim() === "") {
                return Promise.reject({
                    message: "Usuário é obrigatório para validação",
                    errorType: "validation",
                    validationErrors: ["Usuário é obrigatório"]
                });
            }

            return new Promise(function (resolve, reject) {
                BusyIndicator.show();

                that._oModel.callFunction("/ValidarUsuarioCentro", {
                    urlParameters: {
                        Usuario: sUsuario.trim()
                    },
                    success: function (oData) {
                        BusyIndicator.hide();

                        if (oData && oData.Werks) {
                            resolve({
                                centro: oData.Werks,
                                usuario: sUsuario.trim(),
                                isValid: true,
                                isAuthorized: true,
                                message: "Usuário autorizado para o centro " + oData.Werks,
                                timestamp: new Date().toISOString()
                            });
                        } else {
                            reject({
                                message: "Usuário não autorizado - centro não encontrado",
                                errorType: "authorization",
                                statusCode: 403,
                                isAuthError: true
                            });
                        }
                    },
                    error: function (oError) {
                        BusyIndicator.hide();

                        var oProcessedError = that._processServiceError(oError, "ValidarUsuarioCentro");
                        oProcessedError.isAuthError = true;
                        reject(oProcessedError);
                    }
                });
            });
        },

        /**
         * Enhanced UC creation with comprehensive validation and error handling
         * @public
         * @param {object} oUCData UC creation data
         * @returns {Promise} promise that resolves with UC creation result
         */
        createUCEnhanced: function (oUCData) {
            var that = this;

            // Validate input data
            var oValidation = this._validateUCCreationData(oUCData);
            if (!oValidation.isValid) {
                return Promise.reject({
                    message: oValidation.message,
                    errorType: "validation",
                    validationErrors: oValidation.errors
                });
            }

            return new Promise(function (resolve, reject) {
                BusyIndicator.show();

                that._oModel.callFunction("/CriarUC", {
                    urlParameters: {
                        MatEmbalagem: oUCData.matEmbalagem.trim(),
                        Nf: oUCData.nf.trim(),
                        Identificador: oUCData.identificador.trim()
                    },
                    success: function (oData) {
                        BusyIndicator.hide();

                        if (oData && oData.Uc) {
                            resolve({
                                uc: oData.Uc,
                                success: true,
                                message: "UC '" + oData.Uc + "' criada com sucesso",
                                timestamp: new Date().toISOString(),
                                inputData: oUCData
                            });
                        } else {
                            reject({
                                message: "Erro na criação da UC - resposta inválida do servidor",
                                errorType: "server",
                                originalResponse: oData
                            });
                        }
                    },
                    error: function (oError) {
                        BusyIndicator.hide();

                        var oProcessedError = that._processServiceError(oError, "CriarUC");
                        oProcessedError.isBusinessError = true;
                        reject(oProcessedError);
                    }
                });
            });
        },

        /**
         * Enhanced UC completion with status validation
         * @public
         * @param {object} oCompletionData UC completion data
         * @returns {Promise} promise that resolves with completion result
         */
        completeUCEnhanced: function (oCompletionData) {
            var that = this;

            // Validate input data
            var oValidation = this._validateUCCompletionData(oCompletionData);
            if (!oValidation.isValid) {
                return Promise.reject({
                    message: oValidation.message,
                    errorType: "validation",
                    validationErrors: oValidation.errors
                });
            }

            return new Promise(function (resolve, reject) {
                BusyIndicator.show();

                that._oModel.callFunction("/ConcluirUC", {
                    urlParameters: {
                        Uc: oCompletionData.uc.trim(),
                        Nf: oCompletionData.nf.trim(),
                        Identificador: oCompletionData.identificador.trim()
                    },
                    success: function (oData) {
                        BusyIndicator.hide();

                        resolve({
                            uc: oCompletionData.uc,
                            success: true,
                            message: "UC '" + oCompletionData.uc + "' concluída com sucesso",
                            timestamp: new Date().toISOString(),
                            data: oData
                        });
                    },
                    error: function (oError) {
                        BusyIndicator.hide();

                        var oProcessedError = that._processServiceError(oError, "ConcluirUC");
                        oProcessedError.isBusinessError = true;
                        reject(oProcessedError);
                    }
                });
            });
        },

        /**
         * Enhanced UC deletion with confirmation and validation
         * @public
         * @param {string} sUc UC number to delete
         * @param {boolean} bConfirmed whether deletion is already confirmed
         * @returns {Promise} promise that resolves with deletion result
         */
        deleteUCEnhanced: function (sUc, bConfirmed) {
            var that = this;

            if (!sUc || typeof sUc !== "string" || sUc.trim() === "") {
                return Promise.reject({
                    message: "UC é obrigatória para exclusão",
                    errorType: "validation",
                    validationErrors: ["UC é obrigatória"]
                });
            }

            // Show confirmation dialog if not already confirmed
            if (!bConfirmed) {
                return new Promise(function (resolve, reject) {
                    MessageBox.confirm(
                        "Tem certeza que deseja excluir a UC '" + sUc + "'?",
                        {
                            title: "Confirmar Exclusão",
                            onClose: function (oAction) {
                                if (oAction === MessageBox.Action.OK) {
                                    that.deleteUCEnhanced(sUc, true)
                                        .then(resolve)
                                        .catch(reject);
                                } else {
                                    reject({
                                        message: "Exclusão cancelada pelo usuário",
                                        errorType: "cancelled"
                                    });
                                }
                            }
                        }
                    );
                });
            }

            return new Promise(function (resolve, reject) {
                BusyIndicator.show();

                that._oModel.callFunction("/DeletarUC", {
                    urlParameters: {
                        Uc: sUc.trim()
                    },
                    success: function (oData) {
                        BusyIndicator.hide();

                        resolve({
                            uc: sUc,
                            success: true,
                            message: "UC '" + sUc + "' excluída com sucesso",
                            timestamp: new Date().toISOString(),
                            data: oData
                        });
                    },
                    error: function (oError) {
                        BusyIndicator.hide();

                        var oProcessedError = that._processServiceError(oError, "DeletarUC");
                        oProcessedError.isBusinessError = true;
                        reject(oProcessedError);
                    }
                });
            });
        },

        /**
         * Batch service operations for better performance
         * @public
         * @param {array} aOperations array of operation objects
         * @returns {Promise} promise that resolves with batch results
         */
        executeBatchOperations: function (aOperations) {
            var that = this;
            var aPromises = [];

            aOperations.forEach(function (oOperation) {
                var oPromise;

                switch (oOperation.type) {
                    case "createUC":
                        oPromise = that.createUCEnhanced(oOperation.data);
                        break;
                    case "completeUC":
                        oPromise = that.completeUCEnhanced(oOperation.data);
                        break;
                    case "deleteUC":
                        oPromise = that.deleteUCEnhanced(oOperation.data.uc, true);
                        break;
                    default:
                        oPromise = Promise.reject({
                            message: "Tipo de operação não suportado: " + oOperation.type,
                            errorType: "validation"
                        });
                }

                aPromises.push(oPromise.catch(function (oError) {
                    return {
                        success: false,
                        error: oError,
                        operation: oOperation
                    };
                }));
            });

            return Promise.all(aPromises).then(function (aResults) {
                var aSuccessful = aResults.filter(function (oResult) {
                    return oResult.Success !== false;
                });
                var aFailed = aResults.filter(function (oResult) {
                    return oResult.Success === false;
                });

                return {
                    successful: aSuccessful,
                    failed: aFailed,
                    totalCount: aResults.length,
                    successCount: aSuccessful.length,
                    failureCount: aFailed.length
                };
            });
        },

        /**
         * Validate UC creation data
         * @private
         * @param {object} oData UC creation data
         * @returns {object} validation result
         */
        _validateUCCreationData: function (oData) {
            var aErrors = [];

            if (!oData) {
                aErrors.push("Dados da UC são obrigatórios");
            } else {
                if (!oData.matEmbalagem || oData.matEmbalagem.trim() === "") {
                    aErrors.push("Material de embalagem é obrigatório");
                }
                if (!oData.nf || oData.nf.trim() === "") {
                    aErrors.push("Número da nota fiscal é obrigatório");
                }
                if (!oData.identificador || oData.identificador.trim() === "") {
                    aErrors.push("Identificador é obrigatório");
                }
            }

            return {
                isValid: aErrors.length === 0,
                errors: aErrors,
                message: aErrors.length > 0 ? aErrors.join(", ") : ""
            };
        },

        /**
         * Validate UC completion data
         * @private
         * @param {object} oData UC completion data
         * @returns {object} validation result
         */
        _validateUCCompletionData: function (oData) {
            var aErrors = [];

            if (!oData) {
                aErrors.push("Dados de conclusão da UC são obrigatórios");
            } else {
                if (!oData.uc || oData.uc.trim() === "") {
                    aErrors.push("UC é obrigatória");
                }
                if (!oData.nf || oData.nf.trim() === "") {
                    aErrors.push("Número da nota fiscal é obrigatório");
                }
                if (!oData.identificador || oData.identificador.trim() === "") {
                    aErrors.push("Identificador é obrigatório");
                }
            }

            return {
                isValid: aErrors.length === 0,
                errors: aErrors,
                message: aErrors.length > 0 ? aErrors.join(", ") : ""
            };
        },

        /**
         * Process service errors with enhanced error information
         * @private
         * @param {object} oError the error object
         * @param {string} sContext the context/function name
         * @returns {object} processed error object
         */
        _processServiceError: function (oError, sContext) {
            var sMessage = "Erro no processamento";
            var sErrorType = "general";
            var aDetails = [];

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
                        sMessage = "Serviço temporariamente indisponível.";
                        break;
                }
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
                            aDetails = oErrorData.error.innererror.errordetails.map(function (detail) {
                                return detail.message;
                            });
                        }
                    }
                } catch (e) {
                    // Fallback for non-JSON responses
                    if (oError.responseText.indexOf("error") !== -1) {
                        sMessage = oError.responseText;
                    }
                }
            } else if (oError && oError.message) {
                sMessage = oError.message;
            }

            // Handle business-specific errors based on context
            if (sContext && oError.responseText) {
                switch (sContext) {
                    case "ValidarUsuarioCentro":
                        if (oError.responseText.indexOf("não autorizado") !== -1) {
                            sErrorType = "authorization";
                            sMessage = "Usuário não autorizado para este centro";
                        }
                        break;
                    case "CriarUC":
                        if (oError.responseText.indexOf("Material de embalagem não cadastrado") !== -1) {
                            sErrorType = "business";
                            sMessage = "Material de embalagem não cadastrado no SAP";
                        }
                        break;
                    case "ConcluirUC":
                        if (oError.responseText.indexOf("UC não encontrada") !== -1) {
                            sErrorType = "business";
                            sMessage = "UC não encontrada ou já foi concluída";
                        } else if (oError.responseText.indexOf("UC sem itens") !== -1) {
                            sErrorType = "business";
                            sMessage = "UC não pode ser concluída - nenhum item foi adicionado";
                        }
                        break;
                    case "DeletarUC":
                        if (oError.responseText.indexOf("UC não encontrada") !== -1) {
                            sErrorType = "business";
                            sMessage = "UC não encontrada";
                        } else if (oError.responseText.indexOf("UC já concluída") !== -1) {
                            sErrorType = "business";
                            sMessage = "UC não pode ser excluída - já foi concluída";
                        }
                        break;
                }
            }

            return {
                message: sMessage,
                errorType: sErrorType,
                details: aDetails,
                context: sContext,
                originalError: oError,
                timestamp: new Date().toISOString()
            };
        }
    });
});