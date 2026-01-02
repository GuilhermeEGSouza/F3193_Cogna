/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function (JSONModel) {
	"use strict";

	return new JSONModel({
		"busy": true,
		"sourceId": "",
		"sourceType": "",
		"currentShipHandlingUnit": "",
		"currentShipHandlingUnitClosed": false, //the flag of if the current ship hu is closed or not
		"shipHandlingUnits": [], //ship handling unit id
		"exceptionEnable": false,
		"packAllEnable": false,
		"closeShipHUEnable": false,
		"sourceMaterialId": "",
		"isOnCloud": true,
		"scaleEnabled": false,
		"bin": "",
		"unpackEnable": false,
		"productId": "",
		"asyncMode": false,
		"pendingTaskNumber": 0,
		//tell if a source handling unit/bin or ship handling unit is displaying in the source side
		"isPickHUInSourceSide": true,
		"exceptionList": [],
		"checkConsolidationGroup": true
	});
});