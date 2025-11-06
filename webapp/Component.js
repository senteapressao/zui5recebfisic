/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "zui5recebfisic/model/models",
        "sap/m/MessageBox",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/odata/v2/ODataModel"
    ],
    function (UIComponent, Device, models, MessageBox, JSONModel, ODataModel) {
        "use strict";

        return UIComponent.extend("zui5recebfisic.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
                
                // set enhanced mobile device model
                this.setModel(this._createMobileDeviceModel(), "mobileDevice");

                // Initialize OData model for main service
                this._initializeODataModel();

                // Initialize user context model
                this._initializeUserContext();

                // enable routing
                this.getRouter().initialize();
            },

            /**
             * Create enhanced mobile device model
             * @private
             * @returns {sap.ui.model.json.JSONModel} mobile device model
             */
            _createMobileDeviceModel: function () {
                var oMobileDeviceModel = new JSONModel({
                    // Basic device info
                    isMobile: Device.system.phone,
                    isTablet: Device.system.tablet,
                    isDesktop: Device.system.desktop,
                    isTouch: Device.support.touch,
                    
                    // Screen info
                    screenSize: {
                        width: window.innerWidth,
                        height: window.innerHeight,
                        isSmall: window.innerWidth < 480,
                        isMedium: window.innerWidth >= 480 && window.innerWidth < 768,
                        isLarge: window.innerWidth >= 768
                    },
                    
                    // Orientation
                    orientation: {
                        isLandscape: window.innerWidth > window.innerHeight,
                        isPortrait: window.innerWidth <= window.innerHeight
                    },
                    
                    // Capabilities
                    capabilities: {
                        camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
                        vibration: !!navigator.vibrate,
                        geolocation: !!navigator.geolocation,
                        offline: !!window.applicationCache || !!navigator.serviceWorker,
                        fullscreen: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled)
                    },
                    
                    // Browser info
                    browser: {
                        name: Device.browser.name,
                        version: Device.browser.version,
                        mobile: Device.browser.mobile,
                        webkit: Device.browser.webkit,
                        chrome: Device.browser.chrome,
                        safari: Device.browser.safari,
                        firefox: Device.browser.firefox
                    },
                    
                    // OS info
                    os: {
                        name: Device.os.name,
                        version: Device.os.version,
                        ios: Device.os.ios,
                        android: Device.os.android,
                        windows: Device.os.windows
                    },
                    
                    // UI preferences
                    ui: {
                        contentDensity: Device.system.phone ? "cozy" : "compact",
                        theme: "sap_horizon",
                        rtl: sap.ui.getCore().getConfiguration().getRTL(),
                        animationsEnabled: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
                        highContrast: window.matchMedia("(prefers-contrast: high)").matches,
                        darkMode: window.matchMedia("(prefers-color-scheme: dark)").matches
                    }
                });
                
                // Add event listeners for dynamic updates
                this._addMobileDeviceListeners(oMobileDeviceModel);
                
                return oMobileDeviceModel;
            },

            /**
             * Add event listeners for mobile device model updates
             * @private
             * @param {sap.ui.model.json.JSONModel} oModel mobile device model
             */
            _addMobileDeviceListeners: function (oModel) {
                // Update screen size on resize
                window.addEventListener("resize", function () {
                    oModel.setProperty("/screenSize/width", window.innerWidth);
                    oModel.setProperty("/screenSize/height", window.innerHeight);
                    oModel.setProperty("/screenSize/isSmall", window.innerWidth < 480);
                    oModel.setProperty("/screenSize/isMedium", window.innerWidth >= 480 && window.innerWidth < 768);
                    oModel.setProperty("/screenSize/isLarge", window.innerWidth >= 768);
                    
                    // Update orientation
                    oModel.setProperty("/orientation/isLandscape", window.innerWidth > window.innerHeight);
                    oModel.setProperty("/orientation/isPortrait", window.innerWidth <= window.innerHeight);
                });
                
                // Update orientation on orientation change
                window.addEventListener("orientationchange", function () {
                    setTimeout(function () {
                        oModel.setProperty("/orientation/isLandscape", window.innerWidth > window.innerHeight);
                        oModel.setProperty("/orientation/isPortrait", window.innerWidth <= window.innerHeight);
                    }, 100);
                });
                
                // Listen for media query changes
                if (window.matchMedia) {
                    // Dark mode changes
                    var darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
                    if (darkModeQuery.addEventListener) {
                        darkModeQuery.addEventListener("change", function (e) {
                            oModel.setProperty("/ui/darkMode", e.matches);
                        });
                    }
                    
                    // High contrast changes
                    var highContrastQuery = window.matchMedia("(prefers-contrast: high)");
                    if (highContrastQuery.addEventListener) {
                        highContrastQuery.addEventListener("change", function (e) {
                            oModel.setProperty("/ui/highContrast", e.matches);
                        });
                    }
                    
                    // Reduced motion changes
                    var reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
                    if (reducedMotionQuery.addEventListener) {
                        reducedMotionQuery.addEventListener("change", function (e) {
                            oModel.setProperty("/ui/animationsEnabled", !e.matches);
                        });
                    }
                }
            },

            /**
             * Initialize user context and validate authorization
             * @private
             */
            _initializeUserContext: function () {
                var that = this;
                
                // Create user context model
                var oUserModel = new JSONModel({
                    usuario: "",
                    centro: "",
                    isAuthorized: false,
                    isValidating: false
                });
                this.setModel(oUserModel, "user");

                // Get current user from SAP system
                this._getCurrentUser().then(function (sUsuario) {
                    if (sUsuario) {
                        oUserModel.setProperty("/usuario", sUsuario);
                        oUserModel.setProperty("/isValidating", true);
                        
                        // Validate user authorization
                        return that._validateUserAuthorization(sUsuario);
                    } else {
                        throw new Error("Usuário não identificado");
                    }
                }).then(function (oValidationResult) {
                    oUserModel.setProperty("/centro", oValidationResult.centro);
                    oUserModel.setProperty("/isAuthorized", true);
                    oUserModel.setProperty("/isValidating", false);
                    
                    // Store user context globally for easy access
                    that._userContext = {
                        usuario: oUserModel.getProperty("/usuario"),
                        centro: oValidationResult.centro,
                        isAuthorized: true
                    };
                    
                }).catch(function (oError) {
                    oUserModel.setProperty("/isAuthorized", false);
                    oUserModel.setProperty("/isValidating", false);
                    
                    var sMessage = oError.message || "Erro na validação do usuário";
                    
                    MessageBox.error(sMessage, {
                        title: "Erro de Autorização",
                        onClose: function () {
                            // Optionally redirect to login or show limited functionality
                            that._handleAuthorizationFailure();
                        }
                    });
                });
            },

            /**
             * Get current user from SAP system
             * @private
             * @returns {Promise} promise that resolves with user ID
             */
            _getCurrentUser: function () {
                return new Promise(function (resolve, reject) {
                    // Try to get user from various sources
                    var sUser = "";
                    
                    // Method 1: Try to get from SAP system info
                    if (sap && sap.ushell && sap.ushell.Container) {
                        try {
                            var oUser = sap.ushell.Container.getService("UserInfo").getUser();
                            if (oUser && oUser.getId) {
                                sUser = oUser.getId();
                            }
                        } catch (e) {
                            // Fallback to other methods
                        }
                    }
                    
                    // Method 2: Try to get from URL parameters (for testing)
                    if (!sUser) {
                        var oUrlParams = new URLSearchParams(window.location.search);
                        sUser = oUrlParams.get('user') || oUrlParams.get('usuario');
                    }
                    
                    // Method 3: Try to get from session storage (for development)
                    if (!sUser && window.sessionStorage) {
                        sUser = sessionStorage.getItem('currentUser');
                    }
                    
                    // Method 4: Default user for development (remove in production)
                    if (!sUser) {
                        sUser = "TESTUSER"; // This should be removed in production
                    }
                    
                    if (sUser === "DEFAULT_USER") {
                        sUser = "TRALCANTARA"; // This should be removed in production
                    }

                    if (sUser) {
                        resolve(sUser);
                    } else {
                        reject(new Error("Não foi possível identificar o usuário"));
                    }
                });
            },

            /**
             * Validate user authorization using backend service
             * @private
             * @param {string} sUsuario user ID to validate
             * @returns {Promise} promise that resolves with validation result
             */
            _validateUserAuthorization: function (sUsuario) {
                var that = this;
                
                return new Promise(function (resolve, reject) {
                    var oModel = that.getModel();
                    
                    oModel.callFunction("/ValidarUsuarioCentro", {
                        urlParameters: {
                            Usuario: sUsuario
                        },
                        method: "POST",
                        success: function (oData) {
                            if (oData && oData.Werks) {
                                resolve({
                                    centro: oData.Werks,
                                    isValid: true,
                                    message: "Usuário autorizado para o centro " + oData.Werks
                                });
                            } else {
                                reject({
                                    message: "Usuário não autorizado - centro não encontrado",
                                    statusCode: 403
                                });
                            }
                        },
                        error: function (oError) {
                            var sMessage = "Erro na validação do usuário";
                            
                            if (oError.statusCode === 401 || oError.statusCode === 403) {
                                sMessage = "Usuário não autorizado para acessar este sistema";
                            } else if (oError.responseText) {
                                try {
                                    var oErrorData = JSON.parse(oError.responseText);
                                    if (oErrorData.error && oErrorData.error.message && oErrorData.error.message.value) {
                                        sMessage = oErrorData.error.message.value;
                                    }
                                } catch (e) {
                                    // Use default message
                                }
                            }
                            
                            reject({
                                message: sMessage,
                                originalError: oError
                            });
                        }
                    });
                });
            },

            /**
             * Handle authorization failure
             * @private
             */
            _handleAuthorizationFailure: function () {
                // In a real application, you might:
                // 1. Redirect to login page
                // 2. Show limited functionality
                // 3. Display contact information for access requests
                
                // For now, we'll just log the error and continue with limited functionality
                //console.error("User authorization failed - continuing with limited functionality");
                
                // You could also disable certain features or show a different UI
                this._userContext = {
                    usuario: "UNAUTHORIZED",
                    centro: "",
                    isAuthorized: false
                };
            },

            /**
             * Get user context information
             * @public
             * @returns {object} user context object
             */
            getUserContext: function () {
                return this._userContext || {
                    usuario: "",
                    centro: "",
                    isAuthorized: false
                };
            },

            /**
             * Check if current user is authorized
             * @public
             * @returns {boolean} true if user is authorized
             */
            isUserAuthorized: function () {
                return this._userContext && this._userContext.isAuthorized === true;
            },

            /**
             * Get current user's centro
             * @public
             * @returns {string} centro code
             */
            getUserCentro: function () {
                return this._userContext ? this._userContext.centro : "";
            },

            /**
             * Get current user ID
             * @public
             * @returns {string} user ID
             */
            getCurrentUser: function () {
                return this._userContext ? this._userContext.usuario : "";
            },

            /**
             * Initialize OData model for main service
             * @private
             */
            _initializeODataModel: function () {
                try {
                    // Get the OData model already initialized by manifest
                    var oODataModel = this.getModel();
                    
                    // If model doesn't exist (shouldn't happen), create it
                    if (!oODataModel) {
                        oODataModel = new ODataModel({
                            serviceUrl: "/sap/opu/odata/sap/ZGWEWM_RECEB_FISICO_SRV/",
                            defaultBindingMode: "TwoWay",
                            defaultCountMode: "Inline",
                            refreshAfterChange: false,
                            metadataUrlParams: {
                                "sap-value-list": "none"
                            },
                            defaultOperationMode: "Server",
                            earlyRequests: true
                        });
                        this.setModel(oODataModel);
                    }

                    // Also set it as a named model for explicit access
                    this.setModel(oODataModel, "mainService");

                    //console.log("OData model initialized successfully");
                } catch (oError) {
                    //console.error("Error initializing OData model:", oError);
                    // Continue with limited functionality
                }
            }
        });
    }
);