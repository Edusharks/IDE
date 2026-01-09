/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview A minimap is a miniature version of your blocks that
 * appears on top of your main workspace. This gives you an overview
 * of what your code looks like, and how it is organized.
 * @author cesarades@google.com (Cesar Ades)
 */
import * as Blockly from 'blockly/core';
import { FocusRegion } from './focus_region';
/**
 * A minimap is a miniature version of your blocks that appears on
 * top of your main workspace. This gives you an overview of what
 * your code looks like, and how it is organized.
 */
export declare class Minimap {
    protected primaryWorkspace: Blockly.WorkspaceSvg;
    protected minimapWorkspace: Blockly.WorkspaceSvg | null;
    protected focusRegion: FocusRegion | null;
    protected onMouseMoveWrapper: Blockly.browserEvents.Data | null;
    protected onMouseDownWrapper: Blockly.browserEvents.Data | null;
    protected onMouseUpWrapper: Blockly.browserEvents.Data | null;
    protected minimapWrapper: HTMLDivElement | null;
    /**
     * Constructor for a minimap.
     *
     * @param workspace The workspace to mirror.
     */
    constructor(workspace: Blockly.WorkspaceSvg);
    /**
     * Initialize.
     */
    init(): void;
    /**
     * Disposes the minimap.
     * Unlinks from all DOM elements and remove all event listeners
     * to prevent memory leaks.
     */
    dispose(): void;
    /**
     * Creates the mirroring between workspaces. Passes on all desired events
     * to the minimap from the primary workspace.
     *
     * @param event The primary workspace event.
     */
    private mirror;
    /**
     * Converts the coorindates from a mouse event on the minimap
     * into scroll coordinates for the primary viewport.
     *
     * @param primaryMetrics The metrics from the primary workspace.
     * @param minimapMetrics The metrics from the minimap workspace.
     * @param offsetX The x offset of the mouse event.
     * @param offsetY The y offset of the mouse event.
     * @returns (x, y) primary workspace scroll coordinates.
     */
    static minimapToPrimaryCoords(primaryMetrics: Blockly.utils.Metrics, minimapMetrics: Blockly.utils.Metrics, offsetX: number, offsetY: number): [number, number];
    /**
     * Scrolls the primary workspace viewport based on a minimap event.
     *
     * @param event The minimap browser event.
     */
    private primaryScroll;
    /**
     * Updates the primary workspace viewport based on a click in the minimap.
     *
     * @param event The minimap browser event.
     */
    private onClickDown;
    /**
     * Unbinds the minimap mousemove when the mouse is not clicked.
     */
    private onClickUp;
    /**
     * Updates the primary workspace viewport based on a drag in the minimap.
     *
     * @param event The minimap browser event.
     */
    private onMouseMove;
    /**
     * Enables the focus region; A highlight of the viewport in the minimap.
     */
    enableFocusRegion(): void;
    /**
     * Disables the focus region.
     */
    disableFocusRegion(): void;
    /**
     * Returns whether the focus region is enabled.
     *
     * @returns True if the focus region is enabled.
     */
    isFocusEnabled(): boolean;
}
//# sourceMappingURL=minimap.d.ts.map