/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/controller/BaseController",
	"sap/m/MessageBox",
	"zcogna/ewm/packoutbdlvs1/service/ODataService",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Global",
	"zcogna/ewm/packoutbdlvs1/utils/Util",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Material",
	"sap/ui/model/json/JSONModel",
	"zcogna/ewm/packoutbdlvs1/utils/Const",
	"zcogna/ewm/packoutbdlvs1/modelHelper/PackingMode",
	"zcogna/ewm/packoutbdlvs1/model/PackingMode",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"zcogna/ewm/packoutbdlvs1/utils/CustomError",
	"zcogna/ewm/packoutbdlvs1/modelHelper/OData"
], function (Controller, MessageBox, Service, Global, Util, Material, JSONModel, Const, PackingModeHelper, PackingMode, Filter,
	FilterOperator, CustomError, OData) {
	"use strict";
	var startPackingId = "start-packing-button";
	var dummyId = "dummy-input";
	var audioId = "audio-player";
	var workCenterInputId = "pod---defaultbin--workcenter--input";
	var storageBinInputId = "pod---defaultbin--storagebin--input";
	var warehouseInputId = "pod---defaultbin--warehouse--input";
	return Controller.extend("zcogna.ewm.packoutbdlvs1.controller.DefaultBin", {
		sRouteName: "default",
		init: function () {
			this.setModel(PackingMode, "packingMode");

			this.setBusy(true);
			var oRunTimePromise = Service.getRuntimeEnvironment()
				.then(function (aResult) {
					if (Util.isEmpty(Global.getWarehouseNumber())) {
						// this.oWorkCenterModel.setData([]);
						// this.oStorageBinModel.setData([]);
					} else {
						//delay purpose, otherwise view not attached yet.
						this.bindAudioAggregation();
					}
					Global.setIsOnCloud(aResult[0].IsS4Cloud);
					if (!aResult[0].IsS4Cloud && PackingModeHelper.getSelectedMode() !== Const.INTERNAL_MODE) {
						this.initPackingModeModel();
					}
				}.bind(this));
			var oPersonalizationPromise = this.initPersonalizationService();
			this.setButtonToolTip("start-packing-button");
			return Promise.all([oRunTimePromise, oPersonalizationPromise])
				.then(function () {
					this.setBusy(false);
				}.bind(this))
				.catch(function () {
					this.setBusy(false);
				}.bind(this));
		},

		onRouteMatched: function (oParameter) {
			this.getOwnerComponent().getService("ShellUIService")
				.then(function (oService) {
						oService.setBackNavigation();
					},
					function (oError) {
						jQuery.sap.log.error("Cannot get ShellUIService", oError);
					}
				);
		},

		bindWorkCenter: function (sWorkStation) {
			if (Util.isEmpty(Global.getWarehouseNumber())) {
				sWorkStation = "";
			}
			var sWorkStationEncoded = OData.encodeSpecialCharacter(sWorkStation);
			this.byId(workCenterInputId).bindElement({
				path: "/PackingStationSet(EWMWarehouse='" + Global.getWarehouseNumber() + "',EWMWorkCenter='" + sWorkStationEncoded +
					"',EWMStorageBin='')"
			});
		},

		bindStorageBin: function (sWorkStation, sStorageBin) {
			if (Util.isEmpty(Global.getWarehouseNumber())) {
				sWorkStation = "";
				sStorageBin = "";
			}
			if (Util.isEmpty(sStorageBin)) {
				sStorageBin = "";
			}
			var sWorkStationEncoded = OData.encodeSpecialCharacter(sWorkStation);
			this.byId(storageBinInputId).bindElement({
				path: "/PackingStationSet(EWMWarehouse='" + Global.getWarehouseNumber() + "',EWMWorkCenter='" + sWorkStationEncoded +
					"',EWMStorageBin='" + sStorageBin + "')"
			});
		},

		bindWarehouse: function (sWarehouse) {
			var sWarehouse = OData.encodeSpecialCharacter(sWarehouse);
			Global.setWarehouseNumber(sWarehouse);
			this.byId(warehouseInputId).bindElement({
				path: "/EWMWarehouse_Set(EWMWarehouse='" + sWarehouse + "')"
			});
		},

		setWarehouseValue: function (sWarehouse) {
			//var oWarehouseInput = this.byId("pod---defaultbin--warehouse--input-input");
			var oWarehouseInput = this.byId("pod---defaultbin--warehouse--input-input");
			if (!Util.isEmpty(oWarehouseInput)) {
				oWarehouseInput.setValue(sWarehouse);
			}
			var oWarehouseSmartInput = this.byId("pod---defaultbin--warehouse--input");
			oWarehouseSmartInput.fireChange({
				newValue: sWarehouse,
				bSKipVerify: true
			});
		},

		initPackingMode: function () {
			var vPackMode = this.getOwnerComponent().getComponentData().startupParameters.PackMode;
			if (Util.isEmpty(vPackMode)) {
				vPackMode = Const.PACK_MODE.OUTBOUND;
			} else {
				vPackMode = parseInt(vPackMode[0], 10);
			}
			Service.setOdataHeader(vPackMode);
			//todo may support simple mode in the future
			if (vPackMode === Const.PACK_MODE.OUTBOUND) {
				var sPackingMode = this.getDefaultPackingModeForOutbound();
				PackingModeHelper.setSelectedMode(sPackingMode);
				this.byId("mode-selection").setSelectedKey(sPackingMode);
			} else {
				PackingModeHelper.setSelectedMode(Const.INTERNAL_MODE);
			}
		},

		initSubscription: function () {},
		
		initModel: function () {},

		isInTextAndIdFormat: function (sValue) {
			if (sValue.length < 6) {
				return false;
			}

			var lastFive = sValue.substring(sValue.length - 6, sValue.length - 5);
			if (lastFive !== "(") {
				return false;
			}
			var lastOne = sValue.substring(sValue.length - 1, sValue.length);
			if (lastOne !== ")") {
				return false;
			}
			return true;
		},

		getIdFromTextAndIdFormat: function (sValue) {
			return sValue.substring(sValue.length - 5, sValue.length - 1);

		},

		initPackingModeModel: function () {
			var sAdvancedPacking = this.getI18nText("advancedMode");
			var sBasicPacking = this.getI18nText("basicMode");
			var sInternalPacking = this.getI18nText("internalMode");
			var aModeData = [{
				"key": Const.ADVANCED_MODE,
				"text": sAdvancedPacking
			}];
			var oBasicMode = {
				"key": Const.BASIC_MODE,
				"text": sBasicPacking
			};
			if (!Global.isOnCloud()) {
				aModeData.push(oBasicMode);
			}
			PackingModeHelper.setModes(aModeData);
		},
		getDefaultPackingModeForOutbound: function () {
			var sDefaultPackMode = this.oContainer.getItemValue("packingMode");
			if (Util.isEmpty(sDefaultPackMode)) {
				sDefaultPackMode = Const.ADVANCED_MODE;
			} else if (sDefaultPackMode !== Const.ADVANCED_MODE && sDefaultPackMode !== Const.BASIC_MODE) {
				sDefaultPackMode = Const.ADVANCED_MODE;
			}
			return sDefaultPackMode;
		},
		initPersonalizationService: function () {
			this.oPersonalizationService = this.getPersonalizationService();
			return new Promise(function (resolve, reject) {
					var sContainer = this.getContainerId();
					this.oPersonalizationService.getContainer(sContainer)
						.fail(function () {
							this.oPersonalizationService.createEmptyContainer(sContainer)
								.done(function (oContainer) {
									this.oContainer = oContainer;
									resolve();
								}.bind(this));
						}.bind(this))
						.done(function (oContainer) {
							this.oContainer = oContainer;
							resolve();
						}.bind(this));
				}.bind(this))
				.then(function () {
					return this.initDisplayedValue();
				}.bind(this));
		},

		initDisplayedValue: function () {
			var sWarehouse = this.oContainer.getItemValue("ewmWarehouse");
			var sWorkCenter = this.oContainer.getItemValue("workCenter");
			this.byId(startPackingId).setEnabled(false);
			if (!Util.isEmpty(sWarehouse)) {
				this.setBusy(true);
				sWarehouse = sWarehouse.toUpperCase();
				sWorkCenter = Util.isEmpty(sWorkCenter) ? "" : sWorkCenter.toUpperCase();
				Service.verifyWarehouseAndWorkCenter(sWarehouse, sWorkCenter)
					.then(function (oResult) {
						this.setBusy(false);
						if (oResult[0].length === 0) {
							//warehosue verificaion failed.
							Global.setWarehouseNumber("");
							this.bindWarehouse("");
							this.bindWorkCenter("");
							this.bindStorageBin("");
							this.byId(startPackingId).setEnabled(false);
							return;
						}

						sWarehouse = oResult[0][0].EWMWarehouse;

						if (oResult[1].length === 0) {
							//workcenter verificaion failed.
							Global.setWarehouseNumber(sWarehouse);
							this.bindWarehouse(sWarehouse);
							this.bindWorkCenter("");
							this.bindStorageBin("");
							this.byId(startPackingId).setEnabled(false);
							return;
						}

						var sWorkCenter = oResult[1][0].EWMWorkCenter;
						var sDefaultBin = oResult[1][0].Default_Bin;

						Global.setPackStation(sWorkCenter);
						Global.setBin(sDefaultBin);

						var sPath = "/PackingStationSet(EWMWarehouse='" + sWarehouse + "',EWMWorkCenter='" + sWorkCenter + "',EWMStorageBin='" +
							sDefaultBin + "')";

						this.bindWarehouse(sWarehouse);
						this.byId(workCenterInputId).bindElement({
							path: sPath
						});
						this.byId(storageBinInputId).bindElement({
							path: sPath
						});

						if (!Util.isEmpty(sWarehouse) && !Util.isEmpty(sWorkCenter) && !Util.isEmpty(sDefaultBin)) {
							this.byId(startPackingId).setEnabled(true);
						} else {
							this.byId(startPackingId).setEnabled(false);
						}
						
					}.bind(this))
					.catch(function () {
						this.setBusy(false);
						//when the remembered warehouse is not valid again, use set all the inputs as empty.
						Global.setWarehouseNumber("");
						this.bindWarehouse("");
						this.bindWorkCenter("");
						this.bindStorageBin("");
					}.bind(this));
			} else {
				//fist log on use warehouse in the user setting
				var sDefaultWarehouse = Global.getDefaultWarehouseNumber();
				if (!Util.isEmpty(sDefaultWarehouse)) {
					this.bindWarehouse(sDefaultWarehouse);
				} else {
					this.bindWarehouse("");
				}
				this.bindWorkCenter("");
				this.bindStorageBin("");
			}
		},

		onVerifyWorkCenter: function (sValue) {
			var oInput = this.byId(workCenterInputId);
			if (sValue.length > 4) {
				this.handleEntryLengthExceed(oInput);
				return;
			}
			if (!Util.isEmpty(sValue)) {
				this.verifyWorkCenter(sValue)
					.then(function () {
						this.setBusy(false);
					}.bind(this))
					.catch(function () {
						this.setBusy(false);
					}.bind(this));
			} else {
				Global.setPackStation("");
			}
		},

		onWorkCenterChange: function (oEvent) {
			this.byId(startPackingId).setEnabled(false);
			this.focusDummyElement();
			var sValue = Util.trim(oEvent.getParameter("newValue")).toUpperCase();
			if (this.isInTextAndIdFormat(sValue)) {
				sValue = this.getIdFromTextAndIdFormat(sValue);
			}
			if (Util.isEmpty(oEvent.getParameter("validated")) || !oEvent.getParameter("validated")) {
				//by manual input
				this.onVerifyWorkCenter(sValue);
			}
		},

		handleEntryLengthExceed: function (oInput) {
			var sError = this.getI18nText("workCenterMaximunCharacters");
			this.updateInputWithError(oInput, sError);
			this.playAudio(Const.ERROR);
			oInput.focus();
		},

		verifyWorkCenter: function (sValue, bBindWorkCenter, bSetStorageBin) {
			//sValue is the 4 digits number.
			var oInput = this.byId(workCenterInputId);
			var sDefaultBin = "";
			this.setBusy(true);
			var bSetStorageBin = Util.isEmpty(bSetStorageBin) ? true : bSetStorageBin;
			return Service.verifyWorkCenter(sValue)
				.then(function (oResult) {
					this.setBusy(false);
					if (Util.isEmpty(oResult.EWMWarehouse) || Util.isEmpty(oResult.EWMWorkCenter)) {
						throw new Error();
					} else {
						// Global.setWarehouseNumber(oResult.EWMWarehouse);
						// this.setWarehouseValue(oResult.EWMWarehouse);
						Global.setPackStation(oResult.EWMWorkCenter);
						Global.setScaleEnabled(oResult.ScaleEnabled);
						Global.setAsyncMode(!!oResult.IsUIAsync);
						if (Util.isEmpty(oResult.CheckConsGrp)) {
							Global.setCheckConsolidationGroup(false);
						} else {
							Global.setCheckConsolidationGroup(true);
						}

						var sWorkCenter = oResult.EWMWorkCenter.toUpperCase();
						sDefaultBin = oResult.EWMStorageBin.toUpperCase();
						if (bBindWorkCenter) {
							this.bindWorkCenter(sWorkCenter);
						}
						if (bSetStorageBin) {
							this.bindStorageBin(sWorkCenter, sDefaultBin);
						}
					}
				}.bind(this))
				.then(function () {
					if (bSetStorageBin && !Util.isEmpty(sDefaultBin)) {
						Global.setBin(sDefaultBin);
						this.updateInputWithDefault(storageBinInputId, sDefaultBin);
						this.byId(startPackingId).setEnabled(true);
					} else {
						var oStorageBinInput = this.byId(storageBinInputId);
						var sStorageBinValue = oStorageBinInput.getValue();
						if (!Util.isEmpty(sStorageBinValue)) {
							oStorageBinInput.fireChange({
								newValue: sStorageBinValue
							});
						} else {
							this.updateInputWithDefault(oStorageBinInput, "");
						}
					}
					this.focus(storageBinInputId);
				}.bind(this))
				.catch(function (oError) {
					this.setBusy(false);
					this.byId(startPackingId).setEnabled(false);
					if (Util.isEmpty(oError._vPara)) {
						var sError = this.getI18nText("incorrectWorkCenter", sValue);
						this.updateInputWithError(oInput, sError);
					} else {
						this.updateInputWithError(oInput, oError._vPara.MsgVar);
					}
					Global.setPackStation("");
					this.playAudio(Const.ERROR);
					oInput.focus();
				}.bind(this));
		},

		onWarehouseVerify: function (sValue) {
			var oWarehouseInput = this.byId(warehouseInputId);
			var oWorkCenterInput = this.byId(workCenterInputId);
			if (sValue.length > 4) {
				var sError = this.getI18nText("incorrectWarehouse", sValue);
				this.updateInputWithError(oWarehouseInput, sError);
				this.playAudio(Const.ERROR);
				oWarehouseInput.focus();
				return;
			}

			if (Util.isEmpty(sValue)) {
				var sError = this.getI18nText("specifyWarehouse");
				this.updateInputWithError(oWarehouseInput, sError);
				this.playAudio(Const.ERROR);
				oWarehouseInput.focus();
				return;
			}

			this.setBusy(true);
			return Service.verifyWarehouse(sValue)
				.then(function (oResult) {
					this.setBusy(false);
					if (oResult.length == 0) {
						var sError = this.getI18nText("warehouseNotExist", [sValue]);
						this.updateInputWithError(oWarehouseInput, sError);
						this.playAudio(Const.ERROR);
						oWarehouseInput.focus();
					} else {
						Global.setWarehouseNumber(oResult[0].EWMWarehouse);
						this.setWarehouseValue(oResult[0].EWMWarehouse);
						this.bindWorkCenter("");
						this.bindStorageBin("");
						this.byId(workCenterInputId).setEditable(true);
						this.byId(storageBinInputId).setEditable(true);
						oWorkCenterInput.focus();
					}
				}.bind(this))
				.catch(function (oError) {
					this.setBusy(false);
					var sError = this.getI18nText("specifyWarehouse");
					this.updateInputWithError(oWarehouseInput, sError);
					this.playAudio(Const.ERROR);
					oWarehouseInput.focus();
				}.bind(this));

		},

		onStorageBinVerify: function (sValue) {
			var oWorkCenterInput = this.byId(workCenterInputId);
			var sWorkCenter = Global.getPackStation();
			var oInput = this.byId(storageBinInputId);
			if (Util.isEmpty(sWorkCenter)) {
				oWorkCenterInput.focus();
				this.updateInputWithDefault(oInput, sValue);
				return;
			}

			if (sValue.length > 18) {
				this.updateInputWithError(oInput);
				this.playAudio(Const.ERROR);
				oInput.focus();
				return;
			}

			if (!Util.isEmpty(sValue)) {
				this.verifyStorageBin(sValue);
			} else {
				Global.setBin("");
			}
		},
		onWorkCenterValueListChanged: function (oEvent) {
			if (Util.isEmpty(oEvent.getParameter("changes"))) {
				return;
			}
			var sWarehouseNumber = oEvent.getParameter("changes").EWMWarehouse;
			var sDefaultBin = oEvent.getParameter("changes").Default_Bin;
			var sPath = this.byId(workCenterInputId).getBinding("value").getContext().getPath();
			var fromIndex = sPath.indexOf("EWMWorkCenter='") + 15;
			var endIndex = sPath.indexOf("',EWMStorageBin=");
			var sWorkCenter = sPath.substring(fromIndex, endIndex);
			
			if (Util.isEmpty(sWarehouseNumber)) {
				var oWarehouseInput = this.byId(warehouseInputId);
				this.updateInputWithDefault(oWarehouseInput, "");
				this.setWarehouseValue("");
				oWarehouseInput.focus();
				this.UIChangeWhenWarehouseNumberIsEmpty();
				var sError = this.getI18nText("specifyWarehouse");
				this.updateInputWithError(oWarehouseInput, sError);
				this.playAudio(Const.ERROR);
				return;
			}
			if (Global.getWarehouseNumber(sWarehouseNumber) !== sWarehouseNumber) {
				Global.setWarehouseNumber(sWarehouseNumber);
				this.setWarehouseValue(sWarehouseNumber);
				if (!Util.isEmpty(sWorkCenter)) {
					this.verifyWorkCenter(sWorkCenter, false, true);
				}
			} else{
				Global.setPackStation(sWorkCenter);
				Global.setBin(sDefaultBin);

				var oStorageBinInput = this.byId("pod---defaultbin--storagebin--input-input");
				oStorageBinInput.setValue(sDefaultBin);
				var oStorageBinSmartInput = this.byId("pod---defaultbin--storagebin--input");
				oStorageBinSmartInput.fireChange({
					newValue: sDefaultBin,
					bSKipVerify: true
				});

				if (!Util.isEmpty(sDefaultBin)) {
					this.byId(startPackingId).setEnabled(true);
				} else {
					this.byId(startPackingId).setEnabled(false);
				}
				return;
			}
		},

		onStorageBinValueListChanged: function (oEvent) {
			if (Util.isEmpty(oEvent.getParameter("changes"))) {
				return;
			}
			var sWarehouseNumber = oEvent.getParameter("changes").EWMWarehouse;
			if (Util.isEmpty(sWarehouseNumber)) {
				var oWarehouseInput = this.byId(warehouseInputId);
				this.updateInputWithDefault(oWarehouseInput, "");
				this.setWarehouseValue("");
				oWarehouseInput.focus();
				this.UIChangeWhenWarehouseNumberIsEmpty();
				var sError = this.getI18nText("specifyWarehouse");
				this.updateInputWithError(oWarehouseInput, sError);
				this.playAudio(Const.ERROR);
				return;
			}
			if (Global.getWarehouseNumber(sWarehouseNumber) !== sWarehouseNumber) {
				Global.setWarehouseNumber(sWarehouseNumber);
				this.setWarehouseValue(sWarehouseNumber);
			}
			var sWorkCenter = this.byId(workCenterInputId).getProperty("value");
			if (!Util.isEmpty(sWorkCenter)) {
				this.verifyWorkCenter(sWorkCenter, true, false);
			} else {
				this.bindWorkCenter("");
			}
		},

		UIChangeWhenWarehouseNumberIsEmpty: function () {
			this.byId(startPackingId).setEnabled(false);
			Global.setWarehouseNumber("");
			Global.setPackStation("");
			Global.setBin("");
			this.bindWorkCenter("");
			this.bindStorageBin("");
			this.updateInputWithDefault(this.byId(workCenterInputId), "");
			this.updateInputWithDefault(this.byId(storageBinInputId), "");
			this.byId(workCenterInputId).setEditable(false);
			this.byId(storageBinInputId).setEditable(false);
		},

		onWarehouseChange: function (oEvent) {
			if (!Util.isEmpty(oEvent.getParameter("bSKipVerify")) && oEvent.getParameter("bSKipVerify")) {
				//the warehouse change does not require verification
				return;
			}

			this.UIChangeWhenWarehouseNumberIsEmpty();
			if (!Util.isEmpty(oEvent.getParameter("validated")) && oEvent.getParameter("validated") === true) {
				//change is done by search help selection, there is no need to verify again
				var sWarehouseNumber = oEvent.getParameter("value");
				if (Util.isEmpty(sWarehouseNumber)) {
					var oWarehouseInput = this.byId(warehouseInputId);
					oWarehouseInput.focus();
				} else {
					Global.setWarehouseNumber(sWarehouseNumber);
					this.bindWorkCenter("");
					this.bindStorageBin("");
					this.updateInputWithDefault(this.byId(workCenterInputId), "");
					this.updateInputWithDefault(this.byId(storageBinInputId), "");
					this.byId(workCenterInputId).setEditable(true);
					this.byId(storageBinInputId).setEditable(true);
					var oWorkCenterInput = this.byId(workCenterInputId);
					oWorkCenterInput.focus();
				}
				return;
			}

			// change is done by manul input
			this.focusDummyElement();
			var sValue = Util.trim(oEvent.getParameter("newValue")).toUpperCase();
			if (this.isInTextAndIdFormat(sValue)) {
				sValue = this.getIdFromTextAndIdFormat(sValue);
			}
			this.onWarehouseVerify(sValue);
		},
		onStorageBinChange: function (oEvent) {
			if (!Util.isEmpty(oEvent.getParameter("bSKipVerify")) && oEvent.getParameter("bSKipVerify")) {
				//the storage bin does not require verification
				return;
			}
			
			this.byId(startPackingId).setEnabled(false);
			this.focusDummyElement();
			var sValue = Util.trim(oEvent.getParameter("newValue")).toUpperCase();
			if (Util.isEmpty(oEvent.getParameter("validated")) || !oEvent.getParameter("validated")) {
				//by manual input
				this.onStorageBinVerify(sValue);
			}
		},
		verifyStorageBin: function (sValue) {
			var oInput = this.byId(storageBinInputId);
			this.setBusy(true);
			return Service.verifyStorageBin(sValue)
				.then(function (oResult) {
					this.setBusy(false);
					Global.setBin(oResult.EWMStorageBin);
					this.updateInputWithDefault(oInput, sValue);
					this.byId(startPackingId).setEnabled(true);
					oInput.focus();
					this.byId(workCenterInputId).setEnabled(true);
					this.byId(storageBinInputId).setEnabled(true);
				}.bind(this))
				.catch(function (oError) {
					this.setBusy(false);
					if (Util.isEmpty(oError._vPara)) {
						var sError = this.getI18nText("incorrectStorageBin", sValue);
						this.updateInputWithError(oInput, sError);
					} else {
						this.updateInputWithError(oInput, oError._vPara.MsgVar);
					}
					this.playAudio(Const.ERROR);
					oInput.focus();
				}.bind(this));
		},

		onStartPacking: function (oEvent) {
			var sWorkCenter = Global.getPackStation();
			var sStorageBin = this.byId(storageBinInputId).getValue();
			var sMode = PackingModeHelper.getSelectedMode();

			this.setBusy(true);
			Service.getMaterialAndExceptionList()
				.then(function (aResults) {
					if (aResults[0].length === 0) {
						throw new CustomError(Const.ERRORS.NO_MATERIAL);
					} else {
						Material.setData(aResults[0]);
					}
					Global.setExceptionList(aResults[1]);
				}.bind(this))
				.then(function () {
					this.oContainer.setItemValue("workCenter", sWorkCenter);
					this.oContainer.setItemValue("storageBin", sStorageBin);
					this.oContainer.setItemValue("ewmWarehouse", Global.getWarehouseNumber());
					if (PackingModeHelper.getSelectedMode() !== Const.INTERNAL_MODE) {
						this.oContainer.setItemValue("packingMode", sMode);
					}
					return this.oContainer.save();
				}.bind(this))
				.then(function () {
					var oRouter = this.getRouter();
					if (sMode === Const.ADVANCED_MODE) {
						oRouter.navTo(Const.ADVANCED_ROUTE_NAME);
					} else if (sMode === Const.BASIC_MODE) {
						if (Material.getFavoriteMaterials().length === 0) {
							throw new CustomError(Const.ERRORS.NO_FAVORITE_MATERIAL);
						} else {
							oRouter.navTo(Const.BASIC_ROUTE_NAME);
						}
					} else {
						oRouter.navTo(Const.INTERNAL_ROUTE_NAME);
					}
				}.bind(this))
				.then(function () {
					this.setBusy(false);
				}.bind(this))
				.catch(function (oError) {
					if (Util.isEmpty(oError._vPara)) {
						if (oError._sKey === Const.ERRORS.NO_MATERIAL) {
							var sErrorMessage = this.getI18nText("noMaterialInWarehouse", Global.getWarehouseNumber());
							this.showErrorMessageBox(sErrorMessage);
						} else if (oError._sKey === Const.ERRORS.NO_FAVORITE_MATERIAL) {
							var sError = this.getI18nText("noFavoriteMaterialInWorkCenter", Global.getPackStation());
							this.showErrorMessageBox(sError);
						}
					}
					this.setBusy(false);
				}.bind(this));
		},

		onDefaultInputLiveChanged: function () {
			this.byId(startPackingId).setEnabled(false);
		},
		focusDummyElement: function () {
			this.byId(dummyId).setValue("");
			this.byId(dummyId).focus();
		},
		onPackingModeChange: function (oEvent) {
			var oElement = this.byId("mode-selection");
			var sNewKey = oElement.getSelectedKey();
			PackingModeHelper.setSelectedMode(sNewKey);
			var sWorkCenter = Global.getPackStation();
			var sStorageBin = Global.getBin();
			if (!Util.isEmpty(sWorkCenter) && !Util.isEmpty(sStorageBin)) {
				this.byId(startPackingId).setEnabled(true);
			}
		},
		bindAudioAggregation: function () {
			var oAudioView = this.getAudioParent(this.oView);
			var oWarehouseNumberFilter = new Filter("EWMWarehouse", FilterOperator.EQ, Global.getWarehouseNumber());
			oAudioView.getController().bindAudioList([oWarehouseNumberFilter]);
		},
		getAudioParent: function (oView) {
			if (oView.byId && oView.byId(audioId)) {
				this.oAudio = oView;
			} else {
				this.getAudioParent(oView.getParent());
			}
			return this.oAudio;
		},

		filterTable: function (oTableBindingItems, aKeys, aFilterValues) {
			oTableBindingItems.filter(Util.getFilters(aKeys, aFilterValues));
		},

		formatUpperCase: function (sValue) {
			if (!Util.isEmpty(sValue)) {
				return sValue.toUpperCase();
			} else {
				return "";
			}
		}
	});
});