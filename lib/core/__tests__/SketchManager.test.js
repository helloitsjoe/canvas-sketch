import SketchManager from '../SketchManager';
import * as utils from '../../util';

utils.isWebGLContext = jest.fn();

let manager;

beforeEach(() => {
  utils.isWebGLContext.mockReturnValue(false);
  manager = new SketchManager();
});

afterEach(() => {
  jest.clearAllMocks();
  // manager.destroy();
});

describe('SketchManager', () => {
  it('basic API', () => {
    expect(manager.props).toEqual({});
    expect(manager.settings).toEqual({});
    expect(manager.sketch).toBeUndefined();
    // TODO: methods
  });

  describe('setup', () => {
    it('merges settings with existing settings', () => {
      expect(manager.settings).toEqual({});
      manager.setup({ name: 'some-name' });
      expect(manager.settings).toEqual({ name: 'some-name' });
      manager.setup({ loop: true });
      expect(manager.settings).toEqual({ name: 'some-name', loop: true });
    });

    it('checks settings', () => {
      const originalWarn = console.warn;
      console.warn = jest.fn();
      manager.setup({ invalidSetting: 'invalid' });
      expect(console.warn).toBeCalledWith(
        '[canvas-sketch] Could not recognize the setting "invalidSetting"'
      );
      console.warn = originalWarn;
    });

    it('sets up props', () => {
      const WIDTH = 1024;
      const HEIGHT = 768;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      const initialSettings = { loop: true, data: {}, canvas, context };
      manager.setup(initialSettings);

      expect(manager.props).toMatchObject({
        canvas,
        context,

        // time props
        playhead: 0,
        time: 0,
        frame: 0,
        duration: Infinity,
        totalFrames: Infinity,
        fps: 24,
        timeScale: 1,

        deltaTime: 0,
        started: false,
        exporting: false,
        playing: false,
        recording: false,
        settings: initialSettings,
        data: initialSettings.data,

        // resizeCanvas props
        bleed: 0,
        pixelRatio: 1,
        width: WIDTH,
        height: HEIGHT,
        dimensions: [WIDTH, HEIGHT],
        units: 'px',
        scaleX: 1,
        scaleY: 1,
        pixelsPerInch: 72,
        viewportWidth: WIDTH,
        viewportHeight: HEIGHT,
        canvasWidth: WIDTH,
        canvasHeight: HEIGHT,
        trimWidth: WIDTH,
        trimHeight: HEIGHT,
        styleWidth: WIDTH,
        styleHeight: HEIGHT,
      });

      // Should not have gl prop for a 2d canvas context
      expect(manager.props.gl).toBeUndefined();

      // Functions don't match with toMatchObject or toEqual,
      // need to check them individually.
      expect(typeof manager.props.render).toBe('function');
      expect(typeof manager.props.togglePlay).toBe('function');
      expect(typeof manager.props.dispatch).toBe('function');
      expect(typeof manager.props.tick).toBe('function');
      expect(typeof manager.props.resize).toBe('function');
      expect(typeof manager.props.update).toBe('function');
      expect(typeof manager.props.exportFrame).toBe('function');
      expect(typeof manager.props.record).toBe('function');
      expect(typeof manager.props.play).toBe('function');
      expect(typeof manager.props.pause).toBe('function');
      expect(typeof manager.props.stop).toBe('function');
    });

    it('adds context as `gl` prop if context is webGL', () => {
      utils.isWebGLContext.mockReturnValue(true);
      const canvas = document.createElement('canvas');
      // `canvas` npm package does not support webgl, so we use
      // 2d but mock `isWebGLContext` to return true.
      const context = canvas.getContext('2d');

      const initialSettings = { loop: true, data: {}, canvas };
      manager.setup(initialSettings);

      expect(manager.props.gl).toEqual(context);
    });

    it('throws if SketchManager already has a sketch', () => {
      const createSketch = () => ({});
      return manager.load(createSketch).then(loaded => {
        expect(() => loaded.setup()).toThrow('Multiple setup() calls not yet supported.');
      });
    });
  });

  describe('load', () => {
    it('calls createSketch function', () => {
      const loaderFn = jest.fn();
      const createSketch = jest.fn(() => loaderFn);
      return manager.load(createSketch).then(() => {
        expect(createSketch).toBeCalled();
      });
    });

    it('returns SketchManager', () => {
      const createSketch = () => ({});
      return manager.load(createSketch).then(loaded => {
        expect(loaded).toBeInstanceOf(SketchManager);
      });
    });

    it('sets createSketch return value as SketchManager.sketch', () => {
      const sketch = 'foo';
      const createSketch = () => sketch;
      return manager.load(createSketch).then(loaded => {
        expect(loaded.sketch).toBe('foo');
      });
    });

    it('sets empty object as SketchManager.sketch if createSketch returns nothing', () => {
      const createSketch = () => {};
      return manager.load(createSketch).then(loaded => {
        expect(loaded.sketch).toEqual({});
      });
    });

    it('unloads existing sketch, adds new sketch to SketchManager', () => {
      const unload = jest.fn();
      let firstSketch;
      const createSketch = () => ({ unload });
      return manager
        .load(createSketch)
        .then(loaded => {
          expect(unload).not.toBeCalled();
          firstSketch = loaded.sketch;
          return manager.load(createSketch);
        })
        .then(loaded => {
          expect(unload).toBeCalled();
          expect(loaded.sketch).not.toBe(firstSketch);
          expect(loaded.sketch).toEqual(createSketch());
        });
    });

    it('calls sketch.resize on initial load', () => {
      const resize = jest.fn();
      const createSketch = () => ({ resize });
      return manager.load(createSketch).then(loaded => {
        expect(resize).toBeCalledWith({});
      });
    });

    it.todo('updates with newSettings if provided');
    it.todo('adds event listeners if in browser');

    it('throws if no createSketch provided', () => {
      expect(() => manager.load()).toThrow(/must take in a function as the first parameter/i);
    });
  });
});
