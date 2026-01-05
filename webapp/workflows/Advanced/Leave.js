/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/workflows/WorkFlow",
	"zcogna/ewm/packoutbdlvs1/utils/Util",
	"zcogna/ewm/packoutbdlvs1/service/ODataService",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Material",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Global",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Message",
	"zcogna/ewm/packoutbdlvs1/utils/Const"
], function (WorkFlow, Util, Service, MaterialHelper, Global, Message, Const) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function () {
				return Service.terminateSession();
			}, oSourceController)
			.then(function () {
				this.clearSourceBeforeLeave();
				this.unbindODOInfo();
				this.unbindProductInfo();
				return this.disableButtons();
			}, oSourceController, "clear source side")
			.then(function () {
				this.updateInputWithDefault(Const.ID.SHIP_INPUT, "");
				this.clearShipHUTabs();
				this.oItemHelper.clear();
				MaterialHelper.setCurrentMaterial({});
				Global.removeAllShipHandlingUnits();
				this.setCurrentShipHandlingUnit("");
				this.clearPackingInstr();
			}, oShipController, "clear ship side")
			.then(function () {
				Message.clearAll();
			}, oShipController, "clear message")
			.then(function () {
				this.navToHome();
			}, oSourceController, "nav to home")
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