/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/workflows/WorkFlow",
	"scm/ewm/packoutbdlvs1/service/ODataService",
	"scm/ewm/packoutbdlvs1/utils/Util",
	"scm/ewm/packoutbdlvs1/utils/Const",
	"scm/ewm/packoutbdlvs1/modelHelper/Message",
	"scm/ewm/packoutbdlvs1/modelHelper/Global",
	"scm/ewm/packoutbdlvs1/modelHelper/Cache",
	"scm/ewm/packoutbdlvs1/modelHelper/Material"
], function (WorkFlow, Service, Util, Const, Message, Global, Cache, Material) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function (sHuId, mSession) {
				mSession.sHuId = sHuId;
				if (!this.oItemHelper.isEmpty()) {
					mSession.mItems = this.oItemHelper.getAllItems();
					return this.flushPendings();
				}
			}, oShipController)
			.then(function (preResult, mSession) {
				this.setBusy(true);
				return Service.changeMaterial("");
			}, oShipController)
			.then(function (preResult, mSession) {
				mSession.sNewHuId = preResult.HuId;
				Global.changeShipHandlingUnit(mSession.sHuId, preResult.HuId);
				this.setCurrentShipHandlingUnit(preResult.HuId);
				return this.recreateTab(mSession.sHuId, preResult.HuId, true);
			}, oShipController)
			.then(function (preResult, mSession) {
				this.updateMaterialButtonsAfterChange();
				this.updateCurrentMaterialAfterChange();
				this.clearGrossWeight();
			}, oShipController)
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
				this.setBusy(false);
				var sMessage = this.getTextAccordingToMode("changeHUMaterialSuccessfulMsg", "changeShipHUMaterialSuccessfulMsg", [mSession.sNewHuId]);
				Message.addSuccess(sMessage);
				this.playAudio(Const.INFO);
			}, oShipController);

		oWorkFlow
			.errors()
			.default(function (sError, vPara, mSession, bCustomError) {
				if (bCustomError) {
					this.showErrorMessagePopup(sError);
				}
			}, oSourceController)
			.always(function (sError, vPara, mSession) {
				this.setBusy(false);
				this.clearGrossWeight();
				//When call by flushPending, vPara would be empty, packing material shouldn't change
				if (!Util.isEmpty(vPara.PackagingMaterial)) {
					Material.setFavoriteMaterialSelectedById(Material.getCurrentMaterialId(), false);
					var oMaterial = Material.getMaterialById(vPara.PackagingMaterial);
					Material.setCurrentMaterial(oMaterial);
					Material.setFavoriteMaterialSelectedById(vPara.PackagingMaterial, true);
				}

				if (!Util.isEmpty(vPara.HuId)) {
					Service.getHUItems(vPara.HuId, Const.SHIP_TYPE_HU)
						.then(function (aItems) {
							this.oItemHelper.setItems(aItems);
							if (aItems.length !== 0) {
								Cache.updateShipHUConsGroup(vPara.HuId, aItems[0].EWMConsolidationGroup);
								this.updateShipItemStatus();
							} else {
								Cache.updateShipHUConsGroup(vPara.HuId, "");
							}
							/*
							 * Once request shipping handling unit items, the DefaultAlterQuan, OperationDeltaQuan and PackedQuan are missing,
							 * the below steps will recover those values from the items in shipping handling unit last status.
							 */
							this.oItemHelper.setItemsPreviousAlterQuan();
							this.oItemHelper.setItemsDefaultQuan(mSession.mItems);
							this.oItemHelper.setItemsDeltaQuan();
							this.oItemHelper.setItemsPackedQuan();
						}.bind(this))
						.catch(function (oError) {});
				}
				this.playAudio(Const.ERROR);
			}, oShipController);
		return oWorkFlow;
	};
});