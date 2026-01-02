/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/controller/BaseMain",
	"sap/tl/ewm/lib/reuses1/controllers/Base.controller",
	"scm/ewm/packoutbdlvs1/workflows/SimpleFactory",
	"scm/ewm/packoutbdlvs1/modelHelper/Material",
	"scm/ewm/packoutbdlvs1/utils/Const"
], function (Controller, CommonBase, SimpleFactory, Material, Const) {
	"use strict";
	return Controller.extend("scm.ewm.packoutbdlvs1.controller.Simple", {
		sRouteName: "simple",
		init: function () {
			CommonBase.prototype.initAccessCode.call(this);
			var oSourceController = this.byId("id-source-view").getController();
			var oShipController = this.byId("id-ship-view").getController();
			this.oTemplate = this.byId("template-button");
			this.oWorkFlowFactory = new SimpleFactory(oSourceController, oShipController);

			var oComponent = this.getOwnerComponent();
			var homeButton = oComponent._getHomeButton();
			if (homeButton) {
				homeButton.addEventListener("click", oComponent._fnOnHomeButtonClick);
			}
		},

		onRouteMatched: function () {
			Controller.prototype.onRouteMatched.call(this);
			if (Material.getFavoriteMaterials().length !== 0) {
				this.oWorkFlowFactory.getInitWorkFlow().run();
			}
			this.publish(Const.EVENT_BUS.CHANNELS.USER_SETTING, Const.EVENT_BUS.EVENTS.SUCCESS);
		},
		
		navBack: function(oComponent){
			oComponent._fnOnBackButtonClick();
		}
	});
});