/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"scm/ewm/packoutbdlvs1/modelHelper/Items",
	"sap/ui/model/json/JSONModel",
	"scm/ewm/packoutbdlvs1/control/Audio",
	"sap/suite/ui/commons/collaboration/CollaborationHelper"
], function (Controller, TableItemsHelper, JSONModel, Audio, CollaborationHelper) {
	"use strict";
	return Controller.extend("scm.ewm.packoutbdlvs1.controller.App", {
		onInit: function () {
			var oExpandHashPromise = CollaborationHelper.processAndExpandHash();
			oExpandHashPromise.then(function () {
				this.getView().setModel(this.getOwnerComponent().getModel());
			}.bind(this));
		},
		bindAudioList: function (aFilter) {
			this.byId("audio-player").bindItems({
				path: "/AudioURISet",
				template: new Audio({
					src: "{AudioUri}",
					type: "{Msgty}"
				}),
				filters: aFilter
			});
		}
	});
});