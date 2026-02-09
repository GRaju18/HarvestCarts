/*global history */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/routing/History",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller, UIComponent, History, MessageBox, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("com.9b.harvestCarts.controller.BaseController", {
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},
		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},
		// animatePlantCount: function () {
		// 	$(".plantCountText").each(function () {
		// 		$(this).prop("Counter", 0).animate({
		// 			Counter: $(this).text()
		// 		}, {
		// 			duration: 4000,
		// 			easing: "swing",
		// 			step: function (now) {
		// 				$(this).text(Math.ceil(now));
		// 			}
		// 		});
		// 	});
		// },
		/*Methods for multiInput for sarch field for scan functionality start*/
		onSubmitMultiInput: function (oEvent) {
			oEvent.getSource()._bUseDialog = false;
			var value = oEvent.getSource().getValue();
			if (!value) {
				this.fillFilterLoad(oEvent.getSource());
				return;
			}
			value = value.replace(/\^/g, "");
			oEvent.getSource().addToken(new sap.m.Token({
				key: value,
				text: value
			}));
			//	var orFilter = [];
			//	var andFilter = [];
			oEvent.getSource().setValue("");
			this.fillFilterLoad(oEvent.getSource());
		},
		onChangeMultiInput: function (oEvent) {
			oEvent.getSource()._bUseDialog = false;
			var value = oEvent.getSource().getValue();
			if (value.indexOf("^") !== -1) {
				value = value.replace(/\^/g, "");
				oEvent.getSource().addToken(new sap.m.Token({
					key: value,
					text: value
				}));
				//	var orFilter = [];
				//	var andFilter = [];
				oEvent.getSource().setValue("");
				this.fillFilterLoad(oEvent.getSource());
			}
		},
		tokenUpdateMultiInput: function (oEvent) {
			this.fillFilterLoad(oEvent.getSource(), oEvent.getParameter("removedTokens")[0].getText());
		},

		getUsersService: function () {
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			return new Promise(function (resolve, reject) {
				that.readServiecLayer("/b1s/v2/UsersService_GetCurrentUser", function (data) {
					resolve();
					var userAccessLicense = JSON.parse(data.U_License);
					if (userAccessLicense != null) {
						jsonModel.setProperty("/userAccessLicense", userAccessLicense);
					}
					jsonModel.setProperty("/apiKey", data.U_APIKey);
					if (data.UserActionRecord.length) {
						var sTime = data.UserActionRecord[0].ActionTime;
						var sDate = data.UserActionRecord[0].ActionDate;
						sDate = sDate.replace("Z", "");
						var dateObj = new Date(sDate);
						dateObj.setHours(sTime.split(":")[0], sTime.split(":")[1], sTime.split(":")[2]);
						jsonModel.setProperty("/systemDate", dateObj);
						jsonModel.setProperty("/systemTime", sTime);
					} else {
						jsonModel.setProperty("/systemDate", new Date());
					}

				});
			});
		},
		getSystemDate: function (sDate) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "yyyy-MM-dd",
				UTC: false
			});
			var systemDate;
			if (sDate) {
				var systemTime = jsonModel.getProperty("/systemTime");
				if (systemTime) {
					var sDate = new Date(sDate);
					sDate.setHours(systemTime.split(":")[0], systemTime.split(":")[1], systemTime.split(":")[2]);
				}
				systemDate = sDate;
			} else {
				systemDate = jsonModel.getProperty("/systemDate");
			}
			systemDate = dateFormat.format(new Date(systemDate));
			return systemDate;
		},

		fillFilterLoad: function (elementC, removedText) {
			var orFilter = [];
			var andFilter = [];
			$.each(elementC.getTokens(), function (i, info) {
				var value = info.getText();
				if (value !== removedText) {
					orFilter.push(new sap.ui.model.Filter("U_NCTTP", "Contains", value.toLowerCase()));
					orFilter.push(new sap.ui.model.Filter("U_NCTWT", "EQ", value.toLowerCase()));
					orFilter.push(new sap.ui.model.Filter("U_NHNWT", "EQ", value.toLowerCase()));
					orFilter.push(new sap.ui.model.Filter("U_NGRHWT", "EQ", value.toLowerCase()));
					orFilter.push(new sap.ui.model.Filter("U_NWFWT", "EQ", value.toLowerCase()));
					orFilter.push(new sap.ui.model.Filter("U_NHBID", "Contains", value.toLowerCase()));
					orFilter.push(new sap.ui.model.Filter("U_NITEM", "Contains", value.toLowerCase()));
					orFilter.push(new sap.ui.model.Filter("U_NLOCD", "Contains", value.toLowerCase()));
					// orFilter.push(new sap.ui.model.Filter("U_NLCNM", "Contains", value.toLowerCase()));
					// orFilter.push(new sap.ui.model.Filter("U_NLCNM", "Contains", value.toLowerCase()));

					andFilter.push(new sap.ui.model.Filter({
						filters: orFilter,
						and: false,
						caseSensitive: false
					}));
				}
			});
			this.byId("HarvestLinesTable").getBinding("rows").filter(andFilter);
			// this.loadData(orFilter);
		},
		cellClick: function (evt) {
			//	evt.getParameter("cellControl").getParent()._setSelected(true);
			var cellControl = evt.getParameter("cellControl");
			var isBinded = cellControl.getBindingContext("jsonModel");
			if (isBinded) {
				var oTable = evt.getParameter("cellControl").getParent().getParent();
				var sIndex = cellControl.getParent().getIndex();
				var sIndices = oTable.getSelectedIndices();
				if (sIndices.includes(sIndex)) {
					sIndices.splice(sIndices.indexOf(sIndex), 1);
				} else {
					sIndices.push(sIndex);
				}
				if (sIndices.length > 0) {
					jQuery.unique(sIndices);
					$.each(sIndices, function (i, e) {
						oTable.addSelectionInterval(e, e);
					});
				} else {
					oTable.clearSelection();
				}
			}

			//	oTable.setSelectionInterval(sIndex, sIndex);
		},
		validateNumber: function (evt) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var validationObj = jsonModel.getProperty("/validationObj");
			var sPath = evt.getSource().getBinding("value").getPath();
			var newValue = evt.getParameter("newValue");
			if (isNaN(newValue)) {
				evt.getSource().setValueStateText("enter numeric value only");
				evt.getSource().setValueState("Error");
				evt.getSource().focus();
				validationObj.errorText = "enter numeric value only";
				validationObj[sPath] = false;
			} else {
				evt.getSource().setValueState("None");
				validationObj.errorText = "";
				validationObj[sPath] = true;
			}
			jsonModel.setProperty("/validationObj", validationObj);
		},

		prepareVizKPIData: function (data, field) {
			var arr = [];
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYYMMdd",
				UTC: true
			});
			var tDay = new Date();
			//	var todayDate = dateFormat.format(tDay);

			var oneDayPast = new Date();
			oneDayPast.setDate(oneDayPast.getDate() - 1);
			//	var yesterDayDate = dateFormat.format(oneDayPast);

			var day10 = new Date();
			day10.setDate(day10.getDate() - 10);

			var day20 = new Date();
			day20.setDate(day20.getDate() - 20);

			arr = [{
				DATETXT: "Today",
				DAYS: 0,
				FIELDNAME: "DAYS",
				LABEL: "0"
			}, {
				DATETXT: "1 - 10",
				DAYS: 0,
				FIELDNAME: "DAYS",
				LABEL: "1"
			}, {
				DATETXT: "11 - 20",
				DAYS: 0,
				FIELDNAME: "DAYS",
				LABEL: "2"
			}, {
				DATETXT: ">20",
				DAYS: 0,
				FIELDNAME: "DAYS",
				LABEL: "3"
			}];
			$.each(data, function (i, info) {
				var index = 1;
				if (info[field]) {
					if (dateFormat.format(info[field]) === dateFormat.format(tDay)) {
						info.DAYS = "0";
						index = 0;
					} else
					if (dateFormat.format(info[field]) < dateFormat.format(tDay) && dateFormat.format(info[field]) >= dateFormat.format(day10)) {
						info.DAYS = "1";
						index = 1;
					} else
					if (dateFormat.format(info[field]) < dateFormat.format(day10) && dateFormat.format(info[field]) >= dateFormat.format(day20)) {
						info.DAYS = "2";
						index = 2;
					} else if (dateFormat.format(info[field]) < dateFormat.format(day20)) {
						info.DAYS = "3";
						index = 3;
					}
					arr[index].DAYS = arr[index].DAYS + 1;
				}
			});
			arr[0].DAYS = arr[0].DAYS.toString();
			arr[1].DAYS = arr[1].DAYS.toString();
			arr[2].DAYS = arr[2].DAYS.toString();
			arr[3].DAYS = arr[3].DAYS.toString();
			this.getOwnerComponent().getModel("jsonModel").setProperty("/vegTableData", data);
			return arr;
		},
		getAppConfigData: function () {
			var that = this;
			return new Promise(function (resolve, reject) {
				var jsonModel = that.getOwnerComponent().getModel("jsonModel");
				var filters = "?$filter=U_NAPP eq 'Harvest' or U_NAPP eq 'AllApps'";
				that.readServiecLayer("/b1s/v2/U_NCNFG" + filters, function (data) {
					resolve(data);
					if (data.value.length > 0) {
						var configObj = {};
						$.each(data.value, function (i, e) {
							if (e.U_NFLDS === "Finish") {
								configObj.V_EBL = e.U_NVSBL === "Y" ? true : false;
							} else if (e.U_NFLDS === "WasteUOM") {
								var wasteUOM = e.U_NVALUE;
								if (wasteUOM !== "") {
									try {
										var wasteUOMJson = JSON.parse(wasteUOM);
										jsonModel.setProperty("/uomVals", wasteUOMJson);

									} catch (error) {
										sap.m.MessageToast.show(error);
									}
								}

							} else if (e.U_NFLDS === "METRC Status") {
								var MetrcOnOff = e.U_NVSBL === "Y" ? true : false;
								jsonModel.setProperty("/MetrcOnOff", MetrcOnOff);

							} else if (e.U_NFLDS === "Item Group Code") {
								var itemGrpCodes = e.U_NVALUE;
								jsonModel.setProperty("/itemGrpCodes", itemGrpCodes);

							}
						});
						jsonModel.setProperty("/configData", configObj);
					} else {
						jsonModel.setProperty("/configData", {});
					}
				});
			});
		},

		loginCall: function () {
			var that = this;
			return new Promise(function (resolve, reject) {
				// run login only in webide
				if (location.host.indexOf("webide") !== -1) {
					var jsonModel = that.getOwnerComponent().getModel("jsonModel");
					var loginPayLoad = jsonModel.getProperty("/userAuthPayload");
					loginPayLoad = JSON.stringify(loginPayLoad);
					$.ajax({
						url: jsonModel.getProperty("/serLayerbaseUrl") + "/b1s/v2/Login",
						data: loginPayLoad,
						type: "POST",
						xhrFields: {
							withCredentials: true
						},
						dataType: "json",
						success: function (data) {
							jsonModel.setProperty("/sessionID", data.SessionId);
							resolve(data);
						},
						error: function (err) {
							reject(err);
						}
					});
				} else {
					// not in webide → skip login
					resolve();
				}
			});
		},
		readServiecLayer: function (entity, callBack, busyDialog) {
			var that = this;
			var jsonModel = that.getOwnerComponent().getModel("jsonModel");
			if (location.host.indexOf("webide") !== -1) {
				var sessionID = jsonModel.getProperty("/sessionID");
				if (sessionID === undefined) {
					var loginPayLoad = jsonModel.getProperty("/userAuthPayload");
					loginPayLoad = JSON.stringify(loginPayLoad);
					if (busyDialog) {
						busyDialog.setBusy(true);
					}
					$.ajax({
						url: jsonModel.getProperty("/serLayerbaseUrl") + "/b1s/v2/Login",
						data: loginPayLoad,
						type: "POST",
						xhrFields: {
							withCredentials: true
						},
						dataType: "json", // expecting json response
						success: function (data) {
							jsonModel.setProperty("/sessionID", data.SessionId);
							//	var sessionID = that.getOwnerComponent().getModel("jsonModel").getProperty("/sessionID");
							$.ajax({
								type: "GET",
								xhrFields: {
									withCredentials: true
								},
								url: jsonModel.getProperty("/serLayerbaseUrl") + entity,
								setCookies: "B1SESSION=" + data.SessionId,
								dataType: "json",
								success: function (res) {
									if (busyDialog) {
										busyDialog.setBusy(false);
									}
									callBack.call(that, res);
								},
								error: function (error) {
									if (busyDialog) {
										busyDialog.setBusy(false);
									}
									MessageBox.error(error.responseJSON.error.message);
								}
							});
						},
						error: function () {
							sap.m.MessageToast.show("Error with authentication");
						}
					});
				} else {
					if (busyDialog) {
						busyDialog.setBusy(true);
					}
					$.ajax({
						type: "GET",
						xhrFields: {
							withCredentials: true
						},
						url: jsonModel.getProperty("/serLayerbaseUrl") + entity,
						setCookies: "B1SESSION=" + sessionID,
						dataType: "json",
						success: function (res) {
							if (busyDialog) {
								busyDialog.setBusy(false);
							}
							callBack.call(that, res);
						},
						error: function (error) {
							if (busyDialog) {
								busyDialog.setBusy(false);
							}
							MessageBox.error(error.responseJSON.error.message);
						}
					});
				}
			} else {
				if (busyDialog) {
					busyDialog.setBusy(true);
				}
				$.ajax({
					type: "GET",
					xhrFields: {
						withCredentials: true
					},
					url: entity,
					//	setCookies: "B1SESSION=" + sessionID,
					dataType: "json",
					success: function (res) {
						if (busyDialog) {
							busyDialog.setBusy(false);
						}
						callBack.call(that, res);
					},
					error: function (error) {
						if (busyDialog) {
							busyDialog.setBusy(false);
						}
						MessageBox.error(error.responseJSON.error.message);
					}
				});
			}
		},
		readServiecLayer2: function (entity, callBack, busyDialog) {
			var that = this;
			var jsonModel = that.getOwnerComponent().getModel("jsonModel");
			var sUrl;
			if (location.host.indexOf("webide") !== -1) {
				sUrl = jsonModel.getProperty("/serLayerbaseUrl") + entity;
			} else {
				sUrl = entity;
			}
			return new Promise(
				function (resolve, reject) {
					$.ajax({
						type: "GET",
						xhrFields: {
							withCredentials: true
						},
						url: sUrl,
						//	setCookies: "B1SESSION=" + sessionID,
						dataType: "json",
						success: function (res) {
							if (busyDialog) {
								busyDialog.setBusy(false);
							}
							callBack.call(that, res);
							resolve(res);
						},
						error: function (error) {
							if (busyDialog) {
								busyDialog.setBusy(false);
							}
							reject(error);
							MessageBox.error(error.responseJSON.error.message);
						}
					});
				});
		},

		updateServiecLayer: function (entity, callBack, payLoad, method, busyDialog) {
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			payLoad = JSON.stringify(payLoad);
			if (busyDialog) {
				busyDialog.setBusy(true);
			}
			var sUrl;
			if (location.host.indexOf("webide") !== -1) {
				sUrl = jsonModel.getProperty("/serLayerbaseUrl") + entity;
			} else {
				sUrl = entity;
			}
			$.ajax({
				type: method,
				xhrFields: {
					withCredentials: true
				},
				url: sUrl,
				//	setCookies: "B1SESSION=" + sessionID,
				dataType: "json",
				data: payLoad,
				success: function (res) {
					if (busyDialog) {
						busyDialog.setBusy(false);
					}
					callBack.call(that, res);
					var docEntry;
					if (res == undefined) {
						docEntry = "";
					} else {
						docEntry = res.DocEntry;
					}
					var logData = {
						Api: entity,
						methodType: method,
						Desttype: "SL",
						errorText: docEntry,
						data: payLoad,
						statusTxt: 200
					};
					that.CaptureLog(logData);

				},
				error: function (error) {
					if (busyDialog) {
						busyDialog.setBusy(false);
					}
					MessageBox.error(error.responseJSON.error.message);

					var logData = {
						Api: entity,
						methodType: method,
						Desttype: "SL",
						errorText: error.responseJSON.error.message,
						data: payLoad,
						statusTxt: 400
					};
					that.CaptureLog(logData);
				}
			});
		},

		updateServiceLayerBatch: function (entity, callBack, payLoad, method) {
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var sessionID = jsonModel.getProperty("/sessionID");
			if (sessionID === undefined) {
				var loginPayLoad = jsonModel.getProperty("/userAuthPayload");
				loginPayLoad = JSON.stringify(loginPayLoad);
				$.ajax({
					url: jsonModel.getProperty("/serLayerbaseUrl") + "/b1s/v2/Login",
					data: loginPayLoad,
					type: "POST",
					xhrFields: {
						withCredentials: true
					},
					dataType: "json", // expecting json response
					success: function (data) {
						jsonModel.setProperty("/sessionID", data.SessionId);
						payLoad = JSON.stringify(payLoad);
						$.ajax({
							type: method,
							xhrFields: {
								withCredentials: true
							},
							url: jsonModel.getProperty("/serLayerbaseUrl") + entity,
							setCookies: "B1SESSION=" + data.SessionId,
							dataType: "json",
							data: payLoad,
							success: function (res) {
								callBack.call(that, res);
								var docEntry;
								if (res == undefined) {
									docEntry = "";
								} else {
									docEntry = res.DocEntry;
								}
								var logData = {
									Api: entity,
									methodType: method,
									Desttype: "SL",
									errorText: docEntry,
									data: payLoad,
									statusTxt: 200
								};
								that.CaptureLog(logData);
							},
							error: function (error) {
								callBack.call(that, error);
								var logData = {
									Api: entity,
									methodType: method,
									Desttype: "SL",
									errorText: error.responseJSON.error.message,
									data: payLoad,
									statusTxt: 400
								};
								that.CaptureLog(logData);
							}
						});
					},
					error: function () {
						sap.m.MessageToast.show("Error with authentication");
					}
				});
			} else {
				payLoad = JSON.stringify(payLoad);
				$.ajax({
					type: method,
					xhrFields: {
						withCredentials: true
					},
					url: jsonModel.getProperty("/serLayerbaseUrl") + entity,
					setCookies: "B1SESSION=" + sessionID,
					dataType: "json",
					data: payLoad,
					success: function (res) {
						callBack.call(that, res);
						var logData = {
							Api: entity,
							methodType: method,
							Desttype: "SL",
							errorText: res.DocEntry,
							data: payLoad,
							statusTxt: 200
						};
						that.CaptureLog(logData);
					},
					error: function (error) {
						callBack.call(that, error);
						var logData = {
							Api: entity,
							methodType: method,
							Desttype: "SL",
							errorText: error.responseJSON.error.message,
							data: payLoad,
							statusTxt: 400
						};
						that.CaptureLog(logData);
					}
				});
			}
		},
		createBatchCall: function (batchUrl, callBack, busyDialog) {
			var jsonModel = this.getView().getModel("jsonModel");
			var splitBatch, count;
			count = Math.ceil(batchUrl.length / 100);
			jsonModel.setProperty("/count", count);
			if (batchUrl.length > 100) {
				do {
					splitBatch = batchUrl.splice(0, 100);
					this.callBatchService(splitBatch, callBack, busyDialog);
				} while (batchUrl.length > 100);
				if (batchUrl.length > 0) {
					this.callBatchService(batchUrl, callBack, busyDialog);
				}
			} else {
				this.callBatchService(batchUrl, callBack, busyDialog);
			}

			//	callBack.call(this, errorMessage);
		},
		callBatchService: function (batchUrl, callBack, busyDialog) {
			var reqHeader = "--clone_batch--\r\nContent-Type: application/http \r\nContent-Transfer-Encoding:binary\r\n\r\n";
			var payLoad = reqHeader;
			$.each(batchUrl, function (i, sObj) {
				payLoad = payLoad + sObj.method + " " + sObj.url + "\r\n\r\n";
				payLoad = payLoad + JSON.stringify(sObj.data) + "\r\n\r\n";
				if (batchUrl.length - 1 === i) {
					payLoad = payLoad + "\r\n--clone_batch--";
				} else {
					payLoad = payLoad + reqHeader;
				}
			});
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var baseUrl = jsonModel.getProperty("/serLayerbaseUrl");
			//	var sessionID = jsonModel.getProperty("/sessionID");
			if (busyDialog) {
				busyDialog.setBusy(true);
			}
			if (location.host.indexOf("webide") === -1) {
				baseUrl = "";
			}
			var settings = {
				"url": baseUrl + "/b1s/v2/$batch",
				"method": "POST",
				xhrFields: {
					withCredentials: true
				},
				//"timeout": 0,
				"headers": {
					"Content-Type": "multipart/mixed;boundary=clone_batch"
				},
				//	setCookies: "B1SESSION=" + sessionID,
				"data": payLoad,
				success: function (res) {
					var count = jsonModel.getProperty("/count");
					count--;
					jsonModel.setProperty("/count", count);

					var totalLength = Math.ceil((payLoad.length / 300000));

					var initial = 0,
						final;
					for (var i = 1; i <= totalLength; i++) {

						final = i * 300000;
						var passPayload = payLoad.substr(initial, final);

						var errorCapture, logData;
						if (res.includes("error") == true) {
							errorCapture = res.split("message")[2];
							logData = {
								Api: "Batch calls",
								methodType: "POST",
								Desttype: "SL",
								errorText: errorCapture,
								data: passPayload, //payLoad,
								statusTxt: 400
							};
							jsonModel.setProperty("/errorTxt", errorCapture);
							that.popUpData(errorCapture, "E");
						} else {
							// errorCapture = res;
							logData = {
								Api: "Batch calls",
								methodType: "POST",
								Desttype: "SL",
								errorText: "",
								data: passPayload, //payLoad,
								statusTxt: 200
							};
						}

						that.CaptureLog(logData);

						initial = final - 25;

					}

					// try {
					// 	var errorMessage = "";
					// 	res.split("\r").forEach(function (sString) {
					// 		if (sString.indexOf("error") !== -1) {
					// 			var oString = JSON.parse(sString.replace(/\n/g, ""));
					// 			errorMessage = oString.error.message;
					// 		}
					// 	});
					// } catch (err) {
					// 	//	console.log("error " + err);
					// }
					//	callBack.call(that, res, errorMessage);
					// if (errorMessage) {
					// 	var errorTxt = jsonModel.getProperty("/errorTxt");
					// 	errorTxt.push(errorMessage);
					// 	jsonModel.setProperty("/errorTxt", errorTxt);
					// }
					if (count === 0) {
						callBack.call(that, logData.errorText);
						if (busyDialog) {
							busyDialog.setBusy(false);
						}
					}
				},
				error: function (error) {
					var count = jsonModel.getProperty("/count");
					count--;
					jsonModel.setProperty("/count", count);
					if (count === 0) {
						callBack.call(that);
						if (busyDialog) {
							busyDialog.setBusy(false);
						}
					}
					if (error.statusText) {
						MessageBox.error(error.statusText);
					} else if (error.responseJSON) {
						MessageBox.error(error.responseJSON.error.message.value);
					}

				}
			};

			//	const text = '{"name":"John\n", "birth":"14/12/1989\t"}';
			//	const result = text.escapeSpecialCharsInJSONString();
			//	console.log(result);
			$.ajax(settings).done(function () {
				//	console.log(response);
			});
		},

		CaptureLog: function (LogData) {
			if (LogData.statusTxt !== 200) {
				var jsonModel = this.getOwnerComponent().getModel("jsonModel");
				// var errorLogData = jsonModel.getProperty("/ErrorLogData");
				// errorLogData.push({
				// 	Api: LogData.Api,
				// 	Desttype: LogData.Desttype,
				// 	errorText: LogData.errorText,
				// 	//	colorCode: colorCode
				// });
				// jsonModel.setProperty("/ErrorLogData", errorLogData);
			}
			if (LogData.Desttype === "METRC") {
				this.createMetricLog(LogData.Api, LogData.methodType, LogData.data, LogData.errorText, LogData.statusTxt);
			} else {
				this.createSLLog(LogData.Api, LogData.methodType, LogData.data, LogData.errorText, LogData.statusTxt);
			}
		},

		createSLLog: function (sUrl, method, reqPayload, resPayload, statusCode) {
			this.sendReqPayloadSequential(sUrl, method, reqPayload, statusCode);
		},
		sendReqPayloadSequential: function (sUrl, method, reqPayload, resPayload, statusCode) {
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			const reqChunks = this.splitIntoChunks(reqPayload, 50000);
			let chain = Promise.resolve();

			for (let i = 0; i < reqChunks.length; i++) {
				const payLoad = {
					U_NDTTM: that.convertUTCDate(new Date()),
					U_NUSID: jsonModel.getProperty("/userName"),
					U_NLGMT: method,
					U_NLURL: sUrl,
					U_NLGBD: reqChunks[i], // only request payload chunk
					U_NLGRP: resPayload,
					U_NLGST: statusCode,
					U_NAPP: "HP"
				};

				chain = chain.then(() => that.sendChunk(payLoad, i));
			}

			return chain.then(() => {
				console.log("All request payload chunks sent successfully");
			}).catch(err => {
				console.error("Error in sending request payload chunks", err);
			});
		},
		splitIntoChunks: function (str, size = 50000) {
			if (typeof str !== "string") {
				str = JSON.stringify(str);
			}
			const chunks = [];
			for (let i = 0; i < str.length; i += size) {
				chunks.push(str.substring(i, i + size));
			}
			return chunks;
		},
		sendChunk: function (payLoad, index) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var sUrl, entity = "/b1s/v2/NBNLG";
			if (location.host.indexOf("webide") !== -1) {
				sUrl = jsonModel.getProperty("/serLayerbaseUrl") + entity;
			} else {
				sUrl = entity;
			}
			return new Promise((resolve, reject) => {
				$.ajax({
					type: "POST",
					xhrFields: {
						withCredentials: true
					},
					url: sUrl,
					dataType: "json",
					data: JSON.stringify(payLoad),
					success: function (res) {
						console.log("Batch sent:", index + 1);
						resolve();
					},
					error: function (error) {
						console.error("atch failed:", index + 1, error);
						reject(error);
					}
				});
			});
		},

		convertUTCDateTime: function (date) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "yyyy-MM-ddThh:mm:ss",
				UTC: false
			});
			var postingDate = dateFormat.format(new Date(date));
			var finalDate = postingDate + "Z";
			return finalDate;
		},
		getMetricsCredentials: function () {
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			return new Promise(function (resolve, reject) {
				var filters = "?$filter=U_NITTP eq 'METRC'";
				jsonModel.setProperty("/metrcBusy", true);
				jsonModel.setProperty("/enableSyncNow", false);
				that.readServiecLayer("/b1s/v2/NINGT" + filters, function (data) {
					resolve();
					jsonModel.setProperty("/metrcBusy", false);
					if (data.value.length > 0) {
						jsonModel.setProperty("/metrcData", data.value[0]);
						if (data.value[0].U_NACST === "X") {
							jsonModel.setProperty("/METRCText", "Metrc Sync is ON");
							jsonModel.setProperty("/METRCColorCode", 7);
							that.getCurrentFacilties();
						} else {
							jsonModel.setProperty("/METRCText", "Metrc Sync is OFF");
							jsonModel.setProperty("/METRCColorCode", 3);
							jsonModel.setProperty("/METRCKey", "METRC Key Invalid");
							jsonModel.setProperty("/METRCColorKey", 3);
							// that.loadLicenseData();
						}
					} else {
						jsonModel.setProperty("/metrcData", {});
						jsonModel.setProperty("/METRCText", "Metrc Sync is OFF");
						jsonModel.setProperty("/METRCColorCode", 3);
						jsonModel.setProperty("/METRCKey", "METRC Key Invalid");
						jsonModel.setProperty("/METRCColorKey", 3);
						// that.loadLicenseData();
					}

				});
			});
		},

		// getCurrentFacilties: function () {
		// 	var that = this;
		// 	var jsonModel = this.getOwnerComponent().getModel("jsonModel");
		// 	this.readServiecLayer("/b1s/v2/UsersService_GetCurrentUser", function (data) {
		// 		var metrcData = jsonModel.getProperty("/metrcData");
		// 		jsonModel.setProperty("/apiKey", data.U_APIKey);
		// 		if (metrcData !== undefined && !jQuery.isEmptyObject(metrcData)) {
		// 			$.ajax({
		// 				type: "GET",
		// 				async: false,
		// 				url: metrcData.U_NIURL + "/facilities/v2",
		// 				contentType: "application/json",
		// 				headers: {
		// 					"Authorization": "Basic " + btoa(metrcData.U_NVNDK + ":" + data.U_APIKey)
		// 				},
		// 				success: function (facilities) {
		// 					jsonModel.setProperty("/METRCKey", "METRC Key Valid");
		// 					jsonModel.setProperty("/METRCColorKey", 7);
		// 				},
		// 				error: function () {
		// 					jsonModel.setProperty("/METRCKey", "METRC Key Invalid");
		// 					jsonModel.setProperty("/METRCColorKey", 3);
		// 				}
		// 			});
		// 		}
		// 	});
		// },
		getCurrentFacilties: function () {
			var that = this;
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var apiKey = jsonModel.getProperty("/apiKey");
			var metrcData = jsonModel.getProperty("/metrcData");
			if (metrcData !== undefined && !jQuery.isEmptyObject(metrcData)) {
				$.ajax({
					type: "GET",
					async: false,
					url: metrcData.U_NIURL + "/facilities/v2",
					contentType: "application/json",
					headers: {
						"Authorization": "Basic " + btoa(metrcData.U_NVNDK + ":" + apiKey)
					},
					success: function (facilities) {
						jsonModel.setProperty("/METRCKey", "METRC Key Valid");
						jsonModel.setProperty("/METRCColorKey", 7);
					},
					error: function () {
						jsonModel.setProperty("/METRCKey", "METRC Key Invalid");
						jsonModel.setProperty("/METRCColorKey", 3);
					}
				});
			}

		},
		createMETRCBatchCall: function (batchUrl, method, batchData, callBack, that) {
			var jsonModel = this.getView().getModel("jsonModel");
			//	this.byId("dynamicPageId").setBusy(true);
			var splitBatch, count;
			count = Math.ceil(batchData.length / 10);
			jsonModel.setProperty("/metrcCount", count);
			var promisesUrl = [];
			if (batchData.length > 10) {
				do {
					splitBatch = batchData.splice(0, 10);
					promisesUrl.push(this.metrcPromise(batchUrl, splitBatch, method, jsonModel));
				} while (batchData.length > 10);
				if (batchData.length > 0) {
					promisesUrl.push(this.metrcPromise(batchUrl, batchData, method, jsonModel));
				}
			} else {
				promisesUrl.push(this.metrcPromise(batchUrl, batchData, method, jsonModel));
			}
			Promise.all(promisesUrl).then((values) => {
				callBack.call(that, values);
			});

			//	callBack.call(this, errorMessage);
		},
		metrcPromise: function (entity, postObj, methodType, jsonModel) {
			var metricConfig = jsonModel.getProperty("/metrcData");
			var apiKey = jsonModel.getProperty("/apiKey");
			var that = this;
			var apiKey = jsonModel.getProperty("/apiKey");
			//	jsonModel.setProperty("/busyView", true);
			return new Promise(
				function (resolve, reject) {
					$.ajax({
						data: JSON.stringify(postObj),
						type: methodType,
						async: false,
						url: metricConfig.U_NIURL + entity,
						contentType: "application/json",
						headers: {
							"Authorization": "Basic " + btoa(metricConfig.U_NVNDK + ":" + apiKey)
						},
						success: function (sRes) {
							resolve(sRes);
							that.createMetricLog(entity, methodType, postObj, sRes, "200");

						},
						error: function (eRes) {
							jsonModel.setProperty("/busyView", false);
							reject(eRes);
							var errorArray = [];
							$.grep(eRes.responseJSON, function (e) {
								errorArray.push(e.message);
							});
							that.createMetricLog(entity, methodType, postObj, errorArray, eRes.status);
							that.popUpData(errorArray.join(), "E");
						}
					});
				});
		},

		callMetricsService: function (entity, methodType, data, success, error) {
			var that = this;
			// var obj = this.getView().getModel("jsonModel").getProperty("/selectedMetrics");
			var metricConfig = this.getView().getModel("jsonModel").getProperty("/metrcData");
			var apiKey = this.getView().getModel("jsonModel").getProperty("/apiKey");
			$.ajax({
				data: JSON.stringify(data),
				type: methodType,
				async: false,
				url: metricConfig.U_NIURL + entity,
				contentType: "application/json",
				headers: {
					"Authorization": "Basic " + btoa(metricConfig.U_NVNDK + ":" + apiKey)
				},
				success: function (sRes) {
					that.createMetricLog(entity, methodType, data, sRes, "200");
					success.call(that, sRes);
				},
				error: function (eRes) {
					//	error.bind(this);
					var errorMsg = "";
					/*if (eRes.statusText) {
						errorMsg = eRes.statusText;
					} else*/
					if (eRes.responseJSON && eRes.responseJSON.length > 0) {
						$.each(eRes.responseJSON, function (i, e) {
							errorMsg = e.message + "\n";
						});
					} else if (eRes.responseJSON && eRes.responseJSON.Message) {
						errorMsg = eRes.responseJSON.Message;
					} else if (eRes.statusText && eRes.status === 401) {
						errorMsg = "Unauthorized";
					} else if (eRes.statusText) {
						errorMsg = eRes.statusText;
					}
					error.call(that, errorMsg);
					that.createMetricLog(entity, methodType, data, errorMsg, eRes.status);
					sap.m.MessageToast.show(errorMsg);
				}
			});
		},
		callMetricsGETService: function (entity, success, error) {
			var that = this;
			// var obj = this.getView().getModel("jsonModel").getProperty("/selectedMetrics");
			var metricConfig = this.getView().getModel("jsonModel").getProperty("/metrcData");
			var apiKey = this.getView().getModel("jsonModel").getProperty("/apiKey");
			$.ajax({
				type: "GET",
				async: false,
				url: metricConfig.U_NIURL + entity,
				contentType: "application/json",
				headers: {
					"Authorization": "Basic " + btoa(metricConfig.U_NVNDK + ":" + apiKey)
				},
				success: function (sRes) {
					//	that.createMetricLog(entity, methodType, data, sRes, "200");
					success.call(that, sRes);
				},
				error: function (eRes) {
					var errorMsg = "";
					if (eRes.responseJSON && eRes.responseJSON.length > 0) {
						$.each(eRes.responseJSON, function (i, e) {
							errorMsg = errorMsg + e.message + "\n";
							that.popUpData(e.message, "E");
						});
					} else if (eRes.responseJSON && eRes.responseJSON.Message) {
						errorMsg = eRes.responseJSON.Message;
						that.popUpData(errorMsg, "E");
					} else if (eRes.statusText && eRes.status === 401) {
						errorMsg = "Unauthorized";
						that.popUpData(errorMsg, "E");
					} else if (eRes.statusText) {
						errorMsg = eRes.statusText;
						that.popUpData(errorMsg, "E");
					}

					error.call(that, errorMsg);
					//	that.createMetricLog(entity, methodType, data, errorMsg, eRes.status);
					sap.m.MessageToast.show(errorMsg);
				}
			});
		},
		hanldeMessageDialog: function (evt) {
			var that = this;
			var oMessageTemplate = new sap.m.MessageItem({
				type: '{type}',
				title: '{title}',
				description: '{description}'
			});
			this.oMessageView = new sap.m.MessageView({
				showDetailsPageHeader: true,
				itemSelect: function () {

				},
				items: {
					path: "/responseData",
					template: oMessageTemplate
				}
			});
			var resModel = new sap.ui.model.json.JSONModel();
			resModel.setProperty("/responseData", []);
			this.resModel = resModel;
			var oCloseButton = new sap.m.Button({
					text: "Close",
					press: function () {
						that._oPopover.close();
					}
				}).addStyleClass("sapUiTinyMarginEnd"),
				clearButton = new sap.m.Button({
					text: "Clear",
					press: function () {
						that.resModel.setProperty("/responseData", []);
					}
				}),
				oPopoverFooter = new sap.m.Bar({
					contentRight: [clearButton, oCloseButton]
				}),
				oPopoverBar = new sap.m.Bar({
					//	contentLeft: [oBackButton],
					contentMiddle: [
						new sap.m.Title({
							text: "Messages"
						})
					]
				});

			this._oPopover = new sap.m.Popover({
				customHeader: oPopoverBar,
				contentWidth: "440px",
				contentHeight: "440px",
				verticalScrolling: false,
				modal: true,
				content: [this.oMessageView],
				footer: oPopoverFooter
			});
			this._oPopover.setModel(resModel);
		},
		handleOpenPopOver: function (evt) {
			this._oPopover.openBy(evt.getSource());
		},
		popUpData: function (title, type) {
			var sObj = {
				type: type === "E" ? "Error" : "Success",
				title: title
			};
			var responseData = this.resModel.getProperty("/responseData");
			responseData.push(sObj);
			this.resModel.setProperty("/responseData", responseData);
			this._oPopover.setModel(this.resModel);
			var resPop = this.getView().byId("resPop");
			this.oMessageView.navigateBack();
			resPop.firePress();
		},
		// capture metric log
		createMetricLog: function (sUrl, method, reqPayload, resPayload, statusCode) {
			var data = {
				U_NDTTM: this.convertUTCDate(new Date()),
				U_NUSID: this.getView().getModel("jsonModel").getProperty("/userName"),
				U_NLGMT: method,
				U_NLURL: sUrl,
				U_NLGBD: JSON.stringify(reqPayload),
				U_NLGRP: JSON.stringify(resPayload),
				U_NLGST: statusCode,
				U_NAPP: "HP"
			};
			this.updateServiecLayer("/b1s/v2/NMTLG", function () {}.bind(this), data, "POST");
		},

		convertUTCDate: function (date) {
			date.setHours(new Date().getHours());
			date.setMinutes(new Date().getMinutes());
			date.setSeconds(new Date().getSeconds());
			var utc = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
			return utc;
		},
		convertUTCDateMETRC: function (date) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "yyyy-MM-dd",
				UTC: true
			});
			var finalDate = dateFormat.format(new Date(date));
			return finalDate;
		},
		calNetWtNew: function (gWt, nWt, tWt, pWt, stlWt) {

			// Normalize inputs (null / undefined / NaN → 0)
			gWt = isNaN(gWt) || gWt == null ? 0 : Number(gWt);
			nWt = isNaN(nWt) || nWt == null ? 0 : Number(nWt);
			tWt = isNaN(tWt) || tWt == null ? 0 : Number(tWt);
			pWt = isNaN(pWt) || pWt == null ? 0 : Number(pWt);
			stlWt = isNaN(stlWt) || stlWt == null ? 0 : Number(stlWt);

			// Calculate only when gross weight exists
			if (gWt > 0) {
				return (
					Number(gWt.toFixed(2)) -
					Number(nWt.toFixed(2)) -
					Number(tWt.toFixed(2)) -
					Number(pWt.toFixed(2)) -
					Number(stlWt.toFixed(2))
				);
			}

			return 0;
		},

		_closeBusyDialog: function () {
			this._busyDialog.then(function (oBusyDialog) {
				oBusyDialog.close();
			})
		},
		ensureJSONString: function (data) {
			function isJSONString(str) {
				if (typeof str !== "string") return false;
				try {
					const parsed = JSON.parse(str);
					return typeof parsed === "object" || Array.isArray(parsed);
				} catch (e) {
					return false;
				}
			}
			if (typeof data === "string" && isJSONString(data)) {
				return data; // already stringified
			}
			return JSON.stringify(data);
		},
		exportToExcel: function (JSONData, ReportTitle, ShowLabel) {
			//If JSONData is not an object then JSON.parse will parse the JSON string in an Object
			var arrData = typeof JSONData !== 'object' ? JSON.parse(JSONData) : JSONData;
			var CSV = "";
			//Set Report title in first row or line
			// CSV += ReportTitle + '\r\r\n\n';
			//This condition will generate the Label/Header
			if (ShowLabel) {
				var row = "";
				//This loop will extract the label from 1st index of on array
				for (var index in arrData[0]) {
					//Now convert each value to string and comma-seprated
					row += index + ',';
				}
				row = row.slice(0, -1);
				//append Label row with line break
				CSV += row + '\r\n';
			}
			//1st loop is to extract each row
			for (var i = 0; i < arrData.length; i++) {
				var row = "";
				//2nd loop will extract each column and convert it in string comma-seprated
				for (var index in arrData[i]) {
					row += '"' + arrData[i][index] + '",';
				}
				row = row.slice(0, row.length - 1);
				//add a line break after each row
				CSV += row + '\r\n';
			}
			if (CSV === '') {
				console("Invalid data");
				return;
			}
			//Generate a file name
			var fileName = "";
			//this will remove the blank-spaces from the title and replace it with an underscore
			fileName += ReportTitle.replace(/ /g, " ");
			//Initialize file format you want csv or xls
			// var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);
			var blob = new Blob([CSV], {
				type: "application/csv;charset=utf-8;"
			});
			var csvUrl = URL.createObjectURL(blob);

			//this trick will generate a temp <a /> tag
			var link = document.createElement("a");
			link.href = csvUrl;
			//set the visibility hidden so it will not effect on your web-layout
			link.style = "visibility:hidden";
			link.download = fileName + ".csv";
			//this part will append the anchor tag and remove it after automatic click
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		},

	});
});