import React from 'react';
import {
        MindNode_Anchor, MindNode_Props, 
        add_MindNode_Anchor_Octet, 
        SVG_Object_Props, 
        synchronize_mindnode_anchor,
        MindNode,
        Floating_Anchor,
        ArrowBundle,
        TempArrow,
        MindNode_Anchor_JSON,
        Ghost_Floating_Anchor
        } from './MindNode';
import {Pan_SVG_Props} from './PanSVG';
import {Card, Form, Button, CloseButton, ButtonGroup, ToggleButton, Row, Col} from 'react-bootstrap'
import ReactMarkdown from 'react-markdown';

type Editor_Props = {}

interface Editor_State extends Pan_SVG_Props{
    ghost_line_pos_x:               number,
    ghost_line_pos_y:               number,
    scale_factor:                   number,
    show_ghost_anchor:              boolean,
    ghost_anchor_pos_y:             number,
    ghost_anchor_pos_x:             number,
    file_input_reference:           React.RefObject<HTMLInputElement>;
    move_counter:                   number;
    selected_mind_node_id:          number;
    selected_anchor_id:             number;
    selected_line_ao_id:            number;
    selected_line_ad_id:            number;
    mindNodeID_Counter:             number;
    anchorID_counter:               number;
    mind_node_collection:           Map<number, MindNode_Props>;
    mind_node_anchor_collection:    Map<number, MindNode_Anchor>;
    pointer_down:                   boolean;
    pointer_down_on_mind_node:      boolean;
    pointer_down_on_anchor:         boolean;
    pointer_down_on_anchor_border:  boolean;
    show_md_panel:                  boolean;
    md_panel_edit_enabled:          boolean;
    resetMouseDown:                 React.PointerEventHandler<any>;
    md_panel_rendered:              boolean;
    svg_reference:                  React.RefObject<SVGSVGElement>              
}


interface Editor_JSON_Props
{
    mind_node_collection:        Array<MindNode_Props>;
    mind_node_anchor_collection: Array<MindNode_Anchor_JSON>;
    mindNodeID_Counter:          number;
    anchorID_Counter:            number;
}

interface Point_Cordinates
{
    x: number,
    y: number
}

const disable_mouse = function (this: Document, e: WheelEvent){
    e.preventDefault();
}

class Editor extends React.Component<Editor_Props, Editor_State>
{

    constructor(props: Editor_Props)
    {
        super(props);
        this.state = {
            ghost_line_pos_x:              0,
            ghost_line_pos_y:              0,
            scale_factor:                  1,
            show_ghost_anchor:             false,
            ghost_anchor_pos_y:            0,
            ghost_anchor_pos_x:            0,
            file_input_reference:          React.createRef<HTMLInputElement>(),
            selected_anchor_id:            -1,
            selected_mind_node_id:         -1,
            x_origin:                      0,
            y_origin:                      0,
            width:                         window.innerWidth,
            height:                        window.innerHeight,
            min_x:                         0,
            min_y:                         0,
            pointer_down:                  false,
            pointer_down_on_mind_node:     false,
            pointer_down_on_anchor:        false,
            pointer_down_on_anchor_border: false,
            move_counter:                  0,            
            mind_node_collection:          new Map<number, MindNode_Props>(),
            mind_node_anchor_collection:   new Map<number, MindNode_Anchor>(),
            mouseDown:                     this.mouseDown,
            mouseUp:                       this.mouseUp,
            onPointerMove:                 this.onPointerMove,
            onMouseOut:                    this.onMouseOut,
            onDoubleClick:                 this.deactivate_selection,
            resetMouseDown:                this.resetMouseDown,
            mindNodeID_Counter:            0,
            anchorID_counter:              0,
            show_md_panel:                 false,
            md_panel_edit_enabled:         true,
            md_panel_rendered:             false,
            selected_line_ad_id:           -1,
            selected_line_ao_id:           -1,
            svg_reference:                  React.createRef<SVGSVGElement>()
        }
    }

    componentDidMount(){
        document.addEventListener('wheel', disable_mouse, {passive: false})
    }

    componentWillUnmount()
    {
        document.removeEventListener('wheel', disable_mouse)
    }

    toJSON():string
    {
        let mna_array:Array<MindNode_Anchor_JSON> = [];
        this.state.mind_node_anchor_collection.forEach( (MNA) => {
            mna_array.push({
                id: MNA.id,
                parent_id: MNA.parent_Id,
                inbound_anchor_Ids: Array.from(MNA.inbound_anchor_Ids.values()),
                outbound_anchor_Ids: Array.from(MNA.outbound_anchor_Ids.values()),
                x: MNA.x,
                y: MNA.y
            })
        });
        

        const Editor_Json: Editor_JSON_Props = {
            anchorID_Counter: this.state.anchorID_counter,
            mindNodeID_Counter: this.state.mindNodeID_Counter,
            mind_node_anchor_collection: mna_array,
            mind_node_collection: Array.from(this.state.mind_node_collection.values()),
        }
        return JSON.stringify({Editor_Json})
    }

    getMousePosition_SVG_2(event:React.PointerEvent<any>):Point_Cordinates
    {
        if (this.state.svg_reference.current !== null)
        {
            const reference_point = this.state.svg_reference.current.createSVGPoint();
            reference_point.x = event.clientX;
            reference_point.y = event.clientY;

            const SVG_CORDINATES = reference_point.matrixTransform( this.state.svg_reference.current!.getScreenCTM()!.inverse())
            return({
                x: SVG_CORDINATES.x,
                y: SVG_CORDINATES.y
            })
        }
        return {
            x: 0,
            y: 0
        }
    }

    getMousePosition_SVG(event:React.PointerEvent<any>):Point_Cordinates
    {
        if (this.state.svg_reference.current)
        {
            let CTM = this.state.svg_reference.current!.getCTM()!
            if (CTM)
            {
                return {
                    x: (event.clientX - CTM.e) / CTM.a,
                    y: (event.clientY - CTM.f) / CTM.d
                }
            }
        }
        return {
            x: 0,
            y: 0
        }
    }
    
    //Returns a set of all mind_node Ids that have a inbound relation to the given mind_node
    get_related_mind_node_Ids_from_mind_node(mind_node_id:number, inbound:boolean = true):Set<number>
    {
        const result_set:Set<number> = new Set<number>();
        if (!this.state.mind_node_collection.has(mind_node_id))
            return result_set;
        this.get_Other_Node_anchor_IDs_From_Mind_Node(mind_node_id, inbound).forEach( (anchor_Id) => {
            const anchor = this.state.mind_node_anchor_collection.get(anchor_Id)!
            if (anchor.parent_Id !== -1 && anchor.parent_Id !== mind_node_id)
            {
                result_set.add(anchor.parent_Id)
            }
        })
        return result_set;
    }
    
    //Returns a set of all anchors that have an inbound relation to the mind_node
    get_Other_Node_anchor_IDs_From_Mind_Node(mind_node_id:number, inbound:boolean = true):Set<number>
    {
        const result_set:Set<number> = new Set<number>();
        for(const anchor_id of this.get_mind_node_anchors(mind_node_id))
        {
            this.getNode_anchor_IDs_From_Floating_Anchor(anchor_id, inbound).forEach((value) => result_set.add(value))
        }
        return result_set
    }

    //Returns a set of all anchors that are bound to a node's anchor octet - that relate to a given anchor
    getNode_anchor_IDs_From_Floating_Anchor(anchor_id:number, inbound:boolean = true):Set<number>
    {
        const result_set:Set<number> = new Set<number>();
        const cur_anchor = this.state.mind_node_anchor_collection.get(anchor_id)!
        if (inbound)
        {
            cur_anchor.inbound_anchor_Ids.forEach( (anchor_ID) => {
                if (this.state.mind_node_anchor_collection.get(anchor_ID)!.parent_Id === -1)
                {
                    this.getNode_anchor_IDs_From_Floating_Anchor(anchor_ID).forEach((value) => result_set.add(value));
                }
                else
                {
                    result_set.add(anchor_ID)
                }
            })
        }
        else{
            cur_anchor.outbound_anchor_Ids.forEach((anchor_ID) => {
                if (this.state.mind_node_anchor_collection.get(anchor_ID)!.parent_Id === -1)
                {
                    this.getNode_anchor_IDs_From_Floating_Anchor(anchor_ID, false).forEach((value) => result_set.add(value))
                }
                else
                {
                    result_set.add(anchor_ID)
                }
            })
        }
        return result_set
    }

    //Returns a set of all floating anchors that relate to the given anchor_id
    get_floating_anchor_IDS_from_Anchor(anchor_id:number):Set<number>
    {
        const result_set:Set<number> = new Set<number>();
        const cur_anchor = this.state.mind_node_anchor_collection.get(anchor_id)!
        cur_anchor.inbound_anchor_Ids.forEach( (anchor_ID) => {
            if (this.state.mind_node_anchor_collection.get(anchor_ID)!.parent_Id === -1)
            {
                this.get_floating_anchor_IDS_from_Anchor(anchor_ID).forEach((value) => result_set.add(value))
                result_set.add(anchor_ID)
            }
        })
        return result_set
    }

    //Returns an array of anchor_id belonging to the node's anchor octet
    get_mind_node_anchors(mind_node_id:number):Array<number>
    {
        const mind_node = this.state.mind_node_collection.get(mind_node_id)!
        return [
            mind_node.anchor_octet.a1_id,
            mind_node.anchor_octet.a2_id,
            mind_node.anchor_octet.a3_id,
            mind_node.anchor_octet.a4_id,
            mind_node.anchor_octet.a5_id,
            mind_node.anchor_octet.a6_id,
            mind_node.anchor_octet.a7_id,
            mind_node.anchor_octet.a8_id,
        ]
    }

    clearAnchorReferences:Function = (anchor_id:number, cur_anchor_collection:Map<number, MindNode_Anchor>,set_state:Boolean=false) =>
    {
        //If anchors are floating anchors - all other outbound anchors and anchors of anchors will need to have their
        //similar inbound references cleared...
        if (cur_anchor_collection.has(anchor_id))
        {
            const selected_anchor = cur_anchor_collection.get(anchor_id)!
            //The anchors that the selected anchor point to - must have similar inbound anchors removed
            selected_anchor.outbound_anchor_Ids.forEach( (OA_ID) => {
                cur_anchor_collection.get(OA_ID)?.inbound_anchor_Ids.delete(selected_anchor.id);
            })
            //The anchors that point to the selected anchor
            selected_anchor.inbound_anchor_Ids.forEach( (IA_ID) => {
                cur_anchor_collection.get(IA_ID)?.outbound_anchor_Ids.delete(selected_anchor.id);
            });
        }
        if (set_state)
        {
            this.setState( () => ( {mind_node_anchor_collection: cur_anchor_collection} ) );
        }
    }

    clearLine:Function = (selectedLine_dest_id:number, selectedLine_origin_id:number,
        cur_anchor_collection:Map<number, MindNode_Anchor>,set_state:Boolean=false) =>
    {
        if (cur_anchor_collection.has(selectedLine_dest_id) && cur_anchor_collection.has(selectedLine_origin_id))
        {
            cur_anchor_collection.get(selectedLine_dest_id)?.inbound_anchor_Ids.delete(selectedLine_origin_id);
            cur_anchor_collection.get(selectedLine_origin_id)?.outbound_anchor_Ids.delete(selectedLine_dest_id);
        }
        if (set_state)
        {
            this.setState( () => ( {mind_node_anchor_collection: cur_anchor_collection} ) );
        }
    }

    clearMindMapReferences:Function = (mindmap_id:number, cur_mm_collection:Map<number, MindNode_Props>,
         cur_anchor_collection:Map<number, MindNode_Anchor>, set_state:Boolean = false) => 
    {
        if (cur_mm_collection.has(mindmap_id))
        {
            const selected_mm = cur_mm_collection.get(mindmap_id)!
            this.clearAnchorReferences(selected_mm.anchor_octet.a1_id, cur_anchor_collection);
            this.clearAnchorReferences(selected_mm.anchor_octet.a2_id, cur_anchor_collection);
            this.clearAnchorReferences(selected_mm.anchor_octet.a3_id, cur_anchor_collection);
            this.clearAnchorReferences(selected_mm.anchor_octet.a4_id, cur_anchor_collection);
            this.clearAnchorReferences(selected_mm.anchor_octet.a5_id, cur_anchor_collection);
            this.clearAnchorReferences(selected_mm.anchor_octet.a6_id, cur_anchor_collection);
            this.clearAnchorReferences(selected_mm.anchor_octet.a7_id, cur_anchor_collection);
            this.clearAnchorReferences(selected_mm.anchor_octet.a8_id, cur_anchor_collection);
        }
        if (set_state)
        {
            //console.log("Setting State")
            this.setState( () => ( {mind_node_anchor_collection: cur_anchor_collection} ) );
        }
    }

    clearSelection:Function = () => 
    {
        this.setState( () => 
        ( 
            {
                pointer_down:                  false,
                pointer_down_on_mind_node:     false,
                pointer_down_on_anchor:        false,
                pointer_down_on_anchor_border: false,
                selected_line_ad_id:           -1,
                selected_line_ao_id:           -1,
                selected_anchor_id:            -1,
                selected_mind_node_id:         -1,
        } ) );        
    }

    deleteSelection:Function = () =>
    {
        //console.log("Starting Delete...")
        const cur_anchor_collection = this.state.mind_node_anchor_collection
        const cur_mm_collection = this.state.mind_node_collection
        if (cur_mm_collection.has(this.state.selected_mind_node_id))
        {
            //console.log("Deleting Mind Map")
            const selected_mm = cur_mm_collection.get(this.state.selected_mind_node_id)!
            this.clearMindMapReferences(this.state.selected_mind_node_id, cur_mm_collection, cur_anchor_collection)
            cur_anchor_collection.delete(selected_mm.anchor_octet.a1_id)
            cur_anchor_collection.delete(selected_mm.anchor_octet.a2_id)
            cur_anchor_collection.delete(selected_mm.anchor_octet.a3_id)
            cur_anchor_collection.delete(selected_mm.anchor_octet.a4_id)
            cur_anchor_collection.delete(selected_mm.anchor_octet.a5_id)
            cur_anchor_collection.delete(selected_mm.anchor_octet.a6_id)
            cur_anchor_collection.delete(selected_mm.anchor_octet.a7_id)
            cur_anchor_collection.delete(selected_mm.anchor_octet.a8_id)
            cur_mm_collection.delete(this.state.selected_mind_node_id);
            //console.log("MindMap size after delete: ", cur_mm_collection.size)
            //console.log("Anchor size after delete: ", cur_anchor_collection.size)
            this.clearSelection()
            this.setState( () => ( {mind_node_anchor_collection: cur_anchor_collection,
                                    mind_node_collection: cur_mm_collection
            } ) );
        }
        else if (cur_anchor_collection.has(this.state.selected_anchor_id))
        {
            //console.log("Deleting Anchor")
            this.clearAnchorReferences(this.state.selected_anchor_id, cur_anchor_collection);
            cur_anchor_collection.delete(this.state.selected_anchor_id);
            this.clearSelection()
            this.setState( () => ( {mind_node_anchor_collection: cur_anchor_collection} ) );
        }
        else if (
            cur_anchor_collection.has(this.state.selected_line_ad_id)
            &&
            cur_anchor_collection.has(this.state.selected_line_ao_id)
        )
        {
            this.clearSelection()
            this.clearLine(this.state.selected_line_ad_id, this.state.selected_line_ao_id, 
                cur_anchor_collection, true
            );
        }
    }

    //Selects a Line
    //TAG: Line
    selectLine:Function = (anchor_origin_id:number, anchor_destination_id:number, event:React.PointerEvent<MouseEvent>) =>
    {
        //console.log("Selected Line", anchor_origin_id, anchor_destination_id)
        if (this.state.selected_line_ao_id === anchor_origin_id && this.state.selected_line_ad_id === anchor_destination_id)
        {
            const cur_anchors = this.state.mind_node_anchor_collection;
            const destination_anchor = cur_anchors.get(anchor_origin_id)!
            const source_anchor = cur_anchors.get(anchor_destination_id)!
            this.clearLine(anchor_destination_id, anchor_origin_id, cur_anchors, true)
            cur_anchors.set(this.state.anchorID_counter,
                {
                    color:"green",
                    id: this.state.anchorID_counter,
                    inbound_anchor_Ids: new Set<number>([anchor_origin_id]),
                    outbound_anchor_Ids: new Set<number>([anchor_destination_id]),
                    acceptingAnchor_Up: this.acceptingAnchor_Up,
                    activateAnchor_Down: this.activateAnchor_Down,
                    parent_Id: -1,
                    radius: 75/10,
                    stroke_color: "black",
                    stroke_width: 2,
                    y: this.state.ghost_anchor_pos_y,
                    x: this.state.ghost_anchor_pos_x,
                })
            destination_anchor.outbound_anchor_Ids.add(this.state.anchorID_counter)
            source_anchor.inbound_anchor_Ids.add(this.state.anchorID_counter)
            this.setState(() => ({
                anchorID_counter: this.state.anchorID_counter+1,
                mind_node_anchor_collection:cur_anchors,
                pointer_down:                  true,
                pointer_down_on_mind_node:     false,
                pointer_down_on_anchor:        true,
                pointer_down_on_anchor_border: false,
                selected_line_ad_id:           -1,
                selected_line_ao_id:           -1,
                selected_anchor_id:            this.state.anchorID_counter,
                selected_mind_node_id:         -1,
                show_ghost_anchor:             false,
            }))
        }
        else{
            const mouse_position = this.getMousePosition_SVG_2(event);
            this.setState(prevState=> ({
                ...prevState, 
                selected_mind_node_id: -1, 
                selected_anchor_id: -1, 
                selected_line_ao_id: anchor_origin_id, 
                selected_line_ad_id: anchor_destination_id,
                show_ghost_anchor: true,
                ghost_anchor_pos_y: mouse_position.y,
                ghost_anchor_pos_x: mouse_position.x,
            }))
        }
    }

    mouseOverLine:Function = (anchor_origin_id: number, anchor_destination_id: number, event:React.PointerEvent<MouseEvent>) => {
        if (this.state.selected_line_ao_id === anchor_origin_id && this.state.selected_line_ad_id === anchor_destination_id)
        {
            const mouse_position = this.getMousePosition_SVG_2(event);
            this.setState( (prevState) => ({
                show_ghost_anchor: true,
                ghost_anchor_pos_y: mouse_position.y,
                ghost_anchor_pos_x: mouse_position.x,
            }))
        }
        return;
    }

    mouseOutLine:Function = (anchor_origin_id: number, anchor_destination_id: number) => 
    {
        if (this.state.selected_line_ao_id === anchor_origin_id && this.state.selected_line_ad_id === anchor_destination_id)
        {
            this.setState( ()=> ({
                show_ghost_anchor: false,
            }))
        }
        return;
    }

    activateMindNodeMD:Function = (id:number) => {
        this.setState(prevState => ({...prevState, 
            selected_mind_node_id: id, 
            selected_anchor_id: -1,
            selected_line_ao_id: -1,
            selected_line_ad_id: -1,
        }))
    }
    //Selects a mindNode and sets its ID as the selected mindnode
    //Tag: MindNode, Activate
    activateMindNode:Function = (id:number, event:React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        //console.log("activateMindNode")
        //console.log(this.get_related_mind_node_Ids_from_mind_node(id))
        event.stopPropagation();
        event.preventDefault();
        this.setState(prevState => ({...prevState, 
            selected_mind_node_id: id, 
            pointer_down_on_mind_node:true, 
            selected_anchor_id: -1,
            selected_line_ao_id: -1,
            selected_line_ad_id: -1,
        }))
    }

    //Moves Selected MindNode
    //Tag: MindNode, Drag, Move
    moveMindNode:React.PointerEventHandler<HTMLDivElement> = (event:React.PointerEvent<HTMLDivElement>) => {
        //console.log("MoveMindNode")
        if (!this.state.pointer_down_on_mind_node)
            return;
        event.stopPropagation();
        event.preventDefault();
        const update_mind_node          = this.state.mind_node_collection;
        const updated_mind_node_anchors = this.state.mind_node_anchor_collection;
        const selected_mind_node        = this.state.mind_node_collection.get(this.state.selected_mind_node_id)!;
        const pointer_pos               = this.getMousePosition_SVG_2(event)
        update_mind_node.set(this.state.selected_mind_node_id, {
            ...selected_mind_node,
            x: pointer_pos.x,
            y: pointer_pos.y,
        })
        synchronize_mindnode_anchor(update_mind_node.get(this.state.selected_mind_node_id)!, updated_mind_node_anchors);
        
        this.setState( () => ( {
            mind_node_collection: update_mind_node,
        } ) );
    }
    /*
    moveMindNode:React.PointerEventHandler<HTMLDivElement> = (event:React.PointerEvent<HTMLDivElement>) => {
        //console.log("MoveMindNode")
        if (!this.state.pointer_down_on_mind_node)
            return;
        event.stopPropagation();
        event.preventDefault();
        const update_mind_node          = this.state.mind_node_collection;
        const updated_mind_node_anchors = this.state.mind_node_anchor_collection;
        const selected_mind_node        = this.state.mind_node_collection.get(this.state.selected_mind_node_id)!;
        const pointer_pos               = this.getMousePosition_SVG(event)
        update_mind_node.set(this.state.selected_mind_node_id, {
            ...selected_mind_node,
            x: selected_mind_node.x + (pointer_pos.x - this.state.x_origin),
            y: selected_mind_node.y + (pointer_pos.y - this.state.y_origin),
        })
        synchronize_mindnode_anchor(update_mind_node.get(this.state.selected_mind_node_id)!, updated_mind_node_anchors);
        
        this.setState( () => ( {
            mind_node_collection: update_mind_node,
            x_origin: pointer_pos.x,
            y_origin: pointer_pos.y,
        } ) );
    }
    */

    //Moves Selected Anchor Node
    //Tag: Anchor, Drag, Move
    moveAnchorNode:React.PointerEventHandler<HTMLDivElement> = (event:React.PointerEvent<HTMLDivElement>) => {
        if (!this.state.pointer_down_on_anchor)
            return;

        event.stopPropagation();
        event.preventDefault();
        const pointer_pos = this.getMousePosition_SVG_2(event);
        const update_mind_node_anchors = this.state.mind_node_anchor_collection;
        const selected_anchor = update_mind_node_anchors.get(this.state.selected_anchor_id)!;
        update_mind_node_anchors.set(this.state.selected_anchor_id, {
            ...selected_anchor,
            x: pointer_pos.x,
            y: pointer_pos.y,
        })
        this.setState( () => ( { 
            mind_node_anchor_collection: update_mind_node_anchors,
        } ) );

    }
    
    //Triggers when ever the pointer moves on any element in the SVG
    onPointerMove: React.PointerEventHandler<SVGSVGElement> = (event:React.PointerEvent<HTMLOrSVGElement>) =>
    {
        //event.stopPropagation();
        event.preventDefault();
        if (this.state.pointer_down_on_anchor_border)
        {
            const pointer_pos = this.getMousePosition_SVG_2(event)
            this.setState(prevState => ({
                ...prevState,
                ghost_line_pos_x: pointer_pos.x,
                ghost_line_pos_y: pointer_pos.y,
            }))
            return;
        }

        if(!this.state.pointer_down || this.state.pointer_down_on_mind_node || this.state.pointer_down_on_anchor)
            return;
        
        const pointer_pos = this.getMousePosition_SVG(event)
        this.setState(prevState => ({
            ...prevState,
            min_x: prevState.min_x - (pointer_pos.x - prevState.x_origin),
            min_y: prevState.min_y - (pointer_pos.y - prevState.y_origin)
        }))
    }
    //MouseUp event when mouse is over mind node...
    //Tag: MindNode, MouseUp, PointerDown Reset
    mouseUpMindNode:React.PointerEventHandler<HTMLDivElement> = () => {
        //console.log("MouseUpMindNode")
        if (!this.state.pointer_down_on_anchor_border)
        {
            this.setState(prevState=> ({...prevState, pointer_down_on_mind_node: false, pointer_down:false, pointer_down_on_anchor_border: false}));
        }
    }

    //Allows editing of mind node label
    //Tag: MindNode, TextEdit, OnInput
    mindeNodeTextEditOnInput:React.FormEventHandler<any> = (event:React.FormEvent<any>) => {
        //console.log("MindNodeTextEdit")

        const update_mind_nodes = this.state.mind_node_collection;
       update_mind_nodes.set(this.state.selected_mind_node_id, {
           ...update_mind_nodes.get(this.state.selected_mind_node_id)!,
           node_text: event.currentTarget.value
       })

        this.setState(prevState => ({...prevState, mind_node_collection: update_mind_nodes}));
    }

    //Allows editing of Markdown text - in MD editor window
    //Tag: MindNode, Markdown, OnInput
    mindNodeMarkdownOnInput:React.FormEventHandler<any> = (event:React.FormEvent<any>) => {
        //console.log("mindNodeMarkdownOnInput")

        if (!this.state.mind_node_collection.has(this.state.selected_mind_node_id))
        {
            return;
        }
        const update_mind_nodes = this.state.mind_node_collection;
        update_mind_nodes.set(this.state.selected_mind_node_id, {
            ...update_mind_nodes.get(this.state.selected_mind_node_id)!,
            markdown: event.currentTarget.value
        })

        this.setState(prevState => ({...prevState, mind_node_collection: update_mind_nodes}));
    }

    //A handler used for testing...
    //Tag: Test
    testHandler:React.PointerEventHandler<any> = () =>
    {
        //console.log("Clicked It Good Job");
    }

    //Clears the selected mind node
    deactivate_selection:React.PointerEventHandler<SVGSVGElement> = (event:React.PointerEvent<SVGSVGElement>) =>
    {
        //console.log("DeactivateMindNode");
        event.stopPropagation();
        event.preventDefault();
        this.setState(prevState=> ({...prevState, selected_mind_node_id: -1, selected_anchor_id: -1, selected_line_ao_id: -1, selected_line_ad_id: -1}))
    }

    //MouseDownEvent for the SVG
    mouseDown: React.PointerEventHandler<SVGSVGElement> = (event:React.PointerEvent<HTMLOrSVGElement>) =>
    {
            //console.log("MouseDown SVG")
            const pointer_pos = this.getMousePosition_SVG(event)
            this.setState(prevState => ({
                ...prevState,
                pointer_down: true,
                x_origin: pointer_pos.x,
                y_origin: pointer_pos.y
                }
            ));
    }

    //MouseUp Event for the SVG
    mouseUp: React.PointerEventHandler<SVGSVGElement> = () =>
    {
        //console.log("MouseUp SVG")

        this.setState(prevState => ({
            ...prevState,
            pointer_down: false,
            pointer_down_on_anchor: false,
            pointer_down_on_mind_node: false,
            pointer_down_on_anchor_border: false,
        }));
    }


    //Whenever the mouse leaves the SVG 
    onMouseOut: React.PointerEventHandler<SVGSVGElement> = () =>
    {
        //console.log("OnMouseOut")
        this.setState(prevState => ({
            ...prevState,
            pointerDown: false,
            pointer_down_on_anchor: false,
            pointer_down_on_mind_node: false,
        }));
    }

    //Adds a node to the SVG
    //Refactor: addMindNode
    addNode:React.PointerEventHandler<HTMLButtonElement> = () => {
        //console.log("addNode")
        const cur_mind_node_anchors:Map<number, MindNode_Anchor> = this.state.mind_node_anchor_collection;
        const cur_mind_nodes:Map<number, MindNode_Props>         = this.state.mind_node_collection;

        const SVG_Object_Props_Default:SVG_Object_Props = {
            color:                       "red",
            x:                           this.state.min_x+this.state.width/2,
            y:                           this.state.min_y+this.state.height/2,
            radius:                      75,
            stroke_color:                "black",
            stroke_width:                3,
        }

        const new_mindNode:MindNode_Props = {
            ...SVG_Object_Props_Default,
            id:                          this.state.mindNodeID_Counter,
            node_text:                   `Node: ${this.state.mindNodeID_Counter+1}`,
            anchor_octet:                add_MindNode_Anchor_Octet(SVG_Object_Props_Default, 
                                            this.state.anchorID_counter, 
                                            this.state.mindNodeID_Counter, 
                                            cur_mind_node_anchors,
                                            this.activateAnchor_Down,
                                            this.acceptingAnchor_Up
                                            ),
            activateMindNodeHandler:     this.activateMindNode,
            moveMindNodeHandler:         this.moveMindNode,
            triggerMouseUpHandler:       this.mouseUpMindNode,
            testHandler:                 this.testHandler,
            markdown:                    `# **New Document**`
        }

        cur_mind_nodes.set(this.state.mindNodeID_Counter, new_mindNode);

        this.setState( (prevState) => ({
            ...prevState, 
            anchorID_counter:            prevState.anchorID_counter + 8, 
            mindNodeID_Counter:          prevState.mindNodeID_Counter + 1,
            mind_node_collection:        cur_mind_nodes,
            mind_node_anchor_collection: cur_mind_node_anchors,
            selected_mind_node_id:       prevState.mindNodeID_Counter,
            selected_anchor_id:         -1,
            selected_line_ao_id:        -1,
            selected_line_ad_id:        -1,
        }));

    }

    //Adds an anchor to the SVG
    addAnchor:React.PointerEventHandler<HTMLButtonElement> = () => {
        //console.log("addAnchor")
        const cur_mind_node_anchors:Map<number, MindNode_Anchor> = this.state.mind_node_anchor_collection;
       
       cur_mind_node_anchors.set(this.state.anchorID_counter, {
           color:"green",
           id: this.state.anchorID_counter,
           inbound_anchor_Ids: new Set<number>(),
           outbound_anchor_Ids: new Set<number>(),
           acceptingAnchor_Up: this.acceptingAnchor_Up,
           activateAnchor_Down: this.activateAnchor_Down,
           parent_Id: -1,
           radius: 75/10,
           stroke_color: "black",
           stroke_width: 2,
           x: this.state.min_x+this.state.width/2,
           y: this.state.min_y+this.state.height/2,           
       })

       this.setState( (prevState) => ({
        anchorID_counter:            prevState.anchorID_counter + 1, 
        mind_node_anchor_collection: cur_mind_node_anchors,
        selected_mind_node_id:      -1,
        selected_anchor_id:         prevState.anchorID_counter,
        selected_line_ao_id:        -1,
        selected_line_ad_id:        -1,
    }));
    }
    
    //When triggered sets the state that allows an arrow to be drawn - potentially conecting to another anchor
    activateAnchor_Down:Function = (anchor_id:number, event:React.PointerEvent<HTMLDivElement>) => {
        //console.log("activateAnchor")
        event.stopPropagation();
        event.preventDefault();

        const referenceAnchor:MindNode_Anchor = this.state.mind_node_anchor_collection.get(anchor_id)!
        const pointer_pos:Point_Cordinates = this.getMousePosition_SVG_2(event)
        if (referenceAnchor.parent_Id > -1)
        {
            this.setState( (prevState) => ({
                selected_anchor_id: anchor_id,
                selected_mind_node_id: referenceAnchor.parent_Id,
                pointer_down: true,
                pointer_down_on_anchor: false,
                pointer_down_on_anchor_border: true,
                pointer_down_on_mind_node: false,
                selected_line_ad_id: -1,
                selected_line_ao_id: -1,
                ghost_line_pos_x: pointer_pos.x,
                ghost_line_pos_y: pointer_pos.y,
            }))    
        }
        else
        {
            this.setState( (prevState) => ({
                selected_anchor_id: anchor_id,
                selected_mind_node_id: -1,
                pointer_down: true,
                pointer_down_on_anchor: false,
                pointer_down_on_mind_node: false,
                pointer_down_on_anchor_border: true,
                selected_line_ad_id: -1,
                selected_line_ao_id: -1,
                ghost_line_pos_x: pointer_pos.x,
                ghost_line_pos_y: pointer_pos.y,
            }))    
        }
    }

    acceptAnchor(destination_anchor:MindNode_Anchor, origin_anchor:MindNode_Anchor):boolean {
        //Same Anchor
        if (destination_anchor.id === origin_anchor.id)
            return false;
        //Same MindNode Octet
        if (destination_anchor.parent_Id === origin_anchor.parent_Id)
        {
            if (destination_anchor.parent_Id !== -1)
                return false;
        }
        //Different Anchor in Anchor Octet already has destination anchor as an outbound anchor
        if (this.state.mind_node_collection.has(origin_anchor.parent_Id))
        {
            let result:boolean = true
            const mind_node = this.state.mind_node_collection.get(origin_anchor.parent_Id)!
            if (this.state.mind_node_anchor_collection.get(mind_node.anchor_octet.a1_id)?.outbound_anchor_Ids.has(destination_anchor.id))
                result = false;
            if (this.state.mind_node_anchor_collection.get(mind_node.anchor_octet.a2_id)?.outbound_anchor_Ids.has(destination_anchor.id))
                result = false;
            if (this.state.mind_node_anchor_collection.get(mind_node.anchor_octet.a3_id)?.outbound_anchor_Ids.has(destination_anchor.id))
                result = false;
            if (this.state.mind_node_anchor_collection.get(mind_node.anchor_octet.a4_id)?.outbound_anchor_Ids.has(destination_anchor.id))
                result = false;
            if (this.state.mind_node_anchor_collection.get(mind_node.anchor_octet.a5_id)?.outbound_anchor_Ids.has(destination_anchor.id))
                result = false;
            if (this.state.mind_node_anchor_collection.get(mind_node.anchor_octet.a6_id)?.outbound_anchor_Ids.has(destination_anchor.id))
                result = false;
            if (this.state.mind_node_anchor_collection.get(mind_node.anchor_octet.a7_id)?.outbound_anchor_Ids.has(destination_anchor.id))
                result = false;
            if (this.state.mind_node_anchor_collection.get(mind_node.anchor_octet.a8_id)?.outbound_anchor_Ids.has(destination_anchor.id))
                result = false;
            if (!result)
            {
                alert("Error - Redundant Link: The destination is already linked by another anchor belonging to the source node")
                return false;
            }
        }
        //Accepting Anchor in Anchor Octet already has the origin anchor in inbound Anchor
        if (this.state.mind_node_collection.has(destination_anchor.parent_Id))
        {
            let result:boolean = true
            const mind_node = this.state.mind_node_collection.get(destination_anchor.parent_Id)!
            if (this.state.mind_node_anchor_collection.get(mind_node.anchor_octet.a1_id)?.inbound_anchor_Ids.has(origin_anchor.id))
                result = false;
            if (this.state.mind_node_anchor_collection.get(mind_node.anchor_octet.a2_id)?.inbound_anchor_Ids.has(origin_anchor.id))
                result = false;
            if (this.state.mind_node_anchor_collection.get(mind_node.anchor_octet.a3_id)?.inbound_anchor_Ids.has(origin_anchor.id))
                result = false;
            if (this.state.mind_node_anchor_collection.get(mind_node.anchor_octet.a4_id)?.inbound_anchor_Ids.has(origin_anchor.id))
                result = false;
            if (this.state.mind_node_anchor_collection.get(mind_node.anchor_octet.a5_id)?.inbound_anchor_Ids.has(origin_anchor.id))
                result = false;
            if (this.state.mind_node_anchor_collection.get(mind_node.anchor_octet.a6_id)?.inbound_anchor_Ids.has(origin_anchor.id))
                result = false;
            if (this.state.mind_node_anchor_collection.get(mind_node.anchor_octet.a7_id)?.inbound_anchor_Ids.has(origin_anchor.id))
                result = false;
            if (this.state.mind_node_anchor_collection.get(mind_node.anchor_octet.a8_id)?.inbound_anchor_Ids.has(origin_anchor.id))
                result = false;
            if (!result)
            {
                alert("Error - Redundant Link: The destination node is already being linked to by the source anchor")
                return false;
            }
        }
        //Check if the destination node already is related to the parent node
        if (this.state.mind_node_collection.has(origin_anchor.parent_Id))
        {
            const mind_node = this.state.mind_node_collection.get(origin_anchor.parent_Id)!
            const node_anchors = this.getNode_anchor_IDs_From_Floating_Anchor(destination_anchor.id)
            let result:boolean = true;
            if (node_anchors.has(mind_node.anchor_octet.a1_id))
                result = false
            if (node_anchors.has(mind_node.anchor_octet.a2_id))
                result = false
            if (node_anchors.has(mind_node.anchor_octet.a3_id))
                result = false
            if (node_anchors.has(mind_node.anchor_octet.a4_id))
                result = false
            if (node_anchors.has(mind_node.anchor_octet.a5_id))
                result = false
            if (node_anchors.has(mind_node.anchor_octet.a6_id))
                result = false
            if (node_anchors.has(mind_node.anchor_octet.a7_id))
                result = false
            if (node_anchors.has(mind_node.anchor_octet.a8_id))
                result = false
            if (!result)
            {
                alert("Error - Redunant Link: The node is already linked to another related anchor")
                return false;
            }
        }

        if (origin_anchor.parent_Id === -1)
        {
            if (this.get_floating_anchor_IDS_from_Anchor(origin_anchor.id).has(destination_anchor.id))
            {
                alert("Error - Circular Reference: Anchors are not permitted to form circular reference chains.")
                return false;
            }
        }
        
        if (destination_anchor.parent_Id !== -1 && origin_anchor.parent_Id !== -1)
        {
            const mind_node_source_anchors = this.get_mind_node_anchors(destination_anchor.parent_Id)
            const mind_node_destination_anchors = this.get_mind_node_anchors(origin_anchor.parent_Id);
            for (const s_anchor_id of mind_node_source_anchors)
            {
                for (const d_anchor_id of mind_node_destination_anchors)
                {
                    if (this.state.mind_node_anchor_collection.get(s_anchor_id)!.inbound_anchor_Ids.has(d_anchor_id))
                    {
                        alert("Error - Redundant Link: The source node is already linked to the destination node.")
                        return false;
                    }
                }
            }
        }

        return true;
    }

    //When an arrow is being drawn
    acceptingAnchor_Up:Function = (anchor_ID:number, event:React.PointerEvent<HTMLDivElement>) => {
        //console.log("AcceptAnchor")
        event.stopPropagation();
        event.preventDefault();
        const referenceAnchor:Map<number, MindNode_Anchor> = this.state.mind_node_anchor_collection;

        if (referenceAnchor.has(anchor_ID) && referenceAnchor.has(this.state.selected_anchor_id))
        {
            const recievingAnchor:MindNode_Anchor = referenceAnchor.get(anchor_ID)!;
            const sendingAnchor: MindNode_Anchor = referenceAnchor.get(this.state.selected_anchor_id)!;
            if (this.acceptAnchor(recievingAnchor, sendingAnchor))
            {
                recievingAnchor.inbound_anchor_Ids.add(sendingAnchor.id);
                sendingAnchor.outbound_anchor_Ids.add(recievingAnchor.id);
                this.setState( () => ({
                    mind_node_anchor_collection:referenceAnchor,
                    pointer_down_on_anchor: false
                }))
            }
            else{
                this.resetMouseDown(event);
            }
        }
        else{
            this.resetMouseDown(event);
        }
    }

    //Activates when the mouse is clicked on the border of an achor.
    activateAnchor_BorderSelect:Function = (anchor_id:number, event:React.PointerEvent<HTMLDivElement>) => {
        //console.log("AnchorBorder")

        event.stopPropagation();
        event.preventDefault();
        if (this.state.mind_node_anchor_collection.get(anchor_id)!.parent_Id === -1)
        {
            let collection:Array<number> = []
            this.getNode_anchor_IDs_From_Floating_Anchor(anchor_id).forEach((a) => {
                collection.push(this.state.mind_node_anchor_collection.get(a)!.parent_Id);
            })
            console.log(collection);
        }
        
        this.setState( () => ({
            selected_anchor_id: anchor_id,
            selected_mind_node_id: -1,
            pointer_down: true,
            pointer_down_on_anchor: true,
            pointer_down_on_anchor_border: false,
            pointer_down_on_mind_node: false,
            selected_line_ad_id: -1,
            selected_line_ao_id: -1,
        }))    
    }

    //Brings up the markdown panel
    toggle_md_panels:React.PointerEventHandler<HTMLButtonElement> = () => {
        //console.log("Toggle_md_panels")
        if (this.state.show_md_panel)
        {
            document.addEventListener('wheel', disable_mouse, {passive: false})
        }
        else
        {
            document.removeEventListener('wheel', disable_mouse)
        }
        this.setState(prevState => ({
            ...prevState,
            show_md_panel: !prevState.show_md_panel,

        }));
    }

    //toggles the the markdown editor panel overlay
    enable_markdown_editor:React.PointerEventHandler<HTMLButtonElement> = () => {
        this.setState(prevState => ({
            ...prevState,
            md_panel_edit_enabled: true,
            md_panel_rendered: false
        }));
    }

    get_file_name = (event:any) => {
        if (event.target.files.length > 0)
        {
            //console.log(event.target.files[0]);
        }
    }

    //toggles the markdown editor preview state
    enable_markdown_editor_preview:React.PointerEventHandler<HTMLButtonElement> = () => {
        this.setState(prevState => ({
            ...prevState,
            md_panel_edit_enabled: true,
            md_panel_rendered: true
        }));
    }

    //toggles the markdown editor preview state
    enable_markdown_preview:React.PointerEventHandler<HTMLButtonElement> = () => {
        this.setState(prevState => ({
            ...prevState,
            md_panel_edit_enabled: false,
            md_panel_rendered: true
        }));
    }

    resetMouseDown:React.PointerEventHandler<HTMLDivElement> = (event:React.PointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        this.setState(prevState => ({...prevState, pointerDown: false, pointer_down_on_anchor: false, pointer_down_on_mind_node: false}));
        return;
    }

    download(){
        var element = document.createElement('a');
        element.setAttribute('href', 'data:json;charset=utf-8,' + encodeURIComponent(this.toJSON()));
        element.setAttribute('download', "map.json");

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    load_from_editor_JSON(editor_JSON: Editor_JSON_Props)
    {
        const imported_MNC:Map<number, MindNode_Props> = new Map<number, MindNode_Props>();
        const imported_MNAC:Map<number, MindNode_Anchor> = new Map<number, MindNode_Anchor>();
        editor_JSON.mind_node_collection.forEach( (value) => {
            imported_MNC.set(value.id, {
                id:                          value.id,
                color:                       "red",
                x:                           value.x,
                y:                           value.y,
                anchor_octet:                value.anchor_octet,
                activateMindNodeHandler:     this.activateMindNode,
                moveMindNodeHandler:         this.moveMindNode,
                triggerMouseUpHandler:       this.mouseUpMindNode,
                testHandler:                 this.testHandler,
                radius:                      75,
                stroke_color:                "black",
                stroke_width:                3,
                markdown:                    value.markdown,
                node_text:                   value.node_text,
            })
        })
        editor_JSON.mind_node_anchor_collection.forEach( (value) => {
            imported_MNAC.set(value.id, {
                color:"green",
                id: value.id,
                inbound_anchor_Ids: new Set<number>(value.inbound_anchor_Ids),
                outbound_anchor_Ids: new Set<number>(value.outbound_anchor_Ids),
                acceptingAnchor_Up: this.acceptingAnchor_Up,
                activateAnchor_Down: this.activateAnchor_Down,
                parent_Id: value.parent_id,
                radius: 75/10,
                stroke_color: "black",
                stroke_width: 2,
                x: value.x,
                y: value.y
            })
        })
        this.setState(() => ({
            mind_node_collection: imported_MNC,
            mind_node_anchor_collection: imported_MNAC,
            anchorID_counter: editor_JSON.anchorID_Counter,
            mindNodeID_Counter: editor_JSON.mindNodeID_Counter
        }));
    }

    import(){  
       if (this.state.file_input_reference.current)
       {
           if (this.state.file_input_reference.current.files! && this.state.file_input_reference.current.files.length > 0)
           {
                const file_name = this.state.file_input_reference.current.files[0].name;
                const reference_obj:React.RefObject<HTMLInputElement> = this.state.file_input_reference;
                this.state.file_input_reference.current.files[0].text().then((json_data) => {
                    try{
                        this.load_from_editor_JSON(JSON.parse(json_data).Editor_Json);
                    }
                    catch{
                        alert(`ERROR: File ${file_name} could not be imported`)
                    }
                });

                reference_obj.current!.value = ""
                this.setState( () => ({
                    file_input_reference: reference_obj
                }));
           }
       }
    }
    
    zoom:React.WheelEventHandler<SVGSVGElement> = (event:React.WheelEvent<SVGSVGElement>) => {
        if ( (this.state.width + event.deltaY) < 1 || (this.state.height + event.deltaY) < 1)
        {
            return;
        }
        this.setState((prevState) => ({
            width: prevState.width   + event.deltaY,
            height: prevState.height + event.deltaY,
        }))
    }

    render(){
        let mindNode_List:    Array<MindNode_Props>     = [];
        let free_Anchor_List: Array<MindNode_Anchor>    = [];              
        let all_Anchor_List:  Array<MindNode_Anchor>    = [];
        let connected_from_selected: Set<number> = new Set<number>();
        let connected_to_selected: Set<number> = new Set<number>();
        let selectedAnchor: MindNode_Anchor|undefined = this.state.mind_node_anchor_collection.get(this.state.selected_anchor_id)
        //const file_data = this.toJSON();
        this.state.mind_node_collection.forEach( (value) => {if (value.id !== this.state.selected_mind_node_id) mindNode_List.push(value)})
        this.state.mind_node_anchor_collection.forEach( (value) => {
                if(value.parent_Id < 0) 
                    free_Anchor_List.push(value); 
                all_Anchor_List.push(value);
            } 
        )
        if (this.state.selected_mind_node_id > -1)
        {
            mindNode_List.push(this.state.mind_node_collection.get(this.state.selected_mind_node_id)!)
            //inbound
            connected_from_selected = this.get_related_mind_node_Ids_from_mind_node(this.state.selected_mind_node_id)
            
            //outbound
            connected_to_selected = this.get_related_mind_node_Ids_from_mind_node(this.state.selected_mind_node_id, false)
        }
        
        const temp_arrow:JSX.Element|null = selectedAnchor?TempArrow(selectedAnchor.x , selectedAnchor.y, this.state.ghost_line_pos_x, this.state.ghost_line_pos_y):null;
        //console.log(mindNode_List.length);
        return(
            <>
            <input ref={this.state.file_input_reference} accept="*.json" type="file" style={{display:"none"}} onChange={ () => {this.import();}}></input>
            <Card onMouseLeave={this.state.resetMouseDown} border="primary" text="light" className="left_menu bg-dark text-center" style={{zIndex:2}}>
                <Card.Header><strong>Node Placer</strong></Card.Header>
                <Card.Body>
                    <div className="d-grid gap-2">
                        <Button variant="primary" size="sm" onClick = {this.addNode}>
                            Add a Node
                        </Button>
                        <Button variant="success" size="sm" onClick = {this.addAnchor}>
                            Add an Anchor
                        </Button>
                    </div>
                </Card.Body>
                <Card.Footer>
                    <div className="d-grid gap-2">
                        <Button variant="success" size="sm" onClick = {() => {this.download()}}>
                            Download Map
                        </Button>
                        <Button variant="warning" size="sm" onClick = {() => {this.state.file_input_reference.current?.click()}}>
                            Import Map
                        </Button>
                    </div>
                </Card.Footer>
            </Card>

            <Card onMouseLeave={this.state.resetMouseDown} border="primary" text="light" className="right_menu bg-dark" style={{zIndex:2}}>
                <Card.Header className="text-center"><strong>Node Editor</strong></Card.Header>
                <Card.Body className="text-center">
                    <Form>
                        <Form.Label>Node Label</Form.Label>
                        {
                            this.state.selected_mind_node_id > -1 ?
                            <> 
                            <Form.Control as="textarea" rows={3} cols={30} className="non_resizable" maxLength={90} 
                                value={this.state.mind_node_collection.get(this.state.selected_mind_node_id)?.node_text} 
                                onInput={(e) => {this.mindeNodeTextEditOnInput(e)}}/>
                            <br/>                            
                            <div className="d-grid gap-2">
                                <Button variant="primary" size="sm" onClick = {this.toggle_md_panels}>
                                    Show Markdown Editor
                                </Button>
                            </div>
                            </>
                            : 
                            <Form.Control disabled={true} as="textarea" rows={3} cols={30} className="non_resizable" maxLength={90} value="" placeholder="Select a node to edit its label"/>
                        }
                    </Form>
                </Card.Body>
                <Card.Footer>
                <div className="d-grid gap-2">
                    {
                    (this.state.selected_anchor_id > -1 || (this.state.selected_line_ao_id > -1 && this.state.selected_line_ad_id > -1) || this.state.selected_mind_node_id > -1)?
                    <Button variant="danger" size="sm" onClick = {() => {this.deleteSelection()}}>
                        Delete Selection
                    </Button>:
                    <></>
                    }
                </div>
                </Card.Footer>
            </Card>

            <svg ref={this.state.svg_reference} style={{zIndex:1, cursor:this.state.pointer_down_on_anchor_border?"crosshair":"auto"}}
                height="100%"
                width="100%"
                onPointerDown={this.state.mouseDown} 
                onPointerUp={this.state.mouseUp} onPointerMove={this.state.onPointerMove} 
                onDoubleClick={this.state.onDoubleClick}
                onWheel={this.zoom}
                viewBox={`${this.state.min_x} ${this.state.min_y} ${this.state.width} ${this.state.height}`} className="bg-dark"
                >
                <g key={"mindnodes"}>
                {
                    mindNode_List.map( (eachMindNode) => { return MindNode(eachMindNode, 
                        this.state.selected_mind_node_id, 
                        this.state.mind_node_anchor_collection) 
                    })
                }
                </g>
                <g key={"anchors"}>
                {
                    (this.state.show_ghost_anchor)?
                    Ghost_Floating_Anchor(this.state.ghost_anchor_pos_x, this.state.ghost_anchor_pos_y):
                    <></>
                }
                {
                    free_Anchor_List.map((eachAnchor) => {return Floating_Anchor(eachAnchor, 
                        this.state.selected_anchor_id, 
                        this.activateAnchor_BorderSelect, 
                        this.moveAnchorNode)
                    })
                }
                </g>
                <g key={"arrows"}>
                {
                    all_Anchor_List.map((eachAnchor) => {return ArrowBundle(eachAnchor, 
                        this.state.mind_node_anchor_collection, 
                        this.state.selected_line_ao_id,
                        this.state.selected_line_ad_id, 
                        this.selectLine,
                        this.mouseOverLine,
                        this.mouseOutLine
                        )
                    })
                }
                </g>
                <g key={"Selected Component"}>
                    {
                        this.state.selected_mind_node_id>-1?
                        MindNode(this.state.mind_node_collection.get(this.state.selected_mind_node_id)!,
                        this.state.selected_mind_node_id, this.state.mind_node_anchor_collection):
                        this.state.selected_anchor_id>-1?
                        Floating_Anchor(this.state.mind_node_anchor_collection.get(this.state.selected_anchor_id)!,
                            this.state.selected_anchor_id,
                            this.activateAnchor_BorderSelect,
                            this.moveAnchorNode
                        ):<></>
                    }
                </g>
                {
                    (temp_arrow && this.state.pointer_down_on_anchor_border && !this.state.pointer_down_on_anchor)?temp_arrow:<div></div>
                }
            </svg>

            <div className={this.state.show_md_panel?"in_frame":"out_frame"}>
                <Card border="primary" text="light" className="right_menu_md bg-dark">
                    <Card.Header className="text-center"><strong>Connected To</strong></Card.Header>
                    <Card.Body className="text-center">
                        <div className="d-grid gap-2">
                            {Create_Transition_Menu_Md(this.state.mind_node_collection, connected_to_selected, this.activateMindNodeMD)}
                        </div>
                    </Card.Body>
                </Card>
                <Card border="primary" text="light" className="left_menu_md bg-dark">
                    <Card.Header className="text-center"><strong>Connected From</strong></Card.Header>
                    <Card.Body className="text-center">
                        <div className="d-grid gap-2">
                            {Create_Transition_Menu_Md(this.state.mind_node_collection, connected_from_selected, this.activateMindNodeMD)}
                        </div>
                    </Card.Body>
                </Card>
                <div>
                <Card border="primary" text="light" className="center_menu">
                    <Card.Header><CloseButton onClick={this.toggle_md_panels}/>
                    {
                        this.state.mind_node_collection.has(this.state.selected_mind_node_id)?
                        <strong className="text-dark">{this.state.mind_node_collection.get(this.state.selected_mind_node_id)!.node_text}</strong>:<></>
                    }
                    </Card.Header>
                    <Card.Body className="overflow-auto">
                        <Form className="markdown_text_area">
                            {
                                this.state.md_panel_edit_enabled && !this.state.md_panel_rendered?
                                <Form.Control className="non_resizable" as="textarea" rows={25} cols={30} onInput={(e)=> {this.mindNodeMarkdownOnInput(e)}} 
                                    value={this.state.mind_node_collection.has(this.state.selected_mind_node_id)?
                                    this.state.mind_node_collection.get(this.state.selected_mind_node_id)!.markdown:""}>
                                </Form.Control>
                                :!this.state.md_panel_edit_enabled && this.state.md_panel_rendered?
                                <ReactMarkdown className="text-dark markdown_render_preview">
                                    {
                                        this.state.mind_node_collection.has(this.state.selected_mind_node_id)?
                                        this.state.mind_node_collection.get(this.state.selected_mind_node_id)!.markdown:""
                                    }
                                </ReactMarkdown>
                                :
                                <>
                                    <Row>
                                        <Col>
                                            <Form.Control className="non_resizable" as="textarea" rows={25} cols={30} onInput={(e)=> {this.mindNodeMarkdownOnInput(e)}} 
                                            value={this.state.mind_node_collection.has(this.state.selected_mind_node_id)?
                                            this.state.mind_node_collection.get(this.state.selected_mind_node_id)!.markdown:""}>
                                            </Form.Control>
                                        </Col>
                                        <Col>
                                            <ReactMarkdown className="text-dark markdown_render_preview ">
                                            {
                                                this.state.mind_node_collection.has(this.state.selected_mind_node_id)?
                                                this.state.mind_node_collection.get(this.state.selected_mind_node_id)!.markdown:""
                                            }
                                            </ReactMarkdown>
                                        </Col>
                                    </Row>
                                </>
                            }
                        </Form>
                    </Card.Body>
                    <Card.Footer className="text-center">
                        <ButtonGroup>
                            <ToggleButton 
                                value="" 
                                onClick={this.enable_markdown_editor}
                                variant='outline-success'
                                active={this.state.md_panel_edit_enabled && !this.state.md_panel_rendered}
                            >
                                Markdown Editor
                            </ToggleButton>
                            <ToggleButton 
                                value="" 
                                onClick={this.enable_markdown_editor_preview}
                                variant='outline-warning'
                                active={this.state.md_panel_edit_enabled && this.state.md_panel_rendered}
                                >
                                Markdown Preview Editor
                            </ToggleButton>
                            <ToggleButton 
                                value="" 
                                onClick={this.enable_markdown_preview}
                                variant='outline-primary'
                                active={!this.state.md_panel_edit_enabled && this.state.md_panel_rendered}
                                >
                                Markdown Preview
                            </ToggleButton>
                        </ButtonGroup>
                    </Card.Footer>
                </Card>
                </div>
            </div>
            </>
        )
    }
}

const Create_Transition_Menu_Md = (mind_node_collection:Map<number, MindNode_Props>, choice_nodes:Set<number>, activate_mind_node:Function) => {
    const mind_node_list:Array<number> = []
    choice_nodes.forEach((node) => {mind_node_list.push(node)})
    return (
        <>
            {
                mind_node_list.map((value) => {
                    const mind_node = mind_node_collection.get(value)!
                    return(
                        <Button key={mind_node.id} variant="primary" size="sm" onClick={(e) => {activate_mind_node(mind_node.id)}}>
                            {mind_node.node_text}
                        </Button>
                    )
                })
            }
        </>
    )
}

export {Editor}