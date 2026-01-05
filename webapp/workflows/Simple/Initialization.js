/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/workflows/WorkFlow",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Material",
	"zcogna/ewm/packoutbdlvs1/utils/Util"
], function(WorkFlow, Material, Util) {
	"use strict";
	return function(oSourceController, oShipController) {
		var oWorkFlow = new WorkFlow()
			.then(function() {
				var oToolbar = this.byId("simple_favorite_material_toolbar");
				oToolbar.bindAggregation("content", {
					path: "material>/favoriteMaterials",
					template: this.oTemplate,
					templateShareable: true
				});
			}, oShipController, "init package matrial buttons")
			.then(function() {
				var oToolbar = this.byId("simple_favorite_material_toolbar");
				var aContent = oToolbar.getContent();
				var aMaterials = Material.getFavoriteMaterials();
				aContent.forEach(function(oButton, idx) {
					var oMaterial = aMaterials[idx];
					var sToolTip = oMaterial.PackagingMaterial;
					if (!Util.isEmpty(oMaterial.PackagingMaterialDescription)) {
						sToolTip += " - " + oMaterial.PackagingMaterialDescription;
					}
					oButton.setTooltip(sToolTip);
				});
			}, oShipController, "add tool tip for favorite material buttons");
		return oWorkFlow;
	};
});