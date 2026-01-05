/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/workflows/WorkFlow",
	"zcogna/ewm/packoutbdlvs1/utils/Util",
	"zcogna/ewm/packoutbdlvs1/utils/Const",
	"zcogna/ewm/packoutbdlvs1/utils/CustomError",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Message",
	"zcogna/ewm/packoutbdlvs1/service/ODataService",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Cache",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Global"
], function (WorkFlow, Util, Const, CustomError, Message, Service, Cache, Global) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function (oProduct, oParam) {
				oParam.oProduct = oProduct;
				return Service
					.unpack(oProduct);
			}, oShipController, "call backend service")
			.then(function (preResult, oParam) {
				oParam.StockItemUUID = preResult.StockItemUUID;
				return preResult;
			})
			.then(oShipController.unpackCallback, oShipController,
				"delete the ship hu from ui and interupt the following actions, if it is deleted from backend")
			.then(function (preResult, oParam) {
				this.updateInputWithDefault(Const.ID.SHIP_INPUT, "");
				this.updateNetWeightRelated(preResult.NetWeight, preResult.WeightUoM);
				this.clearGrossWeight();
			}, oShipController, "update weight chart, color and text")
			.then(function (preResult, oParam) {
				this.oItemHelper.deleteItem(oParam.oProduct);
			}, oShipController, "remove product from right table")
			.then(function () {
				if (this.oItemHelper.isEmpty()) {
					Cache.updateShipHUConsGroup(Global.getCurrentShipHandlingUnit(), "");
					this.updateScaleWeight("");
				}
			}, oShipController, "clear ship side if it is empty after unpack")
			.then(function () {
				this.dehilightShipHandlingUnits();
			}, oShipController)
			.then(function () {
				if (!this.oItemHelper.isEmpty()) {
					this.oItemHelper.setItemHighlightByIndex(0);
				}
				this.handleUnpackEnable();
			}, oShipController, "set item hightlight")
			.then(function (preResult, oParam) {
				return this.handleUnpackItemsWithDifferentODO(oParam.oProduct);
			}, oShipController, "if source is ODO, ship items with different odo will be unpack to bin")
			.then(function (preResult, oParam) {
				return Service
					.getHUItems(Global.getSourceId());
			}, oShipController)
			.then(function (preResult, oParam) {
				this.setBusy(false);
				this.oItemHelper.setItems(preResult);
				Global.setProductId(oParam.oProduct.ProductName);
				this.oItemHelper.sortItemsByKey(oParam.StockItemUUID, oParam.oProduct.Huident);
			}, oSourceController, "add item to the left table")
			.then(function () {
				Global.setExceptionEnable(true);
				this.oItemHelper.setItemsStatusByConsGrp();
				this.oItemHelper.setItemHighlightByIndex(0);
			}, oSourceController)
			.then(function () {
				this.bindODOInfo();
				this.bindImage();
			}, oSourceController, "update odo")
			.then(function () {
				this.bindProductInfo();
				this.focus(Const.ID.PRODUCT_INPUT);
			}, oSourceController, "update product info")
			.then(function (preResult, mSession) {
				if (this.oItemHelper.isEmpty()) {
					var sConsolidationGroup = mSession.oProduct.EWMConsolidationGroup;
					this.hilightShipHandlingUnitsByConsolidationGroup(sConsolidationGroup);
				}
			}, oShipController, "trigger hilight ship hu as the current ship hu is empty and may ready for the coming product")
			.then(function (preResult, oParam) {
				oParam.sODO = this.oItemHelper.getItemDocNoByIndex(0);
				oParam.sPackInstr = this.oItemHelper.getItemPackInstrByIndex(0);
			}, oSourceController)
			.then(function (preResult, oParam) {
				this.updatePackingInstr(oParam.sODO, oParam.sPackInstr);
			}, oShipController, "update packing info")
			.then(function (preResult, oParam) {
				this.updateCacheIsEmptyHU();
			}, oShipController, "update cache")
			.then(function () {
				this.handlePackAllEnable();
			}, oSourceController)
			.then(function (preResult, mSession) {
				this.delayCalledAdjustContainerHeight();
			}, oShipController);

		oWorkFlow
			.errors()
			.default(function (sError, vPara, mSession, bCustomError) {
				if (bCustomError) {
					this.showErrorMessagePopup(sError);
				}
			}, oSourceController)
			.always(function () {
				this.setBusy(false);
				this.playAudio(Const.ERROR);
			}, oSourceController);
		return oWorkFlow;

	};
});