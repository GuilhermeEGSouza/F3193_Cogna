/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/workflows/WorkFlow",
	"scm/ewm/packoutbdlvs1/modelHelper/Global",
	"scm/ewm/packoutbdlvs1/utils/Util",
	"scm/ewm/packoutbdlvs1/service/ODataService",
	"scm/ewm/packoutbdlvs1/utils/Const",
	"scm/ewm/packoutbdlvs1/modelHelper/Message"
], function (WorkFlow, Global, Util, Service, Const, Message) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function () {
				var oPromise = this.flushPendings();
				this.setBusy(true);
				return oPromise;
			}, oShipController)
			.then(function () {
				return Service.terminateSession();
			})
			.then(function () {
				this.clearSourceBeforeLeave();
				this.byId("product-info").unbindElement();
				return Global.setPackAllEnable(false);
			}, oSourceController, "clear source side")
			.then(function () {
				this.clearShipHUTabs();
				this.oItemHelper.clear();
				this.setCurrentShipHandlingUnit("");
				this.clearPackingInstr();
			}, oShipController, "clear ship side")
			.then(function () {
				Message.clearAll();
			}, oShipController, "clear message")
			.then(function () {
				this.navToHome();
			}, oSourceController, "nav to home")
			.then(function (preResult, oParams) {
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