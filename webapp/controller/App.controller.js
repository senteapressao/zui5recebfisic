sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("zui5recebfisic.controller.App", {
        onInit: function () {
            // Initialize the router
            this.getOwnerComponent().getRouter().initialize();
        }
    });
});
  