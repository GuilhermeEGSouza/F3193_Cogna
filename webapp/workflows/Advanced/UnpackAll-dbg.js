/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/workflows/WorkFlow",
	"scm/ewm/packoutbdlvs1/utils/Util",
	"scm/ewm/packoutbdlvs1/utils/Const",
	"scm/ewm/packoutbdlvs1/utils/CustomError",
	"scm/ewm/packoutbdlvs1/modelHelper/Message",
	"scm/ewm/packoutbdlvs1/service/ODataService",
	"scm/ewm/packoutbdlvs1/modelHelper/Global",
	"scm/ewm/packoutbdlvs1/modelHelper/Cache"
], function (WorkFlow, Util, Const, CustomError, Message, Service, Global, Cache) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function (aProducts, oParam) {
				oParam.aProducts = aProducts;
				return Service
					.unpackAll(aProducts);
			}, oShipController, "call backend service to unpack all items")
			.then(oShipController.unpackCallback, oShipController,
				"delete the ship hu from ui and interupt the following actions, if it is deleted from backend")
			.then(function (preResult, oParam) {
				this.updateInputWithDefault(Const.ID.SHIP_INPUT, "");
				this.updateNetWeightRelated(preResult.NetWeight, preResult.WeightUoM);
				this.clearGrossWeight();
			}, oShipController, "update weight chart, color and text")
			.then(function (preResult, oParam) {
				this.oItemHelper.clear();
				Global.setUnpackEnable(false);
			}, oShipController, "remove product from right table")
			.then(function () {
				Cache.updateShipHUConsGroup(Global.getCurrentShipHandlingUnit(), "");
				this.updateScaleWeight("");
			}, oShipController, "clear ship side")
			.then(function (preResult, oParam) {
				return this.handleUnpackAllItemsWithDifferentODO(oParam.aProducts);
			}, oShipController, "if source is ODO, ship items with different odo will be unpack to bin")
			.then(function (preResult, oParam) {
				return Service
					.getHUItems(Global.getSourceId());
			}, oShipController)
			.then(function (preResult, oParam) {
				this.setBusy(false);
				this.oItemHelper.setItems(preResult);
				this.oItemHelper.sortItemsByKey(preResult[0].StockItemUUID,preResult[0].Huident);
			}, oSourceController, "add item to the left table")
			.then(function () {
				this.oItemHelper.setItemsStatusByConsGrp();
				Global.setExceptionEnable(false);
				Global.setProductId("");
			}, oSourceController, "update first item and buttons status")
			.then(function () {
				this.unbindProductInfo();
				this.bindODOInfo();
			}, oSourceController, "update odo and product info")
			.then(function () {
				this.focus(Const.ID.PRODUCT_INPUT);
			}, oSourceController)
			.then(function (preResult, oParam) {
				this.clearPackingInstr();
			}, oShipController, "clear packing info")
			.then(function (preResult, oParam) {
				this.updateCacheIsEmptyHU();
			}, oShipController, "update cache")
			.then(function () {
				this.handlePackAllEnable();
			}, oSourceController, "handle packall enable")
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
			}, oShipController);
		return oWorkFlow;

	};
});