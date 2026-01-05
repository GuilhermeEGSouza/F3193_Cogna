/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(['sap/ui/core/Control'],
    function(Control) {
        "use strict";
        var Audio = Control.extend("zcogna.ewm.packoutbdlvs1.control.Audio", {
            metadata: {
                properties: {
                    src: {
                        type: "String",
                        defaultValue: "",
                        bindable: "bindable"
                    },
                    type: {
                        type: "String",
                        defaultValue: "",
                        bindable: "bindable"
                    }
                },
                designTime: true
            }
        });

        Audio.prototype.play = function() {
            var $DomNode = this.$();

            if ($DomNode.length) {
                $DomNode[0].play();
            }
        };

        return Audio;

    });