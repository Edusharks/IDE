/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview A positionable version of the minimap.
 * @author cesarades@google.com (Cesar Ades)
 */
import * as Blockly from 'blockly/core';
import { Minimap } from './minimap';
/**
 * A positionable version of minimap that implements IPositionable.
 */
export declare class PositionedMinimap extends Minimap implements Blockly.IPositionable {
    protected margin: number;
    protected top: number;
    protected left: number;
    protected width: number;
    protected height: number;
    id: string;
    /**
     * Constructor for a positionable minimap.
     *
     * @param workspace The workspace to mirror.
     */
    constructor(workspace: Blockly.WorkspaceSvg);
    /**
     * Initialize.
     */
    init(): void;
    /**
     * Returns the bounding rectangle of the UI element in pixel units
     * relative to the Blockly injection div.
     *
     * @returns The component’s bounding box.
     */
    getBoundingRectangle(): Blockly.utils.Rect;
    /**
     * Positions the minimap.
     *
     * @param metrics The workspace metrics.
     * @param savedPositions List of rectangles already on the workspace.
     */
    position(metrics: Blockly.MetricsManager.UiMetrics, savedPositions: Blockly.utils.Rect[]): void;
    /**
     * Sizes the minimap.
     *
     * @internal
     */
    setSize(): void;
    /**
     * Calculates the position of the minimap over the primary workspace.
     *
     * @param metrics The workspace metrics.
     * @param savedPositions List of rectangles already on the workspace.
     * @internal
     */
    setPosition(metrics: Blockly.MetricsManager.UiMetrics, savedPositions: Blockly.utils.Rect[]): void;
    /**
     * Sets the CSS attribute for the minimap.
     */
    private setAttributes;
}
//# sourceMappingURL=positioned_minimap.d.ts.map