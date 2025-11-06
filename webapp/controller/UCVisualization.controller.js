sap.ui.define([
    "./BaseController",
    "sap/m/MessageBox"
], function (BaseController, MessageBox) {
    "use strict";

    return BaseController.extend("zui5recebfisic.controller.UCVisualization", {

        onInit: function () {
            // Initialize the UC visualization screen
            this._initializeUCModel();
            this._setupRouteMatched();
        },

        /**
         * Initialize the UC model
         * @private
         */
        _initializeUCModel: function () {
            var oUCData = {
                ucs: [],
                loading: false
            };
            
            this.createLocalModel(oUCData, "ucModel");
        },

        /**
         * Setup route matched handler
         * @private
         */
        _setupRouteMatched: function () {
            var oRouter = this.getRouter();
            oRouter.getRoute("RouteUCVisualization").attachPatternMatched(this._onRouteMatched, this);
        },

        /**
         * Handle route matched event
         * @private
         * @param {sap.ui.base.Event} oEvent the route matched event
         */
        _onRouteMatched: function (oEvent) {
            // Load UCs when the view is displayed
            this._loadUCs();
        },

        /**
         * Load UCs for the current receipt
         * @private
         */
        _loadUCs: function () {
            var oReceiptModel = this.getModel("receiptContext");
            
            if (!oReceiptModel) {
                this.showErrorMessage("Dados do recebimento não encontrados");
                this.navToPhysicalReceipt();
                return;
            }

            var sNf = oReceiptModel.getProperty("/nf");
            var sIdentificador = oReceiptModel.getProperty("/identificador");
            let sDoca = oReceiptModel.getProperty("/doca");

            if (!sNf || !sIdentificador) {
                this.showErrorMessage("NF e Identificador são obrigatórios");
                this.navToPhysicalReceipt();
                return;
            }

            this._fetchUCsFromBackend(sNf, sIdentificador, sDoca);
        },

        /**
         * Fetch UCs from backend service
         * @private
         * @param {string} sNf the invoice number
         * @param {string} sIdentificador the container/truck identifier
         */
        _fetchUCsFromBackend: function (sNf, sIdentificador, sDoca) {
            var that = this;
            var oUCModel = this.getModel("ucModel");
            
            // Set loading state
            oUCModel.setProperty("/loading", true);
            
            // Build filter for ItemsSet to get UCs for this NF+Identificador
            var aFilters = [
                "Nf eq '" + encodeURIComponent(sNf) + "'",
                "Identificador eq '" + encodeURIComponent(sIdentificador) + "'"
            ];
            
            var sPath = "/StatusUCSet";

            this.readEntity(sPath, {
                urlParameters: {
                    "$filter": aFilters.join(" and ")
                },
                showBusy: true
            }).then(function (oData) {
                that._processUCData(oData.results || []);
            }).catch(function (oError) {
                that.handleServiceError(oError);
                oUCModel.setProperty("/ucs", []);
            }).finally(function () {
                oUCModel.setProperty("/loading", false);
            });
        },

        /**
         * Process UC data from backend response
         * @private
         * @param {array} aItems array of items from backend
         */
        _processUCData: function (aItems) {
            var oUCModel = this.getModel("ucModel");
            var mUCs = {};
            
            // Group items by UC and get status from associated StatusUC entity
            aItems.forEach(function (oItem) {
                var sUC = oItem.Uc;
                if (sUC && !mUCs[sUC]) {
       
                    
                    mUCs[sUC] = {
                        uc: sUC,
                        status: oItem.Status,
                        nf: oItem.Nf,
                        identificador: oItem.Identificador
                    };
                }
            });
            
            // Convert to array
            var aUCs = Object.keys(mUCs).map(function (sKey) {
                return mUCs[sKey];
            });
            
            // Sort UCs by UC number
            aUCs.sort(function (a, b) {
                return a.uc.localeCompare(b.uc);
            });
            
            oUCModel.setProperty("/ucs", aUCs);
        },

        /**
         * Format status state for ObjectStatus
         * @public
         * @param {string} sStatus the status value
         * @returns {string} the state for ObjectStatus
         */
        formatStatusState: function (sStatus) {
            switch (sStatus) {
                case "CONCLUIDO":
                    return "Success";
                case "EM ABERTO":
                    return "Warning";
                case "ERRO":
                    return "Error";
                default:
                    return "None";
            }
        },

        /**
         * Handle UC item press
         * @public
         * @param {sap.ui.base.Event} oEvent the press event
         */
        onUCItemPress: function (oEvent) {
            var oSource = oEvent.getSource();
            var sUC = oSource.getCustomData()[0].getValue();
            var sStatus = oSource.getCustomData()[1].getValue();
            
            // Update receipt context with selected UC
            var oReceiptModel = this.getModel("receiptContext");
            oReceiptModel.setProperty("/uc", sUC);
            
            // Navigate to AssembleUC if UC is open, otherwise show info
            if (sStatus === "EM ABERTO") {
                this.navToAssembleUC();
            } else {
                this.showInfoMessage("UC " + sUC + " está com status: " + sStatus);
            }
        },

        /**
         * Handle delete UC button press with enhanced confirmation
         * @public
         * @param {sap.ui.base.Event} oEvent the press event
         */
        onDeleteUCPress: function (oEvent) {
            var oSource = oEvent.getSource();
            var sUC = oSource.getCustomData()[0].getValue();
            var sStatus = oSource.getCustomData()[1] ? oSource.getCustomData()[1].getValue() : "EM ABERTO";
            
            // Debug: Log the status to verify it's being received correctly
            console.log("Delete UC - UC:", sUC, "Status:", sStatus);
            
            // Check if UC can be deleted based on status
            if (sStatus === "CONCLUIDO") {
                this.showErrorMessage("Não é possível excluir uma UC com status CONCLUIDO.\n\n" +
                                    "UC: " + sUC + "\n" +
                                    "Status: " + sStatus + "\n\n" +
                                    "Apenas UCs com status 'EM ABERTO' podem ser excluídas.");
                return;
            }
            
            var sTitle = "Confirmar Exclusão";
            var sMessage = "Esta ação irá deletar permanentemente a UC " + sUC + " e todos os seus itens.\n\n" +
                          "Esta operação não pode ser desfeita.\n\n" +
                          "Deseja continuar?";
            
            this.showDestructiveConfirmDialog(
                sTitle,
                sMessage,
                this._confirmDeleteUC.bind(this, sUC),
                null,
                {
                    emphasizedAction: "Deletar"
                }
            );
        },

        /**
         * Confirm UC deletion with enhanced error handling
         * @private
         * @param {string} sUC the UC to delete
         */
        _confirmDeleteUC: function (sUC) {
            var that = this;
            
            // Show progress dialog
            this.showProgressDialog("Deletando UC", "Removendo UC " + sUC + "...");
            
            // Use the new service method from BaseController with enhanced error handling
            this.deleteUC(sUC)
                .then(function (oResult) {
                    that.updateProgressDialog("UC deletada com sucesso!");
                    
                    // Show success message
                    that.showSuccessMessage("UC " + sUC + " foi deletada com sucesso");
                    
                    // Immediately remove UC from local model for instant UI update
                    that._removeUCFromLocalModel(sUC);
                    
                    // Reload UCs to ensure data consistency with backend
                    that._loadUCs();
                })
                .catch(function (oError) {
                    that._handleDeleteUCError(oError, sUC);
                })
                .finally(function () {
                    that.hideProgressDialog();
                });
        },

        /**
         * Remove UC from local model immediately for instant UI update
         * @private
         * @param {string} sUC the UC to remove from local model
         */
        _removeUCFromLocalModel: function (sUC) {
            var oUCModel = this.getModel("ucModel");
            if (!oUCModel) {
                return;
            }
            
            var aUCs = oUCModel.getProperty("/ucs") || [];
            
            // Filter out the deleted UC
            var aFilteredUCs = aUCs.filter(function (oUC) {
                return oUC.uc !== sUC;
            });
            
            // Update the model with filtered UCs
            oUCModel.setProperty("/ucs", aFilteredUCs);
            
            // Log the removal for debugging
        },

        /**
         * Handle UC deletion errors with specific feedback
         * @private
         * @param {object} oError the error object
         * @param {string} sUC the UC that failed to delete
         */
        _handleDeleteUCError: function (oError, sUC) {
            var sErrorMessage = "Erro ao deletar UC " + sUC;
            var bShowRetry = false;
            
            // Analyze error for specific handling
            if (oError && oError.message) {
                if (oError.message.indexOf("não encontrada") !== -1 ||
                    oError.message.indexOf("not found") !== -1) {
                    sErrorMessage = "UC " + sUC + " não foi encontrada no sistema";
                } else if (oError.message.indexOf("concluída") !== -1 ||
                          oError.message.indexOf("completed") !== -1) {
                    sErrorMessage = "UC " + sUC + " já foi concluída e não pode ser deletada";
                } else if (oError.message.indexOf("timeout") !== -1 ||
                          oError.message.indexOf("network") !== -1) {
                    sErrorMessage = "Erro de conexão ao deletar UC. Tente novamente.";
                    bShowRetry = true;
                } else {
                    sErrorMessage = "Erro ao deletar UC " + sUC + ": " + oError.message;
                }
            }
            
            // Show error with retry option if applicable
            this.handleServiceError(oError, {
                defaultMessage: sErrorMessage,
                showRetry: bShowRetry,
                onRetry: this._confirmDeleteUC.bind(this, sUC),
                context: "UC Deletion"
            });
        },

        /**
         * Navigate back to main menu
         * @public
         */
        onInicioPress: function () {
            this.navToMainMenu();
        },

        /**
         * Navigate to UC assembly/creation
         * @public
         */
        onMontarUCPress: function () {
            var that = this;
            var oReceiptModel = this.getModel("receiptContext");
            var oUCModel = this.getModel("ucModel");
            var aUCs = oUCModel.getProperty("/ucs");
            
            // First check StatusContainer before allowing UC creation
            this._checkStatusContainerBeforeUC()
                .then(function (bCanCreateUC) {
                    if (!bCanCreateUC) {
                        // StatusContainer is CONCLUIDO, show error message
                        that.showErrorMessage("Não é possível criar novas UCs.\n\n" +
                                            "O recebimento já foi finalizado (StatusContainer: CONCLUIDO).\n\n" +
                                            "Apenas recebimentos em andamento permitem a criação de novas UCs.");
                        return;
                    }
                    
                    // Check if there are any open UCs
                    var aOpenUCs = aUCs.filter(function (oUC) {
                        return oUC.status === "EM ABERTO";
                    });
                    
                    if (aOpenUCs.length > 0) {
                        // If there's an open UC, use the first one and navigate to AssembleUC
                        oReceiptModel.setProperty("/uc", aOpenUCs[0].uc);
                        that.navToAssembleUC();
                    } else {
                        // No open UCs, navigate to CreateUC to create a new one
                        oReceiptModel.setProperty("/uc", "");
                        that.navToCreateUC();
                    }
                })
                .catch(function (oError) {
                    that.handleServiceError(oError, {
                        defaultMessage: "Erro ao verificar status do recebimento"
                    });
                });
        },

        /**
         * Navigate to UC LxC assembly/creation
         * @public
         */
        onMontarUCLxCPress: function () {
            var that = this;
            var oReceiptModel = this.getModel("receiptContext");
            var oUCModel = this.getModel("ucModel");
            var aUCs = oUCModel.getProperty("/ucs");
            
            // First check StatusContainer before allowing UC creation
            this._checkStatusContainerBeforeUC()
                .then(function (bCanCreateUC) {
                    if (!bCanCreateUC) {
                        // StatusContainer is CONCLUIDO, show error message
                        that.showErrorMessage("Não é possível criar novas UCs.\n\n" +
                                            "O recebimento já foi finalizado (StatusContainer: CONCLUIDO).\n\n" +
                                            "Apenas recebimentos em andamento permitem a criação de novas UCs.");
                        return;
                    }
                    
                    // Check if there are any open UCs
                    var aOpenUCs = aUCs.filter(function (oUC) {
                        return oUC.status === "EM ABERTO";
                    });
                    
                    if (aOpenUCs.length > 0) {
                        // If there's an open UC, use the first one and navigate to AssembleUCLxC
                        oReceiptModel.setProperty("/uc", aOpenUCs[0].uc);
                        that.navToAssembleUCLxC();
                    } else {
                        // No open UCs, navigate to CreateUC to create a new one
                        oReceiptModel.setProperty("/uc", "");
                        that.navToCreateUC();
                    }
                })
                .catch(function (oError) {
                    that.handleServiceError(oError, {
                        defaultMessage: "Erro ao verificar status do recebimento"
                    });
                });
        },

        /**
         * Check StatusContainer before allowing UC creation
         * @private
         * @returns {Promise<boolean>} Promise that resolves to true if UC creation is allowed
         */
        _checkStatusContainerBeforeUC: function () {
            var that = this;
            var oReceiptModel = this.getModel("receiptContext");
            
            if (!oReceiptModel) {
                return Promise.reject(new Error("Dados do recebimento não encontrados"));
            }
            
            var sNf = oReceiptModel.getProperty("/nf");
            var sIdentificador = oReceiptModel.getProperty("/identificador");
            
            if (!sNf || !sIdentificador) {
                return Promise.reject(new Error("NF e Identificador são obrigatórios"));
            }
            
            // Read Header entity to check StatusContainer
            var sHeaderPath = "/HeaderSet(Nf='" + sNf + "',Identificador='" + sIdentificador + "')";
            
            return this.readEntity(sHeaderPath, {
                showBusy: false,
                handleError: false
            }).then(function (oHeaderData) {
                if (!oHeaderData) {
                    throw new Error("Dados do header não encontrados");
                }
                
                var sStatusContainer = oHeaderData.StatusContainer;
                
                // Allow UC creation only if StatusContainer is not CONCLUIDO
                return sStatusContainer !== "CONCLUIDO";
            }).catch(function (oError) {
                // If there's an error reading the header, allow UC creation as fallback
                console.warn("Error checking StatusContainer:", oError);
                return true;
            });
        },

        /**
         * Navigate to finalization check
         * @public
         */
        onFinalizarRecebimentoPress: function () {
            var that = this;
            var oUCModel = this.getModel("ucModel");
            var aUCs = oUCModel.getProperty("/ucs");
            
            // Check if there are any UCs
            if (!aUCs || aUCs.length === 0) {
                this.showErrorMessage("Não há UCs para finalizar o recebimento");
                return;
            }
            
            // Check if there are any UCs not concluded
            var aNonConcludedUCs = aUCs.filter(function (oUC) {
                return oUC.status !== "CONCLUIDO";
            });
            
            if (aNonConcludedUCs.length > 0) {
                // Show popup with list of non-concluded UCs
                this._showNonConcludedUCsPopup(aNonConcludedUCs);
                return;
            }
            
            // All UCs are completed, show confirmation and proceed to finalization
            var sConfirmMessage = "Esta ação irá:\n" +
                "- Atualizar o status do identificador para CONCLUÍDO\n" +
                "- Não poderá ser desfeita\n\n" +
                "Deseja continuar?";
            
            sap.m.MessageBox.confirm(sConfirmMessage, {
                title: "Confirmar Finalização do Recebimento",
                actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                emphasizedAction: sap.m.MessageBox.Action.OK,
                onClose: function (oAction) {
                    if (oAction === sap.m.MessageBox.Action.OK) {
                        // User confirmed, proceed to finalization
                        that._performRecebimentoFinalization();
                    }
                }
            });
        },

        /**
         * Show popup with list of non-concluded UCs
         * @param {array} aNonConcludedUCs - Array of UCs that are not concluded
         * @private
         */
        _showNonConcludedUCsPopup: function (aNonConcludedUCs) {
            // Build message with list of non-concluded UCs
            var sMessage = "Existem UCs que ainda não foram concluídas:\n\n";
            
            aNonConcludedUCs.forEach(function (oUC) {
                sMessage += "• UC: " + oUC.uc + " - Status: " + oUC.status + "\n";
            });
            
            sMessage += "\nFinalize todas as UCs antes de concluir o recebimento.";
            
            sap.m.MessageBox.warning(sMessage, {
                title: "UCs Pendentes",
                actions: [sap.m.MessageBox.Action.OK],
                emphasizedAction: sap.m.MessageBox.Action.OK
            });
        },

        /**
         * Perform recebimento finalization - update container status to CONCLUIDO
         * @private
         */
        _performRecebimentoFinalization: function () {
            var that = this;
            var oReceiptModel = this.getModel("receiptContext");
            var sNf = oReceiptModel.getProperty("/nf");
            var sIdentificador = oReceiptModel.getProperty("/identificador");
            
            this.showBusyIndicator("Finalizando recebimento...");
            
            // Update HeaderSet to set StatusContainer to CONCLUIDO
            var sHeaderPath = "/HeaderSet(Nf='" + sNf + "',Identificador='" + sIdentificador + "')";
            
            var oUpdateData = {
                StatusContainer: "CONCLUIDO"
            };
            
            this.updateEntity(sHeaderPath, oUpdateData, {
                showBusy: false,
                handleError: true
            }).then(function () {
                that.hideBusyIndicator();
                
                // Show success message
                sap.m.MessageBox.success("Recebimento finalizado com sucesso!", {
                    title: "Sucesso",
                    actions: [sap.m.MessageBox.Action.OK],
                    onClose: function () {
                        // Navigate to main menu
                        that.clearAllProcessData();
                        that.navToMainMenu();
                    }
                });
            }).catch(function (oError) {
                that.hideBusyIndicator();
                that.handleServiceError(oError, {
                    defaultMessage: "Erro ao finalizar recebimento"
                });
            });
        },

        /**
         * Handle navigation back
         * @public
         */
        onNavBack: function () {
            this.navToPhysicalReceipt();
        }
    });
});