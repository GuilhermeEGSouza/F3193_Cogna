/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/workflows/WorkFlow",
	"scm/ewm/packoutbdlvs1/utils/Util",
	"scm/ewm/packoutbdlvs1/utils/CustomError",
	"scm/ewm/packoutbdlvs1/service/ODataService",
	"scm/ewm/packoutbdlvs1/utils/Const",
	"scm/ewm/packoutbdlvs1/modelHelper/Message",
	"scm/ewm/packoutbdlvs1/modelHelper/Cache",
	"scm/ewm/packoutbdlvs1/modelHelper/Global"
], function (WorkFlow, Util, CustomError, Service, Const, Message, Cache, Global) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function (oUnpackInfo, mSession) {
				this.setBusy(true);
				//todo:: refine data structure
				mSession.oProduct = oUnpackInfo.oProduct;
				mSession.oUnpackProduct = JSON.parse(JSON.stringify(oUnpackInfo.oProduct));
				mSession.iQuantity = oUnpackInfo.iQuantity;
				mSession.iIndex = oUnpackInfo.iIndex;

				//the quantity need send to backend
				var iApplyQty = mSession.oUnpackProduct.OperationDeltaQuan - mSession.oUnpackProduct.PackedQuan - oUnpackInfo.iQuantity;
				if (iApplyQty >= 0) { //do not send request
					mSession.applyQty = 0;
				} else {
					mSession.applyQty = Math.abs(iApplyQty);
				}
			}, oShipController, "caculate the count need send to backend")
			.then(function (preResult, mSession) {
				if (mSession.applyQty > 0) {
					mSession.oUnpackProduct.AlterQuan = mSession.applyQty.toString();
					var bNeedQuantity = false;
					if (mSession.oUnpackProduct.AlterQuan < mSession.oUnpackProduct.PackedQuan) {
						bNeedQuantity = true;
					}
					return Service
						.unpack(mSession.oUnpackProduct, bNeedQuantity);
				}
			}, oShipController)
			.then(function (preResult, mSession) {
				if (!Util.isEmpty(preResult)) {
					mSession.sNewStockItemUUID = preResult.StockItemUUID;
				}
			})
			.then(function (preResult, mSession) {
				//todo:: rename PackedQuan => iPackedQuan
				// Set PackedQuan to actually packed quantity
				this.oItemHelper.setItemPackedQuanByIndex(mSession.iIndex, (mSession.oProduct.PackedQuan - mSession.applyQty));
				// Set OperationDeltaQuan to currently item alter quantity
				this.oItemHelper.setItemDeltaByIndex(mSession.iIndex, Util.parseNumber(mSession.oProduct.AlterQuan), "");
			}, oShipController, "update the quantity of the item")
			.then(function (preResult, mSession) {
				if (Util.parseNumber(mSession.oProduct.AlterQuan) === 0) {
					this.oItemHelper.setItemPreviousAlterQuanByIndex(mSession.iIndex, "0");
					this.oItemHelper.deleteItem(mSession.oProduct);
					if (!this.oItemHelper.isEmpty()) {
						this.oItemHelper.setItemHighlightByIndex(0);
					} else {
						Cache.updateShipHUConsGroup(Global.getCurrentShipHandlingUnit(), "");
					}
				} else {
					this.oItemHelper.setItemsStatusToNone();
					this.oItemHelper.setItemHighlightByIndex(mSession.iIndex);
					this.oItemHelper.setItemPreviousAlterQuanByIndex(mSession.iIndex, mSession.oProduct.AlterQuan);
				}
			}, oShipController)
			.then(function (preResult, mSession) {
				//add item to the left table
				mSession.oUnpackProduct.AlterQuan = mSession.iQuantity.toString();
				// Initial PreviousAlterQuan for item in source
				mSession.oUnpackProduct.PreviousAlterQuan = "0";
				if (Util.isEmpty(mSession.sNewStockItemUUID)) {
					mSession.oUnpackProduct.StockItemUUID = mSession.oUnpackProduct.OriginId;
				} else {
					mSession.oUnpackProduct.OriginId = mSession.sNewStockItemUUID;
					mSession.oUnpackProduct.StockItemUUID = mSession.sNewStockItemUUID;
				}
				this.oItemHelper.addItem(mSession.oUnpackProduct);
				// Initial PackedQuan for item in source, when user apply pack, need to judge send service or not
				this.oItemHelper.setItemPackedQuanByIndex(0, (mSession.oProduct.PackedQuan - mSession.applyQty));
				// Initial PackedQuan for item in source, when user apply pack, need to judge send service or not
				this.oItemHelper.setItemDeltaByIndex(0, 0, "");

				Global.setProductId(mSession.oUnpackProduct.ProductName);
				this.oItemHelper.sortItemsByKey(mSession.oUnpackProduct.StockItemUUID, mSession.oUnpackProduct.Huident);
			}, oSourceController)
			.then(function (preResult, mSession) {
				this.oItemHelper.setItemsStatusByConsGrp();
				this.oItemHelper.setItemHighlightByIndex(0);
			}, oSourceController)
			.then(function (preResult, mSession) {
				//update product info
				this.bindProductInfo();
				this.updateInputWithDefault(Const.ID.PRODUCT_INPUT, "");
				this.focus(Const.ID.PRODUCT_INPUT);
				this.setBusy(false);
				this.handlePackAllEnable();
			}, oSourceController)
			.then(function (preResult, oParam) {
				oParam.sODO = this.oItemHelper.getItemDocNoByIndex(0);
				oParam.sPackInstr = this.oItemHelper.getItemPackInstrByIndex(0);
			}, oSourceController)
			.then(function (preResult, oParam) {
				this.updatePackingInstr(oParam.sODO, oParam.sPackInstr);
			}, oShipController, "update packing info")
			.then(function (preResult, mSession) {
				this.clearGrossWeight();
				this.delayCalledAdjustContainerHeight();
			}, oShipController);

		oWorkFlow
			.errors()
			.default(function (sError, vPara, mSession, bCustomError) {
				if (bCustomError) {
					this.showErrorMessagePopup(sError);
				}
			}, oSourceController)
			.always(function (sError, vParam, mSession) {
				mSession.oProduct.AlterQuan = mSession.oProduct.PreviousAlterQuan;
				mSession.oProduct.OperationDeltaQuan = mSession.oProduct.PreviousAlterQuan;
				this.playAudio(Const.ERROR);
				this.setBusy(false);
			}, oShipController);
		return oWorkFlow;

	};
});