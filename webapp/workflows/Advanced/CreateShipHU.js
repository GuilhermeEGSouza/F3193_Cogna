/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/workflows/WorkFlow",
	"scm/ewm/packoutbdlvs1/service/ODataService",
	"scm/ewm/packoutbdlvs1/modelHelper/Global",
	"scm/ewm/packoutbdlvs1/utils/Util",
	"scm/ewm/packoutbdlvs1/utils/Const",
	"scm/ewm/packoutbdlvs1/modelHelper/Message",
	"scm/ewm/packoutbdlvs1/modelHelper/Material"
], function (WorkFlow, Service, Global, Util, Const, Message, Material) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function (oCreateInfo, mSession) {
				if (oCreateInfo.bOpen) {
					return this.onOpenCreateShipHUDialog();
				} else {
					mSession.oCreateInfo = oCreateInfo;
				}
			}, oShipController)
			.then(function (preResult, mSession) {
				this.prepareParemeterForCreation(mSession.oCreateInfo, mSession);
			}, oSourceController)
			.then(function (preResult, mSession) {
				return Service.createShippingHU(mSession.sHuId, mSession.sMaterialId);
			}, oShipController)
			.then(function (preResult, mSession) {
				mSession.sHuId = preResult.HuId;
				this.updateParameterAfterCreation(preResult, mSession);
			}, oShipController)
			.then(function (preResult, mSession) {
				return this.createNewTab(mSession.sHuId, Const.TAB.ADVANCED);
			}, oShipController)
			.then(function (preResult, mSession) {
				mSession.oComponent.setBusy(false).close();
			}, oShipController)
			.then(function (preResult, mSession) {
				this.updateDataBingdingAfterCreation(mSession);
				this.handleButtonsEnableAfterCreate(mSession);
			}, oShipController)
			.then(function (preResult, mSession) {
				this.handleFocusAndHighlightForCreation();
			}, oSourceController)
			.then(function (preResult, oParam) {
				return this.updateItemWeightInNeed();
			}, oSourceController, "check if there exists source item which is not in ItemWeight")
			.then(function (preResult, mSession) {
				this.updateNetWeightRelated(0, Material.getCurrentMaterialUom());
			}, oShipController, "update net weight related")
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
				var sMessage = this.getTextAccordingToMode("createHuSuccessMsg", "createShipHuSuccessMsg", [mSession.sHuId]);
				Message.addSuccess(sMessage);
				this.playAudio(Const.INFO);
			}, oShipController);

		oWorkFlow
			.errors()
			.subscribe(Const.ERRORS.CREATE_HU_DUPLICATE, function (sError) {
				this.updateInputWithError(Const.ID.CREATE_SHIP_INPUT, sError);
				this.focus(Const.ID.CREATE_SHIP_INPUT);
			}, oShipController)
			.subscribe(Const.ERRORS.SHIP_HU_CREATED_INTERNALLY, function (sError) {
				this.updateInputWithError(Const.ID.CREATE_SHIP_INPUT, sError);
			}, oShipController)
			.subscribe(Const.ERRORS.INTERVAL_HU_ID_NOT_DEFINED, function (sError) {
				sError = this.getI18nText("createShipHUContactAdmin");
				this.updateInputWithError(Const.ID.CREATE_SHIP_INPUT, sError);
			}, oShipController)
			.subscribe(Const.ERRORS.HU_ASSIGNED_FAILED, function (sError) {
				this.updateInputWithError(Const.ID.CREATE_SHIP_INPUT, sError);
				this.focus(Const.ID.CREATE_SHIP_INPUT);
			}, oShipController)
			.subscribe(Const.ERRORS.HU_PROCESSED_BY_OTHER, function (sError) {
				this.updateInputWithError(Const.ID.CREATE_SHIP_INPUT, sError);
				this.focus(Const.ID.CREATE_SHIP_INPUT);
			}, oShipController)
			.default(function (sError) {
				this.getView().byId("createShipHUDialog").close();
			}, oShipController)
			.default(function (sError, vPara, mSession, bCustomError) {
				if (bCustomError) {
					this.showErrorMessagePopup(sError);
				}
			}, oSourceController)
			.always(function (sError, vPara, mSession) {
				this.getView().byId("createShipHUDialog").setBusy(false);
				this.playAudio(Const.ERROR);
			}, oShipController);
		return oWorkFlow;
	};
});