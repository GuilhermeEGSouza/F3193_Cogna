/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/workflows/WorkFlow",
	"zcogna/ewm/packoutbdlvs1/service/ODataService",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Global",
	"zcogna/ewm/packoutbdlvs1/utils/Util",
	"zcogna/ewm/packoutbdlvs1/utils/Const",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Message",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Cache",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Material"
], function (WorkFlow, Service, Global, Util, Const, Message, Cache, Material) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function (oChangeInfo, mSession) {
				mSession.oDialog = oChangeInfo.oDialog;
				mSession.bMaterialChanged = oChangeInfo.bMaterialChanged;
				return Service.changeMaterial(oChangeInfo.sHuId);
			}, oShipController)
			.then(function (preResult, mSession) {
				mSession.NetWeight = preResult.NetWeight;
				mSession.WeightUoM = preResult.WeightUoM;
				mSession.sHuId = preResult.HuId;
				mSession.sGrossWeight = this.getGrossWeight();
				var sNewShippingId = preResult.HuId;
				mSession.sOldShippingId = Global.getCurrentShipHandlingUnit();
				Global.changeShipHandlingUnit(mSession.sOldShippingId, sNewShippingId);
				this.setCurrentShipHandlingUnit(sNewShippingId);
			}, oShipController)
			.then(function (preResult, mSession) {
				return this.recreateTab(mSession.sOldShippingId, mSession.sHuId);
			}, oShipController)
			.then(function (preResult, mSession) {
				this.updateCurrentMaterialAfterChange();
				Service.getHUSet(mSession.sHuId, Const.SHIP_TYPE_HU);
				this.setGrossWeight(mSession.sGrossWeight);
			}, oShipController)
			.then(function (preResult, mSession) {
				this.setBusy(true);
				return Service.getHUItems(mSession.sHuId, Const.SHIP_TYPE_HU);
			}, oShipController, "get hu items")
			.then(function (preResult, mSession) {
				this.setBusy(false);
				this.oItemHelper.setItems(preResult);
				this.updateShipItemStatus();
			}, oShipController, "reset ship item status")
		.then(function (preResult, mSession) {
				return this.updateItemWeightInNeed(mSession.sHuId, Const.SHIP_TYPE_HU);
			}, oShipController, "check if there exists ship item which is not in ItemWeight")
			.then(function (preResult, oParam) {
				var fLoadingWeight = this.getLoadingWeightInCurrentShipHandlingUnit();
				var sUOM = this.getWeightUOMInCurrentShipHandlingUnit();
				this.updateNetWeightRelated(fLoadingWeight, sUOM);
				if (oParam.bMaterialChanged) {
					this.clearGrossWeight();
				}
			}, oShipController, "update weight chart, color and text")
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
			.then(function (preResult, mSession) {
				mSession.oDialog.setBusy(false).close();
			})
			.then(function (preResult, mSession) {
				var sMessage = this.getTextAccordingToMode("changeHUMaterialSuccessfulMsg", "changeShipHUMaterialSuccessfulMsg", [mSession.sHuId]);
				Message.addSuccess(sMessage);
				this.playAudio(Const.INFO);
			}, oShipController);

		oWorkFlow
			.errors()
			.subscribe(Const.ERRORS.CREATE_HU_DUPLICATE, function (sError) {
				this.updateInputWithError(Const.ID.CHANGE_SHIP_INPUT, sError);
				this.focus(Const.ID.CHANGE_SHIP_INPUT);
			}, oShipController)
			.subscribe(Const.ERRORS.CHANGE_ID_DUPLICATE, function (sError) {
				this.updateInputWithError(Const.ID.CHANGE_SHIP_INPUT, sError);
				this.focus(Const.ID.CHANGE_SHIP_INPUT);
			}, oShipController)
			.subscribe(Const.ERRORS.HU_ASSIGNED_FAILED, function (sError) {
				this.updateInputWithError(Const.ID.CHANGE_SHIP_INPUT, sError);
				this.focus(Const.ID.CHANGE_SHIP_INPUT);
			}, oShipController)
			.subscribe(Const.ERRORS.CHANGE_MATERIAL_EXCEED_MAX, function (sError) {
				this.byId(Const.ID.ERROR_MATERIAL_STRIP).setText(sError);
				this.setMessageStripVisible(Const.ID.ERROR_MATERIAL_STRIP, true);
			}, oShipController)
			.subscribe(Const.ERRORS.INITIAL_CAN_NOT_READ_HUS, function (sError) {
				this.byId(Const.ID.ERROR_MATERIAL_STRIP).setText(sError);
				this.setMessageStripVisible(Const.ID.ERROR_MATERIAL_STRIP, true);
			}, oShipController)
			.default(function (sError) {
				this.getView().byId("change-material-dialog").close();
			}, oShipController)
			.default(function (sError, vPara, mSession, bCustomError) {
				if (bCustomError) {
					this.showErrorMessagePopup(sError);
				}
			}, oSourceController)
			.always(function (sError, vPara, mSession) {
				this.getView().byId("change-material-dialog").setBusy(false);
				this.clearGrossWeight();
				if (Util.isEmpty(vPara.PackagingMaterial)) {
					Material.setCurrentMaterial({});
				} else {
					var oMaterial = Material.getMaterialById(vPara.PackagingMaterial);
					Material.setCurrentMaterial(oMaterial);
				}
				if (!Util.isEmpty(vPara.HuId)) {
					var sCurrentShippingHU = Global.getCurrentShipHandlingUnit();
					if (sCurrentShippingHU !== vPara.HuId) {
						this.recreateTab(sCurrentShippingHU, vPara.HuId).then(function () {
							Global.setCurrentShipHandlingUnit(vPara.HuId);
							Global.changeShipHandlingUnit(sCurrentShippingHU, vPara.HuId);
						});
					}
					Service.getHUItems(vPara.HuId, Const.SHIP_TYPE_HU)
						.then(function (aItems) {
							this.oItemHelper.setItems(aItems);
							if (aItems.length !== 0) {
								Cache.updateShipHUConsGroup(vPara.HuId, aItems[0].EWMConsolidationGroup);
								this.updateShipItemStatus();
							} else {
								Cache.updateShipHUConsGroup(vPara.HuId, "");
							}
							this.updateCacheIsEmptyHU();
							this.updateItemWeightInNeed(vPara.HuId, Const.SHIP_TYPE_HU)
								.then(function () {
									var fLoadingWeight = this.getLoadingWeightInCurrentShipHandlingUnit();
									var sUOM = this.getWeightUOMInCurrentShipHandlingUnit();
									this.updateNetWeightRelated(fLoadingWeight, sUOM);
								}.bind(this));
						}.bind(this))
						.catch(function (oError) {});
				}
				this.playAudio(Const.ERROR);
			}, oShipController);

		return oWorkFlow;
	};
});