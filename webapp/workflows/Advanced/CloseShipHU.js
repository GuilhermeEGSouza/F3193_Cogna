/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/workflows/MixedWorkFlow",
	"scm/ewm/packoutbdlvs1/utils/Util",
	"scm/ewm/packoutbdlvs1/utils/Const",
	"scm/ewm/packoutbdlvs1/modelHelper/Message",
	"scm/ewm/packoutbdlvs1/modelHelper/Global",
	"scm/ewm/packoutbdlvs1/modelHelper/Cache",
	"scm/ewm/packoutbdlvs1/service/ODataService"
], function (WorkFlow, Util, Const, Message, Global, Cache, Service) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function (bClosed, mSession) {
				mSession.bClosed = bClosed;
				this.setBusy(true);
			}, oShipController)
			.asyncOnly(function (vPara, mSession) {
				var promise = new Promise(function (resolve, reject) {
					WorkFlow.setObserver(resolve, reject);
				});
				return promise;
			}, oShipController)
			.then(function (bClosed, mSession) {
				if (!mSession.bClosed) {
					return Service
						.closeShipHandlingUnit();
				}
			}, oShipController, "send close request to backend only when the hu is open.")
			.then(function (preResult, mSession) {
				if (!mSession.bClosed) {
					if (preResult.MsgVar === "") {
						var sCurrentHU = Global.getCurrentShipHandlingUnit();
						var sSuccessMessage = this.getTextAccordingToMode("closeHU", "closeShippingHU", [sCurrentHU]);
						Message.addSuccess(sSuccessMessage);
						this.playAudio(Const.INFO);
					}
				}
			}, oShipController, "show success message only when the ship hu is already closed before displayed on the ui ")
			.then(function (preResult, mSession) {
				this.setBusy(false);
				this.updateInputWithDefault(Const.ID.SHIP_INPUT, "");
			}, oShipController)
			.then(function (preResult, oParams) {
				var sCloseHU = Global.getCurrentShipHandlingUnit();
				Cache.clearShipHU(sCloseHU);
				this.deleteCurrentShipHandlingUnit();
				return this.removeTabByTabName(sCloseHU);
			}, oShipController, "delete items from ship table, delete current shipHU from Global")
			.then(function (preResult, oParams) {
				if (Global.hasOpenShipHandlingUnit()) {
					var sProposedShipHuId = Global.getShipHandlingUnits()[0];
					this.setCurrentShipHandlingUnit(sProposedShipHuId);
					return this.selectTabByTabName(sProposedShipHuId);
				}
			}, oShipController, "select next ship handling unit")
			.then(function (preResult, oParams) {
				if (!Global.hasOpenShipHandlingUnit()) {
					//no open ship hu
					this.oInitTab.setVisible(true);
					this.setCurrentShipHandlingUnit("");
					this.handleUnpackEnable();
				}
			}, oShipController, "display the intial tab")
			.then(function (preResult, oParams) {
				oParams.sConGroupOfFirstSourceItem = "";
				if (!Util.isEmpty(Global.getSourceId()) && !this.oItemHelper.isEmpty()) {
					oParams.sConGroupOfFirstSourceItem = this.oItemHelper.getFirstItemConsGroup();
				}
			}, oSourceController, "get consolidation group of the selected source product")
			.then(function (vPre, mSession) {
				this.dehilightShipHandlingUnits();
				if (!Util.isEmpty(Global.getProductId())) {
					//has a selected item in the source side
					var aHandlingUnit = this.getHightlightShipHandlingUnits(mSession.sConGroupOfFirstSourceItem);
					if (aHandlingUnit.length > 0) {
						this.hilightShipHandlingUnits(aHandlingUnit);
					}
				}
			}, oShipController, "highlight ship handling unit if possible")
			.then(function () {
				this.oItemHelper.setItemsStatusByConsGrp();
				this.handleExceptionEnable();
				this.updateSourceItemStatus();
				this.handlePackAllEnable();
			}, oSourceController)
			.then(function (preResult, oParams) {
				oParams.bHasSourceItem = !this.oItemHelper.isEmpty();
				if (!oParams.bHasSourceItem && !Global.hasOpenShipHandlingUnit()) {
					this.focus(Const.ID.SOURCE_INPUT);
				} else {
					this.focus(Const.ID.PRODUCT_INPUT);
				}
			}, oSourceController)
			.then(function (preResult, oParams) {
				//has a selected item in the source side
				//TODO: move the logic about "bHasSourceItem" into needAutoCreateShippingHU
				if (oParams.bHasSourceItem && this.needAutoCreateShippingHU(oParams.sConGroupOfFirstSourceItem)) {
					this.onOpenCreateShipHUDialog();
				}
			}, oShipController, "open createshiphu dialog if there is no open ship hu")
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
				this.updateInputWithDefault(Const.ID.SHIP_INPUT, "");
			}, oShipController, "update packing info");

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
			}, oShipController);
		return oWorkFlow;

	};
});