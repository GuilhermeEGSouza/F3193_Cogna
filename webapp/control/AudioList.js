/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(['sap/ui/core/Control'],function(C){"use strict";var A=C.extend("scm.ewm.packoutbdlvs1.control.AudioList",{metadata:{properties:{visible:{type:"boolean",group:"Appearance",defaultValue:false}},defaultAggregation:"items",aggregations:{items:{type:"sap.ui.core.Control",multiple:true,singularName:"item",bindable:"bindable"}},designTime:true}});A.prototype.play=function(m){var I=this.getItems();for(var i=0;i<I.length;i++){if(I[i].getType()===m){return I[i].play();}}};return A;});
