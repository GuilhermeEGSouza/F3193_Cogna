/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/workflows/Factory",
	"scm/ewm/packoutbdlvs1/workflows/Simple/Initialization",
	"scm/ewm/packoutbdlvs1/workflows/Simple/ChangeMaterial",
	"scm/ewm/packoutbdlvs1/workflows/Simple/CloseShipHU",
	"scm/ewm/packoutbdlvs1/workflows/Simple/CreateShipHU",
	"scm/ewm/packoutbdlvs1/workflows/Simple/DeleteShipHU",
	"scm/ewm/packoutbdlvs1/workflows/Simple/PackAll",
	"scm/ewm/packoutbdlvs1/workflows/Simple/PackItem",
	"scm/ewm/packoutbdlvs1/workflows/Simple/PackPartial",
	"scm/ewm/packoutbdlvs1/workflows/Simple/PackWithDifference",
	"scm/ewm/packoutbdlvs1/workflows/Simple/ProductChange",
	"scm/ewm/packoutbdlvs1/workflows/Simple/SelectShipHU",
	"scm/ewm/packoutbdlvs1/workflows/Simple/SourceChange",
	"scm/ewm/packoutbdlvs1/workflows/Simple/UnpackAll",
	"scm/ewm/packoutbdlvs1/workflows/Simple/UnpackItem",
	"scm/ewm/packoutbdlvs1/workflows/Simple/QuantityChange",
	"scm/ewm/packoutbdlvs1/workflows/Simple/Leave",
	"scm/ewm/packoutbdlvs1/workflows/Simple/RestoreShipHU",
	"scm/ewm/packoutbdlvs1/workflows/Simple/Clear",
	"scm/ewm/packoutbdlvs1/workflows/Advanced/Print"
], function(BaseObject, Initialization, ChangeMaterial, CloseShipHU, CreateShipHU, DeleteShipHU, PackAll, PackItem, PackPartial,
	PackWithDifference, ProductChange, SelectShipHU, SourceChange, UnpackAll, UnpackItem, QuantityChange, Leave, RestoreShipHU, Clear, Print) {
	"use strict";
	var Factory = BaseObject.extend("scm.ewm.packoutbdlvs1.workflows.SimpleFactory", {
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