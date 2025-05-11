sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller,MessageToast) => {
    "use strict";

    return Controller.extend("zfile.controller.Main", {
        onInit() {
            var jQueryScript = document.createElement('script');
			jQueryScript.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.10.0/jszip.js');
			document.head.appendChild(jQueryScript);
		
			var jQueryScript = document.createElement('script');
			jQueryScript.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.10.0/xlsx.js');
			document.head.appendChild(jQueryScript);

            /*
            var oView = this.getView();
            var oModel = this.getOwnerComponent().getModel();
            oModel.read("/FileSet", {
                success: (oData,oResponse) => {
                    console.log(oData);
                    console.log(oResponse);
                }
            });
            */
        },

        loadFile: function(oFile,callback){
            var reader = new FileReader();
            reader.onerror = function(){ alert('Unable to read ' + oFile.name); };
            reader.onload = function(event){
                var content = event.target.result;
                oFile.content = content;
                callback(oFile);
            };
            reader.readAsBinaryString(oFile);
        },

        onPressUpload: function(oEvent) {
            var oModel = this.getOwnerComponent().getModel();
            
            // fazendo uma cópia do array de arquivos
            window.fileQueue = window.files.slice();

            MessageToast.show("Enviando "+window.fileQueue.length+" arquivos para o servidor");
            console.clear();

            oModel.refreshSecurityToken();
            window.csrfToken = oModel.oHeaders['x-csrf-token'];

            this.sendFileToServerQueue();
        },

        sendFileToServerQueue: function(){
            var that   = this;
            var oView  = this.getView();
            var oModel = this.getOwnerComponent().getModel();
            var oFile  = window.fileQueue.shift();

            if(oFile == null || oFile == undefined){
                return;
            }

            this.loadFile(oFile,function(oFile2){
                var csrfToken = window.csrfToken;

                oView.setBusy(true);

                // enviando via ajax puro pois o model não esta funcionando com arquivos binários, somente
                // com texto. Não encontrei nada sobre isso na documentação, me parece um bug. Existem
                // outras formas de fazer upload, porém essa temos mais controle sobre todo o processo
                var xhr = new XMLHttpRequest();
                xhr.open("POST", "/sap/opu/odata/sap/ZFILE_SRV/FileSet", true);
                xhr.setRequestHeader("Content-Type", oFile2.type);
                xhr.setRequestHeader("Slug", encodeURIComponent(oFile2.name));
                xhr.setRequestHeader("x-csrf-token", csrfToken);
                xhr.onload = function () {
                    if (xhr.status === 201) {
                        oView.setBusy(false);

                        that.sendFileToServerQueue();
                    } else {
                        MessageToast.show("Erro no upload");
                    }
                };
                xhr.send(oFile);
            });
        },

        onChangeUpload: function(e){
            var that   = this;
            var aFiles = e.getParameter("files");

            console.clear();

            // guardando em memória para usar no upload
            window.files = Array.from(aFiles);

            var oFile1 = aFiles[0];
            var oFile2 = aFiles[1];
            var oFile3 = aFiles[2];
            var oFile4 = aFiles[3];
            
            // texto
            var reader1 = new FileReader();
            reader1.onerror = function(){ alert('Unable to read ' + file.fileName); };
            reader1.onload = function(event){
                var content = event.target.result;
                
                that.getView().byId('texto1').setValue(content);
            };
            reader1.readAsText(oFile1);

            // excel
            var reader2 = new FileReader();
            reader2.onerror = function(){ alert('Unable to read ' + file.fileName); };
            reader2.onload = function(event){
                var content = event.target.result;

                var workbook = XLSX.read(content, {
                    type: 'binary'
                });
                workbook.SheetNames.forEach(function (sheetName) {
                    var excelData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                    that.getView().byId('texto2').setValue(JSON.stringify(excelData));
                });
            };
            reader2.readAsBinaryString(oFile2);

            // imagem
            var reader3 = new FileReader();
            reader3.onerror = function(){ alert('Unable to read ' + file.fileName); };
            reader3.onload = function(event){
                var content = event.target.result;

                that.getView().byId('imagem1').setSrc(content);
            };
            reader3.readAsDataURL(oFile3);

            // pdf
            var reader4 = new FileReader();
            reader4.onerror = function(){ alert('Unable to read ' + file.fileName); };
            reader4.onload = function(event){
                var decodedPdfContent = event.target.result;

                var byteArray = new Uint8Array(decodedPdfContent.length)
                for(var i=0; i<decodedPdfContent.length; i++){
                    byteArray[i] = decodedPdfContent.charCodeAt(i);
                }

                var blob = new Blob([byteArray.buffer], { type: 'application/pdf' });
                var _pdfurl = URL.createObjectURL(blob);

                jQuery.sap.addUrlWhitelist("blob");
                that.getView().byId('pdf1').setSource(_pdfurl);
            };
            reader4.readAsBinaryString(oFile4);
        }
    });
});