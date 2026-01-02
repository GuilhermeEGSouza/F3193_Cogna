/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/workflows/WorkFlow",
	"scm/ewm/packoutbdlvs1/utils/Util",
	"scm/ewm/packoutbdlvs1/utils/Const",
	"scm/ewm/packoutbdlvs1/modelHelper/Message",
	"scm/ewm/packoutbdlvs1/service/ODataService",
	"scm/ewm/packoutbdlvs1/modelHelper/Cache",
	"scm/ewm/packoutbdlvs1/modelHelper/Global"
], function (WorkFlow, Util, Const, Message, Service, Cache, Global) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function (aProducts, oParams) {
				oParams.aProducts = aProducts;
			}, oSourceController, "set oParams")
			.then(function () {
				return this.updateItemWeightInNeed();
			}, oSourceController, "check if there exists source item which is not in ItemWeight")
			.then(function (aProducts, oParams) {
				//send backend service
				return Service
					.packAll(aProducts);
			}, oSourceController)
			.then(function (preResult, oParams) {
				// this.setBusy(false);
				oParams.NetWeight = preResult.NetWeight;
				oParams.WeightUoM = preResult.WeightUoM;
				this.oItemHelper.clear();
				Global.setProductId("");
				this.disableButtons();
			}, oSourceController, "remove item from left")
			.then(function () {
				this.unbindProductInfo();
				this.unbindImage();
			}, oSourceController, "unbind product info")
			.then(function () {
				this.unbindODOInfo();
				this.focus(Const.ID.PRODUCT_INPUT);
			}, oSourceController, "update odo info")
			.then(function () {
				this.updateInputWithDefault(Const.ID.SHIP_INPUT, "");
			}, oShipController, "clear ship input")
			.then(function (preResult, oParam) {
				oParam.bShipHUEmptyBeforePack = this.oItemHelper.isEmpty();
				return Service
					.getHUItems(Global.getCurrentShipHandlingUnit(), Const.SHIP_TYPE_HU);
			}, oShipController)
			.then(function (preResult, oPara) {
				this.setBusy(false);
				this.oItemHelper.setItems(preResult);
				this.oItemHelper.setItemsStatusToNone();
				this.oItemHelper.setItemHighlightByIndex(0);
				this.handleUnpackEnable();
			}, oShipController, "add item in the right table")
			.then(function (preResult, oParam) {
				if (oParam.bShipHUEmptyBeforePack) {
					Cache.updateShipHUConsGroup(Global.getCurrentShipHandlingUnit(), oParam.aProducts[0].EWMConsolidationGroup);
				}
			}, oShipController, "if it is the first item in the right, update packing info")
			.then(function () {
				this.dehilightShipHandlingUnits();
			}, oShipController)
			.then(function (preResult, oParam) {
				this.updateNetWeightRelated(oParam.NetWeight, oParam.WeightUoM);
				this.clearGrossWeight();
				this.clearPackingInstr();
			}, oShipController, "update weight chart, color and text")
			.then(function (preResult, oParam) {
				this.updateCacheIsEmptyHU();
			}, oShipController, "update cache")
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
				this.focus(Const.ID.PRODUCT_INPUT);
				this.playAudio(Const.ERROR);
			}, oSourceController);
		return oWorkFlow;

	};
});