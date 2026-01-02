/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/workflows/WorkFlow",
	"scm/ewm/packoutbdlvs1/model/Material"
], function(WorkFlow, Material) {
	"use strict";
	return function(oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function() {
				//todo::
			}, oSourceController, "init work");
		return oWorkFlow;
	};
});