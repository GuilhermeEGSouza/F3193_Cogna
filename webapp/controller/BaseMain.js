/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/controller/BaseController",
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
	"scm/ewm/packoutbdlvs1/modelHelper/OData"
], function (Controller, CommonBase, Util, Service, ODataHelper, Const, JSONModel, MessageModel, MessageHelper,
	MessagePopoverItem,
	MessagePopover, MessageBox, Global, SerialNumberModel, SimpleFactory, AdvancedFactory, PackingMode, Material, OData) {
	"use strict";
	var workCenterInputId = "workcenter--input";
	var storageBinInputId = "storagebin--input";
	return Controller.extend("scm.ewm.packoutbdlvs1.controller.BaseMain", {
		sRouteName: "main",
		init: function () {
			CommonBase.prototype.initAccessCode.call(this);
			this.setButtonToolTip("leave-button");
		},
		initModel: function () {
			this.setModel(SerialNumberModel, "serialNum");
			this.setModel(MessageModel, "message");
		},
		onMessagePopoverPress: function (oEvent) {
			if (!this.oMessagePopover) {
				this.initMessagePopover();
			}
			this.oMessagePopover.toggle(oEvent.getSource());
		},
		initMessagePopover: function () {
			var oMessageTemplate = new MessagePopoverItem({
				type: '{type}',
				title: '{text}'
			});

			var oMessagePopover = new MessagePopover({
				items: {
					path: '/',
					template: oMessageTemplate
				}
			});
			oMessagePopover.setModel(MessageModel);
			this.oMessagePopover = oMessagePopover;
		},

		formatTitle: function (sBin, sWorkStation, sWarehouse) {
			if (Util.isEmpty(sWarehouse) || Util.isEmpty(sWorkStation) || Util.isEmpty(sBin)) {
				return "";
			}
			return this.getI18nText("pageTitle", [sBin, sWorkStation, sWarehouse]);
		},

		onLeave: function (oEvent) {
			var bHaveShip = !Util.isEmpty(Global.getCurrentShipHandlingUnit());
			var sWarning = bHaveShip ? this.getTextAccordingToMode("leaveMsgSaveHU", "leaveMsgSaveShipHU") : this.getI18nText(
				"leaveMsgWhenNoShipHU");
			this.playAudio(Const.WARNING);
			MessageBox.warning(
				sWarning, {
					actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
					onClose: function (oAction) {
						if (oAction === MessageBox.Action.OK) {
							this.setBusy(true);
							this.oWorkFlowFactory.getLeaveWorkFlow().run();
						}
					}.bind(this)
				}
			);

		},

		leavePage: function (oEvent) {
			var bHaveShip = !Util.isEmpty(Global.getCurrentShipHandlingUnit());
			var oComponent = this.getOwnerComponent();
			if (bHaveShip) {
				var sWarning = this.getI18nText("leavePageMsg");
				this.playAudio(Const.WARNING);
				MessageBox.warning(
					sWarning, {
						actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
						onClose: function (oAction) {
							if (oAction === MessageBox.Action.OK) {
								this.navBack(oComponent);
							}
						}.bind(this)
					}
				);
			} else {
				this.navBack(oComponent);
			}
		},

		navBack: function (oComponent) {
	        this.bindInputInDefaultBin(oComponent);
			oComponent.navigateBack.call(oComponent, arguments);
		},

			bindInputInDefaultBin: function (oComponent) {
			var sComponentId = oComponent.getId();
			var oWorkCenterInput = sap.ui.getCore().byId(sComponentId + Const.ID.DEFAULT_BIN_VIEW + workCenterInputId);
			if (Util.isEmpty(oWorkCenterInput)) {
				return;
			}
			var sWorkStation = oWorkCenterInput.getProperty("value");
			if (Util.isEmpty(sWorkStation)) {
				return;
			}
			var sWorkStationEncoded = OData.encodeSpecialCharacter(sWorkStation);
			oWorkCenterInput.bindElement({
				path: "/PackingStationSet(EWMWarehouse='" + Global.getWarehouseNumber() + "',EWMWorkCenter='" + sWorkStationEncoded +
					"',EWMStorageBin='')"
			});
			var oStorageBinInput = sap.ui.getCore().byId(sComponentId + Const.ID.DEFAULT_BIN_VIEW + storageBinInputId);
			oStorageBinInput.bindElement({
				path: "/PackingStationSet(EWMWarehouse='" + Global.getWarehouseNumber() + "',EWMWorkCenter='" + sWorkStationEncoded +
					"',EWMStorageBin='')"
			});
		},

		onRouteMatched: function () {
			this.getOwnerComponent().getService("ShellUIService")
				.then(function (oService) {
						oService.setBackNavigation(this.leavePage.bind(this));
					}.bind(this),
					function (oError) {
						jQuery.sap.log.error("Cannot get ShellUIService", oError);
					}
				);
		}
	});
});