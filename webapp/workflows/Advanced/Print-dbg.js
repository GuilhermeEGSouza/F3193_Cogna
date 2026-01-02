/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/workflows/WorkFlow",
	"scm/ewm/packoutbdlvs1/service/ODataService",
	"scm/ewm/packoutbdlvs1/utils/Const",
	"scm/ewm/packoutbdlvs1/modelHelper/Message"
], function (WorkFlow, Service, Const, Message) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function () {
				return Service.print();
			}, oShipController, "init package matrial buttons")
			.then(function () {
				Message.addSuccess(this.getI18nText("printSuccess"));
				this.playAudio(Const.INFO);
			}, oShipController, "init package matrial buttons");

		oWorkFlow
			.errors()
			.default(function (sError, vPara, mSession, bCustomError) {
				if (bCustomError) {
					this.showErrorMessagePopup(sError);
				}
			}, oSourceController)
			.always(function (sError) {
				this.playAudio(Const.ERROR);
			}, oShipController);
		return oWorkFlow;
	};
});