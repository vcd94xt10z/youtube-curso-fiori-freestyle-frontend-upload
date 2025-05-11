sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("zfile.controller.Main", {
        onInit() {
            var oView = this.getView();
            var oModel = this.getOwnerComponent().getModel();
            oModel.read("/FileSet", {
                success: (oData,oResponse) => {
                    console.log(oData);
                    console.log(oResponse);
                }
            });
        }
    });
});