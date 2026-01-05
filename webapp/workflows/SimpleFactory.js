/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/workflows/Factory",
	"zcogna/ewm/packoutbdlvs1/workflows/Simple/Initialization",
	"zcogna/ewm/packoutbdlvs1/workflows/Simple/ChangeMaterial",
	"zcogna/ewm/packoutbdlvs1/workflows/Simple/CloseShipHU",
	"zcogna/ewm/packoutbdlvs1/workflows/Simple/CreateShipHU",
	"zcogna/ewm/packoutbdlvs1/workflows/Simple/DeleteShipHU",
	"zcogna/ewm/packoutbdlvs1/workflows/Simple/PackAll",
	"zcogna/ewm/packoutbdlvs1/workflows/Simple/PackItem",
	"zcogna/ewm/packoutbdlvs1/workflows/Simple/PackPartial",
	"zcogna/ewm/packoutbdlvs1/workflows/Simple/PackWithDifference",
	"zcogna/ewm/packoutbdlvs1/workflows/Simple/ProductChange",
	"zcogna/ewm/packoutbdlvs1/workflows/Simple/SelectShipHU",
	"zcogna/ewm/packoutbdlvs1/workflows/Simple/SourceChange",
	"zcogna/ewm/packoutbdlvs1/workflows/Simple/UnpackAll",
	"zcogna/ewm/packoutbdlvs1/workflows/Simple/UnpackItem",
	"zcogna/ewm/packoutbdlvs1/workflows/Simple/QuantityChange",
	"zcogna/ewm/packoutbdlvs1/workflows/Simple/Leave",
	"zcogna/ewm/packoutbdlvs1/workflows/Simple/RestoreShipHU",
	"zcogna/ewm/packoutbdlvs1/workflows/Simple/Clear",
	"zcogna/ewm/packoutbdlvs1/workflows/Advanced/Print"
], function(BaseObject, Initialization, ChangeMaterial, CloseShipHU, CreateShipHU, DeleteShipHU, PackAll, PackItem, PackPartial,
	PackWithDifference, ProductChange, SelectShipHU, SourceChange, UnpackAll, UnpackItem, QuantityChange, Leave, RestoreShipHU, Clear, Print) {
	"use strict";
	var Factory = BaseObject.extend("zcogna.ewm.packoutbdlvs1.workflows.SimpleFactory", {
		aImplemention: [
			Initialization,
			SourceChange,
			ProductChange,
			PackItem,
			null,
			null,
			UnpackItem,
			null,
			SelectShipHU,
			CloseShipHU,
			ChangeMaterial,
			null,
			CreateShipHU,
			QuantityChange,
			Leave,
			RestoreShipHU,
			PackAll,
			Clear,
			Print,
			null
		]

	});
	return Factory;
});