import React from 'react';

//Document link...
interface MindNode_Props extends MindNode_Sub_Props{
    id:               number,
    anchor_octet:     MindNode_Anchor_Octet,
    markdown:         string,
}

type MindNode_Anchor_Octet = {
    a1_id: number,
    a2_id: number,
    a3_id: number,
    a4_id: number,
    a5_id: number,
    a6_id: number,
    a7_id: number,
    a8_id: number,
}

//Where parent_Id is the Id of the parent Node
// - If a negative parentId is given it means no parent is associated with this anchor
// - However the anchor may have numerous inbound and outbound nodes - which may lead to a non-negative parent

interface MindNode_Anchor_JSON
{
    id: number;
    parent_id: number;
    inbound_anchor_Ids:  Array<number>
    outbound_anchor_Ids: Array<number>
    x: number,
    y: number,
}

interface MindNode_Anchor extends SVG_Object_Props{
    id:                    number;
    parent_Id:             number;
    inbound_anchor_Ids:    Set<number>;
    outbound_anchor_Ids:   Set<number>;
    activateAnchor_Down:   Function;
    acceptingAnchor_Up:    Function;
}

interface SVG_Object_Props {
    x:            number;
    y:            number;
    stroke_color: string;
    stroke_width: number;
    radius:       number;
    color:        string;
}

//Holds Color and Position Properties
interface MindNode_Sub_Props extends SVG_Object_Props{
    node_text:                 string;
    activateMindNodeHandler:   Function;
    triggerMouseUpHandler:     Function;
    moveMindNodeHandler:       Function;
    testHandler:               Function;
}


function add_MindNode_Anchor_Octet(MSP:SVG_Object_Props, 
    curAnchorID_counter:number, 
    curMindNodeID_counter:number, 
    MindNode_Anchor:Map<number, MindNode_Anchor>,
    activateAnchor_Down:Function,
    acceptingAnchor_Up: Function
    ):MindNode_Anchor_Octet
{
    const MNAO:MindNode_Anchor_Octet = {
        a1_id: curAnchorID_counter,
        a2_id: curAnchorID_counter+1,
        a3_id: curAnchorID_counter+2,
        a4_id: curAnchorID_counter+3,
        a5_id: curAnchorID_counter+4,
        a6_id: curAnchorID_counter+5,
        a7_id: curAnchorID_counter+6,
        a8_id: curAnchorID_counter+7,
    }
    MindNode_Anchor.set(MNAO.a1_id, {
        inbound_anchor_Ids:  new Set<number>(),
        outbound_anchor_Ids: new Set<number>(),
        x: MSP.x - MSP.radius,
        y: MSP.y,
        radius: MSP.radius/10,
        stroke_color: MSP.stroke_color,
        color:"green",
        stroke_width: MSP.stroke_width,
        id:MNAO.a1_id,
        parent_Id: curMindNodeID_counter,
        activateAnchor_Down:activateAnchor_Down,
        acceptingAnchor_Up: acceptingAnchor_Up,
    })
    MindNode_Anchor.set(MNAO.a2_id, {
        inbound_anchor_Ids:  new Set<number>(),
        outbound_anchor_Ids: new Set<number>(),
        x: MSP.x + MSP.radius,
        y: MSP.y,
        radius: MSP.radius/10,
        id:MNAO.a2_id,
        parent_Id: curMindNodeID_counter,
        stroke_color: MSP.stroke_color,
        color:"green",
        stroke_width: 2,
        activateAnchor_Down:activateAnchor_Down,
        acceptingAnchor_Up: acceptingAnchor_Up,
    })
    MindNode_Anchor.set(MNAO.a3_id, {
        inbound_anchor_Ids:  new Set<number>(),
        outbound_anchor_Ids: new Set<number>(),
        x: MSP.x,
        y: MSP.y - MSP.radius,
        radius: MSP.radius/10,
        id:MNAO.a3_id,
        parent_Id: curMindNodeID_counter,
        stroke_color: MSP.stroke_color,
        color:"green",
        stroke_width: 2,
        activateAnchor_Down:activateAnchor_Down,
        acceptingAnchor_Up: acceptingAnchor_Up,
    })
    MindNode_Anchor.set(MNAO.a4_id, {
        inbound_anchor_Ids:  new Set<number>(),
        outbound_anchor_Ids: new Set<number>(),
        x: MSP.x,
        y: MSP.y + MSP.radius,
        radius: MSP.radius/10,
        id:MNAO.a4_id,
        parent_Id: curMindNodeID_counter,
        stroke_color: MSP.stroke_color,
        color:"green",
        stroke_width: 2,
        activateAnchor_Down:activateAnchor_Down,
        acceptingAnchor_Up: acceptingAnchor_Up,
    })
    MindNode_Anchor.set(MNAO.a5_id, {
        inbound_anchor_Ids:  new Set<number>(),
        outbound_anchor_Ids: new Set<number>(),
        x: MSP.x - MSP.radius*.7,
        y: MSP.y - MSP.radius*.7,
        radius: MSP.radius/10,
        id:MNAO.a5_id,
        parent_Id: curMindNodeID_counter,
        stroke_color: MSP.stroke_color,
        color:"green",
        stroke_width: 2,
        activateAnchor_Down:activateAnchor_Down,
        acceptingAnchor_Up: acceptingAnchor_Up,
    })
    MindNode_Anchor.set(MNAO.a6_id, {
        inbound_anchor_Ids:  new Set<number>(),
        outbound_anchor_Ids: new Set<number>(),
        x: MSP.x + MSP.radius*.7,
        y: MSP.y - MSP.radius*.7,
        radius: MSP.radius/10,
        id:MNAO.a6_id,
        parent_Id: curMindNodeID_counter,
        stroke_color: MSP.stroke_color,
        color:"green",
        stroke_width: 2,
        activateAnchor_Down:activateAnchor_Down,
        acceptingAnchor_Up: acceptingAnchor_Up,
    })
    MindNode_Anchor.set(MNAO.a7_id, {
        inbound_anchor_Ids:  new Set<number>(),
        outbound_anchor_Ids: new Set<number>(),
        x: MSP.x - MSP.radius*.7,
        y: MSP.y + MSP.radius*.7,
        radius: MSP.radius/10,
        id:MNAO.a7_id,
        parent_Id: curMindNodeID_counter,
        stroke_color: MSP.stroke_color,
        color:"green",
        stroke_width: 2,
        activateAnchor_Down:activateAnchor_Down,
        acceptingAnchor_Up: acceptingAnchor_Up,
    })
    MindNode_Anchor.set(MNAO.a8_id, {
        inbound_anchor_Ids:  new Set<number>(),
        outbound_anchor_Ids: new Set<number>(),
        x: MSP.x + MSP.radius*.7,
        y: MSP.y + MSP.radius*.7,
        radius: MSP.radius/10,
        id:MNAO.a8_id,
        parent_Id: curMindNodeID_counter,
        stroke_color: MSP.stroke_color,
        color:"green",
        stroke_width: 2,
        activateAnchor_Down:activateAnchor_Down,
        acceptingAnchor_Up: acceptingAnchor_Up,
    })
    return MNAO;

}

function synchronize_mindnode_anchor(MNP: MindNode_Props, MindNode_Anchors:Map<number, MindNode_Anchor>)
{
    MindNode_Anchors.set(MNP.anchor_octet.a1_id, {
        ...MindNode_Anchors.get(MNP.anchor_octet.a1_id)!,
        parent_Id: MNP.id,
        x: MNP.x - MNP.radius,
        y: MNP.y,
        stroke_color: MNP.stroke_color
    })

    MindNode_Anchors.set(MNP.anchor_octet.a2_id, {
        ...MindNode_Anchors.get(MNP.anchor_octet.a2_id)!,
        x: MNP.x + MNP.radius,
        y: MNP.y,
        stroke_color: MNP.stroke_color
    })

    MindNode_Anchors.set(MNP.anchor_octet.a3_id, {
        ...MindNode_Anchors.get(MNP.anchor_octet.a3_id)!,
        x: MNP.x,
        y: MNP.y - MNP.radius,
        stroke_color: MNP.stroke_color
    })

    MindNode_Anchors.set(MNP.anchor_octet.a4_id, {
        ...MindNode_Anchors.get(MNP.anchor_octet.a4_id)!,
        x: MNP.x,
        y: MNP.y + MNP.radius,
        stroke_color: MNP.stroke_color
    })

    MindNode_Anchors.set(MNP.anchor_octet.a5_id, {
        ...MindNode_Anchors.get(MNP.anchor_octet.a5_id)!,
        parent_Id: MNP.id,
        x: MNP.x - MNP.radius*.7,
        y: MNP.y - MNP.radius*.7,
        stroke_color: MNP.stroke_color
    })

    MindNode_Anchors.set(MNP.anchor_octet.a6_id, {
        ...MindNode_Anchors.get(MNP.anchor_octet.a6_id)!,
        parent_Id: MNP.id,
        x: MNP.x + MNP.radius*.7,
        y: MNP.y - MNP.radius*.7,
        stroke_color: MNP.stroke_color
    })

    MindNode_Anchors.set(MNP.anchor_octet.a7_id, {
        ...MindNode_Anchors.get(MNP.anchor_octet.a7_id)!,
        parent_Id: MNP.id,
        x: MNP.x - MNP.radius*.7,
        y: MNP.y + MNP.radius*.7,
        stroke_color: MNP.stroke_color
    })

    MindNode_Anchors.set(MNP.anchor_octet.a8_id, {
        ...MindNode_Anchors.get(MNP.anchor_octet.a8_id)!,
        parent_Id: MNP.id,
        x: MNP.x + MNP.radius*.7,
        y: MNP.y + MNP.radius*.7,
        stroke_color: MNP.stroke_color
    })
}


const Floating_Anchor = (props: MindNode_Anchor, selectedAnchorNode:number, 
    ActivateAnchor_Border:Function, 
    MouseMove:Function) => {
    return(
        <g key={props.id}>
            <circle 
                id={props.id.toString()} 
                cx=          {props.x}
                cy=          {props.y}
                r=           {props.radius*2}
                fill=        "blue"
                stroke=      {selectedAnchorNode===props.id?"white":props.stroke_color}
                strokeWidth= {2}
                onMouseMove= {(event)=>{MouseMove(event)}}
                onMouseDown = {(e)=>{props.activateAnchor_Down(props.id, e)}} 
                onMouseUp = {(e)=>{props.acceptingAnchor_Up(props.id, e)}} 
                style       = {{cursor:"pointer"}}
            />
            <circle 
                id=          {props.id.toString()} 
                cx=          {props.x}
                cy=          {props.y}
                r=           {props.radius}
                fill=        {props.color}
                stroke=      {selectedAnchorNode===props.id?"white":props.stroke_color}
                strokeWidth= {props.stroke_width}
                onMouseMove= {(event)=>{MouseMove(event)}} 
                onMouseUp=   {(e)=>{props.acceptingAnchor_Up(props.id, e)}} 
                onMouseDown= {(e)=>{ActivateAnchor_Border(props.id, e)}}
                style       = {{cursor:"move"}}
            />
        </g>
    )
}

const Anchor = (props: MindNode_Anchor, selectedMindNode:number) => {
    return (
        <>
            <circle 
                id          = {props.id.toString()} 
                cx          = {props.x}
                cy          = {props.y}
                r           = {props.radius}
                fill        = {props.color}
                stroke      = {selectedMindNode===props.parent_Id?"white":props.stroke_color}
                strokeWidth = {props.stroke_width}
                onMouseDown = {(e)=>{props.activateAnchor_Down(props.id, e)}} 
                onMouseUp   = {(e)=>{props.acceptingAnchor_Up(props.id, e)}} 
                style       = {{cursor:"pointer"}}
            />
        </>
    );
}

const Ghost_Floating_Anchor = (cx: number, cy: number) => {
    return (
        <>
            <g key={"Ghost"} opacity={.5}>
                <circle
                cx=          {cx}
                cy=          {cy}
                r=           {(75/10)*2}
                fill=        "blue"
                stroke=      "black"
                strokeWidth= {2}
                >
                </circle>
                <circle
                cx=          {cx}
                cy=          {cy}
                r=           {75/10}
                fill=        "green"
                stroke=      "black"
                strokeWidth= {2}
                >
                </circle>
            </g>
        </>
    )
}

const TempArrow = (origin_x:number, origin_y:number, cursor_x:number, cursor_y:number) => {
    const opposite = cursor_y - origin_y;
    const adjacent = cursor_x - origin_x;
    const angleRad = Math.atan2(opposite, adjacent);
    const angleDeg = angleRad * 180 / Math.PI;
    return (
        <g pointerEvents={"none"}>
            <line pointerEvents={"none"} x1={origin_x} y1={origin_y} x2={cursor_x} y2={cursor_y} stroke="white" strokeWidth={4}/>
            {
            <g pointerEvents={"none"} transform={`rotate(${angleDeg}, ${cursor_x}, ${cursor_y})`} >
                <polygon points={`${cursor_x-15},${cursor_y+6} ${cursor_x-15},${cursor_y-6} ${cursor_x+1},${cursor_y}`} fill="white" stroke="black" strokeWidth={1}/>
            </g>
            }        
        </g>
    )
}

const Arrow = (props_1: MindNode_Anchor, props_2: MindNode_Anchor, selectFunction:Function, selected:boolean, mouseOverFunction:Function, mouseOutFunction:Function) => {
    const opposite = props_2.y - props_1.y;
    const adjacent = props_2.x - props_1.x;
    const angleRad = Math.atan2(opposite, adjacent);
    const angleDeg = angleRad * 180 / Math.PI;
    return (
        <g key={props_2.id}>
            <circle pointerEvents={"none"} cx={props_1.x} cy={props_1.y} r={props_1.radius/2} fill={"black"}></circle>
            <line onMouseMove={(e)=>{mouseOverFunction(props_1.id, props_2.id, e)}}
             onMouseDown={(e)=>{selectFunction(props_1.id, props_2.id, e)}}
             onMouseOut={()=>{mouseOutFunction(props_1.id, props_2.id)}}
              x1={props_1.x} y1={props_1.y} x2={props_2.x} y2={props_2.y} 
              stroke={selected?"white":"black"} strokeWidth={4}
              style       = {{cursor:"crosshair"}}
              />
            <g pointerEvents={"none"} transform={`rotate(${angleDeg}, ${props_2.x}, ${props_2.y})`} >
                <polygon points={`${props_2.x-15},${props_2.y+6} ${props_2.x-15},${props_2.y-6} ${props_2.x+1},${props_2.y}`} fill="white" stroke="black" strokeWidth={1}/>
            </g>
        </g>
    )
}

const ArrowBundle = (props: MindNode_Anchor, reference_Anchors:Map<number, MindNode_Anchor>, selected_ao_id:number, selected_ad_id:number,  selectFunction:Function, mouseOverFunction:Function, mouseOutFunction:Function) =>
{
    const outbound_Nodes:Array<number> = [];
    props.outbound_anchor_Ids.forEach( value => {outbound_Nodes.push(value)} );
    const Arrows = outbound_Nodes.map( (outbound_id) => {return Arrow(props, reference_Anchors.get(outbound_id)!, selectFunction, (selected_ao_id===props.id && selected_ad_id===outbound_id), mouseOverFunction, mouseOutFunction)});
    return (
        <g key={props.id}>
            {Arrows}
        </g>
    )
}

const MindNode = (props:MindNode_Props, selectedMindNode:number, anchors:Map<number, MindNode_Anchor>) => {
    //console.log("selectedMindNode: ", selectedMindNode, "Anchor Length: ", anchors.size)
    return (
            <g key={props.id}>
                <circle cx={props.x} cy={props.y} r={props.radius} stroke={selectedMindNode===props.id?"white":props.stroke_color} strokeWidth={props.stroke_width} fill={props.color}
                onMouseMove = {(e)=> {props.moveMindNodeHandler(e)}} onMouseDown = {(e) => {props.activateMindNodeHandler(props.id, e)}} 
                onMouseUp = {(e)=>{props.triggerMouseUpHandler(e)}}
                />
                <foreignObject color={props.color} width={props.radius*2} height={props.radius*2} x={props.x - props.radius} y={props.y - props.radius} pointerEvents={"none"}>
                        <div style={{height:props.radius*2, width:props.radius*2, alignItems:"center", justifyContent: "center", display: 'flex', borderRadius:"50%"}}> 
                            <div className="text-black text-center fw-bold" 
                                style={{clipPath:`circle(${props.radius}px)`, borderRadius:`${props.radius}px`, wordBreak:"break-word", textAlign:"center", background:`${props.color}`, textOverflow: "clip"}}>
                                    {props.node_text}
                            </div>
                        </div>
                </foreignObject>
                {Anchor(anchors.get(props.anchor_octet.a1_id)!, selectedMindNode)}
                {Anchor(anchors.get(props.anchor_octet.a2_id)!, selectedMindNode)}
                {Anchor(anchors.get(props.anchor_octet.a3_id)!, selectedMindNode)}
                {Anchor(anchors.get(props.anchor_octet.a4_id)!, selectedMindNode)}
                {Anchor(anchors.get(props.anchor_octet.a5_id)!, selectedMindNode)}
                {Anchor(anchors.get(props.anchor_octet.a6_id)!, selectedMindNode)}
                {Anchor(anchors.get(props.anchor_octet.a7_id)!, selectedMindNode)}
                {Anchor(anchors.get(props.anchor_octet.a8_id)!, selectedMindNode)}
            </g> 

    )
}

export {MindNode, 
        add_MindNode_Anchor_Octet, 
        synchronize_mindnode_anchor,
        Floating_Anchor,
        ArrowBundle,
        TempArrow,
        Ghost_Floating_Anchor
    }
export type {MindNode_Sub_Props, MindNode_Anchor_Octet, MindNode_Props, MindNode_Anchor, SVG_Object_Props, MindNode_Anchor_JSON}
