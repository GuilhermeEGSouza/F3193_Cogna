/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/workflows/WorkFlow",
	"scm/ewm/packoutbdlvs1/utils/Util",
	"scm/ewm/packoutbdlvs1/utils/Const",
	"scm/ewm/packoutbdlvs1/modelHelper/Message",
	"scm/ewm/packoutbdlvs1/service/ODataService",
	"scm/ewm/packoutbdlvs1/modelHelper/Global",
	"scm/ewm/packoutbdlvs1/modelHelper/Cache"
], function (WorkFlow, Util, Const, Message, Service, Global, Cache) {
	"use strict";
	return function (oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function (oDeleteInfo, mSession) {
				mSession.oDeleteInfo = oDeleteInfo;
				mSession.HU = Global.getCurrentShipHandlingUnit();
				if (oDeleteInfo.bCallService) {
					return Service.deleteShippingHU();
				}
			}, oShipController, "call delete ship hu service based on the indicator")
			.then(function (preResult, oParams) {
				this.setBusy(false);
				var sDeleteHU = Global.getCurrentShipHandlingUnit();
				Cache.clearShipHU(sDeleteHU);
				this.deleteCurrentShipHandlingUnit();
				return this.removeTabByTabName(sDeleteHU);
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
			.then(function (preResult, mSession) {
				if (mSession.oDeleteInfo.bCallService) {
					var sMessage = this.getTextAccordingToMode("deleteHuSuccessMsg", "deleteShipHuSuccessMsg", mSession.HU);
					Message.addSuccess(sMessage);
					this.playAudio(Const.INFO);
				}
			}, oShipController)
			.then(function (preResult, mPara) {
				if (mPara.oDeleteInfo.bRefreshSource) {
					return this.getWorkFlowFactory().getSourceChangeWorkFlow().run({
						sReferenceNumber: Global.getSourceId(),
						bReferenceNumberValidated: true
					});
				}
			}, oSourceController, "refresh the left side")
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
				this.focus(Const.ID.PRODUCT_INPUT);
				this.oItemHelper.setItemsStatusByConsGrp();
				this.handleExceptionEnable();
				this.updateSourceItemStatus();
				this.handlePackAllEnable();
			}, oSourceController)
			.then(function (preResult, oParams) {
				oParams.bHasSourceItem = !this.oItemHelper.isEmpty();
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