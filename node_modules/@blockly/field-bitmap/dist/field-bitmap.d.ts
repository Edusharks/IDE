/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly/core';
export declare const DEFAULT_HEIGHT = 5;
export declare const DEFAULT_WIDTH = 5;
/**
 * Field for inputting a small bitmap image.
 * Includes a grid of clickable pixels that's exported as a bitmap.
 */
export declare class FieldBitmap extends Blockly.Field<number[][]> {
    private initialValue;
    private imgHeight;
    private imgWidth;
    /**
     * Array holding info needed to unbind events.
     * Used for disposing.
     */
    private boundEvents;
    /** References to UI elements */
    private editorPixels;
    private blockDisplayPixels;
    /** Stateful variables */
    private pointerIsDown;
    private valToPaintWith?;
    buttonOptions: Buttons;
    pixelSize: number;
    pixelColours: {
        empty: string;
        filled: string;
    };
    fieldHeight?: number;
    /**
     * Constructor for the bitmap field.
     *
     * @param value 2D rectangular array of 1s and 0s.
     * @param validator A function that is called to validate.
     * @param config Config A map of options used to configure the field.
     */
    constructor(value: number[][] | typeof Blockly.Field.SKIP_SETUP, validator?: Blockly.FieldValidator<number[][]>, config?: FieldBitmapFromJsonConfig);
    /**
     * Constructs a FieldBitmap from a JSON arg object.
     *
     * @param options A JSON object with options.
     * @returns The new field instance.
     */
    static fromJson(options: FieldBitmapFromJsonConfig): FieldBitmap;
    /**
     * Returns the width of the image in pixels.
     *
     * @returns The width in pixels.
     */
    getImageWidth(): number;
    /**
     * Returns the height of the image in pixels.
     *
     * @returns The height in pixels.
     */
    getImageHeight(): number;
    /**
     * Validates that a new value meets the requirements for a valid bitmap array.
     *
     * @param newValue The new value to be tested.
     * @returns The new value if it's valid, or null.
     */
    protected doClassValidation_(newValue: number[][]): number[][] | null | undefined;
    protected doClassValidation_(newValue?: number[][]): number[][] | null;
    /**
     * Called when a new value has been validated and is about to be set.
     *
     * @param newValue The value that's about to be set.
     */
    protected doValueUpdate_(newValue: number[][]): void;
    /**
     * Show the bitmap editor dialog.
     *
     * @param e Optional mouse event that triggered the field to open, or
     *    undefined if triggered programmatically.
     */
    protected showEditor_(e?: Event): void;
    /**
     * Updates the block display and editor dropdown when the field re-renders.
     */
    protected render_(): void;
    /**
     * Determines whether the field is editable.
     *
     * @returns True since it is always editable.
     */
    updateEditable(): void;
    /**
     * Gets the rectangle built out of dimensions matching SVG's <g> element.
     *
     * @returns The newly created rectangle of same size as the SVG element.
     */
    getScaledBBox(): Blockly.utils.Rect;
    /**
     * Creates the bitmap editor and add event listeners.
     *
     * @returns The newly created dropdown menu.
     */
    private dropdownCreate;
    /**
     * Initializes the on-block display.
     */
    initView(): void;
    /**
     * Updates the size of the block based on the size of the underlying image.
     */
    protected updateSize_(): void;
    /**
     * Create control button.
     *
     * @param parent Parent HTML element to which control button will be added.
     * @param buttonText Text of the control button.
     * @param onClick Callback that will be attached to the control button.
     */
    private addControlButton;
    /**
     * Disposes of events belonging to the bitmap editor.
     */
    private dropdownDispose;
    /**
     * Constructs an array of zeros with the specified width and height.
     *
     * @returns The new value.
     */
    private getEmptyArray;
    /**
     * Checks if a down event is on a pixel in this editor and if it is starts an
     * edit gesture.
     *
     * @param e The down event.
     */
    private onPointerStart;
    /**
     * Updates the editor if we're in an edit gesture and the pointer is over a
     * pixel.
     *
     * @param e The move event.
     */
    private onPointerMove;
    /**
     * Starts an interaction with the bitmap dropdown when there's a pointerdown
     * within one of the pixels in the editor.
     *
     * @param r Row number of grid.
     * @param c Column number of grid.
     */
    private onPointerDownInPixel;
    /**
     * Sets the specified pixel in the editor to the current value being painted.
     *
     * @param r Row number of grid.
     * @param c Column number of grid.
     */
    private updatePixelValue;
    /**
     * Resets pointer state (e.g. After either a pointerup event or if the
     * gesture is canceled).
     */
    private onPointerEnd;
    /**
     * Sets all the pixels in the image to a random value.
     */
    private randomizePixels;
    /**
     * Sets all the pixels to 0.
     */
    private clearPixels;
    /**
     * Sets the value of a particular pixel.
     *
     * @param r Row number of grid.
     * @param c Column number of grid.
     * @param newValue Value of the pixel.
     */
    private setPixel;
    private getPixel;
    /**
     * Calls a given function for all cells in the image, with the cell
     * coordinates as the arguments.
     *
     * @param func A function to be applied.
     */
    private forAllCells;
    /**
     * Creates a new element with the specified type and class.
     *
     * @param elementType Type of html element.
     * @param className ClassName of html element.
     * @returns The created element.
     */
    private createElementWithClassname;
    /**
     * Binds an event listener to the specified element.
     *
     * @param element Specified element.
     * @param eventName Name of the event to bind.
     * @param callback Function to be called on specified event.
     */
    private bindEvent;
    private fireIntermediateChangeEvent;
}
interface Buttons {
    readonly randomize: boolean;
    readonly clear: boolean;
}
interface PixelColours {
    readonly empty: string;
    readonly filled: string;
}
export interface FieldBitmapFromJsonConfig extends Blockly.FieldConfig {
    value?: number[][];
    width?: number;
    height?: number;
    buttons?: Buttons;
    fieldHeight?: number;
    colours?: PixelColours;
}
export {};
//# sourceMappingURL=field-bitmap.d.ts.map