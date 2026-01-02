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
], function(WorkFlow, Service, Global, Util, Const, Message) {
	"use strict";
	return function(oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function(oCreateInfo, mSession) {
				// this.prepareParemeterForCreation(oCreateInfo, mSession);
				// this.handleFocusAndHighlightForCreation();
			}, oSourceController)
			.then(function(preResult, mSession) {
				//todo use restore shipping hu service
				return Service.getOpenShippingHU();
			}, oShipController)
			.then(function(preResult, mSession) {
				//todo 0 open ship hu shouldn't execute the work flow 
				mSession.aShipHUs = preResult;
				preResult.forEach(function(oShipHU){
					Global.addShipHandlingUnit(oShipHU.HuId);
				});
				this.restoreShipHUTabs(preResult);
				return preResult;
			}, oShipController)
			.then(function(preResult, mSession) {
				preResult.forEach(function(oShipHU) {
					this.updateNetWeightRelated(oShipHU.NetWeight, oShipHU.WeightUoM, oShipHU.HuId);
					// this.clearActualWeight(oShipHU.HuId);
				}.bind(this));
			}, oShipController)
			.then(function(preResult, mSession) {
				this.setBusy(false);
				var iLastIndex = mSession.aShipHUs.length - 1;
				// this.oItemHelper.setItems(mSession.aShipHUs[mSession.aShipHUs.length - 1].Items);
				this.oShipItemHelper.setItems(mSession.aShipHUs[iLastIndex].Items.results);
				this.updateShippingHUMaterial(mSession.aShipHUs[iLastIndex].HuId);
				this.adjustContainerHeight();
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
			});
		return oWorkFlow;

	};
});