/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/workflows/WorkFlow",
	"scm/ewm/packoutbdlvs1/utils/Util"
], function(WorkFlow, Util) {
	"use strict";
	return function(oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function(){
				
			}, oSourceController)
			.then(function(){
				
			}, oShipController);
			
			oWorkFlow
				.errors()
				.subscribe("", function() {
					
				});
		return oWorkFlow;
			
	};
});