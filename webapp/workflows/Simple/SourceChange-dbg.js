/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/workflows/WorkFlow",
	"scm/ewm/packoutbdlvs1/utils/Util",
	"scm/ewm/packoutbdlvs1/modelHelper/Global",
	"scm/ewm/packoutbdlvs1/modelHelper/Material",
	"scm/ewm/packoutbdlvs1/service/ODataService",
	"scm/ewm/packoutbdlvs1/utils/CustomError",
	"scm/ewm/packoutbdlvs1/modelHelper/Cache",
	"scm/ewm/packoutbdlvs1/utils/Const"
], function (WorkFlow, Util, Global, Material, Service, CustomError, Cache, Const) {
	"use strict";
	var sourceHUId = "source-hu-input";
	return function (oSourceController, oShipController, oFactory) {
		var oWorkFlow = new WorkFlow()
			.then(function (mPara, mSession) {
				this.setBusy(true);
				mSession.sInput = mPara.sReferenceNumber;
				this.updateInputWithDefault(sourceHUId, "");
				mSession.bToCreateShipHU = mPara.bToCreateShipHU === false ? false : true;
				mSession.bToSelectProductInSource = mPara.bToSelectProductInSource === true ? true : false;
			}, oSourceController, "disable ui interaction")
			.then(function (preResult, mSession) {
				if (!this.oItemHelper.isEmpty()) {
					return this.flushPendings();
				}
			}, oShipController)
			.then(function (mResponse, mSession) {
				if (Global.isShipHandlingUnitExist(mSession.sInput)) {
					return this.getHandlingUnitDisplayWhenScanOnOtherSide();
				}
			}, oShipController, "if the user scans the ship hu, determine how to display it")
			.then(function (preResult, mSession) {
				if (Global.isShipHandlingUnitExist(mSession.sInput)) {
					if (mSession.sInput === Global.getCurrentShipHandlingUnit()) {
						var oClearInfo = {
							"bClearSource": false,
							"bClearShip": true
						};
						this.getWorkFlowFactory().getClearWorkFlow().run(oClearInfo);
					}
				}
			}, oShipController, "remove ship hu if need")
			.then(function () {
				this.byId("product-info").unbindElement();
				this.oItemHelper.clear();
				Global.setProductId("");
			}, oSourceController, "clear the info of previouse source hu/bin")
			.then(function (preResult, oParam) {
				this.clearPackingInstr();
			}, oShipController, "update packing info")
			.then(function (preResult, mSession) {
				return Service.convertHUID(mSession.sInput);
			}, oSourceController, "conver hu id")
			.then(function (preResult, mSession) {
				mSession.sInput = preResult.Huident;
				this.setBusy(true);
				return Service
					.verifySource(mSession.sInput);
			}, oSourceController, "verify input")
			.then(function (mResponse) {
				if (mResponse.Closed) {
					throw new CustomError(Const.ERRORS.SHIP_HU_ALREADY_CLOSED);
				}
				Global.setPackAllEnable(false);
				Global.setSourceId(mResponse.SourceId);
				Global.setSourceType(mResponse.SourceType);
				Global.setSourceMaterialId(mResponse.PackagingMaterial);
				Global.setIsPickHUInSourceSide(mResponse.IsPickHU);
			}, oSourceController, "set gloable model")
			.then(function () {
				return Service
					.getHUItems(Global.getSourceId());
			}, oSourceController, "request the HU/Bin items")
			.then(function (aItem, mSession) {
				this.oItemHelper.setItems(aItem);
				if (aItem.length !== 0) {
					this.oItemHelper.setItemsStatusByConsGrp();
					this.oItemHelper.setItemsDefaultQuan();
				}
				mSession.aItem = aItem;
			}, oSourceController, "update items info to helper method")
			.then(function (preResult, mSession) {
				if (this.oItemHelper.isSerialNumberEnable() || this.oItemHelper.isBatchEnable()) {
					throw new CustomError(Const.ERRORS.NOT_SUPPORT_SN_BATCH, this.getI18nText("serialNumberOrBatchManagedNotSupport"));
				}
				if (this.oItemHelper.isItemSplitEnable()) {
					throw new CustomError(Const.ERRORS.NOT_SUPPORT_STOCK_ID_SPLIT, this.getI18nText("stockIdSplitNotSupport"));
				}
				if (this.oItemHelper.isMultipleSourceLocation()) {
					throw new CustomError(Const.ERRORS.NOT_SUPPORT_MULTI_SOURCE_LOCATION, this.getI18nText("multipleSourceLocationNotSupport"));
				}
			}, oSourceController, "throw error message if contains s/n or batch")
			.then(function (preResult, mSession) {
				var sShippingHU = Global.getCurrentShipHandlingUnit();
				if (!Util.isEmpty(sShippingHU)) {
					var sConsGroup = Cache.getShipHUConsGroup(sShippingHU);
					if (!Util.isEmpty(sConsGroup) && mSession.aItem.length !== 0 && !this.oItemHelper.isItemsContainsConsGroup(sConsGroup) && Global.getCheckConsolidationGroup()) {
						var sMessage = this.getTextAccordingToMode("differentConsGroupWithHUMsg", "differentConsGroupWithShipHUMsg");
						this.showErrorMessageBox(sMessage);
					}
				}
			}, oSourceController, "throw error message if doesn't contain groups belong to current ship hu")
			.then(function (preResult, mSession) {
				if (mSession.bToCreateShipHU && mSession.aItem.length !== 0 && !Global.hasOpenShipHandlingUnit() && Material.getDefaultMaterialId()) {
					return oFactory.getShipHUCreationWorkFlow().run({
						sHuId: "",
						sMaterialId: Material.getDefaultMaterialId()
					}).getResult();
				} else if (Util.isEmpty(Material.getDefaultMaterialId()) && !Global.hasOpenShipHandlingUnit()) {
					var sError = this.getI18nText("materialEmptyMsg");
					throw new CustomError(Const.ERRORS.NO_PACKAGING_MATERIAL_SELECTED, sError);
				}
			}, oShipController, "auto create a ship hu, if no ship hu and has a default material")
			.then(function () {
				this.handlePackAllEnable();
			}, oSourceController, "enable pack all if the items of source/ship hu belongs to same consolidation group")
			.then(function () {
				this.updateShipItemStatus();
			}, oShipController, "update status of ship hu item")
			.then(function () {
				this.setBusy(false);
				this.updateInputWithDefault(Const.ID.PRODUCT_INPUT, "");
				this.focus(Const.ID.PRODUCT_INPUT);
			}, oSourceController, "enable ui interaction")
			.then(function (preResult, mSession) {
				this.delayCalledAdjustContainerHeight();
			}, oShipController)
			.then(function (preResult, mSession) {
				if (mSession.bToSelectProductInSource) {
					var oProduct = Global.getSelectedProductInSource();
					if (!Util.isEmpty(oProduct)) {
						var index = this.oItemHelper.getItemIndexByKey(oProduct.StockItemUUID, oProduct.Huident);
						if (index >= 0) {
							var mPara = {
								bToPackProduct: false,
								oProduct: oProduct
							};
							this.getWorkFlowFactory().getProductChangeWorkFlow().run(mPara);
						}
					}
				}
			}, oSourceController, "select one product in source table");;

		oWorkFlow
			.errors()
			.subscribe(Const.ERRORS.HU_NOT_EXIST, function (sError) {
				this.updateInputWithError(sourceHUId, sError);
			}, oSourceController)
			.subscribe(Const.ERRORS.BIN_NOT_EXIST, function () {
				var sError = this.getI18nText(Const.ERRORS.BIN_NOT_EXIST);
				this.updateInputWithError(sourceHUId, sError);
			}, oSourceController)
			.subscribe(Const.ERRORS.BIN_NOT_IN_PACKING_STATION, function () {
				var sError = this.getI18nText(Const.ERRORS.BIN_NOT_EXIST);
				this.updateInputWithError(sourceHUId, sError);
			}, oSourceController)
			.subscribe(Const.ERRORS.SOURCE_NO_ITEM, function () {
				var sError = this.getTextAccordingToMode("sourceWithoutItem", "sourceNoItem", [Global.getSourceId()]);
				this.updateInputWithError(sourceHUId, sError);
			}, oSourceController)
			.subscribe(Const.ERRORS.SCAN_SHIPHU_IN_SOURCE_INPUT, function () {
				var sError = this.getTextAccordingToMode("scanHUInSourceInput", "scanShipInSourceInput", [Global.getSourceId()]);
				this.updateInputWithError(sourceHUId, sError);
			}, oSourceController)
			.subscribe(Const.ERRORS.HU_NOT_IN_WORK_CENTER, function (sError) {
				this.updateInputWithError(sourceHUId, sError);
			}, oSourceController)
			.subscribe(Const.ERRORS.STORAGE_BIN_NOT_IN_WAREHOUSE, function (sError) {
				this.updateInputWithError(sourceHUId, sError);
			}, oSourceController)
			.subscribe(Const.ERRORS.NOT_SUPPORT_SN_BATCH, function (sError) {
				this.updateInputWithError(sourceHUId, sError);
			}, oSourceController)
			.subscribe(Const.ERRORS.NOT_SUPPORT_STOCK_ID_SPLIT, function (sError) {
				this.updateInputWithError(sourceHUId, sError);
			}, oSourceController)
			.subscribe(Const.ERRORS.NO_PACKAGING_MATERIAL_SELECTED, function (sError) {
				this.showErrorMessagePopup(sError);
			}, oSourceController)
			.subscribe(Const.ERRORS.NO_AUTHORIZATION_FOR_WAREHOUSE, function (sError) {
				this.showToLeaveMessagePopup(sError);
			}, oSourceController)
			.subscribe(Const.ERRORS.SHIP_HU_ALREADY_CLOSED, function (sError, vPara, mSession) {
				var sErrorMessage = this.getTextAccordingToMode("HUClosedMsg", "shipHUClosedMsg", [mSession.sInput]);
				this.updateInputWithError(Const.ID.SOURCE_INPUT, sErrorMessage);
			}, oSourceController)
			.default(function (sError) {
				this.updateInputWithError(sourceHUId, sError);
			}, oSourceController)
			.always(function () {
				this.setBusy(false);
				this.oItemHelper.setItems([]);
				this.byId("product-info").unbindElement();
				Global.setSourceId("");
				Global.setPackAllEnable(false);
				this.focus(sourceHUId);
				this.playAudio(Const.ERROR);
			}, oSourceController);
		return oWorkFlow;

	};
});