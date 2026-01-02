/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([],function(){"use strict";var A={};A.render=function(r,a){var b=r;b.write("<audio");b.writeControlData(a);b.writeAttributeEscaped("src",a.getSrc());b.write(">");b.write("</audio>");};return A;},true);
