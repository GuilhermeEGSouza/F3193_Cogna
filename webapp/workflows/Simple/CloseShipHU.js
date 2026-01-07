/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/workflows/MixedWorkFlow",
	"zcogna/ewm/packoutbdlvs1/utils/Util",
	"zcogna/ewm/packoutbdlvs1/utils/Const",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Message",
	"zcogna/ewm/packoutbdlvs1/service/ODataService",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Cache",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Global",
	"sap/m/MessageBox"
], function (WorkFlow, Util, Const, Message, Service, Cache, Global, MessageBox) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function () {
				this.setBusy(true);
				return this.flushPendings();
			}, oShipController, "flush the uncommitted pack items to the server before really sending close hu request")
			.then(function (preResult, oParams) {
				this.setBusy(true);
				return Service
					.closeShipHandlingUnit();
			}, oShipController)
			.then(function (preResult, mSession) {
				if (preResult.MsgVar === "") {
					let sCurrentHU = Global.getCurrentShipHandlingUnit();
					let sSuccessMessage = this.getTextAccordingToMode("closeHU", "closeShippingHU", [sCurrentHU]);
					Message.addSuccess(sSuccessMessage);

					if (oSourceController.oItemHelper.isEmpty()) {
						let sSourceId = Global.getSourceId();
						let sConfMsg = this.getI18nText("conferenceCompleted", [sSourceId]);
						MessageBox.success(sConfMsg);
					}

					this.playAudio(Const.INFO);
				}
			}, oShipController, "show success message only when the ship hu is already closed before displayed on the ui ")
			.then(function () {
				Cache.clearShipHU(Global.getCurrentShipHandlingUnit());
				this.removeTabAfterClose(Global.getCurrentShipHandlingUnit());
			}, oShipController)
			.then(function (preResult, oParams) {
				oParams.bSourceEmpty = this.oItemHelper.isEmpty();
			}, oSourceController, "get if source hu is empty")
			.then(function (preResult, oParams) {
				if (!oParams.bSourceEmpty) {
					this.autoCreateShipHUAfterClose();
				} else {
					this.resetMaterialButtons();
				}
				this.deleteCurrentShipHandlingUnit();
				this.setCurrentShipHandlingUnit("");
			}, oShipController)
			.then(function (preResult, oParams) {
				if (!this.oItemHelper.isEmpty()) {
					this.oItemHelper.setItemsDefaultQuan();
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
			.then(function () {
				this.setBusy(false);
			}, oShipController);

		oWorkFlow
			.errors()
			.default(function (sError, vPara, mSession, bCustomError) {
				if (bCustomError) {
					this.showErrorMessagePopup(sError);
				}
			}, oSourceController)
			.always(function () {
				this.setBusy(false);
				this.playAudio(Const.ERROR);
			}, oSourceController);
		return oWorkFlow;

	};
});