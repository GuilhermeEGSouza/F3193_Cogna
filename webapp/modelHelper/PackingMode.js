/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/model/PackingMode",
	"scm/ewm/packoutbdlvs1/utils/Util",
	"scm/ewm/packoutbdlvs1/utils/Const"
], function (Model, Util, Const) {
	"use strict";
	return {
		setModes: function (aModes) {
			Model.setProperty("/modes", aModes);
			return this;
		},
		setSelectedMode: function (sMode) {
			Model.setProperty("/selectedMode", sMode);
			return this;
		},
		getSelectedMode: function () {
			return Model.getProperty("/selectedMode");
		},
		reset: function () {
			this.setModes([]);
			this.setSelectedMode("");
			return this;
		},
		isBasicMode: function () {
			var sMode = Model.getProperty("/selectedMode");
			return sMode === Const.BASIC_MODE;
		},
		isAdvancedMode: function () {
			var sMode = Model.getProperty("/selectedMode");
			return sMode === Const.ADVANCED_MODE;
		},
		isInternalMode: function () {
			var sMode = Model.getProperty("/selectedMode");
			return sMode === Const.INTERNAL_MODE;
		}

	};
});