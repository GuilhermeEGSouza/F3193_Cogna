/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/base/Interface",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Global"
	], function(BaseObject, Interface, Global) {
	"use strict";
	function dummyFunction () {};
	return BaseObject.extend("zcogna.ewm.packoutbdlvs1.workflows.Factory", {
		//todo:: remove the dependency to controller
		constructor: function(oSourceController, oShipController) {
			BaseObject.call(this);
			this.oSourceController = oSourceController;
			this.oShipController = oShipController;
			this.initPublicMethods();
		},
		interfaces: [
			"getInitWorkFlow",
			"getSourceChangeWorkFlow",
			"getProductChangeWorkFlow",
			"getPackItemWorkFlow",
			"getDiffPackWorkFlow",
			"getPartialPackWorkFlow",
			"getUnpackWorkFlow",
			"getUnpackAllWorkFlow",
			"getShipHUSelectionWorkFlow",
			"getShipHUCloseWorkFlow",
			"getMaterialChangeWorkFlow",
			"getShipHUDeleteWorkFlow",
			"getShipHUCreationWorkFlow",
			"getQuantityChangeWorkFlow",
			"getLeaveWorkFlow",
			"getShipHURestoreWorkFlow",
			"getPackAllWorkFlow",
			"getClearWorkFlow",
			"getPrintWorkFlow",
			"getShipHUChangeWorkFlow"
		],
		abstract: true,
		final: false,
		aImplemention: [], // the implementations of the interfaces, should keep same order with interfaces
		initPublicMethods: function() {
			//todo:: check all interfaces are implemented
			if(this.aImplemention.length !== this.interfaces.length) {
				throw new Error("the number of public methods and implementations not matched");
			} else {
				this.interfaces.forEach(function(sMethod, inx) {
					var fnWorkFlow = this.aImplemention[inx];
					var _fnWrapper;
					this[sMethod] = function() {
						if(!_fnWrapper) {
							_fnWrapper = fnWorkFlow ? fnWorkFlow(this.oSourceController, this.oShipController, this) : dummyFunction;
						}
						return _fnWrapper;
					};
				}.bind(this));
			}
		}
	});
});