/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/workflows/WorkFlow",
	"zcogna/ewm/packoutbdlvs1/service/ODataService",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Global",
	"zcogna/ewm/packoutbdlvs1/utils/Util",
	"zcogna/ewm/packoutbdlvs1/utils/Const",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Message"
], function(WorkFlow, Service, Global, Util, Const, Message) {
	"use strict";
	return function(oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function(preResult, mSession) {
				return Service.getOpenShippingHU();
			}, oShipController)
			.then(function(preResult, mSession) {
				this.setBusy(false);
				mSession.aShipHUs = preResult;
				if (preResult.length > 1) {
					var sMessage = this.getI18nText("moreThanOneShipHUMsg");
					this.showErrorMessageBox(sMessage);
					throw new Error();
				} else {
					//todo 0 open ship hu shouldn't execute the work flow 
					Global.addShipHandlingUnit(preResult[0].HuId);
					this.restoreShipHUTabs(preResult);
					return preResult;
				}
			}, oShipController)
			.then(function(preResult, mSession) {
				preResult.forEach(function(oShipHU) {
					this.clearActualWeight(oShipHU.HuId);
				}.bind(this));
			}, oShipController)
			.then(function(preResult, mSession) {
				this.oItemHelper.setItems(mSession.aShipHUs[mSession.aShipHUs.length - 1].Items.results);
			}, oShipController);

		oWorkFlow
			.errors()
			.subscribe(Const.ERRORS.CREATE_HU_DUPLICATE, function(sError) {
				Message.addError(sError);
			})
			.subscribe(Const.ERRORS.SHIP_HU_CREATED_INTERNALLY, function(sError) {
				Message.addError(sError);
			})
			.subscribe(Const.ERRORS.INTERVAL_HU_ID_NOT_DEFINED, function() {
				var sError = this.getI18nText("createShipHUContactAdmin");
				this.showErrorMessageBox(sError);
			}, oShipController)
			.always(function() {
				Global.setBusy(false);
				this.playAudio(Const.ERROR);
			});
		return oWorkFlow;

	};
});