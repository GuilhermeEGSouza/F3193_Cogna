/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/utils/Util"
], function (Util) {
	var _sJsonFilesModulePath = "scm/ewm/packoutbdlvs1/localService/mockdata";

	function getParameterByName(name, url) {
		var match = RegExp("[?&]" + name + "=([^&]*)").exec(url);
		return match && decodeURIComponent(match[1].replace(/\+/g, " "));
	}
	return [{
			name: "RuntimeEnvSet",
			method: "GET",
			path: new RegExp("RuntimeEnvSet?(.*)"),
			response: function () {
				return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/RuntimeEnvSet", ".json");
				// return "/webapp/localService/mockdata/RuntimeEnvSet.json";
			}
		}, {
			name: "Pack",
			method: "POST",
			path: new RegExp("Pack?(.*)"),
			response: function (mUrlParam, mBody) {
				if (Util.containString(mUrlParam, "Stock03")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/PackSuccess_03", ".json");
					// return "/webapp/localService/mockdata/PackSuccess_03.json";
				} else if (Util.containString(mUrlParam, "Stock04")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/PackSuccess_04", ".json");
					// return "/webapp/localService/mockdata/PackSuccess_04.json";
				} else if (Util.containString(mUrlParam, "StockDifference1") && Util.containString(mUrlParam, "1M")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/Difference_Success_01", ".json");
				} else if (Util.containString(mUrlParam, "StockDamage1") && Util.containString(mUrlParam, "1M")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/Damage_Success_01", ".json");
				} else if (Util.containString(mUrlParam, "StockPartial1") && Util.containString(mUrlParam, "1M")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/Partial_Success_01", ".json");
					// return "/webapp/localService/mockdata/Partial_Success_01.json";
				} else if (Util.containString(mUrlParam, "StockPartial1") && Util.containString(mUrlParam, "2M")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/Partial_Success_02", ".json");
					// return "/webapp/localService/mockdata/Partial_Success_02.json";
				} else if (Util.containString(mUrlParam, "StockPartial2") && Util.containString(mUrlParam, "1M")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/Partial_Success_03", ".json");
					// return "/webapp/localService/mockdata/Partial_Success_03.json";
				} else if (Util.containString(mUrlParam, "StockPartial2") && Util.containString(mUrlParam, "3M")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/Partial_Success_04", ".json");
					// return "/webapp/localService/mockdata/Partial_Success_04.json";
				} else if (Util.containString(mUrlParam, "StockDelivery1")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/Delivery_Success_01", ".json");
				} else if (Util.containString(mUrlParam, "StockDelivery2")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/Delivery_Success_02", ".json");
				} else if (Util.containString(mUrlParam, "SHIP_HU_DE")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/PackSuccess_DE", ".json");
				} else if (Util.containString(mUrlParam, "DE_ITEMS")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/PackSuccess_DE", ".json");
				} 
				else {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/PackSuccess_01", ".json");
					// return "/webapp/localService/mockdata/PackSuccess_01.json";
				}
			}
		}, {
			name: "UnPack",
			method: "POST",
			path: new RegExp("UnPack?(.*)"),
			response: function () {
				return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/PackSuccess_01", ".json");
				// return "/webapp/localService/mockdata/Unpack_Success.json";
			}
		}, {
			name: "Create Ship HU",
			method: "POST",
			path: new RegExp("HUSet$"),
			response: function (mUrlParam, mBody) {
				// var jsonFile = "/webapp/localService/mockdata/NewShippingHU.json";
				var jsonFile = jQuery.sap.getModulePath(_sJsonFilesModulePath + "/NewShippingHU", ".json");
				switch (mBody.HuIdInput) {
				case "SHIP_HU_FOR_ODO1":
					jsonFile = jQuery.sap.getModulePath(_sJsonFilesModulePath + "/SHIP_HU_FOR_ODO1", ".json");
					// jsonFile = "/webapp/localService/mockdata/SHIP_HU_FOR_ODO1.json";
					break;
				case "SHIP_HU_FOR_ODO2":
					jsonFile = jQuery.sap.getModulePath(_sJsonFilesModulePath + "/SHIP_HU_FOR_ODO2", ".json");
					// jsonFile = "/webapp/localService/mockdata/SHIP_HU_FOR_ODO2.json";
					break;
				case "SHIP_HU_DE":
					jsonFile = jQuery.sap.getModulePath(_sJsonFilesModulePath + "/SHIP_HU_DE", ".json");
					// jsonFile = "/webapp/localService/mockdata/SHIP_HU_FOR_ODO2.json";
					break;
				case "SHIP_HU_01":
					jsonFile = jQuery.sap.getModulePath(_sJsonFilesModulePath + "/NewShippingHU", ".json");
					// jsonFile = "/webapp/localService/mockdata/NewShippingHU.json";
					break;
				case "SHIP_HU_02":
					jsonFile = jQuery.sap.getModulePath(_sJsonFilesModulePath + "/SHIP_HU_02", ".json");
					// jsonFile = "/webapp/localService/mockdata/SHIP_HU_02.json";
					break;
				}
				return jsonFile;
			}
		}, {
			name: "Get Source Items",
			path: new RegExp("HUSet(.*)"),
			response: function (mUrlParam, mRequestBody) {
				if (Util.containString(mUrlParam, "SHIP-HU-001")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/NewShippingHU", ".json");
					// return "/webapp/localService/mockdata/NewShippingHU.json";
				} else if (Util.containString(mUrlParam, "SHIP_HU_01")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ShippingSet_Items", ".json");
					// return "/webapp/localService/mockdata/ShippingSet_Items.json";
				} else if (Util.containString(mUrlParam, "MULTIPLE_GROUP")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/MultiGroupSourceHU", ".json");
					// return "/webapp/localService/mockdata/MultiGroupSourceHU.json";
				} else if (Util.containString(mUrlParam, "SHIP_HU_FOR_ODO1")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/SHIP_HU_FOR_ODO1", ".json");
					// return "/webapp/localService/mockdata/SHIP_HU_FOR_ODO1.json";
				} else if (Util.containString(mUrlParam, "SHIP_HU_FOR_ODO2")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/SHIP_HU_FOR_ODO2", ".json");
					// return "/webapp/localService/mockdata/SHIP_HU_FOR_ODO2.json";
				} else if (Util.containString(mUrlParam, "SHIP_HU_DE")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/SHIP_HU_DE", ".json");
					// return "/webapp/localService/mockdata/SHIP_HU_FOR_ODO2.json";
				} else if (Util.containString(mUrlParam, "SINGLE_GROUP")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/SingleODOSourceHUGeneral", ".json");
					// return "/webapp/localService/mockdata/SingleODOSourceHUGeneral.json";
				} else if (Util.containString(mUrlParam, "HU_DOCSN")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/Items_DOCSN", ".json");
					// return "/webapp/localService/mockdata/Items_DOCSN.json";
				} else if (Util.containString(mUrlParam, "REDUCTION_01")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ReductItems", ".json");
					// return "/webapp/localService/mockdata/ReductItems.json";
				} else if (Util.containString(mUrlParam, "HU_1002")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/PartialPackHU", ".json");
					// return "/webapp/localService/mockdata/PartialPackHU.json";
				} else if (Util.containString(mUrlParam, "HU_1003")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/SourceItemWithBatch", ".json");
					// return "/webapp/localService/mockdata/SourceItemWithBatch.json";
				} else if (Util.containString(mUrlParam, "HU_1004")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/DifferencePackHU", ".json");
				} else if (Util.containString(mUrlParam, "HU_1005")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/DamagePackHU", ".json");
				} else if (Util.containString(mUrlParam, "80091901")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/DeliveryWithHu", ".json");
				} else if (Util.containString(mUrlParam, "DE_ITEMS")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/DE_Items", ".json");
					// return "/webapp/localService/mockdata/SourceSet_Items.json";
				} else {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/SourceSet_Items", ".json");
					// return "/webapp/localService/mockdata/SourceSet_Items.json";
				}
			}
		}, {
			name: "Close Shipping HU",
			method: "POST",
			path: new RegExp("Close?(.*)"),
			response: function () {
				return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/Pack_Success", ".json");
				// return "/webapp/localService/mockdata/Pack_Success.json";
			}
		}, {
			name: "logon",
			method: "GET", //default is get
			path: new RegExp("PackingStationSet\(.*\)$"), //path of the request
			response: function (mUrlParam, mRequesetBody) {
				if (Util.containString(mUrlParam, "WP03")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/LogonNoCheck", ".json");
				} else if (Util.containString(mUrlParam, "EWMWarehouse=\'EW01\',EWMWorkCenter=\'\',EWMStorageBin=\'\'")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/PackingStationSet_EW01", ".json");
				}
				return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/Logon", ".json");
			}
		}, {
			name: "Get Material",
			method: "GET", //default is get
			path: new RegExp("PackingStationSet(.*)/PackMats"), //path of the request
			response: jQuery.sap.getModulePath(_sJsonFilesModulePath + "/PackMat", ".json")
				// response: "/webapp/localService/mockdata/PackMat.json"
		}, {
			name: 'verifyResource',
			method: "POST",
			path: new RegExp("ValidateActionSet"),
			response: function (mUrlParam, mRequesetBody) {
				var sResponseUrl;
				var sSource = mRequesetBody.SourceId;
				if (Util.startWith(sSource, "ERROR")) {
					sResponseUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath + "/VerifySource_Failed", ".json");
					// sResponseUrl = "/webapp/localService/mockdata/VerifySource_Failed.json";
				} else if (Util.startWith(sSource, "BIN")) {
					sResponseUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath + "/VerifySource_Bin_Passed", ".json");
					// sResponseUrl = "/webapp/localService/mockdata/VerifySource_Bin_Passed.json";
				} else if (sSource === "HU_1001") {
					sResponseUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath + "/VerifySource_Hu_Passed", ".json");
					// sResponseUrl = "/webapp/localService/mockdata/VerifySource_Hu_Passed.json";
				} else if (sSource === "HU_1002") {
					sResponseUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath + "/VerifySource_02", ".json");
					// sResponseUrl = "/webapp/localService/mockdata/VerifySource_02.json";
				} else if (sSource === "HU_1003") {
					sResponseUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath + "/VerifySource_03", ".json");
					// sResponseUrl = "/webapp/localService/mockdata/VerifySource_03.json";
				} else if (sSource === "HU_1004") {
					sResponseUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath + "/VerifySource_04", ".json");
				} else if (sSource === "HU_1005") {
					sResponseUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath + "/VerifySource_05", ".json");
				} else if (sSource === "SINGLE_GROUP") {
					sResponseUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath + "/VerifySource_Single_Passed", ".json");
					// sResponseUrl = "/webapp/localService/mockdata/VerifySource_Single_Passed.json";
				} else if (sSource === "MULTIPLE_GROUP") {
					sResponseUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath + "/VerifySource_Multiple_Passed", ".json");
					// sResponseUrl = "/webapp/localService/mockdata/VerifySource_Multiple_Passed.json";
				} else if (sSource === "HU_DOCSN") {
					sResponseUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath + "/VerifySource_DOCSN_Passed", ".json");
					// sResponseUrl = "/webapp/localService/mockdata/VerifySource_DOCSN_Passed.json";
				} else if (sSource === "REDUCTION_01") {
					sResponseUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath + "/VerifySource_Reduct_Hu_Passed", ".json");
					// sResponseUrl = "/webapp/localService/mockdata/VerifySource_Reduct_Hu_Passed.json";
				} else if (sSource === "80091901") {
					sResponseUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath + "/VerifySource_DeliveryWithHu", ".json ");
				} else if (sSource === "DE_ITEMS") {
					sResponseUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath + "/VerifySource_DE_ITEMS", ".json ");
				}
				return sResponseUrl;
			}
		}, {
			name: 'convertHUID',
			method: "GET",
			path: new RegExp("ConvertHUID?(.*)"),
			response: function (mUrlParam, mRequesetBody) {
				if (Util.containString(mUrlParam, "HU_1001")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ConvertHUID_HU_1001", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD_S01.json";
				} else if (Util.containString(mUrlParam, "HU_1002")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ConvertHUID_HU_1002", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD_S02.json";
				} else if (Util.containString(mUrlParam, "HU_1003")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ConvertHUID_HU_1003", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD_S03.json";
				} else if (Util.containString(mUrlParam, "HU_1004")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ConvertHUID_HU_1004", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD_S04.json";
				} else if (Util.containString(mUrlParam, "HU_1005")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ConvertHUID_HU_1005", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD-DOCSN.json";
				} else if (Util.containString(mUrlParam, "SINGLE_GROUP")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ConvertHUID_SINGLE_GROUP", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD-DOCSN.json";
				} else if (Util.containString(mUrlParam, "MULTIPLE_GROUP")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ConvertHUID_MULTIPLE_GROUP", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD-DOCSN.json";
				} else if (Util.containString(mUrlParam, "HU_DOCSN")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ConvertHUID_HU_DOCSN", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD-DOCSN.json";
				} else if (Util.containString(mUrlParam, "REDUCTION_01")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ConvertHUID_REDUCTION_01", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD-DOCSN.json";
				} else if (Util.containString(mUrlParam, "80091901")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ConvertHUID_80091901", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD-DOCSN.json";
				} else if (Util.containString(mUrlParam, "SHIP_HU_FOR_ODO2")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ConvertHUID_SHIP_HU_FOR_ODO2", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD-DOCSN.json";
				} else if (Util.containString(mUrlParam, "SHIP_HU_DE")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ConvertHUID_SHIP_HU_DE", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD-DOCSN.json";
				} else if (Util.containString(mUrlParam, "SHIP_HU_FOR_ODO1")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ConvertHUID_SHIP_HU_FOR_ODO1", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD-DOCSN.json";
				} else if (Util.containString(mUrlParam, "SHIP_HU_01")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ConvertHUID_SHIP_HU_01", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD-DOCSN.json";
				} else if (Util.containString(mUrlParam, "SHIP_HU_02")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ConvertHUID_SHIP_HU_02", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD-DOCSN.json";
				} else if (Util.containString(mUrlParam, "DE_ITEMS")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ConvertHUID_DE_Items", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD-DOCSN.json";
				}
				return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ConvertHUID_HU_1001", ".json");
			}
		},

		{
			name: "Verify Product",
			method: "POST",
			path: new RegExp("ValidateProduct?(.*)"),
			response: function (mUrlParam, mRequesetBody) {
				if (Util.containString(mUrlParam, "PROD-S01")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/VerifyProduct_PROD_S01", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD_S01.json";
				} else if (Util.containString(mUrlParam, "PROD-S02")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/VerifyProduct_PROD_S02", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD_S02.json";
				} else if (Util.containString(mUrlParam, "PROD-S03")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/VerifyProduct_PROD_S03", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD_S03.json";
				} else if (Util.containString(mUrlParam, "PROD-S04")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/VerifyProduct_PROD_S04", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD_S04.json";
				} else if (Util.containString(mUrlParam, "PROD-DOCSN")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/VerifyProduct_PROD-DOCSN", ".json");
					// return "/webapp/localService/mockdata/VerifyProduct_PROD-DOCSN.json";
				}
			}
		}, {
			name: "Change Material",
			method: "POST",
			path: new RegExp("ChangePackMat?(.*)"),
			response: function (mUrlParam, mRequestBody) {
				if (Util.containString(mUrlParam, "ShippingHUIdNew='SHIP_HU_01'")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ChangeMaterial_01", ".json");
					// return "/webapp/localService/mockdata/ChangeMaterial_01.json";
				} else if (Util.containString(mUrlParam, "ShippingHUIdNew='SHIP_HU_02'")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ChangeMaterial_02", ".json");
					// return "/webapp/localService/mockdata/ChangeMaterial_02.json";
				}
			}
		}, {
			name: "Get Exception List",
			path: new RegExp("ExceptionListSet(.*)"),
			response: jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ExceptionList", ".json")
				// response: "/webapp/localService/mockdata/ExceptionList.json"
		}, {
			name: "Get ODO",
			path: new RegExp("ODOSet(.*)"),
			response: function (mUrlPaaram) {
				if (Util.containString(mUrlPaaram, "005056ba-1dcb-1ed7-bde8-836faadb0001")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ODOITEM_ODO1", ".json");
					// return "/webapp/localService/mockdata/ODOITEM_ODO1.json";
				} else if (Util.containString(mUrlPaaram, "005056ba-1dcb-1ed7-bde8-836faadb0002")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ODOITEM_ODO2", ".json");
					// return "/webapp/localService/mockdata/ODOITEM_ODO2.json";
				} else {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ODOItem", ".json");
					// return "/webapp/localService/mockdata/ODOItem.json";
				}
			}
		}, {
			name: "Get Item Weight Set",
			path: new RegExp("HUItemWeightSet(.*)"),
			response: jQuery.sap.getModulePath(_sJsonFilesModulePath + "/HuItemWeightSet", ".json")
				// response: "/webapp/localService/mockdata/HuItemWeightSet.json"
		}, {
			name: "Verify Document Levle Serial Number",
			method: "POST",
			path: new RegExp("ValidateSn(.*)"),
			response: jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ValidateSn", ".json")
				// response: "/webapp/localService/mockdata/ValidateSn.json"
		}, {
			name: "Get Packaging Material",
			method: "GET",
			path: new RegExp("PackMatSet(.*)"),
			response: jQuery.sap.getModulePath(_sJsonFilesModulePath + "/PackMat", ".json")
		}, {
			name: "Get Items",
			path: new RegExp("HUSet(.*)/Items"),
			response: function (mUrlParam, mRequestBody) {
				if (Util.containString(mUrlParam, "MULTIPLE_GROUP")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/MultiHuItemSet", ".json");
				} else if (Util.containString(mUrlParam, "SHIP_HU_FOR_ODO1")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/SHIP_HU_FOR_ODO1_ItemSet", ".json");
				} else if (Util.containString(mUrlParam, "SINGLE_GROUP")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/SingleODOSourceHUGeneral_ItemSet", ".json");
				} else if (Util.containString(mUrlParam, "HU_DOCSN")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/Items_DOCSN_ItemSet", ".json");
				} else if (Util.containString(mUrlParam, "REDUCTION_01")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ReductItems_ItemSet", ".json");
				} else if (Util.containString(mUrlParam, "HU_1002")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/PartialPackHU_ItemSet", ".json");
				} else if (Util.containString(mUrlParam, "HU_1004")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/DifferencePackHU_ItemSet", ".json");
				} else if (Util.containString(mUrlParam, "HU_1005")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/DamagePackHU_ItemSet", ".json");
				} else if (Util.containString(mUrlParam, "80091901")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/DeliveryWithHu_ItemSet", ".json");
				} else if (Util.containString(mUrlParam, "DE_ITEMS")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/DE_ITEMS_SET", ".json");
				}
				return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/HuItemSet", ".json");
			}
		}, {
			name: "Get ODOs",
			path: new RegExp("HUSet(.*)/ODOs"),
			response: function (mUrlParam, mRequestBody) {
				if (Util.containString(mUrlParam, "MULTIPLE_GROUP")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/MultiHuODOSet", ".json");
				} else if (Util.containString(mUrlParam, "SHIP_HU_FOR_ODO1")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/SHIP_HU_FOR_ODO1_ODOSet", ".json");
				} else if (Util.containString(mUrlParam, "SINGLE_GROUP")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/SingleODOSourceHUGeneral_ODOSet", ".json");
				} else if (Util.containString(mUrlParam, "HU_DOCSN")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/Items_DOCSN_ODOSet", ".json");
				} else if (Util.containString(mUrlParam, "REDUCTION_01")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ReductItems_ODOSet", ".json");
				} else if (Util.containString(mUrlParam, "HU_1002")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/PartialPackHU_ODOSet", ".json");
				} else if (Util.containString(mUrlParam, "HU_1004")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/DifferencePackHU_ODOSet", ".json");
				} else if (Util.containString(mUrlParam, "HU_1005")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/DamagePackHU_ODOSet", ".json");
				} else if (Util.containString(mUrlParam, "80091901")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/DeliveryWithHu_ODOSet", ".json");
				}
				return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/HuODOSet", ".json");
			}

		}, {
			name: "Get Search Work Center",
			method: "GET",
			path: new RegExp(".*SearchHelpWorkCenterSet.*"),
			response: function (mUrlParam, mRequestBody) {
				return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/SearchHelpWorkCenterSet", ".json");
			}
		}, {
			name: "Get Search Storage Bin",
			method: "GET",
			path: new RegExp(".*SearchHelpBinSet.*"),
			response: function (mUrlParam, mRequestBody) {
				return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/SearchHelpBinSet", ".json");
			}
		}, {
			name: "Verify Warehouse",
			method: "GET",
			path: new RegExp(".*EWMWarehouseVH_Set.*"),
			response: function (mUrlParam, mRequestBody) {
				if (Util.containString(mUrlParam, "EW01")) {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/EWMWarehouseVH_Set_EW01", ".json");
				} else {
					return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/EWMWarehouseVH_Set", ".json");
				}
			}
		}, {
			name: "Get Warehouse Number Set",
			method: "GET",
			path: new RegExp(".*EWMWarehouse_Set.*"),
			response: function (mUrlParam, mRequestBody) {
				return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/EWMWarehouse_Set", ".json");
			}
		}, {
			name: "Get ItemSet",
			method: "GET",
			path: new RegExp(".*ItemSet.*"),
			response: function (mUrlParam, mRequestBody) {
				//	if (Util.containString(mUrlParam, "Stock01")) {
				return jQuery.sap.getModulePath(_sJsonFilesModulePath + "/ItemSet_Stock01", ".json");
				//	}
			}
		}
	];
});