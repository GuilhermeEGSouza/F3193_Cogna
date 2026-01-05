/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/workflows/WorkFlow",
	"zcogna/ewm/packoutbdlvs1/utils/Util",
	"zcogna/ewm/packoutbdlvs1/utils/Const",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Global",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Cache",
	"zcogna/ewm/packoutbdlvs1/utils/CustomError",
	"zcogna/ewm/packoutbdlvs1/modelHelper/PackingMode",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Message"
], function (WorkFlow, Util, Const, Global, Cache, CustomError, PackingMode, Message) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function (mProduct, mSession) {
				Global.setSelectedProductInSource("");
				mSession.bToAutoCreateShipHU = true;
				if (!Util.isEmpty(mProduct.bToAutoCreateShipHU)) {
					mSession.bToAutoCreateShipHU = mProduct.bToAutoCreateShipHU;
					mProduct = mProduct.oProduct;
				}
				mSession.bInputByScan = Util.isString(mProduct);
				return this.getItemIndexByProductOrEAN(mProduct, mSession);
			}, oSourceController)
			.then(function (preResult, mSession) {
				//data preparation
				this.prepareDataForProductChangeWorkFlow(mSession);
			}, oSourceController)
			.then(function (preResult, mSession) {
				mSession.bStockLevelSnDialogOpened = false;
				if (mSession.bInputByScan && this.oItemHelper.isStockLevelSnEnabledByIndex(mSession.iItemIndex)) {
					if (this.oItemHelper.getItemCountByProduct(mSession.sProduct) > 1) {
						mSession.bStockLevelSnDialogOpened = true;
						var oDialog = this.getStockLevelSnDialog(mSession.sProduct);
						return this.openDialog(oDialog);
					}
				}
			}, oSourceController)
			.then(function (iItemIndex, mSession) {
				//get to-hightlight item index in stock level sn senario
				if (mSession.bStockLevelSnDialogOpened) {
					mSession.iItemIndex = iItemIndex;
				}
			}, oSourceController)
			.then(function (preResult, mSession) {
				mSession.bBatchDialogOpened = false;
				if (mSession.bInputByScan && !mSession.bStockLevelSnDialogOpened && this.oItemHelper.hasMutlipleBatchesByProduct(mSession.sProduct)) {
					mSession.bBatchDialogOpened = true;
					var oDialog = this.getBatchNumberDialog(mSession.sProduct);
					return this.openDialog(oDialog);
				}
			}, oSourceController)
			.then(function (sBatchInput, mSession) {
				//get to-hightlight item index in batch senario
				if (mSession.bBatchDialogOpened) {
					mSession.iItemIndex = this.oItemHelper.getItemIndexByProductAndBatch(mSession.sProduct, sBatchInput);
					if (!Util.isEmpty(mSession.sShipConsGroup)) {
						var iItemIndex = this.oItemHelper.getItemIndexByProductActiveConsGroupAndBatch(mSession.oProduct, mSession.sShipConsGroup,
							sBatchInput);
						if (iItemIndex !== -1) {
							mSession.iItemIndex = iItemIndex;
						}
					}
				}
			}, oSourceController)
			.then(function (preResult, mSession) {
				//get to-hightlight item index in normal senario
				if (!mSession.bBatchDialogOpened && !mSession.bStockLevelSnDialogOpened) {
					if (!Util.isEmpty(mSession.sShipConsGroup)) {
						var iItemIndex = this.oItemHelper.getItemIndexByProductAndActiveConsGroup(mSession.sProduct, mSession.sShipConsGroup);
						if (iItemIndex !== -1) {
							mSession.iItemIndex = iItemIndex;
						}
					}
				}
			}, oSourceController)
			.then(function (preResult, mSession) {
				//sort table
				var sStockId = this.oItemHelper.getItemStockIdByIndex(mSession.iItemIndex);
				this.oItemHelper.sortItemsByKey(sStockId, mSession.oProduct.Huident);
			}, oSourceController)
			.then(function (preResult, mSession) {
				mSession.consolidationGroup = this.oItemHelper.getFirstItemConsGroup();
			}, oSourceController)
			.then(function (preResult, mSession) {
				if (this.oItemHelper.isReductionFirstItem()) {
					var oDialog = this.getChangePackQuantityDialog(mSession.sProduct);
					return this.openDialog(oDialog);
				}
			}, oSourceController)
			.then(function () {
				this.bindProductInfo();
				this.bindImage();
				this.bindODOInfo();
				this.updateInputWithDefault(Const.ID.PRODUCT_INPUT, "");
				this.focus(Const.ID.PRODUCT_INPUT);
				this.oItemHelper.setItemsStatusByConsGrp();
				this.handleExceptionEnable();
				this.updateSourceItemStatus();
			}, oSourceController)
			.then(function (vPre, mSession) {
				this.updateInputWithDefault(Const.ID.SHIP_INPUT, "");
				this.dehilightShipHandlingUnits();
				var aHandlingUnit = this.getHightlightShipHandlingUnits(mSession.consolidationGroup);
				if (aHandlingUnit.length > 0) {
					this.hilightShipHandlingUnits(aHandlingUnit);
				}
			}, oShipController, "highlight ship handling unit if possible")
			.then(function (vPre, mSession) {
				if (mSession.bToAutoCreateShipHU && this.needAutoCreateShippingHU(mSession.consolidationGroup)) {
					this.onOpenCreateShipHUDialog();
				}
			}, oShipController, "open create ship hu dialog in need")
			.then(function (preResult, mSession) {
				if (!PackingMode.isInternalMode() && Util.isEmpty(mSession.consolidationGroup) && Global.getCheckConsolidationGroup()) {
					var sMsg = this.getI18nText("packItemWithNoConGrp");
					Message.addWarning(sMsg);
				}
			}, oShipController, "add warning message for broken items")
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
				this.updatePackingInstr(oParam.sODO, oParam.sPackInstr);
			}, oShipController, "update packing info")
			.then(function (vPre, mSession) {
				Global.setSelectedProductInSource(this.oItemHelper.getItemByIndex(0));
			}, oSourceController);

		oWorkFlow
			.errors()
			.subscribe(Const.ERRORS.PRODUCT_NOT_IN_SOURCE, function (oError, vPara, mSession) {
				var sError;
				if (Global.getSourceId()) {
					sError = this.getTextAccordingToMode("productNotInSource", "productNotInReference", [mSession.sProduct, Global.getSourceId()]);
				} else {
					sError = this.getTextAccordingToMode("provideHUFirst", "provideReferenceFirst");
				}
				this.updateInputWithError(Const.ID.PRODUCT_INPUT, sError);
			}, oSourceController)
			.subscribe(Const.ERRORS.PRODUCT_WITH_DIFF_CONS_GROUP, function () {
				var sMessage = this.getTextAccordingToMode("differentConsGroupWithHUMsg", "differentConsGroupWithShipHUMsg");
				this.updateInputWithError(Const.ID.PRODUCT_INPUT, sMessage);
			}, oSourceController)
			.default(function (sError) {
				this.updateInputWithError(Const.ID.PRODUCT_INPUT, sError);
			}, oSourceController)
			.always(function () {
				this.focus(Const.ID.PRODUCT_INPUT);
				Global.setProductId("");
				this.unbindProductInfo();
				this.unbindODOInfo();
				this.unbindImage();
				Global.setExceptionEnable(false);
				if (!this.oItemHelper.isEmpty()) {
					this.oItemHelper.setItemsStatusByConsGrp();
				}
				this.playAudio(Const.ERROR);
			}, oSourceController)
			.always(function () {
				this.clearPackingInstr();
			}, oShipController);
		return oWorkFlow;

	};
});