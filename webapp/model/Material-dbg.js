/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function(JSONModel) {
	"use strict";

	return new JSONModel({
		"otherMaterials": [],
		"favoriteMaterials": [],
		"currentMaterial": {},
		"materialLayout": [],
		"selectedMaterialId": "",
		"defaultMaterialId": "",
		"originalMaterialId": ""
	});
});