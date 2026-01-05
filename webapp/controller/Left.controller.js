/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/controller/WorkFlowController",
	"zcogna/ewm/packoutbdlvs1/utils/CustomError",
	"zcogna/ewm/packoutbdlvs1/utils/Const",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Global",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Cache",
	"zcogna/ewm/packoutbdlvs1/utils/Util",
	"sap/tl/ewm/lib/reuses1/controllers/Base.controller",
	"zcogna/ewm/packoutbdlvs1/modelHelper/OData",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Items",
	"sap/ui/model/json/JSONModel",
	"zcogna/ewm/packoutbdlvs1/modelHelper/SerialNumber",
	"sap/m/ListMode",
	"zcogna/ewm/packoutbdlvs1/service/ODataService",
	"sap/ui/core/ValueState",
	"zcogna/ewm/packoutbdlvs1/modelHelper/PackingMode",
	"sap/m/MessageBox",
	"zcogna/ewm/packoutbdlvs1/model/AdvancedSourceTableSetting",
	"zcogna/ewm/packoutbdlvs1/modelHelper/ColumnSettings",
	"zcogna/ewm/packoutbdlvs1/model/PackingMode",
	"zcogna/ewm/packoutbdlvs1/model/BasicSourceTableSetting",
	"zcogna/ewm/packoutbdlvs1/model/InternalSourceTableSetting"
], function (Controller, CustomError, Const, Global, Cache, Util, CommonBase, ODataHelper, TableItemsHelper, JSONModel, SerialNumber,
	ListMode, Service, ValueState, PackingModeHelper, MessageBox, AdvancedSourceTableSetting, ColumnSettingsHelper, PackingModeModel,
	BasicSourceTableSetting, InternalSourceTableSetting) {
	"use strict";
	var serialNumberDialogId = "serialNumberDialog";
	var serialNumberInputId = "id-input-serialNumber";
	var stockLevleSnDialogId = "stockLevelSnDialog";
	var stockLevelSnInputId = "stockLevel-sn-input";
	var batchDialogId = "batchDialog";
	var batchId = "batch-input";
	var partialId = "partial-pack-input";
	var differenceId = "difference-quantity-input";
	var damageId = "damage-quantity-input";
	var serialNumberDifferenceInputId = "id-input-serialNumber-difference-pack";
	var serialNumberPartialPackInputId = "id-input-serialNumber-partial-pack";
	var serialNumberDamageInputId = "id-input-serialNumber-damage-pack";
	var reductionDialogId = "reductionDialog";
	return Controller.extend("zcogna.ewm.packoutbdlvs1.controller.Left", {
		oItemHelper: new TableItemsHelper(new JSONModel([])),
		oColumnSettingsHelper: new ColumnSettingsHelper(new JSONModel([])),
		bLoaded: false,
		addElement: function () {
			var oContainer = this.byId("product-info");
			var oElement;
			var oField;
			var oView = this.getView();
			var aProperties = this.getItemProperties();
			var oLabel, sLabel, sValue;
			for (var i = 0; i < aProperties.length; i++) {
				sap.ui.getCore().byId();
				oElement = new sap.ui.layout.form.FormElement(oView.createId("element" + i), {
					"visible": false
				});
				oLabel = Util.find(aProperties[i].extensions, function (oProperty) {
					if (oProperty.name === "label") {
						return true;
					}
					return false;
				});
				sLabel = Util.isEmpty(oLabel) ? aProperties[i].name : oLabel.value;
				oElement.setLabel(sLabel);
				sValue = "{itemModel>" + aProperties[i].name + "}";
				oField = new sap.m.Text(oView.createId("field" + i), {
					"text": sValue
				});
				oElement.addField(oField);
				oContainer.addFormElement(oElement);
			}
			this.bLoaded = true;
		},
		onAfterRendering: function () {
			if (!this.bLoaded) {
				this.addElement();
			}
			// setTimeout(function () {
			// 	this.attachHeightListener();
			// }.bind(this), 0);
		},

		initModel: function () {
			this.setModel(this.oItemHelper.getModel(), Const.ITEM_MODEL_NAME);
			this.oProductForm = this.byId("product-info");
			this.oODOForm = this.byId("deliver-info");
			this.oProductHandlingInstr = this.byId("ProductHandlingInstr");
			this.oProductImage = this.byId("prod-image");
			this.sTableId = "SourceProductTable";
			this.setModel(this.oColumnSettingsHelper.getModel(), Const.COLUM_SETTING_MODEL_NAME);
			this.setModel(PackingModeModel, "packMode");
		},
		init: function () {
			this.setButtonToolTip("open-partial-pack-button");
			this.setButtonToolTip("pack-all-button");
			this.setButtonToolTip("pack-button");
			this.getRouter().attachRouteMatched(this.onRouteMatched, this);
			if (Global.isOnCloud()) {
				this.oProductImage.setVisible(false);
			}
		},
		attachHeightListener: function () {
			// var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
			var ResizeObserver = window.ResizeObserver;
			var oLeftGrid = this.byId("pod---source--form") || this.byId("pod---simplesource--form") || this.byId(
				"pod---internalsource--form--product");
			var target = document.getElementById(oLeftGrid.getId());

			var oContainer = this.byId("product-info");
			var container = document.getElementById(oContainer.getId());

			var initHeight = target.clientHeight;
			var observer = new ResizeObserver(function (mutations) {
				if (initHeight != target.clientHeight) {
					this.publish("adjustHeight", Const.EVENT_BUS.EVENTS.SUCCESS);
				}
			}.bind(this));
			var config = {
				attributes: true
			};
			observer.observe(target, config);
		},
		removeDuplicatedId: function () {
			var sComponentId = this.getOwnerComponent().getId();
			var aViewIds = [Const.ID.MAIN_SOURCE_VIEW, Const.ID.MAIN_SHIP_VIEW, Const.ID.INTERNAL_SOURCE_VIEW,
				Const.ID.INTERNAL_SHIP_VIEW
			];
			var aIds = ["pod---snuii--hbox", "pod---snuii--snlabel"];
			var oElement;
			aViewIds.forEach(function (sViewId) {
				aIds.forEach(function (sId) {
					oElement = sap.ui.getCore().byId(sComponentId + sViewId + sId);
					if (oElement) {
						oElement.destroy();
					}
				});
			});
		},
		getPersonlServiceContainerItemName: function () {
			if (PackingModeHelper.isAdvancedMode()) {
				return "advancedSourceTableSettings";
			} else if (PackingModeHelper.isBasicMode()) {
				return "basicSourceTableSettings";
			} else {
				return "internalSourceTableSettings";
			}
		},
		getDefaultColumnSettingNameInService: function () {
			if (PackingModeHelper.isAdvancedMode()) {
				return "advancedSourceDefaultSettings";
			} else if (PackingModeHelper.isBasicMode()) {
				return "basicSourceDefaultSettings";
			} else {
				return "internalSourceDefaultSettings";
			}
		},
		getDefaultColumnSetting: function () {
			if (PackingModeHelper.isAdvancedMode()) {
				return JSON.parse(JSON.stringify(this._mAdvancedSourceTableDefaultSettings));
			} else if (PackingModeHelper.isBasicMode()) {
				return JSON.parse(JSON.stringify(this._mBasicSourceDefaultDefaultSettings));
			} else {
				return JSON.parse(JSON.stringify(this._mInternalSourceTableDefaultSettings));
			}
		},
		getViewName: function () {
			return Const.VIEW_SOURCE;
		},
		getTableSettingDialogName: function () {
			return "zcogna.ewm.packoutbdlvs1.view.SourceTableSettingDialog";
		},
		initSubscription: function () {
			this.subscribe(Const.EVENT_BUS.CHANNELS.USER_SETTING, Const.EVENT_BUS.EVENTS.SUCCESS, function () {
				this.focus(Const.ID.SOURCE_INPUT);
			}.bind(this));
			this.subscribe(Const.EVENT_BUS.CHANNELS.EXCEPTION_LIST, Const.EVENT_BUS.EVENTS.SUCCESS, function (sChannel, sEvent, oResult) {
				this.initExceptionButtons(oResult);
			}.bind(this));
			this.subscribe(Const.EVENT_BUS.CHANNELS.EXCEPTION_ENABLE, Const.EVENT_BUS.EVENTS.SUCCESS, function (sChannel, sEvent) {
				this.handleExceptionEnable();
			}.bind(this));
			this.subscribe(Const.EVENT_BUS.CHANNELS.PACKALL_ENABLE, Const.EVENT_BUS.EVENTS.SUCCESS, function (sChannel, sEvent) {
				this.handlePackAllEnable();
			}.bind(this));
			this.subscribe(Const.EVENT_BUS.CHANNELS.ROUTE_MATCHED, Const.EVENT_BUS.EVENTS.SUCCESS, function (sChannel, sEvent) {
				this.getWorkFlowFactory().getClearWorkFlow().run();
			}.bind(this));
		},
		onSourceInputChange: function (oEvent) {
			var sInput = Util.trim(oEvent.getParameter("newValue")).toUpperCase();
			this.getWorkFlowFactory().getSourceChangeWorkFlow().run({
				sReferenceNumber: sInput
			});
		},
		onPack: function (oEvent) {
			var oProduct = this.oItemHelper.getItemByIndex(0);
			var oPackInfo = {
				oProduct: oProduct,
				sQuantity: oProduct.AlterQuan,
				iIndex: 0,
				bAdd: true
			};
			this.getWorkFlowFactory().getPackItemWorkFlow().run(oPackInfo);
		},
		onPackAll: function () {
			this.setBusy(true);
			var aProducts = this.oItemHelper.getModel().getData();
			this.getWorkFlowFactory().getPackAllWorkFlow().run(aProducts);
		},
		onProductChange: function (oEvent) {
			var newValue = Util.trim(oEvent.getParameter("newValue")).toUpperCase();
			var aAccessCodeList = CommonBase.prototype.getAccessCodeList.call(this);
			var oAccessCode = Util.find(aAccessCodeList, function (accessCode) {
				if (newValue === accessCode.ExternalAccessCode) {
					return true;
				}
				return false;
			});
			if (oAccessCode) {
				this.actionWithAccessCode(oAccessCode);
			} else {
				this.getWorkFlowFactory().getProductChangeWorkFlow().run(newValue);
			}
		},

		isAccessCodeRelatedToSourceHU: function (sAccessCode) {
			switch (sAccessCode) {
			case Const.ACCESS_CODE.PACK_ITEM:
			case Const.ACCESS_CODE.PACK_ALL:
				return true;
			default:
				return false;
			}
		},
		isAccessCodeAllowedWhenPendingExist: function (sAccessCode) {
			switch (sAccessCode) {
			case Const.ACCESS_CODE.PACK_ITEM:
			case Const.ACCESS_CODE.CLOSE_HU:
				return true;
			default:
				return false;
			}
		},

		actionWithAccessCode: function (oAccessCode) {
			var sErrorCode = "";
			var sAccessCode = oAccessCode.InternalAccessCode;
			if (Global.getPendingTaskNumber() > 0 && !this.isAccessCodeAllowedWhenPendingExist(sAccessCode)) {
				//todo refine error message
				this.updateInputWithError(Const.ID.PRODUCT_INPUT, this.getI18nText("cannotPerformAccessCode"));
				this.focus(Const.ID.PRODUCT_INPUT);
				return;
			}

			if (this.isAccessCodeRelatedToSourceHU(sAccessCode)) {
				if (Util.isEmpty(Global.getSourceId())) {
					sErrorCode = "ACCESS_CODE_NO_SOURCE_SPECIFIED";
				} else if (this.oItemHelper.isEmpty()) {
					sErrorCode = "ACCESS_CODE_SOURCE_EMPTY";
				}
			}
			switch (sAccessCode) {
			case Const.ACCESS_CODE.PACK_ITEM:
				if (this.oItemHelper.isFirstItemHighlighted()) {
					var oProduct = this.oItemHelper.getItemByIndex(0);
					var oPackInfo = {
						oProduct: oProduct,
						sQuantity: oProduct.AlterQuan,
						iIndex: 0,
						bAdd: true
					};
					this.getWorkFlowFactory().getPackItemWorkFlow().run(oPackInfo);
				} else {
					sErrorCode = sErrorCode || "ACCESS_CODE_NOT_PRODUCT_SELECTED";
				}
				break;
			case Const.ACCESS_CODE.PACK_ALL:
				if (Global.getPackAllEnable()) {
					this.onPackAll();
				} else {
					sErrorCode = sErrorCode || "ACCESS_CODE_PACK_ALL_DISABLE";
				}
				break;
			case Const.ACCESS_CODE.CLOSE_HU:
				if (Global.getCloseShipHUEnable()) {
					this.updateInputWithDefault(Const.ID.PRODUCT_INPUT, "");
					this.getWorkFlowFactory().getShipHUCloseWorkFlow().run();
				} else {
					sErrorCode = "ACCESS_CODE_CLOSE_HU_DISABLE";
				}
				break;
			case Const.ACCESS_CODE.CREATE_HU:
				if (PackingModeHelper.getSelectedMode() === Const.ADVANCED_MODE || PackingModeHelper.getSelectedMode() === Const.INTERNAL_MODE) {
					var oCreateInfo = {};
					oCreateInfo.bOpen = true;
					this.getWorkFlowFactory().getShipHUCreationWorkFlow().run(oCreateInfo);
				} else {
					sErrorCode = sErrorCode || "ACCESS_CODE_CREATE_HU_DISABLE";
				}

				break;
			default:
				sErrorCode = "ACCESS_CODE_INVALID";
			}
			if (sErrorCode) {
				//as discussed with po, map to a single error code
				sErrorCode = "accessCodeNotApplicable";
				var sAccessCodeDescription;
				if (Util.isEmpty(oAccessCode.Description)) {
					sAccessCodeDescription = "";
				} else {
					sAccessCodeDescription = "(" + oAccessCode.Description + ")";
				}
				var sError = this.getI18nText(sErrorCode, [oAccessCode.ExternalAccessCode, sAccessCodeDescription]);
				this.updateInputWithError(Const.ID.PRODUCT_INPUT, sError);
				this.playAudio(Const.ERROR);
				this.focus(Const.ID.PRODUCT_INPUT);
			} else {
				this.updateInputWithDefault(Const.ID.PRODUCT_INPUT, "");
			}
		},

		verifyProductEAN: function (mProduct) {
			return new Promise(function (resolve, reject) {
				var sProduct;
				if (Util.isString(mProduct)) {
					sProduct = mProduct;
					Service.verifyProduct(sProduct)
						.then(function (oResult) {
							resolve(oResult.ProductName);
						})
						.catch(function () {
							reject(sProduct);
						});
				} else {
					resolve(mProduct.ProductName);
				}
			}.bind(this));
		},

		getItemIndexByProductOrEAN: function (mProduct, mSession) {
			return new Promise(function (resolve, reject) {
				//validate product
				this.updateInputWithDefault(Const.ID.PRODUCT_INPUT, "");
				var iIndex;
				this.verifyProductEAN(mProduct)
					.then(function (sProduct) {
						mSession.sProduct = sProduct;
						if (Util.isString(mProduct)) {
							iIndex = this.oItemHelper.getItemIndexByProduct(mSession.sProduct);
						} else {
							iIndex = this.oItemHelper.getItemIndexByKey(mProduct.StockItemUUID, mProduct.Huident);
						}
						if (iIndex !== -1) {
							//get to-hightlight item index in most simple senario
							mSession.iItemIndex = iIndex;
							if (Global.getPendingTaskNumber() > 0) {
								var sProductConsGroup = this.oItemHelper.getItemConsGroupByIndex(iIndex);
								var sCurrentShippingHUConsGroup = Cache.getShipHUConsGroup(Global.getCurrentShipHandlingUnit());
								if (sCurrentShippingHUConsGroup !== sProductConsGroup && Global.getCheckConsolidationGroup()) {
									throw new CustomError(Const.ERRORS.PRODUCT_WITH_DIFF_CONS_GROUP);
								}
							}
							mSession.oProduct = this.oItemHelper.getItemByIndex(mSession.iItemIndex);
							resolve();
						} else {
							reject(Const.ERRORS.PRODUCT_NOT_IN_SOURCE);
						}
					}.bind(this))
					.catch(function (sValue) {
						mSession.sProduct = sValue;
						reject(Const.ERRORS.PRODUCT_NOT_IN_SOURCE);
					}.bind(this));
			}.bind(this));
		},

		prepareDataForProductChangeWorkFlow: function (mSession) {
			//if sProduct is EAN before, then it is set to Product now.  
			mSession.sProduct = this.oItemHelper.getItemProductByIndex(mSession.iItemIndex);
			var sShippingHU = Global.getCurrentShipHandlingUnit();
			mSession.sShipConsGroup = Cache.getShipHUConsGroup(sShippingHU);
			Global.setProductId(mSession.sProduct);
		},
		getItemIndexByProductAndActiveConsGroup: function (mSession) {
			if (!Util.isEmpty(mSession.sShipConsGroup)) {
				var iItemIndex = this.oItemHelper.getItemIndexByProductAndActiveConsGroup(mSession.oProduct, mSession.sShipConsGroup);
				if (iItemIndex !== -1) {
					mSession.iItemIndex = iItemIndex;
				}
			}
		},
		updateUIElementsAfterProductChange: function () {
			this.bindProductInfo();
			this.updateInputWithDefault(Const.ID.PRODUCT_INPUT, "");
			this.focus(Const.ID.PRODUCT_INPUT);
			this.handleHighLightFirstItem();
		},
		handleHighLightFirstItem: function () {
			var sCurrentShipHU = Global.getCurrentShipHandlingUnit();
			if (!Util.isEmpty(sCurrentShipHU)) {
				var sSourceHUODO = this.oItemHelper.getFirstItemConsGroup();
				var sCurrentShipHUODO = Cache.getShipHUConsGroup(sCurrentShipHU);
				this.oItemHelper.setItemsStatusByConsGrp();
				if (sCurrentShipHUODO === sSourceHUODO || sCurrentShipHUODO === "") {
					this.oItemHelper.setItemHighlightByIndex(0);
				}
			} else {
				this.oItemHelper.setItemsStatusByConsGrp();
			}
		},
		bindProductInfo: function () {
			var sStockItemUUID = this.oItemHelper.getItemStockIdByIndex(0);
			var sPath = ODataHelper.getProductPath(sStockItemUUID);
			this.oProductForm.bindElement(sPath);
			this.oProductHandlingInstr.bindElement(sPath);
			this.bindAddictionalProductInfo();
		},
		bindAddictionalProductInfo: function () {
			var aElements = this.oProductForm.getFormElements();
			aElements.forEach(function (oElement) {
				if (Util.containString(oElement.getId(), "-element")) {
					oElement.bindElement(Const.ITEM_MODEL_NAME + ">/0");
					oElement.getFields()[0].setVisible(true);
				}
			});
			if (!Util.isEmpty(this.oODOForm)) {
				aElements = this.oODOForm.getFormElements();
				aElements.forEach(function (oElement) {
					if (Util.containString(oElement.getId(), "-element")) {
						oElement.bindElement(Const.ITEM_MODEL_NAME + ">/0");
						oElement.getFields()[0].setVisible(true);
					}
				});
			}
		},
		unbindAddictionalProductInfo: function () {
			var aElements = this.oProductForm.getFormElements();
			aElements.forEach(function (oElement) {
				if (Util.containString(oElement.getId(), "-element")) {
					oElement.unbindElement();
					oElement.getFields()[0].setVisible(false);
				}
			});
			if (!Util.isEmpty(this.oODOForm)) {
				aElements = this.oODOForm.getFormElements();
				aElements.forEach(function (oElement) {
					if (Util.containString(oElement.getId(), "-element")) {
						oElement.unbindElement();
						oElement.getFields()[0].setVisible(false);
					}
				});
			}
		},
		bindImage: function () {
			var sStockItemUUID = this.oItemHelper.getItemStockIdByIndex(0);
			var sPath = ODataHelper.getProductPath(sStockItemUUID);
			this.oProductImage.bindElement(sPath);
		},
		unbindImage: function () {
			this.oProductImage.unbindElement();
		},
		unbindProductInfo: function () {
			this.oProductForm.unbindElement();
			this.oProductHandlingInstr.unbindElement();
			this.unbindAddictionalProductInfo();
		},
		/********   Begin  Create shipping hu work flow   ********/
		prepareParemeterForCreation: function (oCreateInfo, mSession) {
			mSession.sMaterialId = oCreateInfo.sMaterialId;
			mSession.oComponent = oCreateInfo.oDialog;
			mSession.sHuId = oCreateInfo.sHuId;
			mSession.sourceItems = this.oItemHelper.getItemsNum();
			mSession.isSingleConsGroupNoReduction = this.oItemHelper.isSingleConsolidationGroup() && !this.oItemHelper.isOrderReductionExist();
			mSession.isSNEnable = this.oItemHelper.isSerialNumberEnable();
			if (this.oItemHelper.isEmpty()) {
				mSession.sDocId = "";
			} else {
				mSession.sDocId = this.oItemHelper.getItemDocIdByIndex(0);
			}
		},
		handleFocusAndHighlightForCreation: function () {
			if (Util.isEmpty(Global.getSourceId())) {
				this.focus(Const.ID.SOURCE_INPUT);
			} else {
				this.focus(Const.ID.PRODUCT_INPUT);
				var sProductId = Global.getProductId();
				if (!Util.isEmpty(sProductId)) {
					this.oItemHelper.setItemHighlightByIndex(0);
				}
			}
		},
		/********   End Create shipping hu work flow   ********/
		handlePackAllEnable: function () {
			var bEnable = false;
			if (Global.getPendingTaskNumber() === 0 && this.oItemHelper.isSingleConsolidationGroup() && !this.oItemHelper.isOrderReductionExist() &&
				!ODataHelper.isShipHUClosed() && !this.oItemHelper.isSerialNumberEnable()) {
				bEnable = this.canFirstSourceItemPackToCurrentShipHU();
			}
			Global.setPackAllEnable(bEnable);
		},
		onBeforeOpenPartialDialog: function (oEvent) {
			this.initUoMItems("partial-uom-select");
			this.updateInputWithDefault(partialId, "");
		},
		onBeforeOpenDifferenceDialog: function (oEvent) {
			this.initUoMItems("difference-uom-select");
			this.updateInputWithDefault(differenceId, "");
		},
		onBeforeOpenDamageDialog: function (oEvent) {
			this.initUoMItems("damage-uom-select");
			this.updateInputWithDefault(damageId, "");
		},
		onAfterOpenPartialDialog: function () {
			this.focus(partialId);
		},
		onAfterOpenDifferenceDialog: function () {
			this.focus(differenceId);
		},
		onAfterOpenDamageDialog: function () {
			this.focus(damageId);
		},
		initUoMItems: function (sSelectId) {
			var aSelectionItem = this.getUoMSelection();
			var oSelect = this.byId(sSelectId);
			oSelect.removeAllItems();
			aSelectionItem.forEach(function (oItem) {
				oSelect.addItem(oItem);
			});
			oSelect.setSelectedItem(aSelectionItem[0]);
		},
		getUoMSelection: function () {
			var sAlternativeUoM = this.oItemHelper.getItemAlternativeUoMByIndex(0);
			var sBaseUoM = this.oItemHelper.getItemBaseUoMByIndex(0);
			var aSelectionItem = [];
			aSelectionItem.push(new sap.ui.core.Item({
				key: Const.UOM_TYPE.ALTER,
				text: sAlternativeUoM
			}));
			if (sAlternativeUoM !== sBaseUoM) {
				aSelectionItem.push(new sap.ui.core.Item({
					key: Const.UOM_TYPE.BASE,
					text: sBaseUoM
				}));
			}
			return aSelectionItem;
		},

		openPartialPack: function () {
			var oView = this.getView();
			var oDialog;
			if (this.oItemHelper.isSerialNumberEnableItem()) {
				oDialog = oView.byId("serialNumberPartialPackDialog");
				if (!oDialog) {
					oDialog = sap.ui.xmlfragment(oView.getId(), "zcogna.ewm.packoutbdlvs1.view.SerialNumberPartialPackDialog", this);
					oView.addDependent(oDialog);
				}
				this.updateInputWithDefault(serialNumberPartialPackInputId, "");
				SerialNumber.clearSerialNumbersList();
			} else {
				oDialog = oView.byId("partialDialog");
				if (!oDialog) {
					oDialog = sap.ui.xmlfragment(oView.getId(), "zcogna.ewm.packoutbdlvs1.view.PartialPackDialog", this);
					oView.addDependent(oDialog);
				}
			}
			this.openDialog(oDialog).catch(function (sError) {});
		},
		onPartialPackQuantityChange: function (oEvent) {
			var sInput = Util.trim(oEvent.getParameter("newValue"));
			if (!Util.isEmpty(sInput)) {
				var iQuantity = Util.parseNumber(sInput);
				var sQuantity = Util.formatNumber(iQuantity);
				var iProductQuantity = Util.parseNumber(this.oItemHelper.getItemQuantityByIndex(0));
				if (Util.isEmpty(sQuantity) || iQuantity >= iProductQuantity || iQuantity <= 0) {
					this.updateInputWithError(partialId);
					this.playAudio(Const.ERROR);
				} else {
					this.updateInputWithDefault(partialId, sQuantity);
				}
			}
		},

		onExceptionQuantitySubmit: function (oEvent) {
			var sInput = Util.trim(oEvent.getParameter("value"));
			var oInput = oEvent.getSource();
			if (!Util.isEmpty(sInput)) {
				var iQuantity = Util.parseNumber(sInput);
				this.checkQuantityOverflow(iQuantity, oInput);
			}
		},

		fireInputChange: function (oInput, vInputValue) {
			oInput.fireChange({
				newValue: vInputValue
			});
		},

		getNewItemWithPartialQuantity: function (oProduct, oResult) {
			var oNewProduct = JSON.parse(JSON.stringify(oProduct));
			if (oNewProduct.StockItemUUID !== oResult.StockItemUUID) {
				oNewProduct.OriginId = oNewProduct.StockItemUUID;
				oNewProduct.StockItemUUID = oResult.StockItemUUID;
			}
			oNewProduct.AlterQuan = Util.formatNumber(parseFloat(oResult.DesAlterQuan), 3);
			oNewProduct.AlternativeUnit = oResult.DesAlterUoM;
			oNewProduct.Quan = Util.formatNumber(parseFloat(oResult.DesQuan), 3);
			oNewProduct.NetWeight = Util.formatNumber(parseFloat(oResult.DesWeight), 3, 3);
			oNewProduct.WeightUoM = oResult.DesUnitGw;
			oNewProduct.Volume = Util.formatNumber(parseFloat(oResult.DesVolume), 3, 3);
			oNewProduct.VolumeUoM = oResult.DesUnitGv;
			return oNewProduct;
		},

		getProductQuantityByUoM: function (sUoMType) {
			var fProductQuantity;
			if (sUoMType === Const.UOM_TYPE.ALTER) {
				fProductQuantity = Util.parseNumber(this.oItemHelper.getItemQuantityByIndex(0));
			} else {
				fProductQuantity = Util.parseNumber(this.oItemHelper.getItemBaseQtyByIndex(0));
			}
			return fProductQuantity;
		},

		onPartialPack: function (oEvent) {
			//if user switch from SN partial dialog to partial dialog, change event may add value to SN list
			SerialNumber.clearSerialNumbersList();

			var oSelect = this.byId("partial-uom-select");
			var sUoMType = oSelect.getSelectedKey();
			var sUoM = oSelect.getSelectedItem().getText();

			var bQuantityError = false;
			var oPackInfo = {};
			var fProductQuantity = this.getProductQuantityByUoM(sUoMType);
			var oInput = this.byId(partialId);
			var sInput = Util.trim(oInput.getValue());
			if (!Util.isEmpty(sInput)) {
				var fQuantity = Util.parseNumber(sInput);
				var sQuantity = Util.formatNumber(fQuantity);
				if (Util.isEmpty(sQuantity) || fQuantity >= fProductQuantity || fQuantity <= 0) {
					bQuantityError = true;
				} else {
					if (this.checkQuantityOverflow(fQuantity, oInput)) {
						return;
					} else {
						this.updateInputWithDefault(partialId, sQuantity);
					}
				}
			} else {
				bQuantityError = true;
			}
			if (bQuantityError) {
				this.handleEmptyQuantityInput(partialId, "inputQuantityNotice");
				return;
			}

			var oDialog = oEvent.getSource().getParent();
			oDialog.setBusy(true);
			var oProduct = this.oItemHelper.getItemByIndex(0);
			oPackInfo.oProduct = oProduct;
			oPackInfo.iQuantity = fQuantity;
			oPackInfo.oDialog = oDialog;
			oPackInfo.sUoM = sUoM;
			oPackInfo.sUoMType = sUoMType;
			this.getWorkFlowFactory().getPartialPackWorkFlow().run(oPackInfo);
		},

		removeExceptionButtons: function () {
			var oToolbar = this.byId("sourcehu-buttons-toolbar");
			var iButtonCount = oToolbar.getContent().length;
			for (var i = iButtonCount - 1; i > 0; i--) {
				var oButton = oToolbar.getContent()[i];
				var oCustomData = oButton.getCustomData();
				if (oCustomData.length !== 0) {
					oToolbar.removeContent(oButton);
				}
			}
		},
		initExceptionButtons: function (aExceptions) {
			var oButton = {};
			var oExccode;
			var oToolbar = this.byId("sourcehu-buttons-toolbar");
			var onPressException = function (oEvent) {
				var oSource = oEvent.getSource();
				var sText = oSource.getText();
				var sInternalcode = oEvent.getSource().getCustomData()[0].getValue();
				var sExccode = oEvent.getSource().getCustomData()[0].getKey();
				if (sInternalcode === Const.EXCCODE.DIFF) {
					this.openDifference(sExccode, sText).catch(function (sError) {});
				} else if (sInternalcode === Const.EXCCODE.EXPA) {
					this.openDamage(sExccode, sText).catch(function (sError) {});
				}
			}.bind(this);
			aExceptions.forEach(function (oException) {
				oButton = new sap.m.Button({
					text: oException.Descr,
					enabled: "{path:'global>/exceptionEnable'}",
					press: onPressException,
					width: "18%"
				});
				oButton.setTooltip(oException.Descr);
				oExccode = new sap.ui.core.CustomData({
					key: oException.Exccode,
					value: oException.InternalProcessCode

				});
				oButton.addCustomData(oExccode);
				if (!PackingModeHelper.isInternalMode() || oException.InternalProcessCode !== Const.EXCCODE.EXPA) {
					oToolbar.insertContent(oButton, 1);
				}
			});
		},

		openDamage: function (sExccode, sText) {
			var oView = this.getView();
			var oDialog;

			oDialog = oView.byId("damageDialog");
			if (!oDialog) {
				oDialog = sap.ui.xmlfragment(oView.getId(), "zcogna.ewm.packoutbdlvs1.view.DamageDialog", this);
				oView.addDependent(oDialog);
			}
			oDialog.setTitle(sText);
			oDialog.removeAllCustomData();
			var oExccode = new sap.ui.core.CustomData({
				key: sExccode
			});
			oDialog.addCustomData(oExccode);

			return this.openDialog(oDialog);
		},
		openDamageDialogWithSerialNumber: function (sExccode, sText) {
			var oView = this.getView();
			var oDialog;

			oDialog = oView.byId("serialNumberDamageDialog");
			if (!oDialog) {
				oDialog = sap.ui.xmlfragment(oView.getId(), "zcogna.ewm.packoutbdlvs1.view.SerialNumberDamageDialog", this);
				oView.addDependent(oDialog);
			}
			this.updateInputWithDefault(serialNumberDamageInputId, "");
			SerialNumber.clearSerialNumbersList();

			oDialog.setTitle(sText);
			oDialog.removeAllCustomData();
			var oExccode = new sap.ui.core.CustomData({
				key: sExccode
			});
			oDialog.addCustomData(oExccode);
			return this.openDialog(oDialog);
		},

		openDifference: function (sExccode, sText) {
			var oView = this.getView();
			var oDialog;
			if (this.oItemHelper.isSerialNumberEnableItem()) {
				oDialog = oView.byId("serialNumberDifferenceDialog");
				if (!oDialog) {
					oDialog = sap.ui.xmlfragment(oView.getId(), "zcogna.ewm.packoutbdlvs1.view.SerialNumberDifferenceDialog", this);
					oView.addDependent(oDialog);
				}
				this.updateInputWithDefault(serialNumberDifferenceInputId, "");
				SerialNumber.clearSerialNumbersList();
			} else {
				oDialog = oView.byId("differenceDialog");
				if (!oDialog) {
					oDialog = sap.ui.xmlfragment(oView.getId(), "zcogna.ewm.packoutbdlvs1.view.DifferenceDialog", this);
					oView.addDependent(oDialog);
				}
			}
			oDialog.setTitle(sText);
			oDialog.removeAllCustomData();
			var oExccode = new sap.ui.core.CustomData({
				key: sExccode
			});
			oDialog.addCustomData(oExccode);

			return this.openDialog(oDialog);
		},

		onDifferenceQuantityChange: function (oEvent) {
			var sInput = Util.trim(oEvent.getParameter("newValue"));
			if (!Util.isEmpty(sInput)) {
				var iQuantity = Util.parseNumber(sInput);
				var sQuantity = Util.formatNumber(iQuantity);
				var iProductQuantity = Util.parseNumber(this.oItemHelper.getItemQuantityByIndex(0));
				if (Util.isEmpty(sQuantity) || iQuantity >= iProductQuantity || iQuantity < 0) {
					this.updateInputWithError(differenceId);
					this.playAudio(Const.ERROR);
				} else {
					this.updateInputWithDefault(differenceId, sQuantity);
				}
			}
		},

		onDifference: function (oEvent) {
			var oSelect = this.byId("difference-uom-select");
			var sUoMType = oSelect.getSelectedKey();
			var sUoM = oSelect.getSelectedItem().getText();
			var fProductQuantity = this.getProductQuantityByUoM(sUoMType);
			var bQuantityError = false;
			var oInput = this.byId(differenceId);
			var sInput = Util.trim(oInput.getValue());
			if (!Util.isEmpty(sInput)) {
				var fQuantity = Util.parseNumber(sInput);
				var sQuantity = Util.formatNumber(fQuantity);
				if (Util.isEmpty(sQuantity) || fQuantity >= fProductQuantity || fQuantity < 0) {
					bQuantityError = true;
				} else {
					if (this.checkQuantityOverflow(fQuantity, oInput)) {
						return;
					} else {
						this.updateInputWithDefault(differenceId, sQuantity);
					}
				}
			} else {
				bQuantityError = true;
			}
			if (bQuantityError) {
				this.handleEmptyQuantityInput(differenceId, "inputQuantityNotice");
				return;
			}

			var oDialog = oEvent.getSource().getParent();
			var sExccode = oDialog.getCustomData()[0].getKey();
			var oProduct = this.oItemHelper.getItemByIndex(0);
			oDialog.setBusy(true);
			this.getWorkFlowFactory().getDiffPackWorkFlow().run([oProduct, fQuantity, sExccode, oDialog, sUoM, sUoMType]);
		},

		onDamage: function (oEvent) {
			var oSelect = this.byId("damage-uom-select");
			var sUoMType = oSelect.getSelectedKey();
			var sUoM = oSelect.getSelectedItem().getText();
			var bQuantityError = false;
			var fProductQuantity = this.getProductQuantityByUoM(sUoMType);
			var oInput = this.byId(damageId);
			var sInput = Util.trim(oInput.getValue());
			if (!Util.isEmpty(sInput)) {
				var fQuantity = Util.parseNumber(sInput);
				var sQuantity = Util.formatNumber(fQuantity);
				if (Util.isEmpty(sQuantity) || fQuantity > fProductQuantity || fQuantity <= 0) {
					bQuantityError = true;
				} else {
					if (this.checkQuantityOverflow(fQuantity, oInput)) {
						return;
					} else {
						this.updateInputWithDefault(damageId, sQuantity);
					}
				}
			} else {
				bQuantityError = true;
			}
			if (bQuantityError) {
				this.handleEmptyQuantityInput(damageId, "inputQuantityNotice");
				return;
			}

			var oDialog = oEvent.getSource().getParent();
			var sExccode = oDialog.getCustomData()[0].getKey();
			var sText = oDialog.getTitle();
			var oProduct = this.oItemHelper.getItemByIndex(0);
			fQuantity = Util.parseNumber(oProduct.AlterQuan) - fQuantity;
			if (this.oItemHelper.isSerialNumberEnableItem() && fQuantity !== 0) {
				oDialog.close();
				this.openDamageDialogWithSerialNumber(sExccode, sText);
			} else {
				oDialog.setBusy(true);
				this.getWorkFlowFactory().getDiffPackWorkFlow().run([oProduct, fQuantity, sExccode, oDialog, sUoM, sUoMType]);
			}
		},

		onSerialNumberExceptionChange: function (oEvent, sInputId) {
			var sInput = Util.trim(oEvent.getParameter("newValue"));
			if (Util.isEmpty(sInput)) {
				return;
			}
			if (sInput.length > 30) {
				this.handleEntryLengthExceed(sInputId);
				return;
			}

			if (SerialNumber.getSerialNumberCount() === this.oItemHelper.getItemBaseQtyByIndex(0) - 1) {
				var sErrorMsg = this.getI18nText("overPackErrorMsg", this.oItemHelper.getItemBaseQtyByIndex(0));
				this.updateInputWithError(sInputId, sErrorMsg);
				this.playAudio(Const.ERROR);
				this.focus(sInputId);
				return;
			}
			sInput = sInput.toUpperCase();
			this.verifySerialNumber(sInput, sInputId);
		},

		verifySerialNumber: function (sSerialNumber, sInputId) {
			var oVerifyPromise = this.getSerialNumberVerifyPromise(sSerialNumber);
			oVerifyPromise
				.then(function (oSuccess) {
					SerialNumber.addSerialNumber(sSerialNumber);
					this.updateInputWithDefault(sInputId, "");
					this.focus(sInputId);
				}.bind(this))
				.catch(function (oError) {
					this.updateInputWithError(sInputId, oError.getDescription());
					this.playAudio(Const.ERROR);
					this.focus(sInputId);
				}.bind(this));
		},

		onSerialNumberDifferenceChange: function (oEvent) {
			this.onSerialNumberExceptionChange(oEvent, serialNumberDifferenceInputId);
		},

		onSerialNumberPartialPackChange: function (oEvent) {
			this.onSerialNumberExceptionChange(oEvent, serialNumberPartialPackInputId);
		},
		onSerialNumberDamageChange: function (oEvent) {
			this.onSerialNumberExceptionChange(oEvent, serialNumberDamageInputId);
		},

		onSerialNumberDifferencePack: function (oEvent) {
			var oDialog = oEvent.getSource().getParent();
			var sExccode = oDialog.getCustomData()[0].getKey();
			var oProduct = JSON.parse(JSON.stringify(this.oItemHelper.getItemByIndex(0)));
			oDialog.setBusy(true);
			var fQuantity = SerialNumber.getSerialNumberCount() / this.oItemHelper.getAlternativeUOMRatio(oProduct);
			fQuantity = Util.parseNumber(Util.formatNumber(fQuantity, 3));
			this.getWorkFlowFactory().getDiffPackWorkFlow().run([oProduct, fQuantity, sExccode, oDialog]);
		},

		onSerialNumberDamagePack: function (oEvent) {
			var oDialog = oEvent.getSource().getParent();
			var sExccode = oDialog.getCustomData()[0].getKey();
			var oProduct = JSON.parse(JSON.stringify(this.oItemHelper.getItemByIndex(0)));
			oDialog.setBusy(true);
			var fQuantity = SerialNumber.getSerialNumberCount() / this.oItemHelper.getAlternativeUOMRatio(oProduct);
			fQuantity = Util.parseNumber(Util.formatNumber(fQuantity, 3));
			this.getWorkFlowFactory().getDiffPackWorkFlow().run([oProduct, fQuantity, sExccode, oDialog]);
		},

		onSerialNumberPartialPack: function (oEvent) {
			var oDialog = oEvent.getSource().getParent();
			var iQuantity = SerialNumber.getSerialNumberCount();
			var oPackInfo = {};
			if (iQuantity === 0) {
				this.handleEmptyQuantityInput(serialNumberPartialPackInputId, "noSNForPartialPackErr");
				return;
			}
			oDialog.setBusy(true);
			var oProduct = JSON.parse(JSON.stringify(this.oItemHelper.getItemByIndex(0)));
			oPackInfo.oProduct = oProduct;
			var fPackQty = iQuantity / this.oItemHelper.getAlternativeUOMRatio(oProduct);
			oPackInfo.iQuantity = Util.parseNumber(Util.formatNumber(fPackQty, 3));
			oPackInfo.oDialog = oDialog;
			this.getWorkFlowFactory().getPartialPackWorkFlow().run(oPackInfo);
		},

		clearSourceBeforeLeave: function () {
			this.updateInputWithDefault(Const.ID.SOURCE_INPUT, "");
			this.updateInputWithDefault(Const.ID.PRODUCT_INPUT, "");
			Global.setSourceId("");
			Global.setProductId("");
			this.oItemHelper.setItems([]);
		},

		unbindODOInfo: function () {
			this.oODOForm.unbindElement();
		},
		disableButtons: function () {
			Global.setPackAllEnable(false);
			Global.setExceptionEnable(false);
		},
		bindODOInfo: function () {
			this.oODOForm.bindElement(Const.ITEM_MODEL_NAME + ">/0");
			//var sHandlingInstr = this.oItemHelper.getItemHandlingInstrByIndex(0);  
			//this.setHandlingInstrElementVisible(!Util.isEmpty(sHandlingInstr));
		},

		setHandlingInstrElementVisible: function (bValue) {
			var oFormElement = this.oODOForm.getFormElements()[2];
			oFormElement.setVisible(bValue);
		},

		getSerialNumberDialog: function () {
			var oView = this.getView();
			var oDialog = oView.byId(serialNumberDialogId);

			if (!oDialog) {
				oDialog = sap.ui.xmlfragment(oView.getId(), "zcogna.ewm.packoutbdlvs1.view.SerialNumberDialog", this);
				oView.addDependent(oDialog);
			}
			this.updateInputWithDefault(serialNumberInputId, "");
			SerialNumber.clearSerialNumbersList();
			return oDialog;
		},
		getStockLevelSnDialog: function (sProductId) {
			var oView = this.getView();
			var oDialog = oView.byId(stockLevleSnDialogId);
			if (!oDialog) {
				oDialog = sap.ui.xmlfragment(oView.getId(), "zcogna.ewm.packoutbdlvs1.view.StockLevelSnDialog", this);
				oView.addDependent(oDialog);
			}
			oDialog.removeAllCustomData();
			var oProductId = new sap.ui.core.CustomData({
				key: sProductId
			});
			oDialog.addCustomData(oProductId);
			var oText = oView.byId("stockLevel-sn-dialog-text");
			this.setDialogText(oText, "stockLevelSerialNumberNotification");
			this.updateInputWithDefault(stockLevelSnInputId, "");
			return oDialog;
		},
		/**
		 * handle the event user input serial number in the stock level sn dialog 
		 * stock level sn dialog poped out after user input a product which is stock level sn enabled
		 * if the value is valid, it will close the dialog
		 * if the value is invalid, it will set the input box to be error
		 * @param {sap.ui.base.Event} oEvent The enter key event
		 */
		onStockLevelSNChange: function (oEvent) {
			var oDialog = oEvent.getSource().getParent().getParent();
			var sProductId = oDialog.getCustomData()[0].getKey();
			var newValue = Util.trim(oEvent.getParameter("value")).toUpperCase();
			if (!Util.isEmpty(newValue)) {
				var iIndex = this.oItemHelper.getItemIndexBySerialNumber(sProductId, newValue);
				if (iIndex !== -1) {
					this.closeDialog(oDialog, iIndex, false);
					return;
				}
			}
			var sError = this.getI18nText("incorrectStockLevelSn");
			this.updateInputWithError(stockLevelSnInputId, sError);
			this.playAudio(Const.ERROR);
			this.focus(stockLevelSnInputId);

		},
		onCancelStockLevelSNialog: function (oEvent) {
			this.updateInputWithDefault(stockLevelSnInputId, "");
			this.closeDialog(oEvent.getSource().getParent(), Const.ERRORS.INTERRUPT_WITH_NO_ACTION, true);
		},
		getSerialNumberVerifyPromise: function (sInput) {
			var oVerifyPromise;
			var sError;
			var oError;
			if (Util.isEmpty(sInput)) {
				sError = this.getI18nText("emptySN");
				oError = new CustomError("", sError);
				oVerifyPromise = Util.getRejectPromise(oError);
			} else if (this.isAllSerialNumberFinished()) {
				//if all required serial numbers are assigned, display error message
				sError = this.getI18nText("serialNumberExceed");
				oError = new CustomError("", sError);
				oVerifyPromise = Util.getRejectPromise(oError);
			} else if (SerialNumber.hasSerialNumber(sInput)) {
				sError = this.getI18nText("duplicateSNMsg", sInput);
				oError = new CustomError("", sError);
				oVerifyPromise = Util.getRejectPromise(oError);
			} else {
				if (this.oItemHelper.isStockLevelSerialNumber()) {
					if (this.oItemHelper.hasSerialNumber(sInput)) {
						oVerifyPromise = Util.getResolvePromise(sInput);
					} else {
						sError = this.getI18nText("incorrectSerialNumber", sInput);
						oError = new CustomError("", sError);
						oVerifyPromise = Util.getRejectPromise(oError);
					}
				} else {
					oVerifyPromise = Service.verifySerialNumber(this.oItemHelper.getItemByIndex(0), sInput);
				}
			}
			return oVerifyPromise;
		},
		onBatchNumberChange: function (oEvent) {
			var oDialog = oEvent.getSource().getParent().getParent();
			var sProductId = oDialog.getCustomData()[0].getKey();
			var newValue = Util.trim(oEvent.getParameter("value")).toUpperCase();
			var bError = false;
			if (!Util.isEmpty(newValue)) {
				var iIndex = this.oItemHelper.getItemIndexByProductAndBatch(sProductId, newValue);
				if (iIndex !== -1) {
					this.updateInputWithDefault(batchId, "");
					this.closeDialog(oDialog, newValue, false);
				} else {
					bError = true;
				}
			} else {
				bError = true;
			}

			if (bError) {
				var sError = this.getI18nText("batchIncorrect");
				this.updateInputWithError(batchId, sError);
				this.playAudio(Const.ERROR);
				this.focus(batchId);
			}
		},
		getBatchNumberDialog: function (sProductId) {
			var oView = this.getView();
			var oDialog = oView.byId(batchDialogId);
			if (!oDialog) {
				oDialog = sap.ui.xmlfragment(oView.getId(), "zcogna.ewm.packoutbdlvs1.view.BatchNumberDialog", this);
				oView.addDependent(oDialog);
			}
			oDialog.removeAllCustomData();
			var oProductId = new sap.ui.core.CustomData({
				key: sProductId
			});
			oDialog.addCustomData(oProductId);
			var oText = oView.byId("batch-dialog-text");
			this.setDialogText(oText, "batchNumberNotification", [sProductId]);
			return oDialog;
		},
		setDialogText: function (oText, sI18n, aValues) {
			var sTextValue = this.getI18nText(sI18n, aValues);
			oText.setText(sTextValue);
		},
		onCancelBatchDialog: function (oEvent) {
			this.updateInputWithDefault(batchId, "");
			this.closeDialog(oEvent.getSource().getParent(), Const.ERRORS.INTERRUPT_WITH_NO_ACTION, true);
		},
		onSerialNumberCancel: function (oEvent) {
			this.closeDialog(oEvent.getSource().getParent(), Const.ERRORS.INTERRUPT_WITH_NO_ACTION, true);
			this.oItemHelper.setItemQtyReducedInitialized();
			this.oItemHelper.setItemReductCancelByIndex(0);
			this.setBusy(false);
		},
		//when user has scan nothing in the input box
		handleEmptyQuantityInput: function (vInput, sI18nKey) {
			var sErrorMessage = this.getI18nText(sI18nKey);
			this.updateInputWithError(vInput, sErrorMessage);
			this.playAudio(Const.ERROR);
			this.focus(vInput);
		},
		handleExceptionEnable: function () {
			if (Util.isEmpty(Global.getSourceId()) || this.oItemHelper.isEmpty() || Util.isEmpty(Global.getProductId())) {
				Global.setExceptionEnable(false);
				return;
			}
			var sCurrentShipHU = Global.getCurrentShipHandlingUnit();
			if (Global.getPendingTaskNumber() === 0 && !Util.isEmpty(sCurrentShipHU) && !ODataHelper.isShipHUClosed(sCurrentShipHU)) {
				if (Global.getCheckConsolidationGroup()) {
					var sSourceHUODO = this.oItemHelper.getFirstItemConsGroup();
					var sCurrentShipHUODO = Cache.getShipHUConsGroup(sCurrentShipHU);
					if (sCurrentShipHUODO === sSourceHUODO || sCurrentShipHUODO === "") {
						Global.setExceptionEnable(true);
					} else {
						Global.setExceptionEnable(false);
					}
				} else {
					Global.setExceptionEnable(true);
				}
			} else {
				Global.setExceptionEnable(false);
			}
		},
		getChangePackQuantityDialog: function (sProductId) {
			var oView = this.getView();
			var oDialog = oView.byId(reductionDialogId);
			var sWarningText;

			if (!oDialog) {
				oDialog = sap.ui.xmlfragment(oView.getId(), "zcogna.ewm.packoutbdlvs1.view.ChangePackingQuantityDialog", this);
				oView.addDependent(oDialog);
			}
			oDialog.removeAllCustomData();
			if (this.oItemHelper.getItemReductionQtyByIndex(0) === "0") {
				sWarningText = this.getI18nText("orderCancelNotification");
			} else {
				sWarningText = this.getI18nText("changePackingQuantityNotification", [this.oItemHelper.getItemQuantityByIndex(0), this.oItemHelper
					.getItemReductionQtyByIndex(0)
				]);
			}
			var oText = oView.byId("reduction-dialog-text");
			oText.setText(sWarningText);
			this.playAudio(Const.WARNING);
			return oDialog;
		},
		onProcessOrderReduction: function (oEvent) {
			this.closeDialog(oEvent.getSource().getParent());
			var oProduct = this.oItemHelper.getItemByIndex(0);
			var oPackInfo = {
				oProduct: oProduct
			};
			this.getWorkFlowFactory().getPackItemWorkFlow().run(oPackInfo);
		},
		onNotProcessOrderReduction: function (oEvent) {
			this.closeDialog(oEvent.getSource().getParent());
			this.oItemHelper.setItemQtyReducedInitialized();
		},

		onDamageQuantityChange: function (oEvent) {
			var sInput = Util.trim(oEvent.getParameter("newValue"));
			var bError = false;
			if (!Util.isEmpty(sInput)) {
				var iQuantity = Util.parseNumber(sInput);
				var sQuantity = Util.formatNumber(iQuantity);
				var iProductQuantity = Util.parseNumber(this.oItemHelper.getItemQuantityByIndex(0));
				if (Util.isEmpty(sQuantity) || iQuantity > iProductQuantity || iQuantity <= 0) {
					bError = true;
				} else {
					this.updateInputWithDefault(damageId, sQuantity);
				}
			} else {
				bError = true;
			}
			if (bError) {
				var sText = this.getI18nText("inputQuantityNotice");
				this.updateInputWithError(damageId, sText);
				this.playAudio(Const.ERROR);
			}
		},
		onAfterCloseDialog: function (oEvent) {
			var oInput = oEvent.getSource().getContent()[0].getContent()[2].getContent()[0].setValue("");
			this.updateInputWithDefault(oInput, "");
			this.focus(Const.ID.PRODUCT_INPUT);
		},

		onSerialNumberPopover: function (oEvent) {
			this.openSerialNumberPopover(oEvent, Const.ITEM_MODEL_NAME, this.oItemHelper);
		},

		onSwitchToPackWithoutSN: function (oEvent) {
			if (SerialNumber.getSerialNumberCount() > 0) {
				var sError = this.getI18nText("snMaintained");
				this.updateInputWithError(serialNumberPartialPackInputId, sError);
				this.focus(serialNumberPartialPackInputId);
				this.playAudio(Const.ERROR);
			} else {
				this.updateInputWithDefault(serialNumberPartialPackInputId, "");
				var oDialog = oEvent.getSource().getParent();
				this.closeDialog(oDialog);

				var oView = this.getView();
				var oNewDialog = oView.byId("partialDialog");
				if (!oNewDialog) {
					oNewDialog = sap.ui.xmlfragment(oView.getId(), "zcogna.ewm.packoutbdlvs1.view.PartialPackDialog", this);
					oView.addDependent(oNewDialog);
				}
				this.openDialog(oNewDialog).catch(function (sError) {});
			}
		},

		onSerialNumberPack: function (oEvent) {
			var oDialog = oEvent.getSource().getParent();
			var sInput = this.byId(serialNumberInputId).getValue();
			if (!Util.isEmpty(sInput)) {
				this.verifySerialNumberInput(sInput, oDialog)
					.then(function () {
						this.handleSerialNumberPack();
					}.bind(this));
			} else {
				if (this.isAllSerialNumberFinished()) {
					this.closeDialog(oDialog);
				} else {
					this.handleSerialNumberPack();
				}
			}
		},
		onPackWithoutSerialNumber: function (oEvent) {
			var oDialog = oEvent.getSource().getParent();
			var sInput = this.byId(serialNumberInputId).getValue();
			var sError = this.getI18nText("snMaintained");
			if (!Util.isEmpty(sInput)) {
				this.verifySerialNumberInput(sInput, oDialog, true)
					.then(function (oResult) {
						this.updateInputWithError(serialNumberInputId, sError);
						this.focus(serialNumberInputId);
						this.playAudio(Const.ERROR);
						this.byId(serialNumberInputId).setShowValueStateMessage(true);
					}.bind(this));
			} else if (SerialNumber.getSerialNumberCount() !== 0) {
				this.updateInputWithError(serialNumberInputId, sError);
				this.focus(serialNumberInputId);
				this.playAudio(Const.ERROR);
			} else {
				this.closeDialog(oDialog);
			}
		},

		handleSerialNumberPack: function () {
			if (!this.isAllSerialNumberFinished()) {
				var iExpectedCount = Util.parseNumber(this.oItemHelper.getItemBaseQtyByIndex(0));
				var sError = this.getI18nText("provideAllSNs", iExpectedCount);
				this.updateInputWithError(serialNumberInputId, sError);
				this.playAudio(Const.ERROR);
				this.focus(serialNumberInputId);
			}
		},

		onDeleteSerialNumber: function (oEvent) {
			var oItem = oEvent.getParameter("listItem");
			var sSerialNum = oItem.getTitle();
			SerialNumber.removeSerialNumber(sSerialNum);
			this.updateInputWithDefault(serialNumberInputId, "");
			this.focus(serialNumberInputId);
		},

		onSerialNumChange: function (oEvent) {
			var sInput = Util.trim(oEvent.getParameter("value"));
			var oDialog = oEvent.getSource().getParent().getParent();
			this.verifySerialNumberInput(sInput, oDialog);
		},
		verifySerialNumberInput: function (sInput, oDialog, bPackWithout) {
			sInput = sInput.toUpperCase();

			if (sInput.length > 30) {
				this.handleEntryLengthExceed(serialNumberInputId);
				return;
			}

			return new Promise(function (resolve, reject) {
				oDialog.setBusy(true);
				var oVerifyPromise;
				oVerifyPromise = this.getSerialNumberVerifyPromise(sInput);
				oVerifyPromise
					.then(function (oSuccess) {
						oDialog.setBusy(false);
						SerialNumber.addSerialNumber(sInput);
						this.updateInputWithDefault(serialNumberInputId, "");
						this.focus(serialNumberInputId);
						if (this.isAllSerialNumberFinished() && !bPackWithout) {
							this.closeDialog(oDialog);
						}
						resolve();
					}.bind(this))
					.catch(function (oError) {
						oDialog.setBusy(false);
						this.updateInputWithError(serialNumberInputId, oError.getDescription());
						this.playAudio(Const.ERROR);
						this.focus(serialNumberInputId);
					}.bind(this));
			}.bind(this));
		},
		handleEntryLengthExceed: function (sInputId) {
			var sError = this.getI18nText("serialNumberMaximunCharacters");
			this.updateInputWithError(sInputId, sError);
			this.playAudio(Const.ERROR);
			this.focus(sInputId);
		},
		isAllSerialNumberFinished: function () {
			var iCount = SerialNumber.getSerialNumberCount();
			var iExpectedCount = Util.parseNumber(this.oItemHelper.getItemBaseQtyByIndex(0));
			if (iCount === iExpectedCount) {
				return true;
			}
			return false;
		},
		formatPackBtn: function (bValue) {
			if (bValue === sap.ui.core.MessageType.Success) {
				return true;
			}
			return false;
		},
		formatSerialNumberPackMsg: function (sShipId, sMode) {
			return this.getTextAccordingToMode("serialNumberPackText", "serialNumberPackNotification", [sShipId], sMode);
		},
		formatExceptionMsg: function (sShipHU, sMode) {
			return this.getTextAccordingToMode("internalExceptionDialogText", "exceptionDialogText", [sShipHU], sMode);
		},
		formatSerialNumQtyDisplay: function (aSerialNumbers, sQuantity) {
			if (sQuantity === undefined) {
				return "";
			}
			return SerialNumber.getSerialNumberCount() + "/" + sQuantity;
		},
		formatSNListMode: function (oItem) {
			if (oItem !== undefined && this.oItemHelper.isStockLevelSerialNumber()) {
				return ListMode.None;
			} else {
				return ListMode.Delete;
			}
		},
		isSelectedItemAndCurrentShipHUInSameConsGroup: function (sConGroupOfHightSourceItem) {
			var bSameConsolidationGroup = false;
			if (!Util.isEmpty(Global.getProductId())) { // has an selected item
				// current ship hu consolidation group
				var sShipHUConsGroup = Cache.getShipHUConsGroup(Global.getCurrentShipHandlingUnit());
				if (Util.isEmpty(sShipHUConsGroup) || sConGroupOfHightSourceItem === sShipHUConsGroup) {
					bSameConsolidationGroup = true;
				}
			}
			return bSameConsolidationGroup;
		},
		updateSourceItemStatus: function () {
			if (Util.isEmpty(Global.getProductId())) {
				//product id is not scanned
				this.oItemHelper.setItemsStatusByConsGrp();
				return;
			}
			if (this.canFirstSourceItemPackToCurrentShipHU()) {
				this.oItemHelper.setItemHighlightByIndex(0);
			} else {
				this.oItemHelper.setItemsStatusByConsGrp();
			}
			return;
		},
		formatSourceHUEnabled: function (iPendingTaskNumber) {
			if (iPendingTaskNumber > 0) {
				return false;
			}
			return true;
		},
		onSourceItemPressed: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext("itemModel");
			var oProduct = oContext.getObject();
			this.getWorkFlowFactory().getProductChangeWorkFlow().run(oProduct);
		},
		formatHandlingInstruction: function (sHandlingInstruction, sProductId) {
			if (Util.isEmpty(sProductId)) {
				return "";
			}
			return sHandlingInstruction;
		},

		/*
		 * @param {string} sMessage
		 * Show error message in message box, leave the app after click ok button
		 * public
		 */
		showToLeaveMessagePopup: function (sMessage) {
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			MessageBox.error(
				sMessage, {
					styleClass: bCompact ? "sapUiSizeCompact" : "",
					actions: [sap.m.MessageBox.Action.OK],
					onClose: function () {
						this.setBusy(true);
						this.getWorkFlowFactory().getLeaveWorkFlow().run();
					}.bind(this)
				}
			);
		},

		formatBaseUoMVisible: function (oItem) {
			if (!Util.isEmpty(oItem) && oItem.AlternativeUnit === oItem.BaseUnit) {
				return false;
			}
			return true;
		},
		initColumnSettingModel: function () {
			this.oColumnSettingsHelper.setData(this.getDefaultColumnSetting());
		},
		canFirstSourceItemPackToCurrentShipHU: function () {
			var bValue = false;
			var sCurrentShipHU = Global.getCurrentShipHandlingUnit();
			var bIsCurrentShipHUClosed = Global.getCurrentShipHandlingUnitClosed();
			if (Util.isEmpty(sCurrentShipHU) || bIsCurrentShipHUClosed) {
				return false;
			}
			if (Global.getCheckConsolidationGroup()) {
				var sSourceItemConGrp = this.oItemHelper.getFirstItemConsGroup();
				var sCurrentShipHUConGrp = Cache.getShipHUConsGroup(sCurrentShipHU);
				if (Util.isEmpty(sCurrentShipHUConGrp)) {
					//ship hu may be empty or has broken items inside
					if (!Util.isEmpty(sSourceItemConGrp) && Cache.getIsEmptyHU(sCurrentShipHU)) {
						//it is a normal source item, ship hu is empty
						bValue = true;
					} else if (Util.isEmpty(sSourceItemConGrp)) {
						//this is a broken source item
						bValue = true;
					}
				} else if (sCurrentShipHUConGrp === sSourceItemConGrp) {
					//ship hu have normal items inside
					bValue = true;
				}
			} else {
				bValue = true;
			}
			return bValue;
		},
		initDefaultColumnSetting: function () {
			this._mAdvancedSourceTableDefaultSettings = JSON.parse(JSON.stringify(AdvancedSourceTableSetting.getData()));
			this._mBasicSourceDefaultDefaultSettings = JSON.parse(JSON.stringify(BasicSourceTableSetting.getData()));
			this._mInternalSourceTableDefaultSettings = JSON.parse(JSON.stringify(InternalSourceTableSetting.getData()));
		},
		formatProductText: function (sProduct, sProdcutDesc) {
			if (!Util.isEmpty(sProduct)) {
				return sProdcutDesc + " (" + sProduct + ")";
			} else {
				return "";
			}
		},
		formatPackWithoutSNVisible: function (oItem) {
			if (oItem !== undefined && oItem.SerialNumberRequiredLevel === Const.SN_DOC_LEVEL_PROFILE_A && oItem.EWMDeliveryDocumentCategory ===
				Const.DOCUMENT_CAT_OUTBOUND) {
				return true;
			} else {
				return false;
			}
		}
	});
});