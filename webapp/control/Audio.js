/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(['sap/ui/core/Control'],function(C){"use strict";var A=C.extend("scm.ewm.packoutbdlvs1.control.Audio",{metadata:{properties:{src:{type:"String",defaultValue:"",bindable:"bindable"},type:{type:"String",defaultValue:"",bindable:"bindable"}},designTime:true}});A.prototype.play=function(){var d=this.$();if(d.length){d[0].play();}};return A;});
