/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/controller/BaseMain",
	"sap/tl/ewm/lib/reuses1/controllers/Base.controller",
	"zcogna/ewm/packoutbdlvs1/utils/Util",
	"zcogna/ewm/packoutbdlvs1/service/ODataService",
	"zcogna/ewm/packoutbdlvs1/modelHelper/OData",
	"zcogna/ewm/packoutbdlvs1/utils/Const",
	"sap/ui/model/json/JSONModel",
	"zcogna/ewm/packoutbdlvs1/model/Message",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Message",
	"sap/m/MessagePopoverItem",
	"sap/m/MessagePopover",
	"sap/m/MessageBox",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Global",
	"zcogna/ewm/packoutbdlvs1/model/SerialNumber",
	"zcogna/ewm/packoutbdlvs1/workflows/SimpleFactory",
	"zcogna/ewm/packoutbdlvs1/workflows/AdvancedFactory",
	"zcogna/ewm/packoutbdlvs1/modelHelper/PackingMode",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Material"
], function (Controller, CommonBase, Util, Service, ODataHelper, Const, JSONModel, MessageModel, MessageHelper,
	MessagePopoverItem,
	MessagePopover, MessageBox, Global, SerialNumberModel, SimpleFactory, AdvancedFactory, PackingMode, Material) {
	"use strict";
	return Controller.extend("zcogna.ewm.packoutbdlvs1.controller.Main", {
		sRouteName: "main",
		init: function () {
			CommonBase.prototype.initAccessCode.call(this);
			var oSourceController = this.byId("id-source-view").getController();
			var oShipController = this.byId("id-ship-view").getController();
			this.oWorkFlowFactory = new AdvancedFactory(oSourceController, oShipController);
		},

		onRouteMatched: function (oParameter) {
			Controller.prototype.onRouteMatched.call(this);
			this.publish(Const.EVENT_BUS.CHANNELS.USER_SETTING, Const.EVENT_BUS.EVENTS.SUCCESS);
			setTimeout(function(){
				this.publish(Const.EVENT_BUS.CHANNELS.EXCEPTION_LIST, Const.EVENT_BUS.EVENTS.SUCCESS, Global.getExceptionList());
			}.bind(this), 0);
		}
	});
});