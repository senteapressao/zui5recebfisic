sap.ui.define([
    "./BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("zui5recebfisic.controller.MainMenu", {

        onInit: function () {
            // Initialize the main menu
            this._initializeLocalModel();
            this._initializeMobileFeatures();
            this._ensureUniformButtonSizing();
        },
        /**
         * Initialize local model for main menu state
         * @private
         */
        _initializeLocalModel: function () {
            var oMainMenuModel = this.createLocalModel({
                title: "Sistema de Recebimento Físico",
                buttons: {
                    recebimento: {
                        enabled: true,
                        text: "Recebimento",
                        icon: "sap-icon://inbox"
                    },
                    armazenarUC: {
                        enabled: true,
                        text: "Armazenar UC",
                        icon: "sap-icon://warehouse"
                    },
                    voltar: {
                        enabled: true,
                        text: "Voltar",
                        icon: "sap-icon://nav-back"
                    }
                }
            }, "mainMenu");
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
         * Add haptic feedback to main menu buttons
         * @private
         */
        _addHapticFeedbackToButtons: function () {
            var that = this;
            var aButtonIds = [
                "recebimentoButton",
                "armazenarUCButton", 
                "voltarButton"
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
                "recebimentoButton",
                "armazenarUCButton", 
                "voltarButton"
            ];
            
            aButtonIds.forEach(function (sButtonId) {
                var oButton = that.byId(sButtonId);
                if (oButton) {
                    // Add touch-friendly styling
                    oButton.addStyleClass("mobileActionButton");
                    
                    // Add accessibility enhancements
                    oButton.setTooltip(oButton.getText() + " - Toque para acessar");
                }
            });
        },

        /**
         * Navigate to Physical Receipt screen with enhanced error handling
         * Requirements: 1.1, 1.2
         * @public
         */
        onRecebimentoPress: function () {
            try {
                // Add visual feedback for mobile
                if (this.isMobileDevice && this.isMobileDevice()) {
                    var oButton = this.byId("recebimentoButton");
                    if (oButton && this.addVisualHapticFeedback) {
                        this.addVisualHapticFeedback(oButton);
                    }
                }
                
                this.navToPhysicalReceipt();
            } catch (oError) {
                this.handleServiceError(oError, {
                    defaultMessage: "Erro ao navegar para tela de recebimento",
                    context: "Main Menu Navigation"
                });
            }
        },

        /**
         * Navigate to UC Storage screen with enhanced error handling
         * Requirements: 1.3
         * @public
         */
        onArmazenarUCPress: function () {
            try {
                // Add visual feedback for mobile
                if (this.isMobileDevice && this.isMobileDevice()) {
                    var oButton = this.byId("armazenarUCButton");
                    if (oButton && this.addVisualHapticFeedback) {
                        this.addVisualHapticFeedback(oButton);
                    }
                }
                
                this.navToArmazenarUC();
            } catch (oError) {
                this.handleServiceError(oError, {
                    defaultMessage: "Erro ao navegar para tela de armazenamento",
                    context: "Main Menu Navigation"
                });
            }
        },

        /**
         * Navigate to Concluir NF screen with enhanced error handling
         * @public
         */
        onConcluirNFPress: function () {
            try {
                // Add visual feedback for mobile
                if (this.isMobileDevice && this.isMobileDevice()) {
                    var oButton = this.byId("concluirNFButton");
                    if (oButton && this.addVisualHapticFeedback) {
                        this.addVisualHapticFeedback(oButton);
                    }
                }
                
                this.navToConcluirNF();
            } catch (oError) {
                this.handleServiceError(oError, {
                    defaultMessage: "Erro ao navegar para tela de conclusão de NF",
                    context: "Main Menu Navigation"
                });
            }
        },

        /**
         * Handle back navigation or exit from main menu with enhanced confirmation
         * Requirements: 1.1, 9.2
         * @public
         */
        onVoltarPress: function () {
            // Add visual feedback for mobile
            if (this.isMobileDevice && this.isMobileDevice()) {
                var oButton = this.byId("voltarButton");
                if (oButton && this.addVisualHapticFeedback) {
                    this.addVisualHapticFeedback(oButton);
                }
            }
            
            // Since this is the main menu, show enhanced confirmation dialog for exit
            var sTitle = "Sair do Aplicativo";
            var sMessage = "Deseja realmente sair do Sistema de Recebimento Físico?";
            
            this.showDestructiveConfirmDialog(
                sTitle,
                sMessage,
                function () {
                    // Exit the application or navigate to parent app
                    this._exitApplication();
                }.bind(this),
                function () {
                    // User cancelled, do nothing
                },
                {
                    emphasizedAction: "Sair"
                }
            );
        },

        /**
         * Exit the application
         * @private
         */
        _exitApplication: function () {
            // In a Fiori Launchpad environment, this would navigate back to the launchpad
            // For standalone app, we can show a message or close the window
            if (window.history.length > 1) {
                window.history.back();
            } else {
                this.showInfoMessage("Você está na tela principal do sistema");
            }
        },

        /**
         * Ensure all main menu buttons have uniform sizing
         * @private
         */
        _ensureUniformButtonSizing: function () {
            var that = this;
            
            // Wait for the view to be fully rendered
            setTimeout(function() {
                var aButtonIds = [
                    "recebimentoButton",
                    "armazenarUCButton", 
                    "concluirNFButton"
                ];
                
                aButtonIds.forEach(function (sButtonId) {
                    var oButton = that.byId(sButtonId);
                    if (oButton) {
                        var oDomRef = oButton.getDomRef();
                        if (oDomRef) {
                            // Force uniform dimensions via JavaScript
                            oDomRef.style.width = "100%";
                            oDomRef.style.minWidth = "280px";
                            oDomRef.style.maxWidth = "320px";
                            oDomRef.style.height = "3.5rem";
                            oDomRef.style.minHeight = "3.5rem";
                            oDomRef.style.boxSizing = "border-box";
                            oDomRef.style.flexShrink = "0";
                            oDomRef.style.display = "flex";
                            oDomRef.style.alignItems = "center";
                            oDomRef.style.justifyContent = "center";
                        }
                    }
                });
            }, 100);
        }
    });
});