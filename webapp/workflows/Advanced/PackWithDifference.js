/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/workflows/WorkFlow",
	"scm/ewm/packoutbdlvs1/service/ODataService",
	"scm/ewm/packoutbdlvs1/modelHelper/Global",
	"scm/ewm/packoutbdlvs1/modelHelper/SerialNumber",
	"scm/ewm/packoutbdlvs1/modelHelper/Cache",
	"scm/ewm/packoutbdlvs1/utils/Util",
	"scm/ewm/packoutbdlvs1/utils/Const",
	"scm/ewm/packoutbdlvs1/modelHelper/Message"
], function (WorkFlow, Service, Global, SerialNumber, Cache, Util, Const, Message) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function (aPackInfo, mSession) {
				mSession.oProduct = aPackInfo[0];
				mSession.fDiffPackQty = aPackInfo[1];
				mSession.sExccode = aPackInfo[2];
				mSession.oDialog = aPackInfo[3];
				mSession.sUoM = aPackInfo[4];
				mSession.sUoMType = aPackInfo[5];
				mSession.iQuantity = mSession.fDiffPackQty;

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
			}, oSourceController, "set mSession")
			.then(function () {
				return this.updateItemWeightInNeed();
			}, oSourceController, "check if there exists source item which is not in ItemWeight")
			.then(function (preResult, mSession) {
				return Service
					.exceptionPack(mSession.oProduct, mSession.fDiffPackQty, mSession.sExccode, mSession.sUoM);
			}, oSourceController)
			.then(function (preResult, mSession) {
				mSession.oDialog.setBusy(false);
				this.closeDialog(mSession.oDialog);
				mSession.NetWeight = preResult.NetWeight;
				mSession.WeightUoM = preResult.WeightUoM;
				//remove item from left
				this.oItemHelper.deleteItem(mSession.oProduct);
				mSession.oProduct = this.getNewItemWithPartialQuantity(mSession.oProduct, preResult);
				Global.setProductId("");
				Global.setExceptionEnable(false);
			}, oSourceController)
			.then(function (preResult, mSession) {
				//unbind product info
				this.unbindProductInfo();
			}, oSourceController)
			.then(function (preResult, mSession) {
				//update odo info
				this.unbindODOInfo();
				if (!this.oItemHelper.isEmpty()) {
					this.bindODOInfo();
				}
				this.focus(Const.ID.PRODUCT_INPUT);
			}, oSourceController)
			.then(function (preResult, mSession) {
				if ((mSession.oProduct.SerialNumberRequiredLevel === Const.SN_DOC_LEVEL_PROFILE_A && mSession.oProduct.EWMDeliveryDocumentCategory ===
						Const.DOCUMENT_CAT_OUTBOUND) || mSession.oProduct.SerialNumberRequiredLevel === Const.SN_DOC_LEVEL_PROFILE_B) {
					this.oItemHelper.removeSerialNumberFromOtherItems(mSession.oProduct.ProductName, SerialNumber.getAllSerialNumerKeys());
				}
			}, oSourceController)
			.then(function (preResult, mSession) {
				this.updateInputWithDefault(Const.ID.SHIP_INPUT, "");
				//add item in the right table
				mSession.bShipHUEmptyBeforePack = this.oItemHelper.isEmpty();
				if (mSession.iQuantity !== 0) {
					this.oItemHelper.updateItem(mSession.oProduct);
					this.oItemHelper.setItemsStatusToNone();
					this.oItemHelper.setItemHighlightByIndex(0);
				}
				this.handleUnpackEnable();
			}, oShipController)
			.then(function (preResult, mSession) {
				this.updateNetWeightRelated(mSession.NetWeight, mSession.WeightUoM);
				this.clearGrossWeight();
			}, oShipController, "update weight chart, color and text")
			.then(function () {
				this.dehilightShipHandlingUnits();
			}, oShipController)
			.then(function (preResult, mSession) {
				if (mSession.bShipHUEmptyBeforePack && mSession.iQuantity !== 0) {
					Cache.updateShipHUConsGroup(Global.getCurrentShipHandlingUnit(), mSession.oProduct.EWMConsolidationGroup);
				}
			}, oShipController)
			.then(function (preResult, oParam) {
				this.clearPackingInstr();
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