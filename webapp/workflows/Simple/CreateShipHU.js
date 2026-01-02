/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/workflows/WorkFlow",
	"scm/ewm/packoutbdlvs1/service/ODataService",
	"scm/ewm/packoutbdlvs1/modelHelper/Global",
	"scm/ewm/packoutbdlvs1/utils/Util",
	"scm/ewm/packoutbdlvs1/utils/Const",
	"scm/ewm/packoutbdlvs1/modelHelper/Message"
], function (WorkFlow, Service, Global, Util, Const, Message) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function (oCreateInfo, mSession) {
				this.prepareParemeterForCreation(oCreateInfo, mSession);
			}, oSourceController)
			.then(function (preResult, mSession) {
				return Service.createShippingHU(mSession.sHuId, mSession.sMaterialId);
			}, oShipController)
			.then(function (preResult, mSession) {
				this.setBusy(false);
				mSession.sHuId = preResult.sHuId;
				this.updateParameterAfterCreation(preResult, mSession);
				this.updateMaterialButtonsAfterCreation(mSession.sMaterialId);
			}, oShipController)
			.then(function (preResult, mSession) {
				return this.createNewTab(mSession.sHuId, Const.TAB.BASIC);
			}, oShipController)
			.then(function (preResult, mSession) {
				this.updateDataBingdingAfterCreation(mSession);
			}, oShipController)
			.then(function (preResult, mSession) {
				this.handlePackAllEnable();
			}, oSourceController)
			.then(function (preResult, mSession) {
				this.handleFocusAndHighlightForCreation();
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
				var sMessage = this.getTextAccordingToMode("createHuSuccessMsg", "createShipHuSuccessMsg", [mSession.sHuId]);
				Message.addSuccess(sMessage);
				this.playAudio(Const.INFO);
			}, oShipController);

		oWorkFlow
			.errors()
			.subscribe(Const.ERRORS.INTERVAL_HU_ID_NOT_DEFINED, function () {
				var sError = this.getI18nText("createShipHUContactAdmin");
				this.showErrorMessageBox(sError);
			}, oShipController)
			.default(function (sError, vPara, mSession, bCustomError) {
				if (bCustomError) {
					this.showErrorMessagePopup(sError);
				}
			}, oSourceController)
			.always(function () {
				Global.setBusy(false);
				this.playAudio(Const.ERROR);
			}, oShipController);
		return oWorkFlow;

	};
});