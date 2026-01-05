/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/workflows/WorkFlow",
	"zcogna/ewm/packoutbdlvs1/utils/Util",
	"zcogna/ewm/packoutbdlvs1/service/ODataService",
	"zcogna/ewm/packoutbdlvs1/utils/Const",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Global",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Cache"
], function (WorkFlow, Util, Service, Const, Global, Cache) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function (sHuid, mSession) {
				this.setBusy(true);
				mSession.Huid = sHuid;
				return Service.getHUItems(sHuid, Const.SHIP_TYPE_HU);
			}, oShipController)
			.then(function (preResult, mSession) {
				this.setBusy(false);
				this.oItemHelper.setItems(preResult);
				this.updateShippingHUMaterial(mSession.Huid);
				this.updateShipItemStatus();
				this.oItemHelper.setItemsPreviousAlterQuan();
				this.oItemHelper.setItemsPackedQuan();
				this.oItemHelper.setItemsDeltaQuan();
				this.oItemHelper.setItemsDefaultQuan();
				this.oItemHelper.setItemsStatusByConsGrp();
				this.clearGrossWeight();
				this.setBusy(false);
			}, oShipController)
			.then(function () {
				this.focus(Const.ID.PRODUCT_INPUT);
			}, oSourceController)
			.then(function (pre, mSession) {
				if (this.oItemHelper.getAllItems().length > 0) {
					Cache.updateShipHUConsGroup(Global.getCurrentShipHandlingUnit(), this.oItemHelper.getAllItems()[0].EWMConsolidationGroup);
					this.oItemHelper.setItemsStatusToNone();
					this.oItemHelper.setItemHighlightByIndex(0);
				} else {
					Cache.updateShipHUConsGroup(Global.getCurrentShipHandlingUnit(), "");
				}
			}, oShipController, "if it is the first item in the right, update packing info")
			.then(function (preResult, oParam) {
				oParam.sODO = "";
				oParam.sPackInstr = "";
				if (this.oItemHelper.getHighLightedItemIndex() === 0) {
					oParam.sODO = this.oItemHelper.getItemDocNoByIndex(0);
					oParam.sPackInstr = this.oItemHelper.getItemPackInstrByIndex(0);
				}
			}, oSourceController)
			.then(function (preResult, oParam) {
				this.updatePackingInstr(oParam.sODO, oParam.sPackInstr);
			}, oShipController, "update packing info")
			.then(function (preResult, mSession) {
				var oProduct = Global.getSelectedProductInShip();
				if (!Util.isEmpty(oProduct)) {
					var index = this.oItemHelper.getItemIndexByKey(oProduct.StockItemUUID, mSession.Huid);
					if (index >= 0) {
						this.oItemHelper.setItemsStatusToNone();
						this.oItemHelper.setItemHighlightByIndex(index);
					}
					Global.setSelectedProductInShip("");
				}
			}, oShipController, "highlight specific item in the ship table");

		oWorkFlow
			.errors()
			.subscribe(Const.ERRORS.NO_AUTHORIZATION_FOR_WAREHOUSE, function (sError) {
				this.showToLeaveMessagePopup(sError);
			}, oSourceController)
			.default(function (sError, vPara, mSession, bCustomError) {
				if (bCustomError) {
					this.showErrorMessagePopup(sError);
				}
			}, oSourceController)
			.subscribe("", function () {})
			.always(function () {
				Global.setBusy(false);
				this.playAudio(Const.ERROR);
			}, oShipController);
		return oWorkFlow;

	};
});