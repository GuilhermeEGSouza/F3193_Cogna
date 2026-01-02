/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/workflows/WorkFlow",
	"scm/ewm/packoutbdlvs1/modelHelper/Global",
	"scm/ewm/packoutbdlvs1/utils/Util",
	"scm/ewm/packoutbdlvs1/service/ODataService",
	"scm/ewm/packoutbdlvs1/utils/Const",
	"scm/ewm/packoutbdlvs1/modelHelper/Message",
	"scm/ewm/packoutbdlvs1/modelHelper/Material",
	"scm/ewm/packoutbdlvs1/modelHelper/PackingMode"
], function (WorkFlow, Global, Util, Service, Const, Message, Material, PackingMode) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function (oClearInfo, mSession) {
				if (Util.isEmpty(oClearInfo)) {
					mSession.bClearSource = true;
					mSession.bClearShip = true;
				} else {
					mSession.bClearSource = oClearInfo.bClearSource;
					mSession.bClearShip = oClearInfo.bClearShip;
				}
			}, oSourceController, "set mSession")
			.then(function (vPre, mSession) {
				if (mSession.bClearSource) {
					this.clearSourceBeforeLeave();
					this.byId("product-info").unbindElement();
					this.removeExceptionButtons();
					return Global.setPackAllEnable(false);
				}
			}, oSourceController, "clear source side")
			.then(function (vPre, mSession) {
					if (mSession.bClearShip) {
						this.clearShipHUTabs();
						this.oItemHelper.clear();
						Global.removeAllShipHandlingUnits();
						this.setCurrentShipHandlingUnit("");
						this.clearPackingInstr();
						Material.setFavoriteMaterialSelectedByDefault();
						Material.setCurrentMaterial({});
					}
				},
				oShipController, "clear ship side")
			.then(function (vPre, mSession) {
					if (mSession.bClearShip) {
						Global.setPackAllEnable(false);
					}
				},
				oShipController, "clear ship side")
			.then(function (vPre, mSession) {
				if (mSession.bClearSource && mSession.bClearShip) {
					Message.clearAll();
				}
			}, oShipController, "clear message")
			.then(function (vPre, mSession) {
				if (mSession.bClearSource && mSession.bClearShip && PackingMode.isBasicMode()) {
					this.initDefaultColumnSetting();
					this.initColumnSetting();
				}
			}, oSourceController, "source column setting initialization")
			.then(function (vPre, mSession) {
				if (mSession.bClearSource && mSession.bClearShip&& PackingMode.isBasicMode()) {
					this.initDefaultColumnSetting();
					this.initColumnSetting();
				}
			}, oShipController, "ship column setting initialization");

		oWorkFlow
			.errors()
			.always(function () {
				this.playAudio(Const.ERROR);
			}, oSourceController);
		return oWorkFlow;

	};
});