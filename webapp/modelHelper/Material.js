/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/model/Material",
	"scm/ewm/packoutbdlvs1/utils/Util"
], function (Model, Util) {
	"use strict";
	var _mMaterialIndexByName; // hash object to store material info with the description field as the key
	var _mMaterialIndexById; // hash object to store material info with the id field as the key
	var _mMaterial;
	return {
		setData: function (aMaterials) {
			_mMaterial = aMaterials;
			this.storeMaterialAsMap(aMaterials);
			var aMaterialsGroup = this.separateMaterials(aMaterials);
			var aFavoriteMaterials = aMaterialsGroup[0];
			var aOtherMaterials = aMaterialsGroup[1];
			this.setFavoriteMaterials(aFavoriteMaterials);
			this.setOtherMaterials(aOtherMaterials);
			this.setMaterialLayout(aFavoriteMaterials);
			this.setDefaultMaterialId(aMaterials);
		},
		getData: function () {
			return _mMaterial;
		},

		separateMaterials: function (aMaterials) {
			var aFavoriteMaterials = [];
			var aOtherMaterials = [];
			aMaterials.forEach(function (oMaterial) {
				if (oMaterial.IsFavorite === true) {
					oMaterial.Selected = false;
					aFavoriteMaterials.push(oMaterial);
				} else {
					aOtherMaterials.push(oMaterial);
				}
			});
			return [aFavoriteMaterials, aOtherMaterials];
		},
		transformMaterialLayout: function (aMaterials) {
			var aMaterialsLayoutData = [],
				oMaterialInfo, iRow, iCol, oMaterial, iRowCount;

			if (aMaterials.length > 0) {
				for (var iIndex = 0; iIndex < aMaterials.length;) {
					iRowCount = Math.ceil(aMaterials.length / 2);
					for (iRow = 0; iRow < iRowCount; iRow++) {
						if (aMaterialsLayoutData[iRow] === undefined) {
							aMaterialsLayoutData[iRow] = {
								cells: []
							};
						}
						for (iCol = 0; iCol < 2; iCol++) {
							oMaterialInfo = aMaterials[iIndex];
							if (oMaterialInfo !== undefined) {
								oMaterial = {
									pressed: false,
									materialCode: oMaterialInfo.DisplayCode,
									materialName: oMaterialInfo.PackagingMaterialDescription,
									materialId: oMaterialInfo.PackagingMaterial,
									isInternal: oMaterialInfo.IsInternalNR
								};

								aMaterialsLayoutData[iRow].cells[iCol] = oMaterial;
								iIndex++;
							}
						}
					}
				}
			}
			return aMaterialsLayoutData;
		},

		storeMaterialAsMap: function (aMaterials) {
			_mMaterialIndexByName = {};
			_mMaterialIndexById = {};
			//todo only for test
			// aMaterials = aMaterials.concat(aTestData);
			aMaterials.forEach(function (oMaterial) {
				_mMaterialIndexByName[oMaterial.PackagingMaterialDescription] = oMaterial;
				_mMaterialIndexById[oMaterial.PackagingMaterial] = oMaterial;
			});
		},
		getMaterialByName: function (sName) {
			var oMaterial;
			if (_mMaterialIndexByName) {
				oMaterial = _mMaterialIndexByName[sName];
			}
			return oMaterial;
		},
		getMaterialById: function (sMaterialId) {
			var oMaterial;
			if (_mMaterialIndexById) {
				oMaterial = _mMaterialIndexById[sMaterialId];
			}
			return oMaterial;
		},
		setOtherMaterials: function (aMaterials) {
			Model.setProperty("/otherMaterials", aMaterials);
		},
		getOtherMaterials: function () {
			return Model.getProperty("/otherMaterials");
		},
		setFavoriteMaterials: function (aMaterials) {
			Model.setProperty("/favoriteMaterials", aMaterials);
		},
		getFavoriteMaterials: function () {
			return Model.getProperty("/favoriteMaterials");
		},
		setMaterialLayout: function (aMaterials) {
			Model.setProperty("/materialLayout", this.transformMaterialLayout(aMaterials));
		},
		getMaterialLayout: function () {
			return Model.getProperty("/materialLayout");
		},
		setCurrentMaterial: function (oMaterial) {
			Model.setProperty("/currentMaterial", oMaterial);
		},
		getCurrentMaterial: function () {
			return Model.getProperty("/currentMaterial");
		},
		getCurrentMaterialId: function () {
			return Model.getProperty("/currentMaterial/PackagingMaterial");
		},
		getCurrentMaterialUom: function () {
			return Model.getProperty("/currentMaterial/MaxWeightUoM");
		},
		setOriginalMaterialId: function (sMaterialId) {
			Model.setProperty("/originalMaterialId", sMaterialId);
		},
		getOriginalMaterialId: function () {
			return Model.getProperty("/originalMaterialId");
		},
		getCurrentMaterialMaxWeight: function () {
			return Model.getProperty("/currentMaterial/HandlingUnitMaxWeight");
		},
		getCurrentMaterialMaxWeightTol: function () {
			return Model.getProperty("/currentMaterial/MaxWeightTol");
		},
		getCurrentMaterialTareWeight: function () {
			return Model.getProperty("/currentMaterial/GrossWeight");
		},
		getMaterialIdByPath: function (sPath) {
			return Model.getProperty(sPath + "/materialId");
		},
		getFavoriteMaterialIdByPath: function (sPath) {
			//todo refine with getMaterialIdByPath for advance mode 
			return Model.getProperty(sPath + "/PackagingMaterial");
		},
		getSelectedMaterialId: function () {
			return Model.getProperty("/selectedMaterialId");
		},
		setSelectedMaterialId: function (sMaterialId) {
			Model.setProperty("/selectedMaterialId", sMaterialId);
		},
		getDefaultMaterialId: function () {
			return Model.getProperty("/defaultMaterialId");
		},
		setDefaultMaterialId: function (aMaterials) {
			var oResult = Util.find(aMaterials, function (oMaterial) {
				if (oMaterial.IsDefault === true) {
					return true;
				}
				return false;
			});
			if (oResult) {
				this.setFavoriteMaterialSelectedById(oResult.PackagingMaterial, true);
				Model.setProperty("/defaultMaterialId", oResult.PackagingMaterial);
			} else {
				Model.setProperty("/defaultMaterialId", "");
			}
		},
		setFavoriteMaterialSelectedByDefault: function () {
			var aFavoriteMaterial = this.getFavoriteMaterials();
			aFavoriteMaterial.forEach(function (oMaterial) {
				this.setFavoriteMaterialSelectedById(oMaterial.PackagingMaterial, oMaterial.IsDefault);
			}.bind(this));
		},
		setMaterialPressedById: function (sMaterialId, bPressed) {
			var aLayout = this.getMaterialLayout();
			aLayout.forEach(function (oLayout) {
				oLayout.cells.forEach(function (oMaterial) {
					if (oMaterial.materialId === sMaterialId) {
						oMaterial.pressed = bPressed;
					}
				});
			});
			Model.updateBindings(true);
		},
		setCurrentMaterialById: function (sMaterialId) {
			var oMaterial = this.getMaterialById(sMaterialId);
			this.setCurrentMaterial(oMaterial);
		},
		IsSelectedMaterialExternal: function (sMaterialId) {
			if (Util.isEmpty(sMaterialId)) {
				sMaterialId = this.getSelectedMaterialId();
			}
			var oMaterial = this.getMaterialById(sMaterialId);
			return !oMaterial.IsInternalNR;
		},
		IsMaterialFavorite: function (sMaterialId) {
			var aFavoriteMaterials = this.getFavoriteMaterials();
			var oResult = Util.find(aFavoriteMaterials, function (oMaterial) {
				if (oMaterial.PackagingMaterial === sMaterialId) {
					return true;
				}
				return false;
			});
			if (oResult) {
				return true;
			}
			return false;
		},
		clearFormerPressedMaterial: function () {
			var sSelectedMaterialId = this.getSelectedMaterialId();
			if (!Util.isEmpty(sSelectedMaterialId)) {
				this.setMaterialPressedById(sSelectedMaterialId, false);
			}
		},
		setFavoriteMaterialSelectedById: function (sMaterialId, bSelected) {
			var oMaterial = this.getMaterialById(sMaterialId);
			oMaterial.Selected = bSelected;
			Model.updateBindings(true);
		}
	};
});