import React from 'react';
import { Text as SVGText, G, TSpan } from 'react-native-svg';
import { useRadialSlider } from './hooks';
import type { RadialSliderProps, TextTailProps } from './types';

const TailText = (props: TextTailProps) => {
  const { unit, min, max } = props;
  const { startPoint, endPoint } = useRadialSlider(props as RadialSliderProps);

  return (
    <>
      <G transform={`translate(${-20}, ${40})`}>
        <SVGText fill={'#6B6F75'} fontSize={12}>
          <TSpan x={startPoint.x} y={startPoint.y} fontWeight={'bold'}>
            {`${min} ${unit}`}
          </TSpan>
        </SVGText>
      </G>
      <G transform={`translate(${-10}, ${40})`}>
        <SVGText fill={'#6B6F75'} fontSize={12}>
          <TSpan x={endPoint.x} y={endPoint.y} fontWeight={'bold'}>
            {`${max} ${unit}`}
          </TSpan>
        </SVGText>
      </G>
    </>
  );
};

export default TailText;
