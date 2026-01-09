/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview A class that highlights the user's
 * viewport on the minimap.
 * @author cesarades@google.com (Cesar Ades)
 */
import * as Blockly from 'blockly/core';
/**
 * A class that highlights the user's viewport on the minimap.
 */
export declare class FocusRegion {
    private primaryWorkspace;
    private minimapWorkspace;
    private onChangeWrapper;
    private svgGroup;
    private rect;
    private background;
    private id;
    private initialized;
    /**
     * Constructor for the focus region.
     *
     * @param primaryWorkspace The primary workspaceSvg.
     * @param minimapWorkspace The minimap workspaceSvg.
     */
    constructor(primaryWorkspace: Blockly.WorkspaceSvg, minimapWorkspace: Blockly.WorkspaceSvg);
    /**
     * Initializes focus region.
     */
    init(): void;
    /**
     * Disposes of the focus region.
     * Unlinks from all DOM elements and remove all event listeners
     * to prevent memory leaks.
     */
    dispose(): void;
    /**
     * Handles events triggered on the primary workspace.
     *
     * @param event The event.
     */
    private onChange;
    /**
     * Positions and sizes the highlight on the minimap
     * based on the primary workspace.
     */
    private update;
    /**
     * Returns whether focus region is initialized or not.
     *
     * @returns True if focus region is initialized else false.
     */
    isEnabled(): boolean;
}
//# sourceMappingURL=focus_region.d.ts.map