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
	"zcogna/ewm/packoutbdlvs1/utils/Const",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Cache",
	"zcogna/ewm/packoutbdlvs1/modelHelper/PackingMode"
], function (WorkFlow, Util, Service, MaterialHelper, Global, Message, Const, Cache, PackingMode) {
	"use strict";
	//There are 2 entry points for the clear work flow:
	//1: after click start packing button
	//2: if user scan a ship hu in the source side, then scan the same ship hu in the ship hu input
	//then the app will call teh clear work flow to clear the source side
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function (oClearInfo, mSession) {
				if (Util.isEmpty(oClearInfo)) {
					mSession.bClearSource = true;
					mSession.bClearShip = true;
					mSession.bRemoveExceptionButtons = true;
				} else {
					mSession.bClearSource = oClearInfo.bClearSource;
					mSession.bClearShip = oClearInfo.bClearShip;
					mSession.bRemoveExceptionButtons = oClearInfo.bRemoveExceptionButtons;
				}
				this.removeDuplicatedId();
			}, oSourceController, "set mSession")
			.then(function (vPre, mSession) {
				if (mSession.bClearSource) {
					this.clearSourceBeforeLeave();
					this.unbindODOInfo();
					this.unbindProductInfo();
					this.unbindImage();
					if (mSession.bRemoveExceptionButtons) {
						this.removeExceptionButtons();
					}
					return this.disableButtons();
				}
			}, oSourceController, "clear source side")
			.then(function (vPre, mSession) {
				if (mSession.bClearShip) {
					this.updateInputWithDefault(Const.ID.SHIP_INPUT, "");
					this.clearShipHUTabs();
					this.oItemHelper.clear();
					MaterialHelper.setCurrentMaterial({});
					Global.removeAllShipHandlingUnits();
					this.setCurrentShipHandlingUnit("");
				}
			}, oShipController, "clear ship side")
			.then(function (vPre, mSession) {
				if (mSession.bClearSource) {
					Global.setUnpackEnable(false);
					this.clearPackingInstr();
					if (!this.oItemHelper.isEmpty()) {
						this.oItemHelper.setItemsStatusToNone();
					}
				}
			}, oShipController, "clear ship side")
			.then(function (vPre, mSession) {
				if (mSession.bClearSource && mSession.bClearShip) {
					Message.clearAll();
					Cache.reset();
				}
			}, oShipController, "clear message")
			.then(function (vPre, mSession) {
				if (mSession.bClearSource && mSession.bClearShip && !PackingMode.isBasicMode()) {
					this.initDefaultColumnSetting();
					this.initColumnSetting();
				}
			}, oSourceController, "source column setting initialization")
			.then(function (vPre, mSession) {
				if (mSession.bClearSource && mSession.bClearShip && !PackingMode.isBasicMode()) {
					this.initDefaultColumnSetting();
					this.initColumnSetting();
				}
			}, oShipController, "ship column setting initialization")
			.then(function (vPre, mSession) {
				Global.setSelectedProductInSource("");
			}, oShipController, "clear");

		oWorkFlow
			.errors()
			.always(function () {
				this.playAudio(Const.ERROR);
			}, oSourceController);
		return oWorkFlow;

	};
});