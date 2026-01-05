/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/workflows/WorkFlow",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Global",
	"zcogna/ewm/packoutbdlvs1/utils/Util",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Cache",
	"zcogna/ewm/packoutbdlvs1/utils/Const",
	"zcogna/ewm/packoutbdlvs1/service/ODataService"
], function (WorkFlow, Global, Util, Cache, Const, Service) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function (sHuid, oParam) {
				oParam.Huid = sHuid;
				return this.updateTabContent(sHuid);
			}, oShipController)
			.then(function (preResult, oParam) {
					return Service.getHUSet(oParam.Huid, Const.SHIP_TYPE_HU);
				},
				oShipController)
			.then(function (preResult, oParam) {
				oParam.NetWeight = preResult.NetWeight;
				oParam.WeightUoM = preResult.WeightUoM;
			}, oShipController)
			.then(function (preResult, oParam) {
				this.updateNetWeightRelated(oParam.NetWeight, oParam.WeightUoM);
			}, oShipController, "update weight chart, color and text")
			.then(function (preResult, oParam) {
				this.updateShipItemStatus();
			}, oShipController)
			.then(function (preResult, oParam) {
				this.updateSourceItemStatus();
				if (Util.isEmpty(Global.getSourceId())) {
					this.focus(Const.ID.SOURCE_INPUT);
				} else {
					this.focus(Const.ID.PRODUCT_INPUT);
				}
			}, oSourceController)
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
			.then(function (preResult, oParam) {
				this.updateCacheIsEmptyHU();
			}, oShipController, "update cache")
			.then(function (preResult, oParam) {
				var oProduct = Global.getSelectedProductInShip();
				if (!Util.isEmpty(oProduct)) {
					var index = this.oItemHelper.getItemIndexByKey(oProduct.StockItemUUID, oParam.Huid);
					if (index >= 0) {
						this.oItemHelper.setItemsStatusToNone();
						this.oItemHelper.setItemHighlightByIndex(index);
					}
					Global.setSelectedProductInShip("");
				}
			}, oShipController, "highlight specific item in the ship table")
			.then(function (preResult, mSession) {
				this.delayCalledAdjustContainerHeight();
			}, oShipController);

		oWorkFlow
			.errors()
			.subscribe(Const.ERRORS.NO_AUTHORIZATION_FOR_WAREHOUSE, function (sError) {
				this.showToLeaveMessagePopup(sError);
			}, oSourceController)
			.default(function (sError) {
				this.updateInputWithError(Const.ID.SHIP_INPUT, sError);
			}, oShipController)
			.always(function () {
				Global.setBusy(false);
				this.playAudio(Const.ERROR);
			}, oShipController);
		return oWorkFlow;

	};
});