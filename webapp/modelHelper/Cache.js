/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["scm/ewm/packoutbdlvs1/model/Global","scm/ewm/packoutbdlvs1/utils/Util"],function(M,U){"use strict";var _={};var a={};return{updateShipHUConsGroup:function(h,c){_[h]=c;},getShipHUConsGroup:function(h){return _[h]===undefined?"":_[h];},clearShipHU:function(h){_[h]=undefined;},replaceShipHUConsGroup:function(o,n){var c=this.getShipHUConsGroup(o);this.updateShipHUConsGroup(n,c);this.clearShipHU(o);},setIsEmptyHU:function(h,v){a[h]=v;},getIsEmptyHU:function(h){return a[h]===undefined?true:a[h];},reset:function(){_={};a={};},get_mCache:function(){return _;},set_mCache:function(d){_=d;},get_mIsEmptyHU:function(){return a;},set_mIsEmptyHU:function(d){a=d;}};});
