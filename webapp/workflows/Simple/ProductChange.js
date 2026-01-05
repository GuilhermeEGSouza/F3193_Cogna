/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/workflows/WorkFlow",
	"zcogna/ewm/packoutbdlvs1/utils/Util",
	"zcogna/ewm/packoutbdlvs1/utils/Const",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Global",
	"zcogna/ewm/packoutbdlvs1/utils/CustomError",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Message"
], function (WorkFlow, Util, Const, Global, CustomError, Message) {
	"use strict";
	return function (oSourceController, oShipController, oFactory) {
		var oWorkFlow = new WorkFlow()
			.then(function (mPara, mSession) {
				Global.setSelectedProductInSource("");
				var mProduct;
				mSession.bToPackProduct = true;
				if (!Util.isEmpty(mPara.bToPackProduct)) {
					mProduct = mPara.oProduct;
					mSession.bToPackProduct = mPara.bToPackProduct;
				} else {
					mProduct = mPara;
				}
				return this.getItemIndexByProductOrEAN(mProduct, mSession);
			}, oSourceController)
			.then(function (preResult, mSession) {
				this.prepareDataForProductChangeWorkFlow(mSession);
			}, oSourceController)
			.then(function (preResult, mSession) {
				this.getItemIndexByProductAndActiveConsGroup(mSession);
			}, oSourceController)
			.then(function (preResult, mSession) {
				if (Util.isEmpty(mSession.sShipConsGroup) || mSession.oProduct.EWMConsolidationGroup === mSession.sShipConsGroup) {
					this.oItemHelper.sortItemsByKey(mSession.oProduct.StockItemUUID, mSession.oProduct.Huident);
				}
			}, oSourceController)
			.then(function (preResult, mSession) {
				this.updateUIElementsAfterProductChange();
			}, oSourceController)
			.then(function (preResult, mSession) {
				if (mSession.bToPackProduct) {
					if (Util.isEmpty(mSession.sShipConsGroup) || mSession.oProduct.EWMConsolidationGroup === mSession.sShipConsGroup || !Global.getCheckConsolidationGroup()) {
						var sQuantity;
						if (Util.parseNumber(mSession.oProduct.AlterQuan) < 1 && Util.parseNumber(mSession.oProduct.AlterQuan) > 0) {
							sQuantity = mSession.oProduct.AlterQuan;
						} else {
							sQuantity = "1";
						}
						var oPackInfo = {
							oProduct: mSession.oProduct,
							sQuantity: sQuantity,
							iIndex: 0,
							bAdd: true
						};
						oFactory.getPackItemWorkFlow().run(oPackInfo);
					} else {
						throw new CustomError(Const.ERRORS.PRODUCT_WITH_DIFF_CONS_GROUP);
					}
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
			.then(function (preResult, mSession) {
				this.delayCalledAdjustContainerHeight();
			}, oShipController)
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
				oSourceController.updateInputWithError(Const.ID.PRODUCT_INPUT, sError);
			})
			.always(function () {
				Global.setProductId("");
				oSourceController.focus(Const.ID.PRODUCT_INPUT);
				oSourceController.unbindProductInfo();
				oSourceController.oItemHelper.setItemsStatusByConsGrp();
				oSourceController.playAudio(Const.ERROR);
				oShipController.clearPackingInstr();
			});
		return oWorkFlow;

	};
});