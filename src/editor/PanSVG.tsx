import React from 'react';
import {MindNode, MindNode_Anchor, MindNode_Props, Floating_Anchor, ArrowBundle} from './MindNode'

interface Pan_SVG_Props extends SVG_Events_Interface{
    x_origin:                    number,
    y_origin:                    number,
    width:                       number,
    height:                      number,
    min_x:                       number,
    min_y:                       number,
}

interface SVG_Events_Interface {
    mouseDown:      React.PointerEventHandler<SVGSVGElement>;
    mouseUp:        React.PointerEventHandler<SVGSVGElement>;
    onPointerMove:  React.PointerEventHandler<SVGSVGElement>;
    onMouseOut:     React.PointerEventHandler<SVGSVGElement>;
    onDoubleClick:  React.PointerEventHandler<SVGSVGElement>;
}

export type {Pan_SVG_Props}