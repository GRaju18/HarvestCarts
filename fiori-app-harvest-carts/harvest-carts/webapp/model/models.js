sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/ui/core/format/DateFormat"
], function (JSONModel, Device, DateFormat) {
	"use strict";

	return {

		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		wightDifference: function (w1, w2) {
			return Number(w1) - Number(w2);
		},
		showIntegrationText: function (active) {
			if (active === true) {
				return "Show Details";
			} else {
				return "Add Integration";
			}
		},

		flexLayoutDevice: function (system) {
			if (system.phone) {
				return "Column";
			} else if (system.desktop) {
				return "Row";
			} else if (system.tablet) {
				return "Column";
			}
		},
		dateFormatDisplay: function (sDate) {
			if (sDate !== null) {
				var oFormat = DateFormat.getInstance({
					format: "MMM dd, YYYY"
				});
				return oFormat.format(new Date(sDate));
			}

		},

		flexLayoutDevice1: function (system) {
			if (system.phone) {
				return "Column";
			} else if (system.desktop) {
				return "Row";
			} else if (system.tablet) {
				return "Row";
			}
		},

		innerFlexLayoutDevice: function (system) {
			if (system.phone) {
				return "Column";
			} else if (system.desktop) {
				return "Row";
			} else if (system.tablet) {
				return "Row";
			}
		},

		adjustColumnWidth: function (phone, width) {
			if (phone) {
				return width + "rem";
			} else {
				return 2 * width + "rem";
			}
		},

		formatQtyUnit: function (amount, unit) {
			return "Watered " + amount + " " + unit;
		},

		// dateDisplay: function (sDate) {
		// 	var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
		// 		pattern: "MM-dd-yyyy",
		// 		UTC:true
		// 	});
		// 	var dateFormatted = dateFormat.format(new Date(sDate));
		// 	return dateFormatted;
		// }
		dateDisplay: function (sDate) {
			if (sDate) {
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "MM-dd-yyyy",
					UTC: true
				});
				var dateFormatted = dateFormat.format(new Date(sDate));
				return dateFormatted;
			}
		},
		measureTareWgt: function (gWt, nWt) {
			if (gWt) {
				var tareWt = Number(gWt) - Number(nWt);
				return tareWt.toFixed(2);
			}
		},
		calNetWt: function (gWt, nWt, tWt, pWt, stlWt) {
			if (gWt == null || gWt == undefined) {
				gWt = 0;
			}
			if (nWt == null || nWt == undefined) {
				nWt = 0;
			}
			if (tWt == null || tWt == undefined) {
				tWt = 0;
			}
			if (pWt == null || pWt == undefined) {
				pWt = 0;
			}
			if (stlWt == null || stlWt == undefined) {
				stlWt = 0;
			}
			if (gWt) {
				var netWt =
					(Math.round(gWt * 100) / 100) -
					(Math.round(nWt * 100) / 100) -
					(Math.round(tWt * 100) / 100) -
					(Math.round(pWt * 100) / 100) -
					(Math.round(stlWt * 100) / 100);

				return netWt.toFixed(2);

			}
		},
		showKeyValue: function (Name, Key) {
			if (Name && Key) {
				return Name + " - " + Key;
			} else {
				return "";
			}
		}
	};
});