/* eslint-disable @typescript-eslint/interface-name-prefix,no-param-reassign,operator-assignment */
/**
 * Plugin which enables automatically exploding overlapping elements.
 * Make sure to assign unique ID for each of the labels.  bulletLabel.propertyFields.id = 'id';
 */

import { Plugin } from '@amcharts/amcharts4/core';
import { LabelBullet, XYChart } from '@amcharts/amcharts4/charts';

export enum LabelBulletOverlapBusterDirection {
  Up = 'Up',
  Down = 'Down',
  Left = 'Left',
  Right = 'Right'
}

export class LabelBulletOverlapBuster extends Plugin {
  /**
   * A list of objects to check for overlapping.
   */
  private _targets: LabelBullet[] = [];

  private _hasOverlaps: boolean = true;

  private _direction: LabelBulletOverlapBusterDirection;

  /**
   * How big an area to check for overlapping elements should be checked in
   * relation to hovered items size.
   *
   * `1` (one) means it will affect only elements that are at least partially
   * overlapping with the target element.
   *
   * `2` (two) will check area twice as big.
   *
   * Etc.
   *
   * @default 1.5
   */
  public tolerance: number = 1.5;

  /**
   * Since we solve once overlap per iterations, its good to assign max number of iterations to prevent infinite loop
   *
   * @default 70
   */
  public maxIterations = 70;

  /**
   * The amount of pixel we move the overlapped label each iteration.
   *
   * @default 5
   */
  public stepSize = 5;

  /**
   * Constructor
   */
  constructor(chart: XYChart, labelBullets: LabelBullet[], direction: LabelBulletOverlapBusterDirection) {
    // Nothing to do here
    super();

    this._direction = direction;

    labelBullets.forEach(labelBullet => {
      labelBullet.events.on('ready', event => {
        /**
         * Collect all the labels
         */
        this._targets.push(event.target);
      });
    });

    chart.events.on('ready', () => {
      /**
       * In order to prevent infinite loops
       */
      let iterations = 0;
      while (this._hasOverlaps && iterations < this.maxIterations) {
        this.resolveOverlapping();
        iterations += 1;
      }
    });
  }

  /**
   * Initializes plugin.
   */
  public init() {
    super.init();
  }

  private resolveOverlapping() {
    /**
     * Break both loops, We resolve one overlap per iteration
     */
    let shouldBreak = false;
    this._hasOverlaps = false;
    this._targets.forEach(mainTarget => {
      this._targets.forEach(target => {
        if (!shouldBreak && target !== mainTarget && this.hitTest(target, mainTarget)) {
          switch (this._direction) {
            case LabelBulletOverlapBusterDirection.Down: {
              target.dy = target.dy + this.stepSize;
              break;
            }
            case LabelBulletOverlapBusterDirection.Up: {
              target.dy = target.dy - this.stepSize;
              break;
            }
            case LabelBulletOverlapBusterDirection.Left: {
              target.dx = target.dx - this.stepSize;
              break;
            }
            case LabelBulletOverlapBusterDirection.Right: {
              target.dx = target.dx + this.stepSize;
              break;
            }
            default: {
              break;
            }
          }
          this._hasOverlaps = true;
          shouldBreak = true;
        }
      });
    });
  }

  /**
   * Test for collision between two bullets
   * @param targetA
   * @param targetB
   */
  public hitTest(targetA: LabelBullet, targetB: LabelBullet): boolean {
    const axStart = targetA.pixelX + targetA.dx + targetA.label.ex; // the EX is an alignment value for the label.
    const ayStart = targetA.pixelY + targetA.dy + targetA.label.ey;
    const axEnd = axStart + targetA.label.measuredWidth * this.tolerance;
    const ayEnd = ayStart + targetA.label.measuredHeight * this.tolerance;

    const bxStart = targetB.pixelX + targetB.dx + targetB.label.ex;
    const byStart = targetB.pixelY + targetB.dy + targetB.label.ey;
    const bxEnd = bxStart + targetB.label.measuredWidth * this.tolerance;
    const byEnd = byStart + targetB.label.measuredHeight * this.tolerance;

    return !(bxStart > axEnd || bxEnd < axStart || byStart > ayEnd || byEnd < ayStart);
  }
}
