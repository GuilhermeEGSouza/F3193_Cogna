/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/utils/Util",
	"zcogna/ewm/packoutbdlvs1/utils/Const"
], function (Util, Const) {

	"use strict";

	function ColumnSettings(oModel) {
		this._oModel = oModel;
	}

	jQuery.extend(ColumnSettings.prototype, Error.prototype, {
		constructor: ColumnSettings,
		getModel: function () {
			return this._oModel;
		},
		setData: function (aData) {
			this._oModel.setData(aData);
			return this;
		},
		setColumnSettings: function (aColumnSettings) {
			this._oModel.setProperty("/columnSettings", aColumnSettings);
			return this;
		},
		getColumnSettings: function () {
			return this._oModel.getProperty("/columnSettings");
		},
		restore: function (oDefaultSetting) {
			var aNewTableSettings = JSON.parse(JSON.stringify(oDefaultSetting));
			for (var i = 0; i < aNewTableSettings.length; i++) {
				aNewTableSettings[i].visible = aNewTableSettings[i].defaultVisible;
				aNewTableSettings[i].index = aNewTableSettings[i].defaultIndex;
			}
			this.setColumnSettings(aNewTableSettings);
		},
		setEnableRestore: function (bValue) {
			this._oModel.setProperty("/enableRestore", bValue);
			return this;
		},
		isColumnSettingAsDefault: function () {
			var aTableSettings = this.getColumnSettings();
			var iIndex = Util.findIndex(aTableSettings, function (oColumnSetting) {
				if (oColumnSetting.visible !== oColumnSetting.defaultVisible) {
					return true;
				}
			});
			return iIndex !== -1 ? false : true;
		},
		updateRestore: function () {
			if (this.isColumnSettingAsDefault()) {
				this.setEnableRestore(false);
			} else {
				this.setEnableRestore(true);
			}
		},
		setColumnTextByKey: function (sKey, sText) {
			var aTableSettings = this.getColumnSettings();
			var aNewTableSettings = JSON.parse(JSON.stringify(aTableSettings));
			for (var i = 0; i < aNewTableSettings.length; i++) {
				if (aNewTableSettings[i].columnKey === sKey) {
					aNewTableSettings[i].text = sText;
				}
			}
			this.setColumnSettings(aNewTableSettings);
		},
		setMandatoryColumnVisible: function () {
			var aTableSettings = this.getColumnSettings();
			for (var i = 0; i < aTableSettings.length; i++) {
				if (aTableSettings[i].mandatory) {
					aTableSettings[i].visible = true;
					aTableSettings[i].index = aTableSettings[i].defaultIndex;
				}
			}
		},
		addStatusColumnSetting: function (sText) {
			var aColumnSettings = this.getColumnSettings();
			var aNewColumnSettings = JSON.parse(JSON.stringify(aColumnSettings));
			var iColumnNum = aNewColumnSettings.length;
			var bChanged = false;
			if (aNewColumnSettings[iColumnNum - 1].columnKey !== "status") {
				var oStatusColumnSetting = {
					"columnKey": "status",
					"text": sText,
					"index": iColumnNum,
					"visible": true,
					"defaultVisible": true,
					"defaultIndex": iColumnNum,
					"mandatory": true
				};
				aNewColumnSettings.splice(iColumnNum, 0, oStatusColumnSetting);
				bChanged = true;
			}
			this.setColumnSettings(aNewColumnSettings);
			return bChanged;
		},
		removeStatusColumnSetting: function () {
			var aColumnSettings = this.getColumnSettings();
			var aNewColumnSettings = JSON.parse(JSON.stringify(aColumnSettings));
			var bChanged = false;
			if (aNewColumnSettings[aNewColumnSettings.length - 1].columnKey === "status") {
				aNewColumnSettings.splice(aNewColumnSettings.length - 1, 1);
				bChanged = true;
			}
			this.setColumnSettings(aNewColumnSettings);
			return bChanged;
		},
		handleStatusColumnSetting: function (bAsync, sText) {
			if (bAsync) {
				return this.addStatusColumnSetting(sText);
			} else {
				return this.removeStatusColumnSetting();
			}
		}
	});

	return ColumnSettings;
});