sap.ui.define([
	"com/9b/harvestCarts/controller/BaseController",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"com/9b/harvestCarts/model/models"
], function (BaseController, Fragment, Filter, FilterOperator, model) {
	"use strict";

	return BaseController.extend("com.9b.harvestCarts.controller.HarvestView", {
		formatter: model,

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 */
		onInit: function () {

			var clonePlannerTable = this.getView().byId("HarvestLinesTable");
			var tableHeader = this.byId("tableHeader");
			clonePlannerTable.addEventDelegate({
				onAfterRendering: function () {
					var oBinding = this.getBinding("rows");
					oBinding.attachChange(function (oEvent) {
						var oSource = oEvent.getSource();
						var count = oSource.iLength; //Will fetch you the filtered rows length
						var totalCount = oSource.oList.length;
						tableHeader.setText("Batches (" + count + "/" + totalCount + ")");
					});
				}
			}, clonePlannerTable);

			this.getOwnerComponent().getRouter(this).attachRoutePatternMatched(this._objectMatched, this);
		},
		_objectMatched: function () {

			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			this.byId("SelectDate").setDateValue(new Date());
			this.loadMasterData();

		},

		loadMasterData: function () {
			var that = this;
			this.byId("dynamicPageId").setBusy(true);
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var selectDate = this.byId("SelectDate").getDateValue();
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: 'yyyy-MM-dd',
				UTC: false
			});
			var newdateT = dateFormat.format(selectDate);

			setTimeout(function () {

				var orderlines = "&$orderby=UpdateTime desc";
				var filters = "?$filter=UpdateDate eq " + newdateT;
				that.readServiecLayer("/b1s/v2/NPFETLINES" + filters + orderlines, function (data) {
					jsonModel.setProperty("/harvestLinesData", data.value);
					that.byId("dynamicPageId").setBusy(false);
				});

			}, 500);

		},

		handleExportToExcelMD: function () {
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var tableData = jsonModel.getProperty("/harvestLinesData");
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYY-MM-dd-HH:mm:ss"
			});
			var dateStr = dateFormat.format(new Date());
			var MDexportData = [];
			
			if(tableData.length > 0 ){

			$.each(tableData, function (i, obj) {

				var MDexpData = {
					"Harvest_Name": obj.U_NHBID,
					"Item_Name": obj.U_NITEM,
					"Location": obj.U_NLOCD,              
					"Cart_Name": obj.U_NCTTP,
					"Cart_Wgt(lb)": obj.U_NCTWT,
					"Hanger_Wgt(lb)": obj.U_NHNWT,
					"Gross_Wgt(lb)": obj.U_NGRHWT,
					"Net_Wgt(lb)": obj.U_NWFWT,
					"License": obj.U_NLFID,

				};
				MDexportData.push(MDexpData);
			});

			var MDShowLabel = "Harvest Lines Data";
			var MDReportTitle = MDShowLabel + dateStr;
			this.exportToExcel(MDexportData, MDReportTitle, MDShowLabel);
			
			} else {
				sap.m.MessageToast.show("No batches found to export");
				
			}

		},

		clearAllFilters: function () {
			var filterTable = this.getView().byId("HarvestLinesTable");
			var aColumns = filterTable.getColumns();
			for (var i = 0; i <= aColumns.length; i++) {
				filterTable.filter(aColumns[i], null);
				filterTable.sort(aColumns[i], null);
			}
			this.byId("searchFieldTable").removeAllTokens();

		},

		refreshData: function () {
			this.clearAllFilters();
		},

	});
});