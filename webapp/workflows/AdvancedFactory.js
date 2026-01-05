/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/workflows/Factory",
	"zcogna/ewm/packoutbdlvs1/workflows/Advanced/ChangeMaterial",
	"zcogna/ewm/packoutbdlvs1/workflows/Advanced/CloseShipHU",
	"zcogna/ewm/packoutbdlvs1/workflows/Advanced/CreateShipHU",
	"zcogna/ewm/packoutbdlvs1/workflows/Advanced/DeleteShipHU",
	"zcogna/ewm/packoutbdlvs1/workflows/Advanced/PackAll",
	"zcogna/ewm/packoutbdlvs1/workflows/Advanced/PackItem",
	"zcogna/ewm/packoutbdlvs1/workflows/Advanced/PackPartial",
	"zcogna/ewm/packoutbdlvs1/workflows/Advanced/PackWithDifference",
	"zcogna/ewm/packoutbdlvs1/workflows/Advanced/ProductChange",
	"zcogna/ewm/packoutbdlvs1/workflows/Advanced/SelectShipHU",
	"zcogna/ewm/packoutbdlvs1/workflows/Advanced/SourceChange",
	"zcogna/ewm/packoutbdlvs1/workflows/Advanced/UnpackAll",
	"zcogna/ewm/packoutbdlvs1/workflows/Advanced/UnpackItem",
	"zcogna/ewm/packoutbdlvs1/workflows/Advanced/QuantityChange",
	"zcogna/ewm/packoutbdlvs1/workflows/Advanced/Leave",
	"zcogna/ewm/packoutbdlvs1/workflows/Advanced/RestoreShipHU",
	"zcogna/ewm/packoutbdlvs1/workflows/Advanced/Clear",
	"zcogna/ewm/packoutbdlvs1/workflows/Advanced/Print",
	"zcogna/ewm/packoutbdlvs1/workflows/Advanced/ShippingHUChange"
], function(BaseObject, ChangeMaterial, CloseShipHU, CreateShipHU, DeleteShipHU, PackAll, PackItem, PackPartial, PackWithDifference,
	ProductChange, SelectShipHU, SourceChange, UnpackAll, UnpackItem, QuantityChange, Leave, RestoreShipHU, Clear, Print,
	ShippingHUChange) {
	"use strict";
	var Factory = BaseObject.extend("zcogna.ewm.packoutbdlvs1.workflows.AdvancedFactory", {
		aImplemention: [
			null,
			SourceChange,
			ProductChange,
			PackItem,
			PackWithDifference,
			PackPartial,
			UnpackItem,
			UnpackAll,
			SelectShipHU,
			CloseShipHU,
			ChangeMaterial,
			DeleteShipHU,
			CreateShipHU,
			QuantityChange,
			Leave,
			RestoreShipHU,
			PackAll,
			Clear,
			Print,
			ShippingHUChange
		]
	});
	return Factory;
});