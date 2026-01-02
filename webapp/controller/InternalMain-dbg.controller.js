/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/controller/BaseMain",
	"sap/tl/ewm/lib/reuses1/controllers/Base.controller",
	"scm/ewm/packoutbdlvs1/utils/Util",
	"scm/ewm/packoutbdlvs1/service/ODataService",
	"scm/ewm/packoutbdlvs1/modelHelper/OData",
	"scm/ewm/packoutbdlvs1/utils/Const",
	"sap/ui/model/json/JSONModel",
	"scm/ewm/packoutbdlvs1/model/Message",
	"scm/ewm/packoutbdlvs1/modelHelper/Message",
	"sap/m/MessagePopoverItem",
	"sap/m/MessagePopover",
	"sap/m/MessageBox",
	"scm/ewm/packoutbdlvs1/modelHelper/Global",
	"scm/ewm/packoutbdlvs1/model/SerialNumber",
	"scm/ewm/packoutbdlvs1/workflows/SimpleFactory",
	"scm/ewm/packoutbdlvs1/workflows/AdvancedFactory",
	"scm/ewm/packoutbdlvs1/modelHelper/PackingMode",
	"scm/ewm/packoutbdlvs1/modelHelper/Material",
], function (Controller, CommonBase, Util, Service, ODataHelper, Const, JSONModel, MessageModel, MessageHelper,
	MessagePopoverItem,
	MessagePopover, MessageBox, Global, SerialNumberModel, SimpleFactory, AdvancedFactory, PackingMode, Material) {
	"use strict";
	return Controller.extend("scm.ewm.packoutbdlvs1.controller.InternalMain", {
		sRouteName: "internal",
		init: function () {
			CommonBase.prototype.initAccessCode.call(this);
			var oSourceController = this.byId("id-source-view").getController();
			var oShipController = this.byId("id-ship-view").getController();
			this.oWorkFlowFactory = new AdvancedFactory(oSourceController, oShipController);
		},

		onRouteMatched: function (oParameter) {
			Controller.prototype.onRouteMatched.call(this);
			this.publish(Const.EVENT_BUS.CHANNELS.USER_SETTING, Const.EVENT_BUS.EVENTS.SUCCESS);
			setTimeout(function () {
				this.publish(Const.EVENT_BUS.CHANNELS.EXCEPTION_LIST, Const.EVENT_BUS.EVENTS.SUCCESS, Global.getExceptionList());
			}.bind(this), 0);
		}
	});
});