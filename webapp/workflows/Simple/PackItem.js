/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/workflows/MixedWorkFlow",
	"zcogna/ewm/packoutbdlvs1/utils/CustomError",
	"zcogna/ewm/packoutbdlvs1/service/ODataService",
	"zcogna/ewm/packoutbdlvs1/utils/Util",
	"zcogna/ewm/packoutbdlvs1/utils/Const",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Message",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Cache",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Global"
], function (WorkFlow, CustomError, Service, Util, Const, Message, Cache, Global) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function (oPackInfo, mSession) {
				this.setBusy(true);
				mSession.oProduct = oPackInfo.oProduct;
				mSession.oPackProduct = JSON.parse(JSON.stringify(oPackInfo.oProduct));
				/*assign initial value to PackedQuan, it will not do acculate caculation.
				 * If right item alread has packed Quan, it will be ignored.
				 * If PackedQuan, set packed quantity to PackedQuan, will calculate it in pack service
				 */
				mSession.oPackProduct.PackedQuan = oPackInfo.oProduct.PackedQuan ? oPackInfo.oProduct.PackedQuan : 0;
				mSession.oPackProduct.AlterQuan = oPackInfo.sQuantity;
				mSession.iIndex = oPackInfo.iIndex;
				mSession.bAdd = oPackInfo.bAdd;
			}, oSourceController)
			.then(function (preResult, mSession) {
				if (!Util.isEmpty(mSession.oProduct.SerialNumberRequiredLevel) || !Util.isEmpty(mSession.oProduct.Batch)) {
					throw new CustomError();
				}
			}, oSourceController)
			.then(function (preResult, mSession) {
				if (mSession.oProduct.AlterQuan - mSession.oPackProduct.AlterQuan > 0) {
					this.oItemHelper.reduceItemAlterQtyByIndex(mSession.iIndex, mSession.oPackProduct.AlterQuan);
					this.oItemHelper.setItemHighlightByIndex(0);
				} else {
					this.oItemHelper.deleteItem(mSession.oProduct);
					Global.setProductId("");
					this.unbindProductInfo();
				}

				if (Util.parseNumber(mSession.oProduct.QtyReduced) !== 0) {
					throw new CustomError();
				}
			}, oSourceController)
			.then(function (preResult, mSession) {
				//add item in the right table
				mSession.bShipHUEmptyBeforePack = this.oItemHelper.isEmpty();
				var oItem;
				//should use new stock id to merge
				mSession.sNewStockItemUUID = this.oItemHelper.getItemStockIdByOriginalId(mSession.oPackProduct.StockItemUUID);
				if (!Util.isEmpty(mSession.sNewStockItemUUID)) {
					oItem = this.oItemHelper.findItemAndIndexByStockIdAndOriginId(mSession.sNewStockItemUUID, mSession.oPackProduct.StockItemUUID,
						mSession.oPackProduct.Huident)[0];
					this.oItemHelper.updateItemStockId(mSession.oPackProduct, mSession.sNewStockItemUUID);
				}
				// If item AlterQuan is NaN, set PreviousAlterQuan to AlterQuan
				if (oItem && !oItem.AlterQuan) {
					oItem.AlterQuan = oItem.PreviousAlterQuan;
				}
				/*
				 * In case, user scan source handling unit and flushPendings called. It means the item in shipping hu alread packed products 
				 * without 100% quantity reached. The DefaultAlterQuan, PackedQuan should keep consistency with item in shipping hu.
				 */
				if (oItem && oItem.DefaultAltQuan !== mSession.oProduct.DefaultAltQuan) {
					mSession.oProduct.DefaultAltQuan = oItem.DefaultAltQuan;
					mSession.oPackProduct.DefaultAltQuan = oItem.DefaultAltQuan;
				}
				if (oItem && oItem.PackedQuan !== mSession.oPackProduct.PackedQuan) {
					mSession.oPackProduct.PackedQuan = oItem.PackedQuan;
				}
				if (mSession.bAdd) {
					//In simple mode, Quan does not synac with AlterQuan by ratio. Because we do not use Quan in simple mode
					this.oItemHelper.addItem(mSession.oPackProduct, true);
				}
				// Calculate operate product quantity, this is delta value
				this.oItemHelper.setItemDeltaByIndex(mSession.iIndex, Util.parseNumber(mSession.oPackProduct.AlterQuan), Const.OPERATOR.PLUS);
				// Remember item AlterQuan, if change quantity, will calculate apply quantity with new value and this previous alter quantity
				this.oItemHelper.setItemPreviousAlterQuanByIndex(mSession.iIndex, this.oItemHelper.getItemDeltaByIndex(mSession.iIndex).toString());
			}, oShipController)
			.asyncOnly(function (preResult, mSession) {
				this.oItemHelper.updatePendingStatus(mSession.oPackProduct, true);
			}, oShipController, "disable the input of the quantity once it is ready to send the pack reqeust")
			.service(function (preResult, mSession) {
				var oItem = this.oItemHelper.getItemByKey(mSession.oPackProduct.StockItemUUID, mSession.oPackProduct.Huident);
				// When oPackProduct AlterQuan is "0", it means in aysnc mode flush case called.
				if (oItem.DefaultAltQuan === oItem.OperationDeltaQuan || mSession.oPackProduct.AlterQuan === "0") {
					var oProduct = JSON.parse(JSON.stringify(oItem));
					//Should use origin id to confirm
					oProduct.StockItemUUID = oProduct.OriginId;
					if (oProduct.PackedQuan) {
						oProduct.AlterQuan = (Util.parseNumber(oProduct.AlterQuan) - oProduct.PackedQuan).toString();
					}
					var vQuantity = "";
					if (oItem.DefaultAltQuan > oItem.OperationDeltaQuan) {
						vQuantity = parseFloat(oProduct.AlterQuan);
					}
					return Service
						.pack(oProduct, vQuantity)
						.then(function (oResult) {
							// Pack successfully, set the packed quantity to item
							this.oItemHelper.setItemPackedQuan(mSession.oPackProduct, Util.parseNumber(oItem.AlterQuan));
							this.oItemHelper.updateItemStockIdByKey(mSession.oPackProduct.StockItemUUID, oResult.StockItemUUID, mSession.oPackProduct.Huident);
						}.bind(this));
				}
			}, oShipController)
			.serviceCallback(function (preResult, mSession) { //currently only for async mode, it is a success callback
				this.oItemHelper.updatePendingStatus(mSession.oPackProduct, false);
			}, oShipController, "enable the quantity input once the pack item request responsed successfully")
			.then(function () {
				this.focus(Const.ID.PRODUCT_INPUT);
			}, oSourceController)
			.then(function (preResult, mSession) {
				this.clearGrossWeight();
				var oTable = this.byId("ShipProductTable");
				var oInput = oTable.getItems()[0].getCells()[2];
				if (oInput.getValueState() === "Error") {
					this.updateInputWithDefault(oInput);
				}
			}, oShipController, "clear qunatity input error in the ship table")
			.then(function (pre, mSession) {
				if (mSession.bShipHUEmptyBeforePack) {
					Cache.updateShipHUConsGroup(Global.getCurrentShipHandlingUnit(), mSession.oProduct.EWMConsolidationGroup);
				}
				this.setBusy(false);
				this.oItemHelper.setItemsStatusToNone();
				this.oItemHelper.setItemHighlightByIndex(0);
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
				var oItem = oShipController.oItemHelper.getItemByKey(mSession.oPackProduct.StockItemUUID, mSession.oPackProduct.Huident);
				var oNeedUnpackProduct = JSON.parse(JSON.stringify(mSession.oPackProduct));
				oNeedUnpackProduct.StockItemUUID = oNeedUnpackProduct.OriginId;
				var bHavePacked = !!oItem.PackedQuan;
				if (bHavePacked) {
					oNeedUnpackProduct.AlterQuan = (oItem.DefaultAltQuan - oItem.PackedQuan).toString();
					// oItem.AlterQuan = oItem.PackedQuan.toString();
					oItem.OperationDeltaQuan = oItem.PackedQuan;
					oShipController.oItemHelper.updateItemBothAlterQuantity(oItem, oItem.PackedQuan.toString());
					this.oItemHelper.updateItem(oNeedUnpackProduct);
				} else {
					oShipController.oItemHelper.deleteItem(oItem);
					if (!oShipController.oItemHelper.isEmpty()) {
						oShipController.oItemHelper.setItemHighlightByIndex(0);
					}
					oItem.OperationDeltaQuan = 0;

					// mSession.oPackProduct.AlterQuan = oItem.DefaultAltQuan.toString();
					oNeedUnpackProduct.AlterQuan = this.oItemHelper.getItemByKey(mSession.oProduct.StockItemUUID, mSession.oPackProduct.Huident) ?
						oItem.AlterQuan : oItem.DefaultAltQuan
						.toString();
					this.oItemHelper.addItem(oNeedUnpackProduct);
				}
				this.oItemHelper.setItemsStatusByConsGrp();
				this.setBusy(false);
				this.focus(Const.ID.PRODUCT_INPUT);
				this.playAudio(Const.ERROR);
			}, oSourceController);
		return oWorkFlow;

	};
});