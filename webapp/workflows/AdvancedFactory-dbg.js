/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/workflows/Factory",
	"scm/ewm/packoutbdlvs1/workflows/Advanced/ChangeMaterial",
	"scm/ewm/packoutbdlvs1/workflows/Advanced/CloseShipHU",
	"scm/ewm/packoutbdlvs1/workflows/Advanced/CreateShipHU",
	"scm/ewm/packoutbdlvs1/workflows/Advanced/DeleteShipHU",
	"scm/ewm/packoutbdlvs1/workflows/Advanced/PackAll",
	"scm/ewm/packoutbdlvs1/workflows/Advanced/PackItem",
	"scm/ewm/packoutbdlvs1/workflows/Advanced/PackPartial",
	"scm/ewm/packoutbdlvs1/workflows/Advanced/PackWithDifference",
	"scm/ewm/packoutbdlvs1/workflows/Advanced/ProductChange",
	"scm/ewm/packoutbdlvs1/workflows/Advanced/SelectShipHU",
	"scm/ewm/packoutbdlvs1/workflows/Advanced/SourceChange",
	"scm/ewm/packoutbdlvs1/workflows/Advanced/UnpackAll",
	"scm/ewm/packoutbdlvs1/workflows/Advanced/UnpackItem",
	"scm/ewm/packoutbdlvs1/workflows/Advanced/QuantityChange",
	"scm/ewm/packoutbdlvs1/workflows/Advanced/Leave",
	"scm/ewm/packoutbdlvs1/workflows/Advanced/RestoreShipHU",
	"scm/ewm/packoutbdlvs1/workflows/Advanced/Clear",
	"scm/ewm/packoutbdlvs1/workflows/Advanced/Print",
	"scm/ewm/packoutbdlvs1/workflows/Advanced/ShippingHUChange"
], function(BaseObject, ChangeMaterial, CloseShipHU, CreateShipHU, DeleteShipHU, PackAll, PackItem, PackPartial, PackWithDifference,
	ProductChange, SelectShipHU, SourceChange, UnpackAll, UnpackItem, QuantityChange, Leave, RestoreShipHU, Clear, Print,
	ShippingHUChange) {
	"use strict";
	var Factory = BaseObject.extend("scm.ewm.packoutbdlvs1.workflows.AdvancedFactory", {
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