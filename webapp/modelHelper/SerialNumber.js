/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/model/SerialNumber",
	"scm/ewm/packoutbdlvs1/utils/Util"
], function (Model, Util) {
	"use strict";
	return {
		removeSerialNumber: function (sSerialNum) {
			var iIndex = this.getSerialNumberIndex(sSerialNum);
			if (iIndex === -1) {
				return;
			}
			var aSerialNumberList = this.getSerialNumbersList();
			aSerialNumberList = aSerialNumberList.slice(0);
			aSerialNumberList.splice(iIndex, 1);
			this.setSerialNumbersList(aSerialNumberList);
		},
		getSerialNumbersList: function () {
			return Model.getProperty("/serialNumbers");
		},
		getAllSerialNumerKeys: function () {
			var aSn = [];
			var aSerialNumberList = this.getSerialNumbersList();
			aSerialNumberList.forEach(function (oSn) {
				aSn.push(oSn.key);
			});
			return aSn;
		},
		setSerialNumbersList: function (aSerialNumberList) {
			Model.setProperty("/serialNumbers", aSerialNumberList);
		},
		setSerialNumberUiisList: function (aSerialNumberUiiList) {
			Model.setProperty("/uiis", aSerialNumberUiiList);
		},
		clearSerialNumbersList: function () {
			this.setSerialNumbersList([]);
		},
		getSerialNumberIndex: function (sSerialNum) {
			var aSerialNumberList = this.getSerialNumbersList();
			var iIndex = Util.findIndex(aSerialNumberList, function (oSerialNumber) {
				if (oSerialNumber.key === sSerialNum) {
					return true;
				}
				return false;
			});
			return iIndex;
		},
		addSerialNumber: function (sSerialNum) {
			var aSerialNumberList = this.getSerialNumbersList();
			var oSerialNumber = {
				"key": sSerialNum
			};
			aSerialNumberList = aSerialNumberList.slice(0);
			aSerialNumberList.unshift(oSerialNumber);
			this.setSerialNumbersList(aSerialNumberList);
			return this;
		},
		hasSerialNumber: function (sSerialNum) {
			var iIndex = this.getSerialNumberIndex(sSerialNum);
			if (iIndex !== -1) {
				return true;
			}
			return false;
		},
		getSerialNumberCount: function () {
			var aSerialNumberList = this.getSerialNumbersList();
			return aSerialNumberList.length;
		},
		convertSerialNumbersToString: function () {
			var aSerialNumberList = this.getAllSerialNumerKeys();
			return Util.formatSerialNumber(aSerialNumberList);
		},
		getPackedUiis: function (aSnList, aIuidList, aPackedSnList) {
			var aPackedIuidList = [];
			var index;
			for (var i = 0; i < aPackedSnList.length; i++) {
				index = aSnList.indexOf(aPackedSnList[i]);
				if (index !== -1) {
					aPackedIuidList.push(aIuidList[index]);
				}
			}
			return aPackedIuidList.join(" ");
		}
	};
});