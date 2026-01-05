/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/workflows/WorkFlow",
	"zcogna/ewm/packoutbdlvs1/service/ODataService",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Global",
	"zcogna/ewm/packoutbdlvs1/modelHelper/SerialNumber",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Cache",
	"zcogna/ewm/packoutbdlvs1/utils/Util",
	"zcogna/ewm/packoutbdlvs1/utils/Const",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Message"
], function (WorkFlow, Service, Global, SerialNumber, Cache, Util, Const, Message) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function (oPackInfo, mSession) {
				mSession.iQuantity = oPackInfo.iQuantity;
				mSession.oDialog = oPackInfo.oDialog;
				mSession.oProduct = oPackInfo.oProduct;
				mSession.sUoM = oPackInfo.sUoM;
				mSession.sStockItemUUID = oPackInfo.oProduct.StockItemUUID;
				if (!Util.isEmpty(mSession.oProduct.SerialNumberRequiredLevel)) {
					var sPackSn = SerialNumber.convertSerialNumbersToString();
					if (mSession.oProduct.isIuidActive === Const.ABAP_TRUE) { //IUID active
						mSession.oProduct.IuidList = SerialNumber.getPackedUiis(
							mSession.oProduct.SnList.split(" "),
							mSession.oProduct.IuidList.split(" "),
							sPackSn.split(" "));
					}
					mSession.oProduct.SnList = sPackSn;
				}
			}, oSourceController, "set mSesssion")
			.then(function () {
				return this.updateItemWeightInNeed();
			}, oSourceController, "check if there exists source item which is not in ItemWeight")
			.then(function (preResult, mSession) {
				return Service
					.pack(mSession.oProduct, mSession.iQuantity, mSession.sUoM);
			}, oSourceController)
			.then(function (preResult, mSession) {
				mSession.NetWeight = preResult.NetWeight;
				mSession.WeightUoM = preResult.WeightUoM;
				mSession.oUpdateInfo = preResult;
				return Service.getHUItems(Global.getSourceId());
			}, oSourceController,"get source hu items")
			.then(function (preResult, mSession) {
				mSession.oDialog.setBusy(false);
				this.closeDialog(mSession.oDialog);
				var oSourceItem = Util.find(preResult, function (oItem) {
					if (oItem.StockItemUUID === mSession.sStockItemUUID) {
						return true;
					}
					return false;
				});
				this.oItemHelper.updateItemQuantityByIndex(0, Util.parseNumber(oSourceItem.AlterQuan), Util.parseNumber(oSourceItem.Quan));
				this.oItemHelper.updateItemWeightByIndex(0, Util.parseNumber(oSourceItem.NetWeight), oSourceItem.WeightUoM);
				this.oItemHelper.updateItemVolumeByIndex(0, Util.parseNumber(oSourceItem.Volume), oSourceItem.VolumeUoM);
				mSession.oProduct = this.getNewItemWithPartialQuantity(mSession.oProduct, mSession.oUpdateInfo);
				this.focus(Const.ID.PRODUCT_INPUT);
			}, oSourceController)
			.then(function (preResult, mSession) {
				if (this.oItemHelper.isStockLevelSerialNumber()) {
					var aCurrentSnList = this.oItemHelper.getSerialNumberListByIndex(0);
					this.oItemHelper.removeSerialNumberFromCurrentItem(SerialNumber.getAllSerialNumerKeys());
					if (mSession.oProduct.isIuidActive === Const.ABAP_TRUE) { //IUID Active check
						this.oItemHelper.removeSerialNumberUiiFromCurrentItem(aCurrentSnList, SerialNumber.getAllSerialNumerKeys());
					}
				} else {
					if (this.oItemHelper.isSerialNumbersAllInSnListByIndex(0, SerialNumber.getAllSerialNumerKeys())) {
						this.oItemHelper.removeSerialNumberFromCurrentItem(SerialNumber.getAllSerialNumerKeys());
					} else {
						this.oItemHelper.clearSnListByIndex(0);
						this.oItemHelper.removeSerialNumberFromOtherItems(mSession.oProduct.ProductName, SerialNumber.getAllSerialNumerKeys());
					}
				}
			}, oSourceController)
			.then(function (preResult, mSession) {
				this.updateInputWithDefault(Const.ID.SHIP_INPUT, "");
				//add item in the right table
				mSession.bShipHUEmptyBeforePack = this.oItemHelper.isEmpty();
				this.oItemHelper.updateItem(mSession.oProduct);
				this.oItemHelper.setItemsStatusToNone();
				this.oItemHelper.setItemHighlightByIndex(0);
				this.handleUnpackEnable();
			}, oShipController)
			.then(function (preResult, mSession) {
				this.updateNetWeightRelated(mSession.NetWeight, mSession.WeightUoM);
				this.clearGrossWeight();
			}, oShipController,"update weight chart, color and text")
			.then(function () {
				this.dehilightShipHandlingUnits();
			}, oShipController)
			.then(function (preResult, mSession) {
				if (mSession.bShipHUEmptyBeforePack) {
					Cache.updateShipHUConsGroup(Global.getCurrentShipHandlingUnit(), mSession.oProduct.EWMConsolidationGroup);
				}
			}, oShipController)
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
			.always(function (sError, vPara, mSession) {
				mSession.oDialog.setBusy(false);
				this.closeDialog(mSession.oDialog);
				this.focus(Const.ID.PRODUCT_INPUT);
				this.playAudio(Const.ERROR);
				if (!Util.isEmpty(Global.getSourceId())) {
					Global.setExceptionEnable(false);
					Service.getHUItems(Global.getSourceId())
						.then(function (aItems) {
							if (aItems[0]) {
								this.oItemHelper.setItems(aItems);
								this.oItemHelper.sortItemsByKey(mSession.oProduct.StockItemUUID, mSession.oProduct.Huident);
								this.bindODOInfo();
								this.oItemHelper.setItemsStatusByConsGrp();
							}
						}.bind(this))
						.catch(function (oError) {});
				}
			}, oSourceController);
		return oWorkFlow;

	};
});