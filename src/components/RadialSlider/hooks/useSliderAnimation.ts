import { useEffect, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
} from 'react-native';
import {
  cartesianToPolar,
  getCurrentRadian,
  getRadianByValue,
  polarToCartesian,
} from '../../../utils/commonHelpers';
import type {
  RadialSliderAnimationHookProps,
  RadialSliderDebugTouchConfig,
} from '../types';
import useRadialSlider from './useRadialSlider';

interface StartCartesianProps {
  x: number;
  y: number;
}

interface SliderGestureDebugSnapshot {
  phase: 'idle' | 'grant' | 'move' | 'release' | 'disabled';
  dx: number;
  dy: number;
  rawValue: number;
  resolvedValue: number;
  radian: number;
}

const MAX_GESTURE_TRAIL_POINTS = 24;

const resolveDebugTouchConfig = (debugTouch?: RadialSliderDebugTouchConfig) => {
  if (debugTouch === true) {
    return {
      overlay: true,
      logs: true,
    };
  }

  if (!debugTouch) {
    return {
      overlay: false,
      logs: false,
    };
  }

  return {
    overlay: !!debugTouch.overlay,
    logs: !!debugTouch.logs,
  };
};

const useSliderAnimation = (props: RadialSliderAnimationHookProps) => {
  const {
    step = 1,
    radius = 100,
    sliderWidth = 18,
    thumbRadius = 18,
    thumbBorderWidth = 5,
    disabled,
    min = 0,
    onChange = () => {},
    max = 100,
    onComplete = () => {},
    startAngle = 270,
    variant = 'default',
    debugTouch,
  } = props;

  let moveStartValue: number;
  let startCartesian: StartCartesianProps;
  let moveStartRadian: number;
  const { radianValue } = useRadialSlider(props);
  const prevValue = useRef(props.value > min ? props.value : min);
  const debugTouchConfig = resolveDebugTouchConfig(debugTouch);
  const debugOverlayEnabled = debugTouchConfig.overlay;
  const debugLogsEnabled = debugTouchConfig.logs;
  const dragStartPointRef = useRef<StartCartesianProps | null>(null);
  const currentTouchPointRef = useRef<StartCartesianProps | null>(null);
  const gestureTrailRef = useRef<StartCartesianProps[]>([]);

  const [value, setValue] = useState(
    props?.value < min ? min : props?.value > max ? max : props?.value
  );
  const [isTouching, setIsTouching] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<StartCartesianProps | null>(null);
  const [currentTouchPoint, setCurrentTouchPoint] = useState<StartCartesianProps | null>(null);
  const [gestureTrail, setGestureTrail] = useState<StartCartesianProps[]>([]);
  const [debugSnapshot, setDebugSnapshot] = useState<SliderGestureDebugSnapshot>({
    phase: 'idle',
    dx: 0,
    dy: 0,
    rawValue: prevValue.current,
    resolvedValue: prevValue.current,
    radian: 0,
  });

  const syncDragStartPoint = (point: StartCartesianProps | null) => {
    dragStartPointRef.current = point;
    if (debugOverlayEnabled) {
      setDragStartPoint(point);
    }
  };

  const syncCurrentTouchPoint = (point: StartCartesianProps | null) => {
    currentTouchPointRef.current = point;
    if (debugOverlayEnabled) {
      setCurrentTouchPoint(point);
    }
  };

  const syncGestureTrail = (points: StartCartesianProps[]) => {
    gestureTrailRef.current = points;
    if (debugOverlayEnabled) {
      setGestureTrail(points);
    }
  };

  const appendGestureTrail = (point: StartCartesianProps) => {
    const nextTrail = [
      ...gestureTrailRef.current.slice(-(MAX_GESTURE_TRAIL_POINTS - 1)),
      point,
    ];

    syncGestureTrail(nextTrail);
  };

  const logGestureDebug = (
    phase: SliderGestureDebugSnapshot['phase'],
    payload: Record<string, unknown>
  ) => {
    if (!debugLogsEnabled) {
      return;
    }
    console.log(`[RadialSlider][${phase}]`, payload);
  };

  useEffect(() => {
    if (max < props?.value) {
      setValue(max);
      prevValue.current = max;
    } else if (min > props?.value) {
      setValue(min);
      prevValue.current = min;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [max, min]);

  useEffect(() => {
    if (min <= props?.value && max >= props?.value) {
      setValue(props?.value);
      prevValue.current = props?.value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props?.value]);

  // useEffect(() => {
  //   onChange(value);
  //   prevValue.current = value;
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [value]);

  const handlePanResponderGrant = () => {
    moveStartValue = prevValue.current;
    moveStartRadian = getRadianByValue(
      prevValue.current,
      radianValue,
      max,
      min
    );
    startCartesian = polarToCartesian(
      moveStartRadian,
      radius,
      sliderWidth,
      thumbRadius,
      thumbBorderWidth as number,
      startAngle,
      variant
    );
    if (debugOverlayEnabled) {
      setIsTouching(true);
    }
    syncDragStartPoint(startCartesian);
    syncCurrentTouchPoint(startCartesian);
    syncGestureTrail([startCartesian]);
    if (debugOverlayEnabled) {
      setDebugSnapshot({
        phase: 'grant',
        dx: 0,
        dy: 0,
        rawValue: prevValue.current,
        resolvedValue: prevValue.current,
        radian: moveStartRadian,
      });
    }
    logGestureDebug('grant', {
      disabled: !!disabled,
      value: prevValue.current,
      startPoint: startCartesian,
      startRadian: moveStartRadian,
    });
    return true;
  };

  const handlePanResponderMove = (
    _e: GestureResponderEvent,
    gestureState: PanResponderGestureState
  ) => {
    if (disabled) {
      if (debugOverlayEnabled) {
        setDebugSnapshot(prevState => ({
          ...prevState,
          phase: 'disabled',
        }));
      }
      logGestureDebug('disabled', {
        reason: 'move_blocked',
        value: prevValue.current,
      });
      return;
    }
    let { x, y } = startCartesian;
    x += gestureState.dx;
    y += gestureState.dy;
    const touchPoint = { x, y };

    const radian = cartesianToPolar(
      x,
      y,
      radius,
      sliderWidth,
      thumbRadius,
      thumbBorderWidth as number,
      startAngle,
      variant
    );

    const ratio =
      (moveStartRadian - radian) / ((Math.PI - (radianValue as number)) * 2);

    const diff = max - min;

    let nValue: any;
    if (step) {
      nValue = moveStartValue + Math.round((ratio * diff) / step) * step;
    } else {
      nValue = moveStartValue + ratio * diff;
    }
    nValue = Math.max(min, Math.min(max, nValue));

    setValue((prevState: number) => {
      const roundedValue = parseFloat(nValue.toFixed(1));
      prevValue.current =
        Math.abs(roundedValue - prevState) > diff / 4
          ? prevState
          : roundedValue;
      return Math.abs(roundedValue - prevState) > diff / 4
        ? prevState
        : roundedValue;
    });

    syncCurrentTouchPoint(touchPoint);
    appendGestureTrail(touchPoint);
    if (debugOverlayEnabled) {
      setDebugSnapshot({
        phase: 'move',
        dx: gestureState.dx,
        dy: gestureState.dy,
        rawValue: parseFloat(nValue.toFixed(1)),
        resolvedValue: prevValue.current,
        radian,
      });
    }
    logGestureDebug('move', {
      dx: Number(gestureState.dx.toFixed(2)),
      dy: Number(gestureState.dy.toFixed(2)),
      rawValue: parseFloat(nValue.toFixed(1)),
      resolvedValue: prevValue.current,
      touchPoint,
      startPoint: dragStartPointRef.current,
      radian: Number(radian.toFixed(4)),
    });
    onChange(prevValue.current);
  };

  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const handlePanResponderEnd = () => {
    if (debugOverlayEnabled) {
      setIsTouching(false);
    }
    if (disabled) {
      if (debugOverlayEnabled) {
        setDebugSnapshot(prevState => ({
          ...prevState,
          phase: 'disabled',
        }));
      }
      logGestureDebug('disabled', {
        reason: 'end_blocked',
        value: prevValue.current,
      });
      return;
    }
    if (debugOverlayEnabled) {
      setDebugSnapshot(prevState => ({
        ...prevState,
        phase: 'release',
        resolvedValue: prevValue.current,
      }));
    }
    logGestureDebug('release', {
      value: prevValue.current,
      startPoint: dragStartPointRef.current,
      endPoint: currentTouchPointRef.current,
      trailLength: gestureTrailRef.current.length,
    });
    onCompleteRef.current(prevValue.current);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: handlePanResponderGrant,
      onPanResponderMove: handlePanResponderMove,
      onPanResponderRelease: handlePanResponderEnd,
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: handlePanResponderEnd,
      onShouldBlockNativeResponder: () => true,
    })
  );

  useEffect(() => {
    panResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: handlePanResponderGrant,
      onPanResponderMove: handlePanResponderMove,
      onPanResponderRelease: handlePanResponderEnd,
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: handlePanResponderEnd,
      onShouldBlockNativeResponder: () => true,
    });
  }, [min, max, disabled]);

  const currentRadian = getCurrentRadian(value, radianValue, max, min);

  const curPoint = polarToCartesian(
    currentRadian,
    radius,
    sliderWidth,
    thumbRadius,
    thumbBorderWidth as number,
    startAngle,
    variant
  );

  return {
    panResponder: panResponder.current,
    prevValue,
    value,
    setValue,
    curPoint,
    currentRadian,
    isTouching,
    dragStartPoint,
    currentTouchPoint,
    gestureTrail,
    debugSnapshot,
  };
};

export default useSliderAnimation;
