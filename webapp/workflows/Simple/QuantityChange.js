/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/workflows/WorkFlow",
	"zcogna/ewm/packoutbdlvs1/utils/Util",
	"zcogna/ewm/packoutbdlvs1/service/ODataService",
	"zcogna/ewm/packoutbdlvs1/utils/CustomError",
	"zcogna/ewm/packoutbdlvs1/utils/Const",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Message",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Global"
], function (WorkFlow, Util, Service, CustomError, Const, Message, Global) {
	"use strict";
	return function (oSourceController, oShipController, oFactory) {
		var oWorkFlow = new WorkFlow()
			.then(function (oObjectInfo, mSession) {
				mSession.oProduct = JSON.parse(JSON.stringify(oObjectInfo.oProduct));
				mSession.iApplyQuantity = oObjectInfo.iQuantity;
				if (mSession.iApplyQuantity > 0) {
					mSession.pack = true;
				} else if (mSession.iApplyQuantity <= 0) {
					mSession.pack = false;
				}
				mSession.mSource = oObjectInfo.mSource;

			}, oShipController)
			.then(function (preRequest, mSession) {
				if (mSession.pack) {
					return;
				}
				var iIndex = this.oItemHelper.getItemIndexByKey(mSession.oProduct.StockItemUUID, mSession.oProduct.Huident);
				var oUnpackInfo = {
					oProduct: mSession.oProduct,
					iQuantity: Math.abs(mSession.iApplyQuantity),
					iIndex: iIndex
				};

				return oFactory.getUnpackWorkFlow().run(oUnpackInfo);
			}, oShipController)
			.then(function (preRequest, mSession) {
				if (!mSession.pack) {
					return;
				}
				var iIndex = this.oItemHelper.getItemIndexByKey(mSession.oProduct.StockItemUUID, mSession.oProduct.Huident);

				if (iIndex === -1) {
					throw new CustomError(Const.ERRORS.NO_ENOUGH_QUANTITY_APPLIED, mSession);
				}
				mSession.oApplyProduct = this.oItemHelper.getItemByIndex(iIndex);
				if (mSession.iApplyQuantity > Util.parseNumber(mSession.oApplyProduct.AlterQuan)) {
					throw new CustomError(Const.ERRORS.NO_ENOUGH_QUANTITY_APPLIED, mSession);
				}
				var oPackInfo = {
					oProduct: mSession.oApplyProduct,
					sQuantity: mSession.iApplyQuantity.toString(),
					iIndex: iIndex,
					bAdd: false
				};

				return oFactory.getPackItemWorkFlow().run(oPackInfo);

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
			.then(function (preRequest, mSession) {
				this.clearGrossWeight();
				this.updateInputWithDefault(mSession.mSource);
			}, oShipController);

		oWorkFlow
			.errors()
			.subscribe(Const.ERRORS.NO_ENOUGH_QUANTITY_APPLIED, function (mSession) {
				var sError = this.getI18nText("noEnoughQuantityPack", mSession.oProduct.DefaultAltQuan);
				this.updateInputWithError(mSession.mSource, sError);
			}, oShipController)
			.always(function (sError, vParam, mSession) {
				this.playAudio(Const.ERROR);
			}, oShipController);
		return oWorkFlow;

	};
});