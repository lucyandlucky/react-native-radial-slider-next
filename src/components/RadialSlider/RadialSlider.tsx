import React, { useEffect, useState } from 'react';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Polyline,
  NumberProp,
} from 'react-native-svg';
import { View, Platform, StyleSheet, Text } from 'react-native';
import type { RadialSliderDebugTouchConfig, RadialSliderProps } from './types';
import { styles } from './styles';
import { Colors } from '../../theme';
import { useSliderAnimation, useRadialSlider } from './hooks';
import { defaultProps } from './SliderDefaultProps';
import ButtonContent from './ButtonContent';
import CenterContent from './CenterContent';
import TailText from './TailText';
import LineContent from './LineContent';

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

const RadialSlider = (props: RadialSliderProps & typeof defaultProps) => {
  const [isStart, setIsStart] = useState<boolean>(false);
  const [iconPosition, setIconPosition] = useState<string>('');

  const {
    step,
    radius,
    sliderWidth,
    unselectedSliderWidth,
    sliderTrackColor,
    linearGradient,
    thumbRadius,
    thumbBorderColor,
    thumbColor,
    thumbBorderWidth,
    style,
    markerLineSize,
    disabled,
    contentStyle,
    buttonContainerStyle,
    min,
    max,
    isHideSlider,
    isHideCenterContent,
    isHideTailText,
    isHideButtons,
    isHideLines,
    leftIconStyle,
    rightIconStyle,
    stroke,
    children,
    debugTouch,
  } = props;

  const {
    panResponder,
    value,
    setValue,
    curPoint,
    currentRadian,
    prevValue,
    isTouching,
    dragStartPoint,
    currentTouchPoint,
    gestureTrail,
    debugSnapshot,
  } = useSliderAnimation(props);

  const {
    svgSize,
    containerRef,
    startPoint,
    endPoint,
    startRadian,
    radianValue,
    isRadialCircleVariant,
    centerValue,
  } = useRadialSlider(props);

  useEffect(() => {
    //check max value length
    const maxLength = max?.toString()?.length;

    const timerId = setTimeout(handleValue, maxLength > 2 ? 10 : 100);
    return () => clearTimeout(timerId);
  });

  const handleValue = () => {
    if (iconPosition === 'up' && max > value) {
      isStart && onPressButtons('up');
    } else if (iconPosition === 'down' && min < value) {
      isStart && onPressButtons('down');
    }
  };

  const leftButtonStyle = StyleSheet.flatten([
    leftIconStyle,
    (disabled || min === value) && {
      opacity: 0.5,
    },
  ]);

  const rightButtonStyle = StyleSheet.flatten([
    rightIconStyle,
    (disabled || max === value) && {
      opacity: 0.5,
    },
  ]);

  const onLayout = () => {
    const ref = containerRef.current as any;
    if (ref) {
      ref.measure((_x: any, _y: any, _width: any, _height: any) => {});
    }
  };

  const onPressButtons = (type: string) => {
    if (type === 'up' && max > value) {
      setValue((prevState: number) => {
        const calculatedValue = prevState + step;
        const roundedValue = parseFloat(calculatedValue.toFixed(1));

        return roundedValue;
      });
    } else if (type === 'down' && min < value) {
      setValue((prevState: number) => {
        const calculatedValue = prevState - step;
        const roundedValue = parseFloat(calculatedValue.toFixed(1));
        prevValue.current = roundedValue;

        return roundedValue;
      });
    }
  };

  const circleXPosition = isRadialCircleVariant
    ? centerValue < value
      ? -7
      : 4
    : 0;
  const gestureHitAreaRadius = thumbRadius + 20;
  const thumbX = curPoint.x + circleXPosition;
  const sliderCenter = svgSize / 2;
  const useFullSliderPanArea = isHideButtons;
  const debugTouchConfig = resolveDebugTouchConfig(debugTouch);
  const debugOverlayEnabled = debugTouchConfig.overlay;
  const gestureTrailPoints = gestureTrail
    .map(point => `${point.x},${point.y}`)
    .join(' ');
  const debugPanelLines = [
    `touch: ${isTouching ? 'YES' : 'NO'}`,
    `capture: ${useFullSliderPanArea ? 'full-slider' : 'thumb-only'}`,
    `phase: ${debugSnapshot.phase}`,
    `value: ${value}`,
    `resolved: ${debugSnapshot.resolvedValue}`,
    `dx/dy: ${debugSnapshot.dx.toFixed(1)} / ${debugSnapshot.dy.toFixed(1)}`,
    `raw: ${debugSnapshot.rawValue.toFixed(1)}`,
    `radian: ${debugSnapshot.radian.toFixed(4)}`,
    `trail: ${gestureTrail.length}`,
  ];

  const strokeLinecap = isRadialCircleVariant ? 'square' : 'round';

  return (
    <View
      onLayout={onLayout}
      ref={containerRef as any}
      style={[styles.container, style, { width: svgSize, height: svgSize }]}
      {...(useFullSliderPanArea ? panResponder.panHandlers : {})}
      testID="slider-view">
      <Svg
        width={svgSize + markerLineSize / 2 - (Platform.OS === 'web' ? 20 : 0)}
        height={svgSize + markerLineSize / 2}
        viewBox={`-${markerLineSize / 2} -${markerLineSize / 2} ${
          svgSize + markerLineSize
        } ${svgSize + markerLineSize}`}
        preserveAspectRatio="none">
        <Defs>
          <LinearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="gradient">
            {linearGradient.map(
              (
                item: {
                  offset: NumberProp | undefined;
                  color: string | undefined;
                },
                index: React.Key | null | undefined
              ) => (
                <Stop key={index} offset={item.offset} stopColor={item.color} />
              )
            )}
          </LinearGradient>
        </Defs>
        {!isRadialCircleVariant && !isHideTailText && <TailText {...props} />}
        {!isHideLines && <LineContent {...props} value={value} />}
        {!isHideSlider && (
          <>
            {debugOverlayEnabled && (
              <Circle
                cx={sliderCenter}
                cy={sliderCenter}
                r={radius}
                fill="none"
                stroke="#ff66c4"
                strokeOpacity={0.35}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            )}
            {debugOverlayEnabled && gestureTrail.length > 1 && (
              <Polyline
                points={gestureTrailPoints}
                fill="none"
                stroke="#ff3366"
                strokeWidth={2}
                strokeOpacity={0.75}
              />
            )}
            <Path
              strokeWidth={unselectedSliderWidth ?? sliderWidth}
              stroke={sliderTrackColor}
              fill="none"
              strokeLinecap={strokeLinecap}
              d={`M${startPoint.x},${startPoint.y} A ${radius},${radius},0,${
                startRadian - radianValue >= Math.PI ? '1' : '0'
              },1,${endPoint.x},${endPoint.y}`}
            />
            <Path
              strokeWidth={sliderWidth}
              stroke="url(#gradient)"
              fill="none"
              strokeLinecap={strokeLinecap}
              d={`M${startPoint.x},${startPoint.y} A ${radius},${radius},0,${
                startRadian - currentRadian >= Math.PI ? '1' : '0'
              },1,${curPoint.x},${curPoint.y}`}
            />
            <Circle
              cx={thumbX}
              cy={curPoint.y}
              r={thumbRadius}
              fill={thumbColor || thumbBorderColor}
              stroke={thumbBorderColor}
              strokeWidth={thumbBorderWidth}
            />
            {debugOverlayEnabled && (
              <Circle
                cx={thumbX}
                cy={curPoint.y}
                r={gestureHitAreaRadius}
                fill={isTouching ? '#ff4db8' : 'pink'}
                fillOpacity={isTouching ? 0.5 : 0.35}
                stroke={isTouching ? '#ff004d' : 'deeppink'}
                strokeWidth={isTouching ? 2 : 1}
                {...(useFullSliderPanArea ? {} : panResponder.panHandlers)}
              />
            )}
            {debugOverlayEnabled && (
              <Circle
                cx={thumbX}
                cy={curPoint.y}
                r={4}
                fill="#8a2be2"
                stroke="#ffffff"
                strokeWidth={1}
              />
            )}
            {debugOverlayEnabled && (
              <Circle
                cx={sliderCenter}
                cy={sliderCenter}
                r={3}
                fill="#8a2be2"
                stroke="#ffffff"
                strokeWidth={1}
              />
            )}
            {debugOverlayEnabled && dragStartPoint && (
              <Circle
                cx={dragStartPoint.x}
                cy={dragStartPoint.y}
                r={6}
                fill="#ffa726"
                fillOpacity={0.7}
                stroke="#fb8c00"
                strokeWidth={2}
              />
            )}
            {debugOverlayEnabled && currentTouchPoint && (
              <Circle
                cx={currentTouchPoint.x}
                cy={currentTouchPoint.y}
                r={7}
                fill={isTouching ? '#ff1744' : '#ff8a80'}
                fillOpacity={0.65}
                stroke="#ffffff"
                strokeWidth={2}
              />
            )}
          </>
        )}
      </Svg>
      {debugOverlayEnabled && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            paddingHorizontal: 8,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: 'rgba(17, 17, 17, 0.72)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.12)',
          }}>
          {debugPanelLines.map(line => (
            <Text
              key={line}
              style={{
                color: '#ffffff',
                fontSize: 10,
                lineHeight: 14,
              }}>
              {line}
            </Text>
          ))}
        </View>
      )}
      <View style={[styles.content, contentStyle]} pointerEvents="box-none">
        {children}
        {/* Center Content */}
        {!isHideCenterContent && <CenterContent {...props} value={value} />}
        {/* Button Content */}
        {!isRadialCircleVariant && !isHideButtons && (
          <View style={[styles.buttonsWrapper, buttonContainerStyle]}>
            <View style={styles.center}>
              <ButtonContent
                onPress={() => onPressButtons('down')}
                onLongPress={() => {
                  setIsStart(true);
                  setIconPosition('down');
                }}
                onPressOut={() => setIsStart(false)}
                buttonType="left-btn"
                style={leftButtonStyle}
                disabled={disabled || min === value}
                stroke={stroke ?? Colors.blue}
              />
              <ButtonContent
                disabled={disabled || max === value}
                onPress={() => onPressButtons('up')}
                onLongPress={() => {
                  setIsStart(true);
                  setIconPosition('up');
                }}
                onPressOut={() => setIsStart(false)}
                style={rightButtonStyle}
                buttonType="right-btn"
                stroke={stroke ?? Colors.blue}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

RadialSlider.defaultProps = defaultProps;
export default RadialSlider;
